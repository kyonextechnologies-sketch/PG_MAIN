import { Response } from 'express';
import { AuthRequest } from '../types';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import prisma from '../config/database';
import { logAdminAction } from '../middleware/auditLog';
import { createNotification } from '../services/notification.service';
import { Prisma } from '@prisma/client';
import { scheduleMonthlyBilling, processOverdueInvoices, generateInvoicesForOwner } from '../services/billing.service';

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
 * /admin/owners/{id}:
 *   delete:
 *     summary: Delete owner and all related data
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
 *         description: Owner deleted successfully
 *       404:
 *         description: Owner not found
 */
export const deleteOwner = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const { id } = req.params;

  // Check if owner exists
  const owner = await prisma.user.findUnique({
    where: { id, role: 'OWNER' },
    include: {
      _count: {
        select: {
          properties: true,
          ownedTenants: true,
        },
      },
    },
  });

  if (!owner) {
    throw new AppError('Owner not found', 404);
  }

  // Delete owner and all related data in a transaction
  // Note: Most relations have cascade delete, but TenantProfile needs manual handling
  await prisma.$transaction(async (tx) => {
    // First, get all tenant profiles owned by this owner
    const tenantProfiles = await tx.tenantProfile.findMany({
      where: { ownerId: id },
      select: { userId: true },
    });

    // Delete tenant users (this will cascade delete their tenant profiles via userId relation)
    // This must be done before deleting the owner to avoid foreign key constraint issues
    for (const tenant of tenantProfiles) {
      await tx.user.delete({
        where: { id: tenant.userId },
      });
    }

    // Now delete the owner user
    // This will cascade delete:
    // - Properties (and their rooms, beds)
    // - OwnerVerification
    // - Subscription
    // - ElectricitySettings
    // - Invoices, Payments, MaintenanceTickets, Notifications, AuditLogs, OTPs, RefreshTokens, PasswordResets, etc.
    await tx.user.delete({
      where: { id },
    });
  });

  // Log admin action
  await logAdminAction(
    req.user!.id,
    'DELETE_OWNER',
    'OWNER',
    id,
    req,
    {
      ownerName: owner.name,
      ownerEmail: owner.email,
      propertiesCount: owner._count.properties,
      tenantsCount: owner._count.ownedTenants,
    }
  );

  res.json({
    success: true,
    message: 'Owner and all related data deleted successfully',
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

/**
 * @swagger
 * /admin/subscriptions:
 *   get:
 *     summary: Get all owner subscriptions
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, EXPIRED, CANCELLED, SUSPENDED]
 *       - in: query
 *         name: package
 *         schema:
 *           type: string
 *           enum: [BASIC, STANDARD, PREMIUM, ENTERPRISE]
 *     responses:
 *       200:
 *         description: List of subscriptions
 */
export const getSubscriptions = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as string;
  const packageName = req.query.package as string;
  const skip = (page - 1) * limit;

  const where: Prisma.SubscriptionWhereInput = {};
  
  if (status) {
    where.status = status as any;
  }
  
  if (packageName) {
    where.packageName = packageName as any;
  }

  const [subscriptions, total] = await Promise.all([
    prisma.subscription.findMany({
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
            phone: true,
            _count: {
              select: {
                properties: true,
                ownedTenants: true,
              },
            },
          },
        },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      subscriptions,
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
 * /admin/subscriptions/{ownerId}:
 *   put:
 *     summary: Update owner subscription
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ownerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               packageName:
 *                 type: string
 *                 enum: [BASIC, STANDARD, PREMIUM, ENTERPRISE]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, EXPIRED, CANCELLED, SUSPENDED]
 *               price:
 *                 type: number
 *               billingCycle:
 *                 type: string
 *                 enum: [MONTHLY, BI_MONTHLY, QUARTERLY]
 *               autoRenew:
 *                 type: boolean
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Subscription updated
 */
export const updateSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const { ownerId } = req.params;
  const { packageName, status, price, billingCycle, autoRenew, endDate } = req.body;

  // Check if owner exists
  const owner = await prisma.user.findUnique({
    where: { id: ownerId, role: 'OWNER' },
  });

  if (!owner) {
    throw new AppError('Owner not found', 404);
  }

  // Update or create subscription
  const subscription = await prisma.subscription.upsert({
    where: { ownerId },
    create: {
      ownerId,
      packageName: packageName || 'BASIC',
      status: status || 'ACTIVE',
      price: price ? new Prisma.Decimal(price) : new Prisma.Decimal(0),
      billingCycle: billingCycle || 'MONTHLY',
      autoRenew: autoRenew !== undefined ? autoRenew : true,
      endDate: endDate ? new Date(endDate) : null,
    },
    update: {
      ...(packageName && { packageName }),
      ...(status && { status }),
      ...(price !== undefined && { price: new Prisma.Decimal(price) }),
      ...(billingCycle && { billingCycle }),
      ...(autoRenew !== undefined && { autoRenew }),
      ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      ...(status === 'CANCELLED' && {
        cancelledAt: new Date(),
        cancelledBy: req.user!.id,
      }),
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  // Log admin action
  await logAdminAction(req.user!.id, 'UPDATE_SUBSCRIPTION', 'Subscription', subscription.id, req, {
    ownerId,
    packageName: subscription.packageName,
    status: subscription.status,
  });

  res.json({
    success: true,
    message: 'Subscription updated successfully',
    data: subscription,
  });
});

/**
 * @swagger
 * /admin/billing/generate:
 *   post:
 *     summary: Manually trigger monthly invoice generation
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *                 format: YYYY-MM
 *                 description: Month to generate invoices for (defaults to next month)
 *               ownerId:
 *                 type: string
 *                 description: Optional owner ID to generate for specific owner only
 *     responses:
 *       200:
 *         description: Invoice generation triggered
 */
export const triggerMonthlyBilling = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const { month, ownerId, direct = false } = req.body;

  try {
    // If direct=true, generate invoices immediately without queue
    if (direct) {
      let totalGenerated = 0;
      let targetMonth = month;

      if (!targetMonth) {
        const now = new Date();
        const year = now.getFullYear();
        const monthNum = String(now.getMonth() + 1).padStart(2, '0');
        targetMonth = `${year}-${monthNum}`;
      }

      if (ownerId) {
        // Generate for specific owner
        const count = await generateInvoicesForOwner(ownerId, targetMonth);
        totalGenerated = count;
      } else {
        // Generate for all owners
        const owners = await prisma.user.findMany({
          where: {
            role: 'OWNER',
            isActive: true,
            autoGenerateInvoices: true,
          },
          select: { id: true },
        });

        for (const owner of owners) {
          try {
            const count = await generateInvoicesForOwner(owner.id, targetMonth);
            totalGenerated += count;
          } catch (error: any) {
            console.error(`Failed to generate invoices for owner ${owner.id}:`, error);
          }
        }
      }

      await logAdminAction(req.user!.id, 'TRIGGER_BILLING_DIRECT', 'Billing', 'direct-generation', req, {
        month: targetMonth,
        ownerId,
        totalGenerated,
      });

      res.json({
        success: true,
        message: `Generated ${totalGenerated} invoice(s) directly`,
        data: {
          month: targetMonth,
          ownerId: ownerId || 'All owners',
          totalGenerated,
        },
      });
      return;
    }

    // Use queue-based approach (default)
    const jobId = await scheduleMonthlyBilling(month);

    if (!jobId) {
      throw new AppError('Failed to schedule billing job. Redis may be unavailable.', 500);
    }

    // Log admin action
    await logAdminAction(req.user!.id, 'TRIGGER_BILLING', 'Billing', jobId, req, {
      month,
      ownerId,
    });

    res.json({
      success: true,
      message: 'Monthly billing job scheduled successfully',
      data: {
        jobId,
        month: month || 'Next month (auto-calculated)',
        ownerId: ownerId || 'All owners',
      },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to trigger monthly billing', 500);
  }
});

/**
 * @swagger
 * /admin/billing/overdue:
 *   post:
 *     summary: Manually process overdue invoices and apply late fees
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue invoices processed
 */
export const processOverdueInvoicesManual = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  try {
    const processedCount = await processOverdueInvoices();

    // Log admin action
    await logAdminAction(req.user!.id, 'PROCESS_OVERDUE', 'Billing', 'overdue-invoices', req, {
      processedCount,
    });

    res.json({
      success: true,
      message: `Processed ${processedCount} overdue invoices`,
      data: {
        processedCount,
      },
    });
  } catch (error: any) {
    throw new AppError(error.message || 'Failed to process overdue invoices', 500);
  }
});

/**
 * @swagger
 * /admin/subscription-upi-settings:
 *   get:
 *     summary: Get subscription UPI settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription UPI settings
 */
export const getSubscriptionUpiSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  // Get admin user's UPI settings (admin user is used to store subscription payment UPI)
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: {
      upiId: true,
      upiName: true,
    },
    orderBy: { createdAt: 'asc' }, // Get first admin user
  });

  res.json({
    success: true,
    data: {
      upiId: admin?.upiId || '',
      upiName: admin?.upiName || 'PG Management System',
    },
  });
});

/**
 * @swagger
 * /admin/subscription-upi-settings:
 *   put:
 *     summary: Update subscription UPI settings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               upiId:
 *                 type: string
 *               upiName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subscription UPI settings updated
 */
export const updateSubscriptionUpiSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  requireAdmin(req);

  const { upiId, upiName } = req.body;

  // Validate UPI ID format if provided
  if (upiId && upiId.trim()) {
    const upiIdRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiIdRegex.test(upiId)) {
      throw new AppError('Please enter a valid UPI ID (e.g., admin@paytm)', 400);
    }
  }

  // Update admin user's UPI settings (use the requesting admin's ID)
  const updatedAdmin = await prisma.user.update({
    where: { id: req.user!.id },
    data: {
      upiId: upiId || null,
      upiName: upiName || null,
    },
    select: {
      upiId: true,
      upiName: true,
    },
  });

  // Log admin action
  await logAdminAction(req.user!.id, 'UPDATE_SUBSCRIPTION_UPI', 'Settings', 'subscription-upi', req, {
    upiId: updatedAdmin.upiId,
    upiName: updatedAdmin.upiName,
  });

  res.json({
    success: true,
    message: 'Subscription UPI settings updated successfully',
    data: {
      upiId: updatedAdmin.upiId || '',
      upiName: updatedAdmin.upiName || 'PG Management System',
    },
  });
});

