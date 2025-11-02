import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generatePaginatedResponse, generateReceiptNumber } from '../utils/helpers';
import { sendEmail } from '../utils/email';

export const createPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { invoiceId, amount, method, transactionId, upiTransactionId, notes } = req.body;

  // Get tenant profile
  const tenant = await prisma.tenantProfile.findFirst({
    where: { userId: req.user.id },
  });

  if (!tenant) {
    throw new AppError('Tenant profile not found', 404);
  }

  // Get invoice
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { tenant: true },
  });

  if (!invoice) {
    throw new AppError('Invoice not found', 404);
  }

  if (invoice.tenantId !== tenant.id) {
    throw new AppError('Unauthorized', 403);
  }

  // Validate amount
  if (amount <= 0) {
    throw new AppError('Payment amount must be greater than 0', 400);
  }

  // Create payment
  const payment = await prisma.payment.create({
    data: {
      invoiceId,
      tenantId: tenant.id,
      amount,
      method,
      transactionId,
      upiTransactionId,
      notes,
      status: 'SUCCESS',
    },
  });

  // Calculate total paid
  const totalPaid = await prisma.payment.aggregate({
    where: {
      invoiceId,
      status: 'SUCCESS',
    },
    _sum: {
      amount: true,
    },
  });

  const paidAmount = parseFloat(totalPaid._sum.amount?.toString() || '0');
  const invoiceAmount = parseFloat(invoice.amount.toString());

  // Update invoice status
  let newStatus = invoice.status;
  let paidAt = invoice.paidAt;
  let receiptNo = invoice.receiptNo;

  if (paidAmount >= invoiceAmount) {
    newStatus = 'PAID';
    paidAt = new Date();
    receiptNo = generateReceiptNumber(invoice.month);
  } else if (paidAmount > 0) {
    newStatus = 'PARTIAL';
  }

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: newStatus,
      paidAt,
      receiptNo,
    },
  });

  // Send confirmation email
  try {
    await sendEmail({
      to: invoice.tenant.email,
      subject: 'Payment Confirmation',
      template: 'paymentConfirmation',
      data: {
        tenantName: invoice.tenant.name,
        amount,
        method,
        transactionId: transactionId || 'N/A',
        date: new Date().toLocaleDateString(),
      },
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  res.status(201).json({
    success: true,
    message: 'Payment processed successfully',
    data: payment,
  });
});

export const getAllPayments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const method = req.query.method as string;

  const skip = (page - 1) * limit;

  let where: any = {};

  if (req.user.role === 'OWNER') {
    where.invoice = { ownerId: req.user.id };
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
  if (method) where.method = method;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        invoice: {
          select: {
            id: true,
            month: true,
            amount: true,
            receiptNo: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);

  const response = generatePaginatedResponse(payments, total, { page, limit });
  res.json(response);
});

export const getPaymentById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      tenant: true,
    },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check authorization
  if (req.user.role === 'OWNER' && payment.invoice.ownerId !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  if (req.user.role === 'TENANT') {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (!tenant || payment.tenantId !== tenant.id) {
      throw new AppError('Unauthorized', 403);
    }
  }

  res.json({
    success: true,
    message: 'Payment fetched successfully',
    data: payment,
  });
});

export const updatePaymentStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can update payment status', 403);
  }

  const { id } = req.params;
  const { status } = req.body;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: true },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.invoice.ownerId !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  const updatedPayment = await prisma.payment.update({
    where: { id },
    data: { status },
  });

  res.json({
    success: true,
    message: 'Payment status updated successfully',
    data: updatedPayment,
  });
});

export const deletePayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can delete payments', 403);
  }

  const { id } = req.params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { invoice: true },
  });

  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  if (payment.invoice.ownerId !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  await prisma.payment.delete({ where: { id } });

  // Recalculate invoice status
  const totalPaid = await prisma.payment.aggregate({
    where: {
      invoiceId: payment.invoiceId,
      status: 'SUCCESS',
    },
    _sum: {
      amount: true,
    },
  });

  const paidAmount = parseFloat(totalPaid._sum.amount?.toString() || '0');
  const invoiceAmount = parseFloat(payment.invoice.amount.toString());

  let newStatus = 'DUE';
  if (paidAmount >= invoiceAmount) {
    newStatus = 'PAID';
  } else if (paidAmount > 0) {
    newStatus = 'PARTIAL';
  }

  await prisma.invoice.update({
    where: { id: payment.invoiceId },
    data: {
      status: newStatus as any,
      paidAt: newStatus === 'PAID' ? new Date() : null,
    },
  });

  res.json({
    success: true,
    message: 'Payment deleted successfully',
  });
});

