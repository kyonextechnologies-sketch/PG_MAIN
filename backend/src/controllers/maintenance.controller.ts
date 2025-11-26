import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generatePaginatedResponse } from '../utils/helpers';
import { sendEmail } from '../utils/email';
import {
  notifyOwnerOfMaintenanceRequest,
  notifyTenantOwnerAcknowledged,
  notifyTenantOfMaintenanceUpdate,
  emitDataUpdate,
} from '../services/notification.service';
import {
  scheduleMaintenanceReminders,
  cancelMaintenanceReminders,
} from '../services/queue.service';
import { logMaintenanceEvent } from '../middleware/auditLog';

export const createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { propertyId, title, description, priority, category, images } = req.body;

  // ✅ Validate required fields
  const missing: string[] = [];
  if (!title) missing.push('title');
  if (!category) missing.push('category');
  // propertyId is optional if tenant profile has property assigned
  
  if (missing.length > 0) {
    throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);
  }

  // Get tenant profile
  const tenant = await prisma.tenantProfile.findFirst({
    where: { userId: req.user.id },
    include: { property: true },
  });

  if (!tenant) {
    throw new AppError('Tenant profile not found', 404);
  }

  // Use tenant's property if not provided
  const ticketPropertyId = propertyId || tenant.propertyId;
  if (!ticketPropertyId) {
    throw new AppError('Property information not found. Please contact administrator.', 400);
  }

  // ✅ Validate property exists
  const property = await prisma.property.findUnique({
    where: { id: ticketPropertyId },
  });

  if (!property) {
    throw new AppError('Property not found', 404);
  }

  const ticketPriority = priority || 'MEDIUM';

  // Create initial timeline entry
  const initialTimeline = [
    {
      actor: tenant.name,
      action: 'CREATED',
      text: 'Maintenance request created',
      timestamp: new Date().toISOString(),
    },
  ];

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      ownerId: tenant.ownerId,
      tenantId: tenant.id,
      propertyId: ticketPropertyId,
      title,
      description,
      priority: ticketPriority,
      category,
      images: images || [],
      status: 'OPEN',
      timeline: initialTimeline,
    },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  // Send notification to owner
  await notifyOwnerOfMaintenanceRequest(
    ticket.id,
    tenant.ownerId,
    tenant.name,
    title,
    ticketPriority
  );

  // Schedule reminders
  await scheduleMaintenanceReminders(
    ticket.id,
    tenant.ownerId,
    tenant.id,
    title,
    ticketPriority as any
  );

  // Log the event
  await logMaintenanceEvent(req.user.id, 'TICKET_CREATED', ticket.id, req, {
    priority: ticketPriority,
    category,
  });

  // Emit real-time update to tenant
  emitDataUpdate(tenant.userId, 'maintenance', 'create', ticket);
  // Also emit to owner
  const owner = await prisma.user.findUnique({
    where: { id: tenant.ownerId },
    select: { id: true },
  });
  if (owner) {
    emitDataUpdate(owner.id, 'maintenance', 'create', ticket);
  }

  res.status(201).json({
    success: true,
    message: 'Maintenance ticket created successfully',
    data: ticket,
  });
});

export const getAllTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const priority = req.query.priority as string;
  const category = req.query.category as string;
  const propertyId = req.query.propertyId as string;

  const skip = (page - 1) * limit;

  let where: any = {};

  if (req.user.role === 'OWNER') {
    where.ownerId = req.user.id;
  } else {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (!tenant) {
      throw new AppError('Tenant profile not found', 404);
    }
    where.tenantId = tenant.id;
  }

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (propertyId) where.propertyId = propertyId;

  const [tickets, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        property: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);

  const response = generatePaginatedResponse(tickets, total, { page, limit });
  res.json(response);
});

export const getTicketById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
    include: {
      tenant: true,
      property: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  // Check authorization
  if (req.user.role === 'OWNER' && ticket.ownerId !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  if (req.user.role === 'TENANT') {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (!tenant || ticket.tenantId !== tenant.id) {
      throw new AppError('Unauthorized', 403);
    }
  }

  res.json({
    success: true,
    message: 'Ticket fetched successfully',
    data: ticket,
  });
});

export const updateTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can update tickets', 403);
  }

  const { id } = req.params;
  const { status, priority, category, description, assignedTo } = req.body;

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, ownerId: req.user.id },
    include: { tenant: true },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  // ✅ Build update data with only valid fields
  const updateData: any = {};

  if (status !== undefined) {
    if (typeof status !== 'string') {
      throw new AppError('Status must be a string', 400);
    }
    updateData.status = status;
  }

  if (priority !== undefined) {
    if (typeof priority !== 'string') {
      throw new AppError('Priority must be a string', 400);
    }
    updateData.priority = priority;
  }

  if (category !== undefined) {
    if (typeof category !== 'string') {
      throw new AppError('Category must be a string', 400);
    }
    updateData.category = category;
  }

  if (description !== undefined) {
    updateData.description = description;
  }

  if (assignedTo !== undefined) {
    updateData.assignedTo = assignedTo;
  }

  // ✅ Set resolvedAt when status changes to RESOLVED
  if (updateData.status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
    updateData.resolvedAt = new Date();
  }

  // ✅ Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    res.json({
      success: true,
      message: 'No changes to update',
      data: ticket,
    });
    return;
  }

  // Build update message for timeline
  const changes: string[] = [];
  if (status) changes.push(`Status: ${status}`);
  if (priority) changes.push(`Priority: ${priority}`);
  if (category) changes.push(`Category: ${category}`);
  if (assignedTo) changes.push(`Assigned to: ${assignedTo}`);

  // Get existing timeline and add new entry
  const currentTimeline = (ticket.timeline as any[]) || [];
  const newTimelineEntry = {
    actor: 'Owner',
    action: 'UPDATED',
    text: `Updated: ${changes.join(', ')}`,
    timestamp: new Date().toISOString(),
  };
  updateData.timeline = [...currentTimeline, newTimelineEntry];

  // Cancel reminders if resolved or closed
  if (updateData.status === 'RESOLVED' || updateData.status === 'CLOSED') {
    await cancelMaintenanceReminders(id);
  }

  const updatedTicket = await prisma.maintenanceTicket.update({
    where: { id },
    data: updateData,
    include: {
      tenant: { select: { id: true, name: true, email: true, userId: true } },
      property: { select: { id: true, name: true } },
    },
  });

  // Send notification to tenant
  await notifyTenantOfMaintenanceUpdate(
    id,
    updatedTicket.tenant.userId,
    ticket.title,
    changes.join(', ')
  );

  // Log the event
  await logMaintenanceEvent(req.user.id, 'TICKET_UPDATED', id, req, {
    changes: changes.join(', '),
  });

  // Emit real-time update
  emitDataUpdate(updatedTicket.tenant.userId, 'maintenance', 'update', updatedTicket);
  emitDataUpdate(req.user.id, 'maintenance', 'update', updatedTicket);

  // Send email notification
  try {
    await sendEmail({
      to: ticket.tenant.email,
      subject: 'Maintenance Ticket Update',
      template: 'ticketUpdate',
      data: {
        name: ticket.tenant.name,
        title: ticket.title,
        status: updateData.status || ticket.status,
        priority: updateData.priority || ticket.priority,
        category: updateData.category || ticket.category,
        notes: updateData.description || ticket.description,
      },
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  res.json({
    success: true,
    message: 'Ticket updated successfully',
    data: updatedTicket,
  });
});

export const deleteTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  let ticket;
  if (req.user.role === 'OWNER') {
    ticket = await prisma.maintenanceTicket.findFirst({
      where: { id, ownerId: req.user.id },
      include: { tenant: { select: { userId: true } } },
    });
  } else {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (tenant) {
      ticket = await prisma.maintenanceTicket.findFirst({
        where: { id, tenantId: tenant.id, status: 'OPEN' },
        include: { tenant: { select: { userId: true } } },
      });
    }
  }

  if (!ticket) {
    throw new AppError('Ticket not found or cannot be deleted', 404);
  }

  // Store IDs before deletion for socket emission
  const tenantUserId = ticket.tenant?.userId;
  const ownerId = ticket.ownerId;

  await prisma.maintenanceTicket.delete({ where: { id } });

  // Emit real-time delete event
  if (tenantUserId) {
    emitDataUpdate(tenantUserId, 'maintenance', 'delete', { id });
  }
  emitDataUpdate(ownerId, 'maintenance', 'delete', { id });

  res.json({
    success: true,
    message: 'Ticket deleted successfully',
  });
});

export const getTicketStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can view ticket statistics', 403);
  }

  const stats = await prisma.maintenanceTicket.groupBy({
    by: ['status'],
    where: { ownerId: req.user.id },
    _count: true,
  });

  const priorityStats = await prisma.maintenanceTicket.groupBy({
    by: ['priority'],
    where: { ownerId: req.user.id },
    _count: true,
  });

  const categoryStats = await prisma.maintenanceTicket.groupBy({
    by: ['category'],
    where: { ownerId: req.user.id },
    _count: true,
  });

  res.json({
    success: true,
    message: 'Ticket statistics fetched successfully',
    data: {
      byStatus: stats,
      byPriority: priorityStats,
      byCategory: categoryStats,
    },
  });
});

/**
 * Owner acknowledges ("Got It") a maintenance request
 */
export const acknowledgeTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can acknowledge tickets', 403);
  }

  const { id } = req.params;

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { id, ownerId: req.user.id },
    include: {
      tenant: {
        select: { id: true, name: true, email: true, userId: true },
      },
    },
  });

  if (!ticket) {
    throw new AppError('Ticket not found', 404);
  }

  if (ticket.gotItByOwner) {
    res.json({
      success: true,
      message: 'Ticket already acknowledged',
      data: ticket,
    });
    return;
  }

  // Update timeline
  const currentTimeline = (ticket.timeline as any[]) || [];
  const newTimelineEntry = {
    actor: 'Owner',
    action: 'ACKNOWLEDGED',
    text: 'Owner has seen this request',
    timestamp: new Date().toISOString(),
  };

  // Update ticket with Got It status
  const updatedTicket = await prisma.maintenanceTicket.update({
    where: { id },
    data: {
      gotItByOwner: true,
      gotItAt: new Date(),
      timeline: [...currentTimeline, newTimelineEntry],
    },
    include: {
      tenant: {
        select: { id: true, name: true, email: true, userId: true },
      },
      property: {
        select: { id: true, name: true },
      },
    },
  });

  // Notify tenant that owner has seen the request
  await notifyTenantOwnerAcknowledged(
    id,
    updatedTicket.tenant.userId,
    ticket.title
  );

  // Cancel periodic reminders (they'll be replaced with daily reminders)
  await cancelMaintenanceReminders(id);

  // Log the event
  await logMaintenanceEvent(req.user.id, 'TICKET_GOT_IT', id, req);

  res.json({
    success: true,
    message: 'Ticket acknowledged successfully',
    data: updatedTicket,
  });
});

