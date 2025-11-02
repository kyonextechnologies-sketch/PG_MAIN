import { body, param } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const createPropertyValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Property name is required')
    .isLength({ min: 2 })
    .withMessage('Property name must be at least 2 characters'),
  body('address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('pincode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be 6 digits'),
  body('totalRooms')
    .isInt({ min: 1 })
    .withMessage('Total rooms must be at least 1'),
  body('totalBeds')
    .isInt({ min: 1 })
    .withMessage('Total beds must be at least 1'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
];

export const updatePropertyValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid property ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Property name must be at least 2 characters'),
  body('address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim(),
  body('state')
    .optional()
    .trim(),
  body('pincode')
    .optional()
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('Pincode must be 6 digits'),
  body('totalRooms')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total rooms must be at least 1'),
  body('totalBeds')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total beds must be at least 1'),
  body('amenities')
    .optional()
    .isArray()
    .withMessage('Amenities must be an array'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active must be a boolean'),
];

export const propertyIdValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid property ID'),
];

// ✅ Tenant Validators
export const createTenantValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone is required'),
  body('propertyId')
    .isUUID()
    .withMessage('Invalid property ID'),
  body('roomId')
    .isUUID()
    .withMessage('Invalid room ID'),
  body('bedId')
    .isUUID()
    .withMessage('Invalid bed ID'),
  body('securityDeposit')
    .isFloat({ min: 0 })
    .withMessage('Security deposit must be a positive number'),
  body('monthlyRent')
    .isFloat({ min: 1 })
    .withMessage('Monthly rent must be greater than 0'),
  body('moveInDate')
    .isISO8601()
    .withMessage('Move-in date must be a valid date'),
  body('kycId')
    .optional()
    .trim(),
  body('kycDocument')
    .optional()
    .trim(),
  body('password')
    .optional()
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const updateTenantValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid tenant ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .trim(),
  body('securityDeposit')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Security deposit must be a positive number'),
  body('monthlyRent')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Monthly rent must be greater than 0'),
  body('moveInDate')
    .optional()
    .isISO8601()
    .withMessage('Move-in date must be a valid date'),
  body('kycId')
    .optional()
    .trim(),
  body('kycDocument')
    .optional()
    .trim(),
];

/**
 * ✅ Maintenance Ticket Validators
 */
export const createMaintenanceTicketValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, category } = req.body;

  const errors: string[] = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('title: Title is required and must be a non-empty string');
  }

  if (!category || typeof category !== 'string' || category.trim().length === 0) {
    errors.push('category: Category is required and must be a non-empty string');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};

export const updateMaintenanceTicketValidator = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { status, priority, category } = req.body;

  const errors: string[] = [];

  if (status && typeof status !== 'string') {
    errors.push('status: Status must be a string');
  }

  if (priority && typeof priority !== 'string') {
    errors.push('priority: Priority must be a string');
  }

  if (category && typeof category !== 'string') {
    errors.push('category: Category must be a string');
  }

  if (errors.length > 0) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
    return;
  }

  next();
};

