import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from './errorHandler';

// Role-based access control middleware
export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('Insufficient permissions', 403);
    }

    next();
  };
};

// Check if user is owner
export const isOwner = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access this resource', 403);
  }

  next();
};

// Check if user is tenant
export const isTenant = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'TENANT') {
    throw new AppError('Only tenants can access this resource', 403);
  }

  next();
};

// Check if user owns the resource
export const isResourceOwner = (resourceOwnerIdField: string = 'ownerId') => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    // Owner can access their own resources
    const resourceOwnerId = (req.params as Record<string, string>)[resourceOwnerIdField] || 
                           (req.body as Record<string, string>)[resourceOwnerIdField];

    if (req.user.role === 'OWNER' && req.user.id !== resourceOwnerId) {
      throw new AppError('You can only access your own resources', 403);
    }

    next();
  };
};
