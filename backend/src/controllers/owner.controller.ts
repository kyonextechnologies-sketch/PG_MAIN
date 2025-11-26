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

  // Return both legacy format and new separate document fields
  // Type assertion needed until Prisma client is regenerated after migration
  const verificationData = verification as any;
  
  res.json({
    success: true,
    data: {
      verificationStatus: verification?.verificationStatus || 'PENDING',
      legalDocuments, // Legacy format for backward compatibility
      rejectionReason: verification?.rejectionReason || '',
      submittedAt: verification?.submittedAt || null,
      verifiedAt: verification?.verifiedAt || null,
      // New separate document fields
      documents: {
        aadhaarFront: {
          url: verificationData?.aadhaarFront || null,
          status: verificationData?.aadhaarFrontStatus || 'PENDING',
          rejectionReason: verificationData?.aadhaarFrontRejectionReason || null,
        },
        aadhaarBack: {
          url: verificationData?.aadhaarBack || null,
          status: verificationData?.aadhaarBackStatus || 'PENDING',
          rejectionReason: verificationData?.aadhaarBackRejectionReason || null,
        },
        pan: {
          url: verificationData?.pan || null,
          status: verificationData?.panStatus || 'PENDING',
          rejectionReason: verificationData?.panRejectionReason || null,
        },
        gst: {
          url: verificationData?.gst || null,
          status: verificationData?.gstStatus || 'PENDING',
          rejectionReason: verificationData?.gstRejectionReason || null,
        },
        addressProof: {
          url: verificationData?.addressProof || null,
          status: verificationData?.addressProofStatus || 'PENDING',
          rejectionReason: verificationData?.addressProofRejectionReason || null,
        },
        ownerPhoto: {
          url: verificationData?.ownerPhoto || null,
          status: verificationData?.ownerPhotoStatus || 'PENDING',
          rejectionReason: verificationData?.ownerPhotoRejectionReason || null,
        },
      },
    },
  });
});

/**
 * Upload owner verification documents (legacy method - supports generic document array)
 */
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
 * Upload separate document types (new method - supports individual document uploads)
 * Supports: aadhaarFront, aadhaarBack, pan, gst, addressProof, ownerPhoto
 */
export const uploadSeparateDocument = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { docType } = req.body;
  const allowedDocTypes = ['aadhaarFront', 'aadhaarBack', 'pan', 'gst', 'addressProof', 'ownerPhoto'];

  if (!docType || !allowedDocTypes.includes(docType)) {
    throw new AppError(`Invalid document type. Allowed types: ${allowedDocTypes.join(', ')}`, 400);
  }

  const files = extractFilesArray(req.files as any);

  if (!files || files.length === 0) {
    throw new AppError('Please upload a document', 400);
  }

  if (files.length > 1) {
    throw new AppError('Only one file allowed per document type', 400);
  }

  const file = files[0];
  const validation = validateUploadedFiles([file]);

  if (!validation.valid) {
    throw new AppError(validation.errors.join(', '), 400);
  }

  const fileUrl = getFileUrl(normalizeRelativePath(file.path));

  // Map docType to database field names
  const fieldMap: Record<string, { urlField: string; statusField: string; rejectionField: string }> = {
    aadhaarFront: {
      urlField: 'aadhaarFront',
      statusField: 'aadhaarFrontStatus',
      rejectionField: 'aadhaarFrontRejectionReason',
    },
    aadhaarBack: {
      urlField: 'aadhaarBack',
      statusField: 'aadhaarBackStatus',
      rejectionField: 'aadhaarBackRejectionReason',
    },
    pan: {
      urlField: 'pan',
      statusField: 'panStatus',
      rejectionField: 'panRejectionReason',
    },
    gst: {
      urlField: 'gst',
      statusField: 'gstStatus',
      rejectionField: 'gstRejectionReason',
    },
    addressProof: {
      urlField: 'addressProof',
      statusField: 'addressProofStatus',
      rejectionField: 'addressProofRejectionReason',
    },
    ownerPhoto: {
      urlField: 'ownerPhoto',
      statusField: 'ownerPhotoStatus',
      rejectionField: 'ownerPhotoRejectionReason',
    },
  };

  const fields = fieldMap[docType];

  // Update verification record
  // Using type assertion until Prisma client is regenerated
  const updateData: any = {
    verificationStatus: 'PENDING',
    verifiedAt: null,
    verifiedBy: null,
    submittedAt: new Date(),
  };
  updateData[fields.urlField] = fileUrl;
  updateData[fields.statusField] = 'PENDING';
  updateData[fields.rejectionField] = null;

  const createData: any = {
    ownerId: req.user.id,
    verificationStatus: 'PENDING',
    submittedAt: new Date(),
  };
  createData[fields.urlField] = fileUrl;
  createData[fields.statusField] = 'PENDING';
  createData[fields.rejectionField] = null;

  const verification = await prisma.ownerVerification.upsert({
    where: { ownerId: req.user.id },
    create: createData,
    update: updateData,
  });

  // Log file upload
  await logFileUpload(req.user.id, 'OWNER_VERIFICATION', file.filename, file.size, req, {
    mimetype: file.mimetype,
    docType,
  });

  const verificationData = verification as any;

  res.json({
    success: true,
    message: `${docType} uploaded successfully`,
    data: {
      docType,
      url: fileUrl,
      status: verificationData[fields.statusField] || 'PENDING',
      verificationStatus: verification.verificationStatus,
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

