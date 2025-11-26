import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { Prisma } from '@prisma/client';

/**
 * Get subscription UPI settings (public endpoint)
 */
export const getSubscriptionUpiSettings = asyncHandler(async (_req: AuthRequest, res: Response) => {
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
      upiId: admin?.upiId || process.env.ADMIN_UPI_ID || '',
      upiName: admin?.upiName || process.env.ADMIN_UPI_NAME || 'PG Management System',
    },
  });
});

/**
 * Get available subscription plans
 */
export const getSubscriptionPlans = asyncHandler(async (_req: AuthRequest, res: Response) => {
  // Default plans - can be made configurable via admin
  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      packageName: 'BASIC',
      price: 499,
      billingCycle: 'MONTHLY',
      features: [
        'Up to 5 properties',
        'Up to 50 tenants',
        'Basic reporting',
        'Email support',
      ],
    },
    {
      id: 'standard',
      name: 'Standard',
      packageName: 'STANDARD',
      price: 999,
      billingCycle: 'MONTHLY',
      features: [
        'Up to 20 properties',
        'Unlimited tenants',
        'Advanced reporting',
        'Priority support',
        'Automated billing',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      packageName: 'PREMIUM',
      price: 1999,
      billingCycle: 'MONTHLY',
      features: [
        'Unlimited properties',
        'Unlimited tenants',
        'Advanced analytics',
        '24/7 priority support',
        'Automated billing',
        'Custom integrations',
      ],
    },
    {
      id: 'yearly-basic',
      name: 'Basic (Yearly)',
      packageName: 'BASIC',
      price: 4990, // ~17% discount
      billingCycle: 'QUARTERLY',
      features: [
        'Up to 5 properties',
        'Up to 50 tenants',
        'Basic reporting',
        'Email support',
        'Save 17%',
      ],
    },
    {
      id: 'yearly-standard',
      name: 'Standard (Yearly)',
      packageName: 'STANDARD',
      price: 9990, // ~17% discount
      billingCycle: 'QUARTERLY',
      features: [
        'Up to 20 properties',
        'Unlimited tenants',
        'Advanced reporting',
        'Priority support',
        'Automated billing',
        'Save 17%',
      ],
    },
    {
      id: 'yearly-premium',
      name: 'Premium (Yearly)',
      packageName: 'PREMIUM',
      price: 19990, // ~17% discount
      billingCycle: 'QUARTERLY',
      features: [
        'Unlimited properties',
        'Unlimited tenants',
        'Advanced analytics',
        '24/7 priority support',
        'Automated billing',
        'Custom integrations',
        'Save 17%',
      ],
    },
  ];

  res.json({
    success: true,
    data: plans,
  });
});

/**
 * Create subscription for owner
 */
export const createSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { packageName, billingCycle, price } = req.body;

  if (!packageName || !billingCycle || !price) {
    throw new AppError('Package name, billing cycle, and price are required', 400);
  }

  if (!['BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE'].includes(packageName)) {
    throw new AppError('Invalid package name', 400);
  }

  if (!['MONTHLY', 'BI_MONTHLY', 'QUARTERLY'].includes(billingCycle)) {
    throw new AppError('Invalid billing cycle', 400);
  }

  // Check if owner already has an active subscription
  const existingSubscription = await prisma.subscription.findUnique({
    where: { ownerId: req.user.id },
  });

  if (existingSubscription && existingSubscription.status === 'ACTIVE') {
    throw new AppError('You already have an active subscription', 400);
  }

  // Calculate end date based on billing cycle
  const startDate = new Date();
  let endDate: Date;
  
  if (billingCycle === 'MONTHLY') {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (billingCycle === 'BI_MONTHLY') {
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 2);
  } else {
    // QUARTERLY
    endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 3);
  }

  // Create subscription (payment will be confirmed later)
  const subscription = await prisma.subscription.upsert({
    where: { ownerId: req.user.id },
    create: {
      ownerId: req.user.id,
      packageName,
      status: 'ACTIVE', // Will be set to ACTIVE after payment confirmation
      startDate,
      endDate,
      price: new Prisma.Decimal(price),
      billingCycle,
      autoRenew: true,
    },
    update: {
      packageName,
      status: 'ACTIVE',
      startDate,
      endDate,
      price: new Prisma.Decimal(price),
      billingCycle,
      autoRenew: true,
      cancelledAt: null,
      cancelledBy: null,
      cancellationReason: null,
    },
  });

  res.json({
    success: true,
    message: 'Subscription created successfully',
    data: subscription,
  });
});

/**
 * Get owner's current subscription
 */
export const getOwnerSubscription = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const subscription = await prisma.subscription.findUnique({
    where: { ownerId: req.user.id },
  });

  res.json({
    success: true,
    data: subscription || null,
  });
});

/**
 * Confirm subscription payment
 */
export const confirmSubscriptionPayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const { subscriptionId, transactionId, upiTransactionId } = req.body;

  if (!subscriptionId) {
    throw new AppError('Subscription ID is required', 400);
  }

  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId, ownerId: req.user.id },
  });

  if (!subscription) {
    throw new AppError('Subscription not found', 404);
  }

  // Update subscription status to ACTIVE
  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
    },
  });

  // TODO: Create payment record if needed
  // TODO: Send confirmation email

  res.json({
    success: true,
    message: 'Subscription payment confirmed',
    data: updatedSubscription,
  });
});

