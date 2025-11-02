import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { getFileUrl } from '../utils/fileUpload';

export const uploadKYC = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const fileUrl = getFileUrl(req.file.path);

  res.json({
    success: true,
    message: 'KYC document uploaded successfully',
    data: {
      filename: req.file.filename,
      path: req.file.path,
      url: fileUrl,
    },
  });
});

export const uploadMeterImage = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('No file uploaded', 400);
  }

  const fileUrl = getFileUrl(req.file.path);

  res.json({
    success: true,
    message: 'Meter image uploaded successfully',
    data: {
      filename: req.file.filename,
      path: req.file.path,
      url: fileUrl,
    },
  });
});

export const uploadMaintenanceImages = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.files || !Array.isArray(req.files)) {
    throw new AppError('No files uploaded', 400);
  }

  const uploadedFiles = req.files.map((file) => ({
    filename: file.filename,
    path: file.path,
    url: getFileUrl(file.path),
  }));

  res.json({
    success: true,
    message: 'Maintenance images uploaded successfully',
    data: uploadedFiles,
  });
});

