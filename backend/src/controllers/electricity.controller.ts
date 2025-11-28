import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { calculateElectricityAmount, generatePaginatedResponse } from '../utils/helpers';
import { sendEmail } from '../utils/email';

// Settings
export const getSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  let settings = await prisma.electricitySettings.findUnique({
    where: { ownerId: req.user.id },
  });

  if (!settings) {
    // Create default settings
    settings = await prisma.electricitySettings.create({
      data: {
        ownerId: req.user.id,
        ratePerUnit: 5.0,
        dueDate: 5,
      },
    });
  }

  res.json({
    success: true,
    message: 'Settings fetched successfully',
    data: settings,
  });
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const settings = await prisma.electricitySettings.upsert({
    where: { ownerId: req.user.id },
    update: req.body,
    create: {
      ownerId: req.user.id,
      ...req.body,
    },
  });

  res.json({
    success: true,
    message: 'Settings updated successfully',
    data: settings,
  });
});

// Bills
export const submitBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { month, previousReading, currentReading, imageUrl } = req.body;

  // Validate required fields
  if (!month) {
    throw new AppError('Month is required', 400);
  }
  if (previousReading === undefined || previousReading === null) {
    throw new AppError('Previous reading is required', 400);
  }
  if (currentReading === undefined || currentReading === null) {
    throw new AppError('Current reading is required', 400);
  }

  // Validate numeric values
  const prevReading = Number(previousReading);
  const currReading = Number(currentReading);

  if (isNaN(prevReading) || isNaN(currReading)) {
    throw new AppError('Readings must be valid numbers', 400);
  }

  const tenant = await prisma.tenantProfile.findFirst({
    where: { userId: req.user.id },
    include: { owner: { include: { electricitySettings: true } } },
  });

  if (!tenant) {
    throw new AppError('Tenant profile not found', 404);
  }

  const settings = tenant.owner.electricitySettings;
  if (!settings) {
    throw new AppError('Electricity settings not configured', 400);
  }

  // Validate readings
  if (currReading <= prevReading) {
    throw new AppError('Current reading must be greater than previous reading', 400);
  }

  if (prevReading < 0 || currReading < 0) {
    throw new AppError('Readings cannot be negative', 400);
  }

  const { units, amount } = calculateElectricityAmount(
    currReading,
    prevReading,
    parseFloat(settings.ratePerUnit.toString())
  );

  // Check min/max limits
  if (units < parseFloat(settings.minimumUnits.toString())) {
    throw new AppError(`Units consumed must be at least ${settings.minimumUnits}`, 400);
  }

  if (units > parseFloat(settings.maximumUnits.toString())) {
    throw new AppError(`Units consumed cannot exceed ${settings.maximumUnits}`, 400);
  }

  // Check for existing bill
  const existingBill = await prisma.electricityBill.findUnique({
    where: {
      tenantId_month: {
        tenantId: tenant.id,
        month,
      },
    },
  });

  if (existingBill) {
    throw new AppError('Bill already submitted for this month', 400);
  }

  // Use transaction to ensure data consistency
  const bill = await prisma.$transaction(async (tx) => {
    // Check again for existing bill within transaction (prevent race condition)
    const existingBill = await tx.electricityBill.findUnique({
      where: {
        tenantId_month: {
          tenantId: tenant.id,
          month,
        },
      },
    });

    if (existingBill) {
      throw new AppError('Bill already submitted for this month', 400);
    }

    // Create bill
    return await tx.electricityBill.create({
      data: {
        ownerId: tenant.ownerId,
        tenantId: tenant.id,
        month,
        previousReading: prevReading,
        currentReading: currReading,
        units,
        ratePerUnit: settings.ratePerUnit,
        amount,
        imageUrl: imageUrl || null,
        status: 'PENDING',
      },
    });
  });

  res.status(201).json({
    success: true,
    message: 'Bill submitted successfully',
    data: bill,
  });
});

export const getAllBills = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string;
  const month = req.query.month as string;

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
  if (month) where.month = month;

  const [bills, total] = await Promise.all([
    prisma.electricityBill.findMany({
      where,
      skip,
      take: limit,
      include: {
        tenant: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.electricityBill.count({ where }),
  ]);

  const response = generatePaginatedResponse(bills, total, { page, limit });
  res.json(response);
});

export const getBillById = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  const bill = await prisma.electricityBill.findUnique({
    where: { id },
    include: {
      tenant: true,
      owner: { select: { id: true, name: true, email: true } },
    },
  });

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Check authorization
  if (req.user.role === 'OWNER' && bill.ownerId !== req.user.id) {
    throw new AppError('Unauthorized', 403);
  }

  if (req.user.role === 'TENANT') {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (!tenant || bill.tenantId !== tenant.id) {
      throw new AppError('Unauthorized', 403);
    }
  }

  res.json({
    success: true,
    message: 'Bill fetched successfully',
    data: bill,
  });
});

export const approveBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  const bill = await prisma.electricityBill.findFirst({
    where: { id, ownerId: req.user.id },
    include: { tenant: true },
  });

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  if (bill.status !== 'PENDING') {
    throw new AppError('Only pending bills can be approved', 400);
  }

  const updatedBill = await prisma.electricityBill.update({
    where: { id },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  // Send email notification
  try {
    await sendEmail({
      to: bill.tenant.email,
      subject: 'Electricity Bill Approved',
      template: 'billApproved',
      data: {
        tenantName: bill.tenant.name,
        month: bill.month,
        previousReading: bill.previousReading,
        currentReading: bill.currentReading,
        units: bill.units,
        ratePerUnit: bill.ratePerUnit,
        amount: bill.amount,
      },
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  res.json({
    success: true,
    message: 'Bill approved successfully',
    data: updatedBill,
  });
});

export const rejectBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;
  const { notes } = req.body;

  const bill = await prisma.electricityBill.findFirst({
    where: { id, ownerId: req.user.id },
    include: { tenant: true },
  });

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  if (bill.status !== 'PENDING') {
    throw new AppError('Only pending bills can be rejected', 400);
  }

  const updatedBill = await prisma.electricityBill.update({
    where: { id },
    data: {
      status: 'REJECTED',
      rejectedAt: new Date(),
      notes,
    },
  });

  // Send email notification
  try {
    await sendEmail({
      to: bill.tenant.email,
      subject: 'Electricity Bill Rejected',
      template: 'billRejected',
      data: {
        tenantName: bill.tenant.name,
        month: bill.month,
        reason: notes || 'No reason provided',
      },
    });
  } catch (error) {
    console.error('Failed to send email:', error);
  }

  res.json({
    success: true,
    message: 'Bill rejected successfully',
    data: updatedBill,
  });
});

export const deleteBill = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { id } = req.params;

  let bill;
  if (req.user.role === 'OWNER') {
    bill = await prisma.electricityBill.findFirst({
      where: { id, ownerId: req.user.id },
    });
  } else {
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });
    if (tenant) {
      bill = await prisma.electricityBill.findFirst({
        where: { id, tenantId: tenant.id, status: 'PENDING' },
      });
    }
  }

  if (!bill) {
    throw new AppError('Bill not found or cannot be deleted', 404);
  }

  await prisma.electricityBill.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Bill deleted successfully',
  });
});

