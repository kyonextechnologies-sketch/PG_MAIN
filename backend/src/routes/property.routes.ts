import { Router } from 'express';
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  getPropertyStats,
} from '../controllers/property.controller';
import {
  createPropertyValidator,
  updatePropertyValidator,
  propertyIdValidator,
} from '../validators/property.validator';
import { validate, validatePagination } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { isOwner } from '../middleware/rbac';

const router = Router();

// All routes require authentication and owner role
router.use(authenticate, isOwner);

router.post('/', validate(createPropertyValidator), createProperty);
router.get('/', validatePagination, getAllProperties);
router.get('/:id', validate(propertyIdValidator), getPropertyById);
router.put('/:id', validate(updatePropertyValidator), updateProperty);
router.delete('/:id', validate(propertyIdValidator), deleteProperty);
router.get('/:id/stats', validate(propertyIdValidator), getPropertyStats);

export default router;

