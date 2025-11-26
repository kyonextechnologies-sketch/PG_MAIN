import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';
import {
  getOwnerVerificationStatus,
  uploadOwnerVerificationDocuments,
  uploadSeparateDocument,
  getOwnerProfile,
  updateOwnerProfile,
  getOwnerPaymentSettings,
  updateOwnerPaymentSettings,
} from '../controllers/owner.controller';
import { uploadLegalDocuments } from '../utils/fileValidation';

const router = Router();

router.use(authenticate, isOwner);

// Profile routes
router.get('/profile/me', getOwnerProfile);
router.put('/profile/me', updateOwnerProfile);

// Payment settings routes
router.get('/payment-settings', getOwnerPaymentSettings);
router.put('/payment-settings', updateOwnerPaymentSettings);

// Verification routes
router.get('/verification', getOwnerVerificationStatus);

// Legacy endpoint - supports generic document array
router.post(
  '/verification/documents',
  uploadLegalDocuments.array('documents', 5),
  uploadOwnerVerificationDocuments
);

// New endpoint - supports separate document type uploads
router.post(
  '/verification/document',
  uploadLegalDocuments.single('document'),
  uploadSeparateDocument
);

export default router;

