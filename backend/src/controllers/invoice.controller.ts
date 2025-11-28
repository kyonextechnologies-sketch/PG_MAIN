import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import {
  generatePaginatedResponse,
  calculateLateFees,
  getDueDateForMonth,
} from '../utils/helpers';
import { sendEmail } from '../utils/email';
import { createNotification, emitDataUpdate } from '../services/notification.service';

// ✅ Generate Invoice
export const generateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { tenantId, month, amount, otherCharges = 0 } = req.body;

  const tenant = await prisma.tenantProfile.findFirst({
    where: { id: tenantId, ownerId: req.user.id },
    select: {
      id: true,
      userId: true,
      name: true,
      email: true,
      monthlyRent: true,
      property: {
        select: {
          name: true,
        },
      },
    },
  });
  if (!tenant) throw new AppError('Tenant not found', 404);
  
  if (!tenant.userId) {
    console.error('❌ Tenant userId is missing:', tenant);
    throw new AppError('Tenant user ID not found', 500);
  }

  // ✅ Ensure composite unique key exists in schema.prisma:
  // @@unique([tenantId, month], name: "tenantId_month")
  const existingInvoice = await prisma.invoice.findUnique({
    where: { tenantId_month: { tenantId, month } },
  });
  if (existingInvoice) throw new AppError('Invoice already exists for this month', 400);

  const settings = await prisma.electricitySettings.findUnique({
    where: { ownerId: req.user.id },
  });

  const dueDate = getDueDateForMonth(month, settings?.dueDate || 5);

  const electricityBill = await prisma.electricityBill.findFirst({
    where: { tenantId, month, status: 'APPROVED' },
  });

  const electricityCharges = electricityBill ? Number(electricityBill.amount) : 0;
  
  // ✅ Use the amount provided by owner, or calculate from base rent if not provided
  let baseRent: number;
  let totalAmount: number;
  
  if (amount !== undefined && amount !== null && amount > 0) {
    // Owner provided a custom amount - use it as base rent
    baseRent = Number(amount);
    totalAmount = baseRent + electricityCharges + Number(otherCharges);
  } else {
    // Fallback to tenant's monthly rent if amount not provided
    baseRent = Number(tenant.monthlyRent);
    totalAmount = baseRent + electricityCharges + Number(otherCharges);
  }

  const invoice = await prisma.invoice.create({
    data: {
      ownerId: req.user.id,
      tenantId,
      month,
      baseRent,
      electricityCharges,
      otherCharges: Number(otherCharges),
      lateFees: 0,
      amount: totalAmount,
      dueDate,
      status: 'DUE',
    },
    include: { tenant: true },
  });

  // Get owner details for email
  const owner = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { name: true },
  });

  // ✅ Safe email sending
  if (tenant.email) {
    try {
      await sendEmail({
        to: tenant.email,
        subject: `Invoice for ${month}`,
        template: 'invoiceGenerated',
        data: {
          tenantName: tenant.name,
          month,
          baseRent,
          electricityCharges,
          otherCharges,
          lateFees: 0,
          totalAmount,
          dueDate: dueDate.toLocaleDateString(),
          ownerName: owner?.name || 'Owner',
          propertyName: tenant.property?.name || 'Property',
        },
      });
    } catch (err) {
      console.error('Email sending failed:', err);
    }
  }

  // ✅ Send notification to tenant
  try {
    console.log(`📬 Preparing to send notification to tenant userId: ${tenant.userId}`);
    console.log(`📬 Invoice details: ${month}, Amount: ₹${totalAmount}, Due: ${dueDate.toLocaleDateString()}`);
    
    await createNotification({
      userId: tenant.userId,
      type: 'PAYMENT_DUE',
      title: 'New Invoice Generated',
      message: `A new invoice for ₹${totalAmount.toLocaleString('en-IN')} has been generated for ${month}. Due date: ${dueDate.toLocaleDateString()}`,
      data: {
        invoiceId: invoice.id,
        month,
        amount: totalAmount,
        dueDate: dueDate.toISOString(),
        baseRent,
        electricityCharges,
        otherCharges,
      },
      channels: ['WEBSOCKET', 'EMAIL'],
      priority: 'HIGH',
    });
    console.log(`✅ Notification sent successfully to tenant userId: ${tenant.userId} for invoice ${invoice.id}`);
  } catch (err: any) {
    console.error('❌ Failed to send notification to tenant:', err);
    console.error('❌ Error details:', {
      message: err?.message,
      stack: err?.stack,
      tenantUserId: tenant.userId,
    });
    // Don't fail the invoice creation if notification fails
  }

  // Emit real-time update
  emitDataUpdate(tenant.userId, 'invoice', 'create', invoice);
  emitDataUpdate(req.user.id, 'invoice', 'create', invoice);

  res.status(201).json({
    success: true,
    message: 'Invoice generated successfully',
    data: invoice,
  });
});

// ✅ Get All Invoices
export const getAllInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const { status, month, tenantId } = req.query;
  const where: any = {};

  if (req.user.role === 'OWNER') {
    where.ownerId = req.user.id;
  } else {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (!tenant) throw new AppError('Tenant profile not found', 404);
    where.tenantId = tenant.id;
  }

  if (status) where.status = status;
  if (month) where.month = month;
  if (tenantId) where.tenantId = tenantId;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true, email: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.invoice.count({ where }),
  ]);

  const response = generatePaginatedResponse(invoices, total, { page, limit });
  res.json(response);
});

// ✅ Get Invoice By ID
export const getInvoiceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { id } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      tenant: true,
      payments: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!invoice) throw new AppError('Invoice not found', 404);

  if (req.user.role === 'OWNER' && invoice.ownerId !== req.user.id)
    throw new AppError('Unauthorized', 403);

  if (req.user.role === 'TENANT') {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (!tenant || invoice.tenantId !== tenant.id)
      throw new AppError('Unauthorized', 403);
  }

  res.json({
    success: true,
    message: 'Invoice fetched successfully',
    data: invoice,
  });
});

// ✅ Update Invoice
export const updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { id } = req.params;
  const { status, amount, dueDate, paidAt, receiptNo } = req.body;

  const invoice = await prisma.invoice.findFirst({
    where: { id, ownerId: req.user.id },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);

  // ✅ Build update data with only valid fields
  const updateData: any = {};

  if (status !== undefined) {
    if (typeof status !== 'string') {
      throw new AppError('Status must be a string', 400);
    }
    updateData.status = status;
  }

  if (amount !== undefined) {
    const amountNum = Number(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      throw new AppError('Amount must be a valid positive number', 400);
    }
    updateData.amount = amountNum;
  }

  if (dueDate !== undefined) {
    const dueDateTime = new Date(dueDate);
    if (isNaN(dueDateTime.getTime())) {
      throw new AppError('Due date must be a valid date', 400);
    }
    updateData.dueDate = dueDateTime;
  }

  if (paidAt !== undefined) {
    if (paidAt !== null) {
      const paidDateTime = new Date(paidAt);
      if (isNaN(paidDateTime.getTime())) {
        throw new AppError('Paid date must be a valid date', 400);
      }
      updateData.paidAt = paidDateTime;
    } else {
      updateData.paidAt = null;
    }
  }

  if (receiptNo !== undefined) {
    updateData.receiptNo = receiptNo;
  }

  // ✅ Only update if there are changes
  if (Object.keys(updateData).length === 0) {
    res.json({
      success: true,
      message: 'No changes to update',
      data: invoice,
    });
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: {
      tenant: { select: { id: true, name: true, email: true, userId: true } },
    },
  });

  // Emit real-time update
  if (updatedInvoice.tenant?.userId) {
    emitDataUpdate(updatedInvoice.tenant.userId, 'invoice', 'update', updatedInvoice);
  }
  emitDataUpdate(req.user.id, 'invoice', 'update', updatedInvoice);

  res.json({
    success: true,
    message: 'Invoice updated successfully',
    data: updatedInvoice,
  });
});

// ✅ Delete Invoice
export const deleteInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { id } = req.params;

  const invoice = await prisma.invoice.findFirst({
    where: { id, ownerId: req.user.id },
    include: { payments: true, tenant: { select: { userId: true } } },
  });

  if (!invoice) throw new AppError('Invoice not found', 404);
  if (invoice.payments.length > 0)
    throw new AppError('Cannot delete invoice with payments', 400);

  await prisma.invoice.delete({ where: { id } });

  // Emit real-time delete
  if (invoice.tenant?.userId) {
    emitDataUpdate(invoice.tenant.userId, 'invoice', 'delete', { id });
  }
  emitDataUpdate(req.user.id, 'invoice', 'delete', { id });

  res.json({
    success: true,
    message: 'Invoice deleted successfully',
  });
});

// ✅ Update Overdue Invoices (cron-compatible)
export const updateOverdueInvoices = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const today = new Date();
  
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: ['DUE', 'PARTIAL'] },
      },
      include: {
        owner: { include: { electricitySettings: true } },
        tenant: true,
      },
    });
  
    const updates = overdueInvoices.map((invoice: any) => {
      const lateFeePercentage = invoice.owner.electricitySettings
        ? Number(invoice.owner.electricitySettings.lateFeePercentage)
        : 0;
  
      const lateFees = calculateLateFees(
        Number(invoice.baseRent),
        invoice.dueDate,
        lateFeePercentage
      );
  
      // ✅ Safe email send
      if (invoice.tenant.email) {
        sendEmail({
          to: invoice.tenant.email,
          subject: 'Overdue Payment Notice',
          template: 'overduePayment',
          data: {
            tenantName: invoice.tenant.name,
            month: invoice.month,
            amount: invoice.amount,
            dueDate: invoice.dueDate.toLocaleDateString(),
            daysOverdue: Math.floor(
              (today.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
            ),
            lateFees,
          },
        }).catch((err) => console.error('Email send failed:', err));
      }
  
      return prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: 'OVERDUE',
          lateFees,
          amount: {
            increment: lateFees - Number(invoice.lateFees),
          },
        },
      });
    });
  
    await prisma.$transaction(updates);
  
    res.json({
      success: true,
      message: `Updated ${overdueInvoices.length} overdue invoices`,
      data: { count: overdueInvoices.length },
    });
  });

// ✅ Send Payment Reminder
export const sendPaymentReminder = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw new AppError('Authentication required', 401);

  const { id } = req.params;

  // Get invoice with tenant details
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      ownerId: req.user.id, // Ensure owner owns this invoice
    },
    include: {
      tenant: {
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (!invoice.tenant.userId) {
    throw new AppError('Tenant user ID not found', 500);
  }

  // Calculate days remaining until due date
  const today = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemainingText = daysRemaining > 0 
    ? `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining`
    : daysRemaining === 0 
      ? 'Due today'
      : `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) > 1 ? 's' : ''} overdue`;

  // Send email notification
  if (invoice.tenant.email) {
    try {
      const amount = Number(invoice.amount);
      await sendEmail({
        to: invoice.tenant.email,
        subject: `Payment Reminder: Invoice for ${invoice.month}`,
        template: 'paymentReminder',
        data: {
          tenantName: invoice.tenant.name,
          month: invoice.month,
          amount: amount.toLocaleString('en-IN'),
          dueDate: dueDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          daysRemaining: daysRemainingText,
        },
      });
      console.log(`✅ Payment reminder email sent to ${invoice.tenant.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send payment reminder email:', emailError);
      // Don't fail the request if email fails
    }
  }

  // Send in-app notification
  try {
    const amount = Number(invoice.amount);
    await createNotification({
      userId: invoice.tenant.userId,
      type: 'PAYMENT_DUE',
      title: 'Payment Reminder',
      message: `Reminder: Your payment of ₹${amount.toLocaleString('en-IN')} for ${invoice.month} is ${daysRemainingText}. Due date: ${dueDate.toLocaleDateString('en-IN')}`,
      data: {
        invoiceId: invoice.id,
        month: invoice.month,
        amount: amount,
        dueDate: dueDate.toISOString(),
        daysRemaining,
      },
      channels: ['WEBSOCKET', 'EMAIL'],
      priority: 'MEDIUM',
    });
    console.log(`✅ Payment reminder notification sent to tenant ${invoice.tenant.userId}`);
  } catch (notifError) {
    console.error('❌ Failed to send payment reminder notification:', notifError);
    // Don't fail the request if notification fails
  }

  // Emit real-time update
  emitDataUpdate(invoice.tenant.userId, 'invoice', 'update', invoice);

  res.json({
    success: true,
    message: 'Payment reminder sent successfully',
    data: {
      invoiceId: invoice.id,
      tenantName: invoice.tenant.name,
      emailSent: !!invoice.tenant.email,
      notificationSent: true,
    },
  });
});
  
