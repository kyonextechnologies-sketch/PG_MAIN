import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';
import {
  getOwnerVerificationStatus,
  uploadOwnerVerificationDocuments,
} from '../controllers/owner.controller';
import { uploadLegalDocuments } from '../utils/fileValidation';

const router = Router();

router.use(authenticate, isOwner);

router.get('/verification', getOwnerVerificationStatus);

router.post(
  '/verification/documents',
  uploadLegalDocuments.array('documents', 5),
  uploadOwnerVerificationDocuments
);

export default router;

