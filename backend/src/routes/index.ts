import { Router } from 'express';
import authRoutes from './auth.routes';
import otpRoutes from './otp.routes';
import adminRoutes from './admin.routes';
import propertyRoutes from './property.routes';
import roomRoutes from './room.routes';
import tenantRoutes from './tenant.routes';
import electricityRoutes from './electricity.routes';
import invoiceRoutes from './invoice.routes';
import paymentRoutes from './payment.routes';
import maintenanceRoutes from './maintenance.routes';
import reportsRoutes from './reports.routes';
import uploadRoutes from './upload.routes';
import ownerRoutes from './owner.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/auth', otpRoutes); // OTP routes under /auth prefix
router.use('/admin', adminRoutes); // Admin routes
router.use('/properties', propertyRoutes);
router.use('/rooms', roomRoutes);
router.use('/tenants', tenantRoutes);
router.use('/electricity', electricityRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/reports', reportsRoutes);
router.use('/upload', uploadRoutes);
router.use('/owners', ownerRoutes);

export default router;

