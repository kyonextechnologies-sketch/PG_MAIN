import path from 'path';
import { Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/database';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { validateUploadedFiles } from '../utils/fileValidation';
import { getFileUrl } from '../utils/fileUpload';
import { logFileUpload } from '../middleware/auditLog';

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

