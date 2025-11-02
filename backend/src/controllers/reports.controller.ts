import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role === 'OWNER') {
    const [
      totalProperties,
      totalTenants,
      activeTenants,
      totalRevenue,
      pendingPayments,
      overdueInvoices,
      openTickets,
      totalRooms,
      occupiedBeds,
    ] = await Promise.all([
      prisma.property.count({ where: { ownerId: req.user.id, active: true } }),
      prisma.tenantProfile.count({ where: { ownerId: req.user.id } }),
      prisma.tenantProfile.count({ where: { ownerId: req.user.id, status: 'ACTIVE' } }),
      prisma.payment.aggregate({
        where: { invoice: { ownerId: req.user.id }, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.invoice.count({ where: { ownerId: req.user.id, status: 'DUE' } }),
      prisma.invoice.count({ where: { ownerId: req.user.id, status: 'OVERDUE' } }),
      prisma.maintenanceTicket.count({ where: { ownerId: req.user.id, status: 'OPEN' } }),
      prisma.room.aggregate({
        where: { property: { ownerId: req.user.id } },
        _sum: { capacity: true },
      }),
      prisma.room.aggregate({
        where: { property: { ownerId: req.user.id } },
        _sum: { occupied: true },
      }),
    ]);

    const totalBeds = totalRooms._sum.capacity || 0;
    const totalOccupied = occupiedBeds._sum.occupied || 0;
    const occupancyRate = totalBeds > 0 ? (totalOccupied / totalBeds) * 100 : 0;

    res.json({
      success: true,
      message: 'Dashboard statistics fetched successfully',
      data: {
        totalProperties,
        totalTenants,
        activeTenants,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingPayments,
        overdueInvoices,
        openTickets,
        totalBeds,
        occupiedBeds: totalOccupied,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
      },
    });
  } else {
    // Tenant dashboard
    const tenant = await prisma.tenantProfile.findFirst({
      where: { userId: req.user.id },
    });

    if (!tenant) {
      throw new AppError('Tenant profile not found', 404);
    }

    const [dueInvoices, paidInvoices, totalPaid, openTickets, pendingBills] = await Promise.all([
      prisma.invoice.count({ where: { tenantId: tenant.id, status: { in: ['DUE', 'OVERDUE'] } } }),
      prisma.invoice.count({ where: { tenantId: tenant.id, status: 'PAID' } }),
      prisma.payment.aggregate({
        where: { tenantId: tenant.id, status: 'SUCCESS' },
        _sum: { amount: true },
      }),
      prisma.maintenanceTicket.count({ where: { tenantId: tenant.id, status: 'OPEN' } }),
      prisma.electricityBill.count({ where: { tenantId: tenant.id, status: 'PENDING' } }),
    ]);

    res.json({
      success: true,
      message: 'Dashboard statistics fetched successfully',
      data: {
        dueInvoices,
        paidInvoices,
        totalPaid: totalPaid._sum.amount || 0,
        openTickets,
        pendingBills,
      },
    });
  }
});

export const getRevenueReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access revenue reports', 403);
  }

  const { startDate, endDate, propertyId } = req.query;

  const where: any = {
    invoice: { ownerId: req.user.id },
    status: 'SUCCESS',
  };

  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
  }

  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          tenant: {
            select: {
              name: true,
              propertyId: true,
              property: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Filter by property if specified
  const filteredPayments = propertyId
    ? payments.filter((p) => p.invoice.tenant.propertyId === propertyId)
    : payments;

  const totalRevenue = filteredPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  // Group by month
  const monthlyRevenue = filteredPayments.reduce((acc: any, payment) => {
    const month = payment.createdAt.toISOString().slice(0, 7);
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += parseFloat(payment.amount.toString());
    return acc;
  }, {});

  // Group by payment method
  const byMethod = filteredPayments.reduce((acc: any, payment) => {
    const method = payment.method;
    if (!acc[method]) {
      acc[method] = 0;
    }
    acc[method] += parseFloat(payment.amount.toString());
    return acc;
  }, {});

  res.json({
    success: true,
    message: 'Revenue report generated successfully',
    data: {
      totalRevenue,
      totalTransactions: filteredPayments.length,
      monthlyRevenue,
      byPaymentMethod: byMethod,
      recentPayments: filteredPayments.slice(0, 10),
    },
  });
});

export const getOccupancyReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access occupancy reports', 403);
  }

  const properties = await prisma.property.findMany({
    where: { ownerId: req.user.id },
    include: {
      rooms: {
        include: {
          beds: true,
        },
      },
      tenants: {
        where: { status: 'ACTIVE' },
      },
    },
  });

  const report = properties.map((property) => {
    const totalBeds = property.rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupiedBeds = property.rooms.reduce((sum, room) => sum + room.occupied, 0);
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    return {
      propertyId: property.id,
      propertyName: property.name,
      totalRooms: property.totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds: totalBeds - occupiedBeds,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      activeTenants: property.tenants.length,
    };
  });

  const totalBeds = report.reduce((sum, p) => sum + p.totalBeds, 0);
  const totalOccupied = report.reduce((sum, p) => sum + p.occupiedBeds, 0);
  const overallOccupancyRate = totalBeds > 0 ? (totalOccupied / totalBeds) * 100 : 0;

  res.json({
    success: true,
    message: 'Occupancy report generated successfully',
    data: {
      overall: {
        totalBeds,
        occupiedBeds: totalOccupied,
        availableBeds: totalBeds - totalOccupied,
        occupancyRate: Math.round(overallOccupancyRate * 100) / 100,
      },
      byProperty: report,
    },
  });
});

export const getPaymentReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access payment reports', 403);
  }

  const [paidInvoices, dueInvoices, overdueInvoices, partialInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: { ownerId: req.user.id, status: 'PAID' },
      include: {
        tenant: { select: { name: true } },
        payments: true,
      },
      orderBy: { paidAt: 'desc' },
      take: 20,
    }),
    prisma.invoice.findMany({
      where: { ownerId: req.user.id, status: 'DUE' },
      include: { tenant: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: { ownerId: req.user.id, status: 'OVERDUE' },
      include: { tenant: { select: { name: true } } },
    }),
    prisma.invoice.findMany({
      where: { ownerId: req.user.id, status: 'PARTIAL' },
      include: { tenant: { select: { name: true } } },
    }),
  ]);

  const totalDue = dueInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount.toString()), 0);
  const totalOverdue = overdueInvoices.reduce(
    (sum, inv) => sum + parseFloat(inv.amount.toString()),
    0
  );

  res.json({
    success: true,
    message: 'Payment report generated successfully',
    data: {
      summary: {
        totalPaid: paidInvoices.length,
        totalDue: dueInvoices.length,
        totalOverdue: overdueInvoices.length,
        totalPartial: partialInvoices.length,
        amountDue: totalDue,
        amountOverdue: totalOverdue,
      },
      recentPaidInvoices: paidInvoices,
      dueInvoices,
      overdueInvoices,
      partialInvoices,
    },
  });
});

export const getElectricityReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access electricity reports', 403);
  }

  const { month } = req.query;

  const where: any = { ownerId: req.user.id };
  if (month) {
    where.month = month;
  }

  const bills = await prisma.electricityBill.findMany({
    where,
    include: {
      tenant: { select: { name: true, property: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalUnits = bills.reduce((sum, bill) => sum + parseFloat(bill.units.toString()), 0);
  const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount.toString()), 0);

  const byStatus = bills.reduce((acc: any, bill) => {
    const status = bill.status;
    if (!acc[status]) {
      acc[status] = { count: 0, amount: 0 };
    }
    acc[status].count += 1;
    acc[status].amount += parseFloat(bill.amount.toString());
    return acc;
  }, {});

  res.json({
    success: true,
    message: 'Electricity report generated successfully',
    data: {
      summary: {
        totalBills: bills.length,
        totalUnits,
        totalAmount,
      },
      byStatus,
      bills: bills.slice(0, 50),
    },
  });
});

