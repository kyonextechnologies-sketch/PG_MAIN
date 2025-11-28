import { Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';

// Allowed file types for legal documents
const LEGAL_DOCUMENT_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

console.log(
  `📄 Legal document upload configured: ${MAX_FILE_SIZE / (1024 * 1024)}MB max per file`
);

/**
 * Validate file type
 */
export function validateFileType(file: Express.Multer.File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.mimetype);
}

/**
 * Validate file size
 */
export function validateFileSize(file: Express.Multer.File, maxSize: number): boolean {
  if (typeof file.size !== 'number') {
    // When using disk storage, size might not be populated until after streaming completes.
    // Multer's limits.fileSize will still enforce the cap, so we treat "unknown" size as valid here.
    return true;
  }
  return file.size <= maxSize;
}

/**
 * Get safe filename
 */
export function getSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext).replace(/[^a-zA-Z0-9]/g, '_');
  return `${name}_${timestamp}_${random}${ext}`;
}

const LEGAL_DOCUMENTS_DIR = path.join(process.cwd(), 'uploads', 'legal-documents');

if (!fs.existsSync(LEGAL_DOCUMENTS_DIR)) {
  fs.mkdirSync(LEGAL_DOCUMENTS_DIR, { recursive: true });
}

/**
 * Multer storage configuration for legal documents
 * Saves files under uploads/owners/{ownerId}/{docType}/ path
 */
export const legalDocumentStorage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    // Get ownerId from authenticated user
    const authReq = req as any;
    const ownerId = authReq.user?.id;
    const docType = authReq.body?.docType || 'documents';

    if (!ownerId) {
      return cb(new AppError('Owner ID not found in request', 401), '');
    }

    // Create owner-specific directory structure: uploads/owners/{ownerId}/{docType}/
    const ownerDocDir = path.join(process.cwd(), 'uploads', 'owners', ownerId, docType);

    // Ensure directory exists
    if (!fs.existsSync(ownerDocDir)) {
      fs.mkdirSync(ownerDocDir, { recursive: true });
    }

    cb(null, ownerDocDir);
  },
  filename: (req: Request, file, cb) => {
    // Use docType in filename for better organization
    const authReq = req as any;
    const docType = authReq.body?.docType || 'document';
    const safeName = getSafeFilename(file.originalname);
    // Format: {docType}_{originalname}_{timestamp}_{random}.ext
    const ext = path.extname(safeName);
    const baseName = path.basename(safeName, ext);
    const filename = `${docType}_${baseName}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter for legal documents
 */
export const legalDocumentFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const fileSizeMB =
    typeof file.size === 'number' ? `${(file.size / (1024 * 1024)).toFixed(2)}MB` : 'unknown';
  console.log(
    `📥 Incoming legal doc: name=${file.originalname}, size=${fileSizeMB}, type=${file.mimetype}`
  );

  if (!validateFileType(file, LEGAL_DOCUMENT_TYPES)) {
    return cb(
      new AppError(
        `Invalid file type. Allowed types: ${LEGAL_DOCUMENT_TYPES.join(', ')}`,
        400
      )
    );
  }

  if (!validateFileSize(file, MAX_FILE_SIZE)) {
    console.warn(`⚠️ Legal doc rejected for size. ${file.originalname} is ${fileSizeMB}`);
    return cb(new AppError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 400));
  }

  cb(null, true);
};

/**
 * Multer upload middleware for legal documents
 */
export const uploadLegalDocuments = multer({
  storage: legalDocumentStorage,
  fileFilter: legalDocumentFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Maximum 5 files at once
  },
});

/**
 * Validate uploaded files array
 */
export function validateUploadedFiles(files: Express.Multer.File[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!files || files.length === 0) {
    errors.push('No files uploaded');
    return { valid: false, errors };
  }

  if (files.length > 5) {
    errors.push('Maximum 5 files allowed');
  }

  files.forEach((file, index) => {
    const sizeLabel =
      typeof file.size === 'number'
        ? `${(file.size / (1024 * 1024)).toFixed(2)}MB`
        : 'unknown';
    console.log(
      `🔍 Validating uploaded doc [${index + 1}/${files.length}]: ${file.originalname} - ${sizeLabel}`
    );
    if (!validateFileType(file, LEGAL_DOCUMENT_TYPES)) {
      errors.push(`File ${index + 1}: Invalid file type`);
    }

    if (!validateFileSize(file, MAX_FILE_SIZE)) {
      errors.push(`File ${index + 1}: File too large`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize file metadata
 */
export function sanitizeFileMetadata(file: Express.Multer.File) {
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
    uploadedAt: new Date().toISOString(),
  };
}

