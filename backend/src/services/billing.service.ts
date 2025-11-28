/**
 * Automated Billing Service
 * 
 * Handles monthly invoice generation, late fee application, and payment reminders
 * Runs on the 28th of each month to generate invoices for the next month
 */

import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../config/database';
import { sendEmail } from '../utils/email';
import { createNotification } from './notification.service';
import { calculateLateFees, getDueDateForMonth } from '../utils/helpers';
import { getRedisConnection, isRedisAvailable } from './queue.service';

interface MonthlyBillingJob {
  month: string; // Format: "YYYY-MM" (e.g., "2024-02" for February 2024)
  ownerId?: string; // Optional: if provided, only generate for this owner
}

interface LateFeeJob {
  invoiceId: string;
}

interface ReminderJob {
  invoiceId: string;
  reminderDay: number; // Days after due date (3, 7, 14)
}

let billingQueue: Queue | null = null;
let billingWorker: Worker | null = null;

/**
 * Get or create billing queue
 */
function getBillingQueue(): Queue | null {
  if (billingQueue) return billingQueue;

  const redisConnection = getRedisConnection();
  if (!redisConnection || !isRedisAvailable()) {
    console.warn('⚠️  Redis unavailable - billing jobs will not be scheduled');
    return null;
  }

  try {
    // Wrap in try-catch to handle any synchronous errors from Queue constructor
    billingQueue = new Queue('monthly-billing', {
      connection: redisConnection,
    });

    // Handle queue errors gracefully
    billingQueue.on('error', (error) => {
      console.warn('⚠️  Billing queue error (Redis may be unavailable):', error.message);
    });

    console.log('✅ Billing queue initialized');
    return billingQueue;
  } catch (error: any) {
    console.error('❌ Failed to initialize billing queue:', error.message);
    billingQueue = null; // Reset to allow retry
    return null;
  }
}

/**
 * Schedule monthly invoice generation
 * Should be called on the 28th of each month
 */
export async function scheduleMonthlyBilling(month?: string): Promise<string | null> {
  const queue = getBillingQueue();
  if (!queue) {
    console.log('ℹ️  Redis unavailable - skipping monthly billing schedule');
    return null;
  }

  try {
    // If month not provided, calculate next month
    const targetMonth = month || getNextMonth();
    
    const job = await queue.add(
      'generate-monthly-invoices',
      {
        month: targetMonth,
      } as MonthlyBillingJob,
      {
        jobId: `monthly-billing-${targetMonth}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    console.log(`✅ Scheduled monthly billing for ${targetMonth} (Job ID: ${job.id})`);
    return job.id || null;
  } catch (error: any) {
    console.error('❌ Failed to schedule monthly billing:', error.message);
    return null;
  }
}

/**
 * Schedule recurring monthly billing (runs on 28th of each month)
 */
export async function scheduleRecurringMonthlyBilling(): Promise<void> {
  const queue = getBillingQueue();
  if (!queue) {
    console.log('ℹ️  Redis unavailable - skipping recurring billing schedule');
    return;
  }

  try {
    // Schedule repeatable job for 28th of each month at 2 AM
    const job = await queue.add(
      'generate-monthly-invoices',
      {
        month: getNextMonth(), // Will be recalculated in the job
      } as MonthlyBillingJob,
      {
        repeat: {
          pattern: '0 2 28 * *', // Every 28th at 2 AM (cron pattern)
        },
        jobId: 'recurring-monthly-billing',
      }
    );

    console.log('✅ Scheduled recurring monthly billing (runs on 28th of each month at 2 AM)');
  } catch (error: any) {
    console.error('❌ Failed to schedule recurring monthly billing:', error.message);
  }
}

/**
 * Generate invoices for all active tenants of an owner
 * Exported for use in cron scripts
 */
export async function generateInvoicesForOwner(ownerId: string, month: string): Promise<number> {
  let generatedCount = 0;

  try {
    // Get owner with settings
    const owner = await prisma.user.findUnique({
      where: { id: ownerId, role: 'OWNER' },
      include: {
        electricitySettings: true,
      },
    });

    if (!owner || !owner.isActive) {
      console.log(`⚠️  Owner ${ownerId} not found or inactive, skipping`);
      return 0;
    }

    // Check if auto-generate is enabled
    if (owner.autoGenerateInvoices === false) {
      console.log(`ℹ️  Auto-generate disabled for owner ${ownerId}, skipping`);
      return 0;
    }

    // Get all active tenants for this owner
    const tenants = await prisma.tenantProfile.findMany({
      where: {
        ownerId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📋 Found ${tenants.length} active tenants for owner ${ownerId}`);

    const dueDate = getDueDateForMonth(month, owner.electricitySettings?.dueDate || 5);

    for (const tenant of tenants) {
      try {
        // Check if invoice already exists
        const existingInvoice = await prisma.invoice.findUnique({
          where: {
            tenantId_month: {
              tenantId: tenant.id,
              month,
            },
          },
        });

        if (existingInvoice) {
          console.log(`ℹ️  Invoice already exists for tenant ${tenant.id}, month ${month}`);
          continue;
        }

        // Get approved electricity bill for this month
        const electricityBill = await prisma.electricityBill.findFirst({
          where: {
            tenantId: tenant.id,
            month,
            status: 'APPROVED',
          },
        });

        const electricityCharges = electricityBill ? Number(electricityBill.amount) : 0;
        const baseRent = Number(tenant.monthlyRent);
        const totalAmount = baseRent + electricityCharges;

        // Create invoice
        const invoice = await prisma.invoice.create({
          data: {
            ownerId,
            tenantId: tenant.id,
            month,
            baseRent,
            electricityCharges,
            otherCharges: 0,
            lateFees: 0,
            amount: totalAmount,
            dueDate,
            status: 'DUE',
          },
        });

        generatedCount++;

        // Send email notification
        if (tenant.email) {
          try {
            await sendEmail({
              to: tenant.email,
              subject: `Invoice for ${month}`,
              template: 'invoiceGenerated',
              data: {
                tenantName: tenant.name,
                month,
                baseRent,
                electricityCharges,
                otherCharges: 0,
                lateFees: 0,
                totalAmount,
                dueDate: dueDate.toLocaleDateString(),
                ownerName: owner.name,
                propertyName: tenant.property?.name || 'Property',
              },
            });
          } catch (emailError) {
            console.error(`❌ Failed to send email to ${tenant.email}:`, emailError);
          }
        }

        // Send in-app notification (WebSocket only - email already sent above)
        if (tenant.userId) {
          try {
            await createNotification({
              userId: tenant.userId,
              type: 'PAYMENT_DUE',
              title: 'New Invoice Generated',
              message: `A new invoice for ₹${totalAmount.toLocaleString('en-IN')} has been generated for ${month}. Due date: ${dueDate.toLocaleDateString()}`,
              data: {
                invoiceId: invoice.id,
                month,
                amount: totalAmount,
                dueDate: dueDate.toISOString(),
              },
              channels: ['WEBSOCKET'], // Email already sent above with proper template
              priority: 'HIGH',
            });
          } catch (notifError) {
            console.error(`❌ Failed to send notification to tenant ${tenant.userId}:`, notifError);
          }
        }

        console.log(`✅ Generated invoice ${invoice.id} for tenant ${tenant.name} (${month})`);
      } catch (tenantError: any) {
        console.error(`❌ Failed to generate invoice for tenant ${tenant.id}:`, tenantError.message);
        // Continue with next tenant
      }
    }

    console.log(`✅ Generated ${generatedCount} invoices for owner ${ownerId}`);
    return generatedCount;
  } catch (error: any) {
    console.error(`❌ Error generating invoices for owner ${ownerId}:`, error.message);
    throw error;
  }
}

/**
 * Process monthly billing job
 */
async function processMonthlyBilling(job: Job<MonthlyBillingJob>): Promise<{ success: boolean; count: number }> {
  const { month, ownerId } = job.data;

  console.log(`📅 Processing monthly billing for ${month}${ownerId ? ` (owner: ${ownerId})` : ''}`);

  try {
    let totalGenerated = 0;

    if (ownerId) {
      // Generate for specific owner
      const count = await generateInvoicesForOwner(ownerId, month);
      totalGenerated = count;
    } else {
      // Generate for all active owners
      const owners = await prisma.user.findMany({
        where: {
          role: 'OWNER',
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      console.log(`📋 Found ${owners.length} active owners`);

      for (const owner of owners) {
        try {
          const count = await generateInvoicesForOwner(owner.id, month);
          totalGenerated += count;
        } catch (error: any) {
          console.error(`❌ Failed to process owner ${owner.id}:`, error.message);
          // Continue with next owner
        }
      }
    }

    console.log(`✅ Monthly billing completed: ${totalGenerated} invoices generated for ${month}`);
    return { success: true, count: totalGenerated };
  } catch (error: any) {
    console.error(`❌ Monthly billing failed:`, error.message);
    throw error;
  }
}

/**
 * Process overdue invoices and apply late fees
 */
export async function processOverdueInvoices(): Promise<number> {
  const today = new Date();
  let processedCount = 0;

  try {
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: ['DUE', 'PARTIAL'] },
      },
      include: {
        owner: {
          include: {
            electricitySettings: true,
          },
        },
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`📋 Found ${overdueInvoices.length} overdue invoices`);

    for (const invoice of overdueInvoices) {
      try {
        const lateFeePercentage = invoice.owner.electricitySettings
          ? Number(invoice.owner.electricitySettings.lateFeePercentage)
          : Number(invoice.owner.lateFeePercentage) || 2;

        const lateFees = calculateLateFees(
          Number(invoice.baseRent),
          invoice.dueDate,
          lateFeePercentage
        );

        // Only apply late fees if not already applied
        if (Number(invoice.lateFees) === 0 && lateFees > 0) {
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              status: 'OVERDUE',
              lateFees,
              amount: {
                increment: lateFees,
              },
            },
          });

          // Send notification
          if (invoice.tenant.userId) {
            try {
              await createNotification({
                userId: invoice.tenant.userId,
                type: 'PAYMENT_DUE',
                title: 'Overdue Payment Notice',
                message: `Your invoice for ${invoice.month} is overdue. Late fee of ₹${lateFees.toLocaleString('en-IN')} has been applied.`,
                data: {
                  invoiceId: invoice.id,
                  month: invoice.month,
                  lateFees,
                },
                channels: ['WEBSOCKET', 'EMAIL'],
                priority: 'HIGH',
              });
            } catch (notifError) {
              console.error(`❌ Failed to send notification:`, notifError);
            }
          }

          processedCount++;
          console.log(`✅ Applied late fee of ₹${lateFees} to invoice ${invoice.id}`);
        }
      } catch (invoiceError: any) {
        console.error(`❌ Failed to process invoice ${invoice.id}:`, invoiceError.message);
      }
    }

    console.log(`✅ Processed ${processedCount} overdue invoices`);
    return processedCount;
  } catch (error: any) {
    console.error('❌ Error processing overdue invoices:', error.message);
    throw error;
  }
}

/**
 * Schedule payment reminders
 */
export async function schedulePaymentReminders(): Promise<void> {
  const queue = getBillingQueue();
  if (!queue) return;

  try {
    // Schedule daily check for overdue invoices
    await queue.add(
      'process-overdue',
      {},
      {
        repeat: {
          pattern: '0 3 * * *', // Every day at 3 AM
        },
        jobId: 'daily-overdue-check',
      }
    );

    console.log('✅ Scheduled daily overdue invoice processing');
  } catch (error: any) {
    console.error('❌ Failed to schedule payment reminders:', error.message);
  }
}

/**
 * Initialize billing worker
 */
export function initializeBillingWorker(): Worker | null {
  if (billingWorker) return billingWorker;

  const redisConnection = getRedisConnection();
  if (!redisConnection || !isRedisAvailable()) {
    console.warn('⚠️  Redis unavailable - billing worker not initialized');
    return null;
  }

  try {
    // Wrap in try-catch to handle any synchronous errors from Worker constructor
    billingWorker = new Worker(
      'monthly-billing',
      async (job: Job<MonthlyBillingJob>) => {
        console.log(`🔔 Processing billing job: ${job.name} (ID: ${job.id})`);

        if (job.name === 'generate-monthly-invoices') {
          // Recalculate month if not provided (for recurring jobs)
          const month = job.data.month || getNextMonth();
          return await processMonthlyBilling({ ...job, data: { ...job.data, month } } as Job<MonthlyBillingJob>);
        }

        return { success: false, reason: 'Unknown job type' };
      },
      {
        connection: redisConnection,
        concurrency: 1, // Process one billing job at a time
        limiter: {
          max: 1,
          duration: 60000, // 1 job per minute
        },
      }
    );

    // Worker event handlers
    billingWorker.on('completed', (job) => {
      console.log(`✅ Billing job ${job.id} completed`);
    });

    billingWorker.on('failed', (job, err) => {
      console.error(`❌ Billing job ${job?.id} failed:`, err.message);
    });

    billingWorker.on('error', (error) => {
      console.warn('⚠️  Billing worker error (Redis may be unavailable):', error.message);
    });

    console.log('✅ Billing worker initialized');
    return billingWorker;
  } catch (error: any) {
    console.error('❌ Failed to initialize billing worker:', error.message);
    billingWorker = null; // Reset to allow retry
    return null;
  }
}

/**
 * Helper: Get next month in "YYYY-MM" format
 */
function getNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Initialize billing service
 * Call this on server startup
 */
export async function initializeBillingService(): Promise<void> {
  console.log('🚀 Initializing billing service...');

  try {
    // Initialize worker (will return null if Redis unavailable)
    const worker = initializeBillingWorker();
    
    if (!worker) {
      console.log('ℹ️  Billing service initialized (Redis unavailable - scheduled jobs disabled)');
      return;
    }

    // Schedule recurring monthly billing (will skip if Redis unavailable)
    try {
      await scheduleRecurringMonthlyBilling();
    } catch (error: any) {
      console.warn('⚠️  Failed to schedule recurring billing:', error.message);
    }

    // Schedule daily overdue processing (will skip if Redis unavailable)
    try {
      await schedulePaymentReminders();
    } catch (error: any) {
      console.warn('⚠️  Failed to schedule payment reminders:', error.message);
    }

    console.log('✅ Billing service initialized');
  } catch (error: any) {
    console.error('❌ Error initializing billing service:', error.message);
    // Don't throw - allow server to start even if billing service fails
  }
}

