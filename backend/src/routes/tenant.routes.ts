// src/routes/tenant.routes.ts
import { Router } from 'express';
import {
  createTenant,
  getAllTenants,
  getTenantById,
  getMyTenantProfile,
  updateMyTenantProfile,
  getOwnerPaymentSettings,
  updateTenant,
  checkoutTenant,
  deleteTenant,
} from '../controllers/tenant.controller';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';
import { validatePagination } from '../middleware/validation';
import { validate } from '../middleware/validation';
import { createTenantValidator, updateTenantValidator } from '../validators/property.validator';

const router = Router();

// ✅ Get current tenant's own profile (for TENANT users) - No role check needed
router.get('/profile/me', authenticate, getMyTenantProfile);
// ✅ Update current tenant's own profile (for TENANT users)
router.put('/profile/me', authenticate, updateMyTenantProfile);
// ✅ Get owner payment settings (for TENANT users)
router.get('/owner/payment-settings', authenticate, getOwnerPaymentSettings);

// All other tenant routes require auth and owner role
router.use(authenticate, isOwner);

// Create tenant
router.post('/', validate(createTenantValidator), createTenant);

// Get paginated tenants
router.get('/', validatePagination, getAllTenants);

// Get a tenant by id
router.get('/:id', getTenantById);

// Update tenant
router.put('/:id', validate(updateTenantValidator), updateTenant);

// Checkout tenant
router.post('/:id/checkout', checkoutTenant);

// Delete tenant
router.delete('/:id', deleteTenant);

export default router;
