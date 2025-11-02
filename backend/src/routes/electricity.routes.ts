import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  submitBill,
  getAllBills,
  getBillById,
  approveBill,
  rejectBill,
  deleteBill,
} from '../controllers/electricity.controller';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';
import { validatePagination } from '../middleware/validation';

const router = Router();

router.use(authenticate);

// Settings (owner only)
router.get('/settings', isOwner, getSettings);
router.put('/settings', isOwner, updateSettings);

// Bills
router.post('/bills', submitBill);
router.get('/bills', validatePagination, getAllBills);
router.get('/bills/:id', getBillById);
router.post('/bills/:id/approve', isOwner, approveBill);
router.post('/bills/:id/reject', isOwner, rejectBill);
router.delete('/bills/:id', deleteBill);

export default router;

