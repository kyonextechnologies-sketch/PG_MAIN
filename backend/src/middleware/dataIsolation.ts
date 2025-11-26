import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { AppError } from './errorHandler';

/**
 * Middleware to ensure data isolation - owners can only access their own data
 * This is a helper that can be used in controllers to ensure consistent filtering
 */
export function ensureOwnerAccess(ownerId: string, resourceOwnerId: string): void {
  if (ownerId !== resourceOwnerId) {
    throw new AppError('Unauthorized: You can only access your own resources', 403);
  }
}

/**
 * Middleware to ensure tenant access - tenants can only access their own data
 */
export function ensureTenantAccess(tenantId: string, resourceTenantId: string): void {
  if (tenantId !== resourceTenantId) {
    throw new AppError('Unauthorized: You can only access your own resources', 403);
  }
}

/**
 * Build where clause for owner-based data isolation
 */
export function buildOwnerWhereClause(ownerId: string, additionalWhere?: any): any {
  return {
    ownerId,
    ...additionalWhere,
  };
}

/**
 * Build where clause for tenant-based data isolation
 */
export function buildTenantWhereClause(tenantId: string, additionalWhere?: any): any {
  return {
    tenantId,
    ...additionalWhere,
  };
}






