import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/database';
import { logAdminAction } from '../middleware/auditLog';
import { createNotification } from '../services/notification.service';

/**
 * Verify admin role middleware
 */
function requireAdmin(req: AuthRequest): void {
  if (!req.user || req.user.role !== 'ADMIN') {
    throw new AppError('Admin access required', 403);
  }
}

/**
 * @swagger
 * /admin/owners:
 *   get:
 *     summary: Get all owners with their properties, tenants, and verification status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: verificationStatus
 *         schema:
 *           type: string
 *           enum: [PENDING, VERIFIED, REJECTED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of owners with details
 */
export const getOwners = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const verificationStatus = req.query.verificationStatus as string;
  const search = req.query.search as string;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = {
    role: 'OWNER',
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Get owners with their related data
  const [owners, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        isActive: true,
        createdAt: true,
        properties: {
          select: {
            id: true,
            name: true,
            totalRooms: true,
            totalBeds: true,
            city: true,
            active: true,
            _count: {
              select: {
                tenants: true,
                rooms: true,
              },
            },
          },
        },
        ownerVerification: {
          select: {
            id: true,
            verificationStatus: true,
            legalDocuments: true,
            verifiedAt: true,
            rejectionReason: true,
            verifiedBy: true,
            submittedAt: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            properties: true,
            ownedTenants: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  // Filter by verification status if provided
  let filteredOwners = owners;
  if (verificationStatus) {
    filteredOwners = owners.filter(
      (owner) => owner.ownerVerification?.verificationStatus === verificationStatus
    );
  }

  res.json({
    success: true,
    data: {
      owners: filteredOwners,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @swagger
 * /admin/owners/{id}:
 *   get:
 *     summary: Get detailed information about a specific owner
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Owner details
 */
export const getOwnerDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const { id } = req.params;

  const owner = await prisma.user.findUnique({
    where: { id, role: 'OWNER' },
    include: {
      properties: {
        include: {
          rooms: {
            include: {
              beds: {
                include: {
                  tenant: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      phone: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
          tenants: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              status: true,
              monthlyRent: true,
              moveInDate: true,
            },
          },
        },
      },
      ownerVerification: true,
      _count: {
        select: {
          properties: true,
          ownedTenants: true,
          maintenanceTickets: true,
        },
      },
    },
  });

  if (!owner) {
    throw new AppError('Owner not found', 404);
  }

  res.json({
    success: true,
    data: owner,
  });
});

/**
 * @swagger
 * /admin/owners/{id}/verify:
 *   post:
 *     summary: Verify or reject owner verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [VERIFIED, REJECTED]
 *               notes:
 *                 type: string
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Owner verification updated
 */
export const verifyOwner = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const { id } = req.params;
  const { status, notes, rejectionReason } = req.body;

  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    throw new AppError('Invalid verification status', 400);
  }

  if (status === 'REJECTED' && !rejectionReason) {
    throw new AppError('Rejection reason is required', 400);
  }

  // Check if owner exists
  const owner = await prisma.user.findUnique({
    where: { id, role: 'OWNER' },
  });

  if (!owner) {
    throw new AppError('Owner not found', 404);
  }

  // Update or create verification record
  const verification = await prisma.ownerVerification.upsert({
    where: { ownerId: id },
    create: {
      ownerId: id,
      verificationStatus: status,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      verifiedBy: req.user!.id,
    },
    update: {
      verificationStatus: status,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      verifiedBy: req.user!.id,
    },
  });

  // Send notification to owner
  await createNotification({
    userId: id,
    type: 'SYSTEM_ALERT',
    title: status === 'VERIFIED' ? 'Account Verified' : 'Verification Rejected',
    message:
      status === 'VERIFIED'
        ? 'Your owner account has been verified successfully.'
        : `Your verification was rejected. Reason: ${rejectionReason}`,
    channels: ['WEBSOCKET', 'EMAIL'],
    priority: 'HIGH',
  });

  // Log admin action
  await logAdminAction(
    req.user!.id,
    `OWNER_${status}`,
    'OWNER_VERIFICATION',
    id,
    req,
    { notes, rejectionReason }
  );

  res.json({
    success: true,
    message: `Owner ${status === 'VERIFIED' ? 'verified' : 'rejected'} successfully`,
    data: verification,
  });
});

/**
 * @swagger
 * /admin/dashboard-stats:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const [
    totalOwners,
    totalTenants,
    totalProperties,
    totalRooms,
    pendingVerifications,
    activeMaintenanceTickets,
    recentRegistrations,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'OWNER' } }),
    prisma.user.count({ where: { role: 'TENANT' } }),
    prisma.property.count(),
    prisma.room.count(),
    prisma.ownerVerification.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.maintenanceTicket.count({
      where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalOwners,
      totalTenants,
      totalProperties,
      totalRooms,
      pendingVerifications,
      activeMaintenanceTickets,
      recentRegistrations,
    },
  });
});

/**
 * @swagger
 * /admin/maintenance-requests:
 *   get:
 *     summary: Get all maintenance requests with filters
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_PROGRESS, RESOLVED, CLOSED]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, URGENT]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of maintenance requests
 */
export const getMaintenanceRequests = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const priority = req.query.priority as string;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  const [tickets, total] = await Promise.all([
    prisma.maintenanceTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
      },
    }),
    prisma.maintenanceTicket.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Audit logs
 */
export const getAuditLogs = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const userId = req.query.userId as string;
  const action = req.query.action as string;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (userId) {
    where.userId = userId;
  }

  if (action) {
    where.action = action;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

