import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getRevenueTrend, getDashboardStats } from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Revenue trend data
router.get('/revenue', getRevenueTrend);

// Dashboard statistics
router.get('/stats', getDashboardStats);

export default router;

