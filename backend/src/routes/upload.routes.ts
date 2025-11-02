import { Router } from 'express';
import {
  uploadKYC,
  uploadMeterImage,
  uploadMaintenanceImages,
} from '../controllers/upload.controller';
import { authenticate } from '../middleware/auth';
import { uploadSingle, uploadMultiple } from '../utils/fileUpload';

const router = Router();

router.use(authenticate);

router.post('/kyc', uploadSingle('kycDocument'), uploadKYC);
router.post('/meter-image', uploadSingle('meterImage'), uploadMeterImage);
router.post('/maintenance-images', uploadMultiple('maintenanceImages', 5), uploadMaintenanceImages);

export default router;

