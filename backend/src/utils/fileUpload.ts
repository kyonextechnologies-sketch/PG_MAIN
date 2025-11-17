import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';

// Ensure upload directories exist
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const directories = ['kyc', 'meter-images', 'maintenance', 'legal-documents'];

directories.forEach((dir) => {
  const fullPath = path.join(uploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    let folder = 'others';

    if (file.fieldname === 'kycDocument') {
      folder = 'kyc';
    } else if (file.fieldname === 'meterImage') {
      folder = 'meter-images';
    } else if (file.fieldname === 'maintenanceImages') {
      folder = 'maintenance';
    }

    cb(null, path.join(uploadDir, folder));
  },
  filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// File filter
const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allowed file types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, and PDF files are allowed.', 400));
  }
};

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
});

// Upload single file
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

// Upload multiple files
export const uploadMultiple = (fieldName: string, maxCount: number = 5) =>
  upload.array(fieldName, maxCount);

// Upload fields
export const uploadFields = (fields: { name: string; maxCount: number }[]) =>
  upload.fields(fields);

// Delete file
export const deleteFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

// Get file URL
export const getFileUrl = (filePath: string): string => {
  const baseUrl = (process.env.BACKEND_URL || 'http://localhost:5000').replace(/\/$/, '');
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/^\.?\/*/, '');
  return `${baseUrl}/${normalizedPath}`;
};

// Validate file size
export const validateFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// Get file extension
export const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Validate image file
export const isImageFile = (mimetype: string): boolean => {
  return ['image/jpeg', 'image/jpg', 'image/png'].includes(mimetype);
};

// Validate PDF file
export const isPdfFile = (mimetype: string): boolean => {
  return mimetype === 'application/pdf';
};
