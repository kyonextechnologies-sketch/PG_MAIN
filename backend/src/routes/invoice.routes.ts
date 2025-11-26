import { Router } from 'express';
import {
  generateInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  updateOverdueInvoices,
  sendPaymentReminder,
} from '../controllers/invoice.controller';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';
import { validatePagination } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.post('/', isOwner, generateInvoice);
router.get('/', validatePagination, getAllInvoices);
router.get('/:id', getInvoiceById);
router.put('/:id', isOwner, updateInvoice);
router.delete('/:id', isOwner, deleteInvoice);
router.post('/update-overdue', isOwner, updateOverdueInvoices);
router.post('/:id/send-reminder', isOwner, sendPaymentReminder);

export default router;

