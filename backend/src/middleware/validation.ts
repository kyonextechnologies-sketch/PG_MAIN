import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

// Middleware to handle validation results
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Execute validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((error) => ({
        field: error.type === 'field' ? error.path : 'unknown',
        message: error.msg,
      }));

      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
      return;
    }

    next();
  };
};

// Pagination validation helper
export const validatePagination = (req: Request, _res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const order = (req.query.order as string) || 'desc';

  // Validate pagination parameters
  if (page < 1) {
    throw new AppError('Page must be greater than 0', 400);
  }

  if (limit < 1 || limit > 100) {
    throw new AppError('Limit must be between 1 and 100', 400);
  }

  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    throw new AppError('Order must be either asc or desc', 400);
  }

  // Attach to request
  req.query.page = page.toString();
  req.query.limit = limit.toString();
  req.query.sortBy = sortBy;
  req.query.order = order.toLowerCase();

  next();
};

