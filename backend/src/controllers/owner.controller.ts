import path from 'path';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { validateUploadedFiles } from '../utils/fileValidation';
import { getFileUrl } from '../utils/fileUpload';
import { logFileUpload } from '../middleware/auditLog';
import { createNotification } from '../services/notification.service';

type UploadedDocument = {
  id: string;
  filename: string;
  originalname: string;
  mimetype: string;
  fileSize: number;
  path: string;
  url: string;
  uploadedAt: string;
};

const normalizeRelativePath = (absolutePath: string): string => {
  const relativePath = path.relative(process.cwd(), absolutePath);
  return relativePath.replace(/\\/g, '/');
};

const formatDocumentMetadata = (file: Express.Multer.File): UploadedDocument => {
  const relativePath = normalizeRelativePath(file.path);

  return {
    id: file.filename,
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    fileSize: file.size,
    path: relativePath,
    url: getFileUrl(relativePath),
    uploadedAt: new Date().toISOString(),
  };
};

const extractFilesArray = (
  files: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] } | undefined
): Express.Multer.File[] => {
  if (!files) return [];
  if (Array.isArray(files)) return files;
  if ('documents' in files) {
    return (files as { [fieldname: string]: Express.Multer.File[] }).documents || [];
  }
  return Object.values(files).flat();
};

export const getOwnerVerificationStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const verification = await prisma.ownerVerification.findUnique({
    where: { ownerId: req.user.id },
  });

  const legalDocuments = Array.isArray(verification?.legalDocuments)
    ? verification?.legalDocuments
    : [];

  res.json({
    success: true,
    data: {
      verificationStatus: verification?.verificationStatus || 'PENDING',
      legalDocuments,
      rejectionReason: verification?.rejectionReason || '',
      submittedAt: verification?.submittedAt || null,
      verifiedAt: verification?.verifiedAt || null,
    },
  });
});

export const uploadOwnerVerificationDocuments = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const files = extractFilesArray(req.files as any);

  if (!files || files.length === 0) {
    throw new AppError('Please upload at least one document', 400);
  }

  const validation = validateUploadedFiles(files);

  if (!validation.valid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  const formattedDocuments = files.map(formatDocumentMetadata);
  const formattedDocumentsJson = formattedDocuments as unknown as Prisma.JsonArray;

  const existingVerification = await prisma.ownerVerification.findUnique({
    where: { ownerId: req.user.id },
  });

  const existingDocuments = Array.isArray(existingVerification?.legalDocuments)
    ? (existingVerification.legalDocuments as Prisma.JsonArray)
    : ([] as Prisma.JsonArray);

  const updatedDocuments = [...existingDocuments, ...formattedDocumentsJson] as Prisma.JsonArray;

  const verification = await prisma.ownerVerification.upsert({
    where: { ownerId: req.user.id },
    create: {
      ownerId: req.user.id,
      verificationStatus: 'PENDING',
      legalDocuments: formattedDocumentsJson,
      rejectionReason: null,
    },
    update: {
      legalDocuments: updatedDocuments,
      verificationStatus: 'PENDING',
      rejectionReason: null,
      verifiedAt: null,
      verifiedBy: null,
      submittedAt: new Date(),
    },
  });

  for (const doc of formattedDocuments) {
    await logFileUpload(req.user.id, 'OWNER_VERIFICATION', doc.filename, doc.fileSize, req, {
      mimetype: doc.mimetype,
    });
  }

  res.json({
    success: true,
    message: 'Verification documents uploaded successfully',
    data: {
      verificationStatus: verification.verificationStatus,
      legalDocuments: verification.legalDocuments,
      rejectionReason: verification.rejectionReason,
      submittedAt: verification.submittedAt,
      verifiedAt: verification.verifiedAt,
    },
  });
});

/**
 * Get owner profile
 */
export const getOwnerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update owner profile
 */
export const updateOwnerProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { name, email, phone, company } = req.body;

  // Validate email if provided
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError('Invalid email format', 400);
    }

    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        NOT: { id: req.user.id },
      },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }
  }

  // Validate phone if provided
  if (phone) {
    // Check if phone is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: req.user.id },
      },
    });

    if (existingUser) {
      throw new AppError('Phone number already in use', 400);
    }
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email.toLowerCase().trim();
  if (phone !== undefined) updateData.phone = phone;
  if (company !== undefined) updateData.company = company;

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      company: true,
    },
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: updatedUser,
  });
});

/**
 * Get owner payment settings
 */
export const getOwnerPaymentSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      upiId: true,
      upiName: true,
      autoGenerateInvoices: true,
      invoiceReminderDays: true,
      lateFeePercentage: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    success: true,
    data: {
      upiId: user.upiId || '',
      upiName: user.upiName || '',
      autoGenerateInvoices: user.autoGenerateInvoices ?? true,
      invoiceReminderDays: user.invoiceReminderDays ?? 3,
      lateFeePercentage: Number(user.lateFeePercentage) || 2,
    },
  });
});

/**
 * Update owner payment settings
 */
export const updateOwnerPaymentSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { upiId, upiName, autoGenerateInvoices, invoiceReminderDays, lateFeePercentage } = req.body;

  // Validate UPI ID format if provided
  if (upiId && upiId.trim()) {
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiIdRegex.test(upiId)) {
      throw new AppError('Please enter a valid UPI ID (e.g., owner@paytm)', 400);
    }
  }

  // Validate invoice reminder days
  if (invoiceReminderDays !== undefined) {
    if (invoiceReminderDays < 1 || invoiceReminderDays > 30) {
      throw new AppError('Invoice reminder days must be between 1 and 30', 400);
    }
  }

  // Validate late fee percentage
  if (lateFeePercentage !== undefined) {
    if (lateFeePercentage < 0 || lateFeePercentage > 50) {
      throw new AppError('Late fee percentage must be between 0 and 50', 400);
    }
  }

  const updateData: any = {};
  if (upiId !== undefined) updateData.upiId = upiId || null;
  if (upiName !== undefined) updateData.upiName = upiName || null;
  if (autoGenerateInvoices !== undefined) updateData.autoGenerateInvoices = autoGenerateInvoices;
  if (invoiceReminderDays !== undefined) updateData.invoiceReminderDays = invoiceReminderDays;
  if (lateFeePercentage !== undefined) updateData.lateFeePercentage = new Prisma.Decimal(lateFeePercentage);

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      upiId: true,
      upiName: true,
      autoGenerateInvoices: true,
      invoiceReminderDays: true,
      lateFeePercentage: true,
    },
  });

  // Notify all tenants of this owner about payment settings update
  try {
    const tenants = await prisma.tenantProfile.findMany({
      where: { ownerId: req.user.id },
      select: { userId: true },
    });

    for (const tenant of tenants) {
      await createNotification({
        userId: tenant.userId,
        type: 'SYSTEM_ALERT',
        title: 'Payment Details Updated',
        message: `Your owner has updated payment details. UPI ID: ${updatedUser.upiId || 'Not set'}`,
        data: {
          upiId: updatedUser.upiId || '',
          upiName: updatedUser.upiName || '',
          updatedAt: new Date().toISOString(),
        },
        channels: ['WEBSOCKET'],
        priority: 'MEDIUM',
      });
    }
    console.log(`✅ Notified ${tenants.length} tenants about payment settings update`);
  } catch (err) {
    console.error('❌ Failed to notify tenants about payment settings update:', err);
    // Don't fail the update if notification fails
  }

  res.json({
    success: true,
    message: 'Payment settings updated successfully',
    data: {
      upiId: updatedUser.upiId || '',
      upiName: updatedUser.upiName || '',
      autoGenerateInvoices: updatedUser.autoGenerateInvoices ?? true,
      invoiceReminderDays: updatedUser.invoiceReminderDays ?? 3,
      lateFeePercentage: Number(updatedUser.lateFeePercentage) || 2,
    },
  });
});

