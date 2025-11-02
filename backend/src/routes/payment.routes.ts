import { Router } from 'express';
import {
  createPayment,
  getAllPayments,
  getPaymentById,
  updatePaymentStatus,
  deletePayment,
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { validatePagination } from '../middleware/validation';

const router = Router();

router.use(authenticate);

router.post('/', createPayment);
router.get('/', validatePagination, getAllPayments);
router.get('/:id', getPaymentById);
router.put('/:id/status', updatePaymentStatus);
router.delete('/:id', deletePayment);

export default router;

