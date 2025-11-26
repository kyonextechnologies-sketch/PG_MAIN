import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getOwners,
  getOwnerDetails,
  verifyOwner,
  getDashboardStats,
  getMaintenanceRequests,
  getAuditLogs,
  getSubscriptions,
  updateSubscription,
  triggerMonthlyBilling,
  processOverdueInvoicesManual,
  getSubscriptionUpiSettings,
  updateSubscriptionUpiSettings,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// Admin routes - ENABLED
router.get('/dashboard-stats', getDashboardStats);
router.get('/owners', getOwners);
router.get('/owners/:id', getOwnerDetails);
router.post('/owners/:id/verify', verifyOwner);
router.get('/maintenance-requests', getMaintenanceRequests);
router.get('/audit-logs', getAuditLogs);
router.get('/subscriptions', getSubscriptions);
router.put('/subscriptions/:ownerId', updateSubscription);

// Billing management routes
router.post('/billing/generate', triggerMonthlyBilling);
router.post('/billing/overdue', processOverdueInvoicesManual);

// Subscription UPI settings routes
router.get('/subscription-upi-settings', getSubscriptionUpiSettings);
router.put('/subscription-upi-settings', updateSubscriptionUpiSettings);

export default router;
