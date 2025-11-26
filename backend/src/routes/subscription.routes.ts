import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSubscriptionPlans,
  createSubscription,
  getOwnerSubscription,
  confirmSubscriptionPayment,
  getSubscriptionUpiSettings,
} from '../controllers/subscription.controller';

const router = Router();

// Public routes - get available plans and UPI settings
router.get('/plans', getSubscriptionPlans);
router.get('/upi-settings', getSubscriptionUpiSettings);

// Protected routes - require authentication
router.use(authenticate);

router.get('/me', getOwnerSubscription);
router.post('/', createSubscription);
router.post('/confirm-payment', confirmSubscriptionPayment);

export default router;

