// src/controllers/tenant.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { hashPassword } from '../utils/auth';
import { sendEmail } from '../utils/email';
import { generatePaginatedResponse } from '../utils/helpers';
import { Prisma } from '@prisma/client'; // ✅ For Decimal support

/**
 * Create a tenant (creates both User and TenantProfile and updates bed/room occupancy)
 */
export const createTenant = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('🚀 [createTenant] Called');
  console.log('📥 [createTenant] Request body:', req.body);
  console.log('👤 [createTenant] User:', req.user?.id);

  if (!req.user) throw new AppError('Authentication required', 401);

  const {
    name,
    email,
    phone,
    password,
    kycId,
    kycDocument,
    propertyId,
    roomId,
    bedId,
    securityDeposit,
    monthlyRent,
    moveInDate,
  } = req.body;

  const missing: string[] = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!phone) missing.push('phone');
  if (!propertyId) missing.push('propertyId');
  if (!roomId) missing.push('roomId');
  if (!bedId) missing.push('bedId');

  if (missing.length > 0) throw new AppError(`Missing required fields: ${missing.join(', ')}`, 400);

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new AppError('Email already in use. Please use a different one.', 400);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: req.user.id },
  });
  if (!property) throw new AppError('Property not found or not owned by you', 404);

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { room: { include: { property: true } } },
  });
  if (!bed) throw new AppError('Bed not found', 404);
  if (!bed.room || bed.room.property.id !== propertyId)
    throw new AppError('Bed does not belong to the selected property/room', 400);
  if (bed.occupied) throw new AppError('Bed is already occupied', 400);

  const finalPassword = password || 'changeme123';
  const hashedPassword = await hashPassword(finalPassword);

  const [user, tenant] = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: { email: normalizedEmail, password: hashedPassword, name, role: 'TENANT' },
    });

    const createdTenant = await tx.tenantProfile.create({
      data: {
        userId: createdUser.id,
        ownerId: req.user!.id,
        name,
        email: normalizedEmail,
        phone,
        kycId: kycId || null,
        kycDocument: kycDocument || null,
        propertyId,
        roomId,
        bedId,
        // ✅ FIX: Ensure numeric values or default fallback
        securityDeposit:
          securityDeposit !== undefined && securityDeposit !== null
            ? new Prisma.Decimal(Number(securityDeposit))
            : new Prisma.Decimal(0),
        monthlyRent:
          monthlyRent !== undefined && monthlyRent !== null
            ? new Prisma.Decimal(Number(monthlyRent))
            : new Prisma.Decimal(0),
        moveInDate: moveInDate ? new Date(moveInDate) : new Date(),
        status: 'ACTIVE',
      },
      include: { property: true, room: true, bed: true },
    });

    await tx.bed.update({
      where: { id: bedId },
      data: { occupied: true, tenantId: createdTenant.id },
    });

    await tx.room.update({
      where: { id: roomId },
      data: { occupied: { increment: 1 } },
    });

    return [createdUser, createdTenant];
  });

  try {
    await sendEmail({
      to: normalizedEmail,
      subject: 'Welcome to PG Management System',
      template: 'welcome',
      data: {
        name,
        email: normalizedEmail,
        password: finalPassword,
        loginUrl: `${process.env.FRONTEND_URL}/login`,
      },
    });
  } catch (err) {
    console.warn('[createTenant] Welcome email failed:', err);
  }

  res.status(201).json({
    success: true,
    message: 'Tenant created successfully',
    data: tenant,
  });
});

/**
 * Get paginated tenants for the logged-in owner
 */
export const getAllTenants = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '10', 10);
  const search = (req.query.search as string) || undefined;
  const status = (req.query.status as string) || undefined;
  const propertyId = (req.query.propertyId as string) || undefined;
  const skip = (page - 1) * limit;

  const where: any = { ownerId: req.user.id };
  if (search)
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  if (status) where.status = status;
  if (propertyId) where.propertyId = propertyId;

  const [tenants, total] = await Promise.all([
    prisma.tenantProfile.findMany({
      where,
      skip,
      take: limit,
      include: {
        property: { select: { id: true, name: true } },
        room: { select: { id: true, name: true, roomNumber: true } },
        bed: { select: { id: true, name: true, bedNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tenantProfile.count({ where }),
  ]);

  res.json(generatePaginatedResponse(tenants, total, { page, limit }));
});

/**
 * Get tenant by ID
 */
export const getTenantById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { id } = req.params;

  const tenant = await prisma.tenantProfile.findFirst({
    where: { id, ownerId: req.user.id },
    include: {
      property: true,
      room: true,
      bed: true,
      user: { select: { id: true, email: true, isActive: true } },
    },
  });

  if (!tenant) throw new AppError('Tenant not found', 404);
  res.json({ success: true, message: 'Tenant fetched successfully', data: tenant });
});

/**
 * Get current tenant's own profile (for TENANT role users)
 */
export const getMyTenantProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  if (req.user.role !== 'TENANT') throw new AppError('Only tenants can access this endpoint', 403);

  const tenant = await prisma.tenantProfile.findFirst({
    where: { userId: req.user.id },
    include: {
      property: true,
      room: true,
      bed: true,
      user: { select: { id: true, email: true, name: true, isActive: true } },
    },
  });

  if (!tenant) throw new AppError('Tenant profile not found', 404);
  res.json({ success: true, message: 'Tenant profile fetched successfully', data: tenant });
});

/**
 * Update tenant
 */
export const updateTenant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { id } = req.params;

  const tenant = await prisma.tenantProfile.findFirst({ where: { id, ownerId: req.user.id } });
  if (!tenant) throw new AppError('Tenant not found', 404);

  // Prepare update data with proper Decimal conversion
  const updateData: any = { ...req.body };

  // Convert Decimal fields if provided
  if (updateData.securityDeposit !== undefined && updateData.securityDeposit !== null) {
    updateData.securityDeposit = new Prisma.Decimal(Number(updateData.securityDeposit));
  }

  if (updateData.monthlyRent !== undefined && updateData.monthlyRent !== null) {
    updateData.monthlyRent = new Prisma.Decimal(Number(updateData.monthlyRent));
  }

  // Convert dates if provided
  if (updateData.moveInDate) {
    updateData.moveInDate = new Date(updateData.moveInDate);
  }
  if (updateData.moveOutDate) {
    updateData.moveOutDate = new Date(updateData.moveOutDate);
  }

  const updatedTenant = await prisma.tenantProfile.update({
    where: { id },
    data: updateData,
    include: {
      property: { select: { id: true, name: true } },
      room: { select: { id: true, name: true, roomNumber: true } },
      bed: { select: { id: true, name: true, bedNumber: true } },
    },
  });

  res.json({ success: true, message: 'Tenant updated successfully', data: updatedTenant });
});

/**
 * Checkout tenant
 */
export const checkoutTenant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { id } = req.params;
  const { moveOutDate } = req.body;

  const tenant = await prisma.tenantProfile.findFirst({
    where: { id, ownerId: req.user.id },
    include: { bed: true, room: true },
  });

  if (!tenant) throw new AppError('Tenant not found', 404);

  const updates: any[] = [];

  if (tenant.bedId)
    updates.push(prisma.bed.update({ where: { id: tenant.bedId }, data: { occupied: false, tenantId: null } }));

  if (tenant.roomId)
    updates.push(prisma.room.update({ where: { id: tenant.roomId }, data: { occupied: { decrement: 1 } } }));

  updates.push(
    prisma.tenantProfile.update({
      where: { id },
      data: {
        status: 'INACTIVE',
        moveOutDate: moveOutDate ? new Date(moveOutDate) : new Date(),
        bedId: null,
        roomId: null,
        propertyId: null,
      },
    })
  );

  await prisma.$transaction(updates);

  res.json({ success: true, message: 'Tenant checked out successfully' });
});

/**
 * Delete tenant (only allowed if not active)
 */
export const deleteTenant = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);
  const { id } = req.params;

  const tenant = await prisma.tenantProfile.findFirst({ where: { id, ownerId: req.user.id } });
  if (!tenant) throw new AppError('Tenant not found', 404);
  if (tenant.status === 'ACTIVE') throw new AppError('Cannot delete active tenant. Please checkout first.', 400);

  await prisma.user.delete({ where: { id: tenant.userId } });
  res.json({ success: true, message: 'Tenant deleted successfully' });
});
