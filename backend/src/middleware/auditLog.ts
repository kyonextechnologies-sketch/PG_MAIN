import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../types';

/**
 * Audit log entry interface
 */
interface AuditLogEntry {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: entry,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging shouldn't break the application
  }
}

/**
 * Middleware to automatically log certain actions
 */
export function auditLogger(options: {
  action: string;
  resource: string;
  getResourceId?: (req: AuthRequest) => string | undefined;
  includeBody?: boolean;
  includeQuery?: boolean;
}) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Only log if user is authenticated
      if (!req.user?.id) {
        return next();
      }

      const { action, resource, getResourceId, includeBody, includeQuery } = options;

      // Get resource ID if provided
      const resourceId = getResourceId ? getResourceId(req) : req.params.id;

      // Build details
      const details: Record<string, any> = {
        method: req.method,
        path: req.path,
      };

      if (includeBody && req.body) {
        // Remove sensitive fields
        const sanitizedBody = { ...req.body };
        delete sanitizedBody.password;
        delete sanitizedBody.confirmPassword;
        delete sanitizedBody.currentPassword;
        delete sanitizedBody.newPassword;
        delete sanitizedBody.otp;
        details.body = sanitizedBody;
      }

      if (includeQuery && req.query) {
        details.query = req.query;
      }

      // Create audit log
      await createAuditLog({
        userId: req.user.id,
        action,
        resource,
        resourceId,
        details,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });

      next();
    } catch (error) {
      console.error('Audit logging error:', error);
      // Continue even if audit logging fails
      next();
    }
  };
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  userId: string,
  action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
  req: Request,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resource: 'AUTH',
    details: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Log OTP events
 */
export async function logOTPEvent(
  phone: string,
  action: 'OTP_SENT' | 'OTP_VERIFIED' | 'OTP_FAILED' | 'OTP_EXPIRED',
  req: Request,
  metadata?: Record<string, any>
): Promise<void> {
  // For OTP events, we might not have a userId yet
  // Store phone in metadata instead
  await createAuditLog({
    userId: undefined, // Use undefined for pre-auth events
    action,
    resource: 'OTP',
    details: {
      phone,
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Log admin actions
 */
export async function logAdminAction(
  adminId: string,
  action: string,
  resource: string,
  resourceId: string,
  req: Request,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId: adminId,
    action: `ADMIN_${action}`,
    resource,
    resourceId,
    details: {
      ...metadata,
      adminAction: true,
      timestamp: new Date().toISOString(),
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Log file upload events
 */
export async function logFileUpload(
  userId: string,
  fileType: string,
  fileName: string,
  fileSize: number,
  req: Request,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'FILE_UPLOAD',
    resource: fileType,
    details: {
      fileName,
      fileSize,
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Log maintenance ticket events
 */
export async function logMaintenanceEvent(
  userId: string,
  action: 'TICKET_CREATED' | 'TICKET_UPDATED' | 'TICKET_RESOLVED' | 'TICKET_GOT_IT',
  ticketId: string,
  req: Request,
  metadata?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    resource: 'MAINTENANCE_TICKET',
    resourceId: ticketId,
    details: {
      ...metadata,
      timestamp: new Date().toISOString(),
    },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
}

/**
 * Get audit logs for a user (with pagination)
 */
export async function getUserAuditLogs(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  logs: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { page = 1, limit = 50, action, resourceType, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: any = { userId };

  if (action) {
    where.action = action;
  }

  if (resourceType) {
    where.resourceType = resourceType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        resource: true,
        resourceId: true,
        details: true,
        ipAddress: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get admin audit logs (all users)
 */
export async function getAdminAuditLogs(
  options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  logs: any[];
  total: number;
  page: number;
  totalPages: number;
}> {
  const { page = 1, limit = 50, userId, action, resourceType, startDate, endDate } = options;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  if (resourceType) {
    where.resourceType = resourceType;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Clean up old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysToKeep);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: dateThreshold,
      },
    },
  });

  console.log(`🗑️  Cleaned up ${result.count} old audit logs`);
  return result.count;
}

