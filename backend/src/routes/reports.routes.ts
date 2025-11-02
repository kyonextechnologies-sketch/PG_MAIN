import { Router } from 'express';
import {
  getDashboardStats,
  getRevenueReport,
  getOccupancyReport,
  getPaymentReport,
  getElectricityReport,
} from '../controllers/reports.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueReport);
router.get('/occupancy', getOccupancyReport);
router.get('/payments', getPaymentReport);
router.get('/electricity', getElectricityReport);

export default router;

