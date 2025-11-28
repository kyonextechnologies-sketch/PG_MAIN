import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

/**
 * Get revenue trend data aggregated by month
 * Returns monthly revenue from paid invoices
 */
export const getRevenueTrend = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access this endpoint', 403);
  }

  // Get revenue data grouped by month
  // Aggregate from invoices (paid status) for accurate revenue
  const revenueData = await prisma.invoice.findMany({
    where: {
      ownerId: req.user.id,
      status: 'PAID',
    },
    select: {
      month: true,
      amount: true,
      paidAt: true,
    },
    orderBy: {
      paidAt: 'desc',
    },
    take: 100, // Get enough records to cover 12 months
  });

  // Also get invoice data for pending/overdue amounts
  const invoiceData = await prisma.invoice.groupBy({
    by: ['month'],
    where: {
      ownerId: req.user.id,
      status: {
        in: ['DUE', 'OVERDUE'],
      },
    },
    _sum: {
      amount: true,
    },
    orderBy: {
      month: 'desc',
    },
    take: 12,
  });

  // Format data for chart consumption
  // Group by month (YYYY-MM format)
  const monthlyRevenue: Record<string, { paid: number; pending: number }> = {};

  // Process paid invoices
  revenueData.forEach((item: { month: string; amount: any; paidAt: Date | null }) => {
    const monthKey = item.month || (item.paidAt ? `${new Date(item.paidAt).getFullYear()}-${String(new Date(item.paidAt).getMonth() + 1).padStart(2, '0')}` : '');
    if (!monthKey) return;
    
    const amount = Number(item.amount || 0);

    if (!monthlyRevenue[monthKey]) {
      monthlyRevenue[monthKey] = { paid: 0, pending: 0 };
    }
    monthlyRevenue[monthKey].paid += amount;
  });

  // Process pending invoices
  invoiceData.forEach((item: { month: string; _sum: { amount: any } }) => {
    const amount = Number(item._sum.amount || 0);
    if (!monthlyRevenue[item.month]) {
      monthlyRevenue[item.month] = { paid: 0, pending: 0 };
    }
    monthlyRevenue[item.month].pending += amount;
  });

  // Convert to array format for charts
  const chartData = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      paid: data.paid,
      pending: data.pending,
      total: data.paid + data.pending,
    }));

  // Calculate summary statistics
  const totalPaid = chartData.reduce((sum, item) => sum + item.paid, 0);
  const totalPending = chartData.reduce((sum, item) => sum + item.pending, 0);
  const averageMonthly = chartData.length > 0 ? totalPaid / chartData.length : 0;

  res.json({
    success: true,
    data: {
      chartData,
      summary: {
        totalPaid,
        totalPending,
        averageMonthly,
        monthsCount: chartData.length,
      },
    },
  });
});

/**
 * Get dashboard statistics (properties, tenants, revenue, etc.)
 */
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  if (req.user.role !== 'OWNER') {
    throw new AppError('Only owners can access this endpoint', 403);
  }

  // Get all stats in parallel
  const [
    totalProperties,
    totalTenants,
    activeTenants,
    totalRevenue,
    outstandingDues,
    maintenanceRequests,
  ] = await Promise.all([
    prisma.property.count({
      where: { ownerId: req.user.id, active: true },
    }),
    prisma.tenantProfile.count({
      where: { ownerId: req.user.id },
    }),
    prisma.tenantProfile.count({
      where: { ownerId: req.user.id, status: 'ACTIVE' },
    }),
    prisma.payment.aggregate({
      where: {
        status: 'SUCCESS',
        invoice: { ownerId: req.user.id },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.aggregate({
      where: {
        ownerId: req.user.id,
        status: { in: ['DUE', 'OVERDUE'] },
      },
      _sum: { amount: true },
    }),
    prisma.maintenanceTicket.count({
      where: {
        ownerId: req.user.id,
        status: { in: ['OPEN', 'IN_PROGRESS'] },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalProperties,
      totalTenants,
      activeTenants,
      monthlyRevenue: Number(totalRevenue._sum.amount || 0),
      outstandingDues: Number(outstandingDues._sum.amount || 0),
      maintenanceRequests,
    },
  });
});

