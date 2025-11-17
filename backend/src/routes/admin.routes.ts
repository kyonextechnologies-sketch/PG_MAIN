import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getOwners,
  getOwnerDetails,
  verifyOwner,
  getDashboardStats,
  getMaintenanceRequests,
  getAuditLogs,
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

export default router;
