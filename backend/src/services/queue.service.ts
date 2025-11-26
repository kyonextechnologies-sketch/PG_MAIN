import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../config/database';
import {
  sendMaintenanceReminder,
  sendUnresolvedMaintenanceNotification,
} from './notification.service';

// Redis connection with error handling
let connection: Redis | null = null;
let maintenanceReminderQueue: Queue | null = null;
let maintenanceReminderWorker: Worker | null = null;
let redisAvailable = false;

// Export function to check if Redis is available
export function isRedisAvailable(): boolean {
  return redisAvailable;
}

// Initialize Redis connection lazily
export function getRedisConnection(): Redis | null {
  if (connection) return connection;
  
  try {
    // Only try to connect if REDIS_HOST is explicitly set
    // Otherwise, assume Redis is optional
    if (!process.env.REDIS_HOST) {
      if (process.env.NODE_ENV === 'production') {
        console.log('ℹ️  Redis not configured (REDIS_HOST not set) - queue features will be disabled');
      }
      return null;
    }

    connection = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null, // Required by BullMQ
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('⚠️  Redis connection failed after 3 retries - queue features disabled');
          redisAvailable = false;
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true, // Don't connect immediately
      enableOfflineQueue: false, // Don't queue commands when offline
      enableReadyCheck: false, // Skip ready check to avoid connection errors
    });

    // Handle connection events
    connection.on('connect', () => {
      console.log('✅ Redis connected successfully');
      redisAvailable = true;
      // Initialize worker once connected
      if (!maintenanceReminderWorker) {
        initializeWorker();
      }
    });

    connection.on('ready', () => {
      console.log('✅ Redis is ready');
      redisAvailable = true;
    });

    connection.on('error', (error) => {
      // Suppress repeated connection errors
      const errorCode = (error as Error & { code?: string })?.code;
      if (errorCode === 'ECONNREFUSED' && !redisAvailable) {
        // Already logged, don't spam
        return;
      }
      if (redisAvailable) {
        console.warn('⚠️  Redis connection error (queue features disabled):', error.message);
      }
      redisAvailable = false;
    });

    connection.on('close', () => {
      if (redisAvailable) {
        console.log('ℹ️  Redis connection closed');
      }
      redisAvailable = false;
    });

    // Don't connect immediately - let it connect lazily on first use
    // This prevents connection errors on startup if Redis is not available

    return connection;
  } catch (error: any) {
    console.warn('⚠️  Failed to initialize Redis - queue features disabled:', error.message);
    redisAvailable = false;
    return null;
  }
}

// Initialize queue lazily
function getQueue(): Queue | null {
  if (maintenanceReminderQueue) return maintenanceReminderQueue;
  
  const redisConnection = getRedisConnection();
  if (!redisConnection) {
    return null;
  }

  // Don't create queue if Redis is not available
  // Wait for Redis to connect first
  if (!redisAvailable) {
    return null;
  }

  try {
    // Wrap in try-catch to handle any synchronous errors from Queue constructor
    maintenanceReminderQueue = new Queue('maintenance-reminders', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600, // Keep completed jobs for 24 hours
          count: 1000,
        },
        removeOnFail: {
          age: 7 * 24 * 3600, // Keep failed jobs for 7 days
        },
      },
    });

    // Handle queue errors gracefully
    maintenanceReminderQueue.on('error', (error) => {
      console.warn('⚠️  Queue error (Redis may be unavailable):', error.message);
      redisAvailable = false;
    });

    return maintenanceReminderQueue;
  } catch (error: any) {
    console.warn('⚠️  Failed to create queue:', error.message);
    redisAvailable = false;
    maintenanceReminderQueue = null; // Reset to allow retry
    return null;
  }
}

// Job Data Types
interface MaintenanceReminderJob {
  ticketId: string;
  ownerId: string;
  tenantId: string;
  ticketTitle: string;
  priority: string;
  reminderType: 'periodic' | 'unresolved_24h';
}

/**
 * Schedule periodic reminders for maintenance ticket
 */
export async function scheduleMaintenanceReminders(
  ticketId: string,
  ownerId: string,
  tenantId: string,
  ticketTitle: string,
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'URGENT'
): Promise<string> {
  const queue = getQueue();
  if (!queue) {
    console.log(`ℹ️  Redis unavailable - skipping reminder scheduling for ticket ${ticketId}`);
    return `reminder-${ticketId}`;
  }

  try {
    // Determine reminder interval based on priority
    const intervalMinutes = priority === 'HIGH' || priority === 'URGENT' ? 30 : 60;

    // Add repeatable job
    const job = await queue.add(
      'periodic-reminder',
      {
        ticketId,
        ownerId,
        tenantId,
        ticketTitle,
        priority,
        reminderType: 'periodic',
      } as MaintenanceReminderJob,
      {
        repeat: {
          every: intervalMinutes * 60 * 1000, // Convert to milliseconds
        },
        jobId: `reminder-${ticketId}`,
      }
    );

    console.log(
      `✅ Scheduled ${priority} priority reminders every ${intervalMinutes} minutes for ticket ${ticketId}`
    );

    return job.id || `reminder-${ticketId}`;
  } catch (error: any) {
    console.warn(`⚠️  Failed to schedule reminder for ticket ${ticketId}:`, error.message);
    return `reminder-${ticketId}`;
  }
}

/**
 * Schedule 24-hour unresolved check
 */
export async function schedule24HourUnresolvedCheck(
  ticketId: string,
  ownerId: string,
  tenantId: string,
  ticketTitle: string
): Promise<string> {
  const queue = getQueue();
  if (!queue) {
    console.log(`ℹ️  Redis unavailable - skipping 24h check scheduling for ticket ${ticketId}`);
    return `24h-check-${ticketId}`;
  }

  try {
    // Schedule job to run after 24 hours
    const job = await queue.add(
      '24h-unresolved-check',
      {
        ticketId,
        ownerId,
        tenantId,
        ticketTitle,
        priority: 'HIGH',
        reminderType: 'unresolved_24h',
      } as MaintenanceReminderJob,
      {
        delay: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
        jobId: `24h-check-${ticketId}`,
      }
    );

    console.log(`✅ Scheduled 24-hour unresolved check for ticket ${ticketId}`);

    return job.id || `24h-check-${ticketId}`;
  } catch (error: any) {
    console.warn(`⚠️  Failed to schedule 24h check for ticket ${ticketId}:`, error.message);
    return `24h-check-${ticketId}`;
  }
}

/**
 * Schedule daily reminders for unresolved tickets
 */
export async function scheduleDailyUnresolvedReminders(
  ticketId: string,
  ownerId: string,
  tenantId: string,
  ticketTitle: string
): Promise<string> {
  const queue = getQueue();
  if (!queue) {
    console.log(`ℹ️  Redis unavailable - skipping daily reminder scheduling for ticket ${ticketId}`);
    return `daily-reminder-${ticketId}`;
  }

  try {
    // Add repeatable job for daily reminders
    const job = await queue.add(
      'daily-unresolved-reminder',
      {
        ticketId,
        ownerId,
        tenantId,
        ticketTitle,
        priority: 'HIGH',
        reminderType: 'unresolved_24h',
      } as MaintenanceReminderJob,
      {
        repeat: {
          pattern: '0 9 * * *', // Every day at 9 AM (cron pattern)
        },
        jobId: `daily-reminder-${ticketId}`,
      }
    );

    console.log(`✅ Scheduled daily reminders for unresolved ticket ${ticketId}`);

    return job.id || `daily-reminder-${ticketId}`;
  } catch (error: any) {
    console.warn(`⚠️  Failed to schedule daily reminder for ticket ${ticketId}:`, error.message);
    return `daily-reminder-${ticketId}`;
  }
}

/**
 * Cancel all reminders for a ticket
 */
export async function cancelMaintenanceReminders(ticketId: string): Promise<void> {
  const queue = getQueue();
  if (!queue) {
    console.log(`ℹ️  Redis unavailable - skipping reminder cancellation for ticket ${ticketId}`);
    return;
  }

  try {
    // Remove all jobs related to this ticket
    const jobIds = [
      `reminder-${ticketId}`,
      `24h-check-${ticketId}`,
      `daily-reminder-${ticketId}`,
    ];

    for (const jobId of jobIds) {
      try {
        const job = await queue.getJob(jobId);
        if (job) {
          await job.remove();
          console.log(`✅ Removed job ${jobId}`);
        }
      } catch (error) {
        // Job might not exist, that's okay
        console.log(`ℹ️  Job ${jobId} not found or already removed`);
      }
    }

    // Also remove any repeatable jobs
    const repeatableJobs = await queue.getRepeatableJobs();
    for (const repeatableJob of repeatableJobs) {
      if (repeatableJob.id?.includes(ticketId)) {
        await queue.removeRepeatableByKey(repeatableJob.key);
        console.log(`✅ Removed repeatable job for ticket ${ticketId}`);
      }
    }

    console.log(`✅ Cancelled all reminders for ticket ${ticketId}`);
  } catch (error: any) {
    console.warn(`⚠️  Error cancelling reminders for ticket ${ticketId}:`, error.message);
  }
}

/**
 * Initialize worker lazily
 */
function initializeWorker(): Worker | null {
  if (maintenanceReminderWorker) return maintenanceReminderWorker;
  
  const redisConnection = getRedisConnection();
  if (!redisConnection) {
    return null;
  }

  // Don't create worker if Redis is not available
  if (!redisAvailable) {
    return null;
  }

  try {
    // Wrap in try-catch to handle any synchronous errors from Worker constructor
    maintenanceReminderWorker = new Worker(
      'maintenance-reminders',
      async (job: Job<MaintenanceReminderJob>) => {
        const { ticketId, ownerId, tenantId, ticketTitle, priority, reminderType } = job.data;

        console.log(
          `🔔 Processing ${reminderType} reminder for ticket ${ticketId} (${job.name})`
        );

        try {
          // Fetch the ticket to check current status
          const ticket = await prisma.maintenanceTicket.findUnique({
            where: { id: ticketId },
          });

          if (!ticket) {
            console.log(`⚠️  Ticket ${ticketId} not found, cancelling reminders`);
            await cancelMaintenanceReminders(ticketId);
            return { success: false, reason: 'Ticket not found' };
          }

          // If ticket is resolved or closed, stop reminders
          if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
            console.log(`✅ Ticket ${ticketId} is ${ticket.status}, stopping reminders`);
            await cancelMaintenanceReminders(ticketId);
            return { success: true, reason: `Ticket ${ticket.status}` };
          }

          // For periodic reminders, check if owner has acknowledged
          if (reminderType === 'periodic' && ticket.gotItByOwner) {
            console.log(`✅ Owner acknowledged ticket ${ticketId}, stopping periodic reminders`);
            await cancelMaintenanceReminders(ticketId);
            
            // Schedule 24-hour check and daily reminders instead
            await schedule24HourUnresolvedCheck(ticketId, ownerId, tenantId, ticketTitle);
            await scheduleDailyUnresolvedReminders(ticketId, ownerId, tenantId, ticketTitle);
            
            return { success: true, reason: 'Owner acknowledged, switched to daily reminders' };
          }

          // Calculate time pending
          const hoursPending = Math.floor(
            (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60)
          );
          const daysPending = Math.floor(hoursPending / 24);

          // Send appropriate notification based on reminder type
          if (reminderType === 'periodic') {
            // Send reminder to owner
            await sendMaintenanceReminder(ticketId, ownerId, ticketTitle, priority, daysPending);
            
            // Update last reminder timestamp
            await prisma.maintenanceTicket.update({
              where: { id: ticketId },
              data: { lastReminderAt: new Date() },
            });
          } else if (reminderType === 'unresolved_24h') {
            // Check if it's been 24 hours since "Got It"
            if (ticket.gotItAt) {
              const hoursSinceGotIt = Math.floor(
                (Date.now() - ticket.gotItAt.getTime()) / (1000 * 60 * 60)
              );

              if (hoursSinceGotIt >= 24) {
                // Send notification to both owner and tenant
                await sendUnresolvedMaintenanceNotification(
                  ticketId,
                  ownerId,
                  ticketTitle,
                  hoursSinceGotIt
                );
                await sendUnresolvedMaintenanceNotification(
                  ticketId,
                  tenantId,
                  ticketTitle,
                  hoursSinceGotIt
                );
              }
            }
          }

          console.log(`✅ Successfully processed ${reminderType} reminder for ticket ${ticketId}`);
          return { success: true };
        } catch (error) {
          console.error(`❌ Error processing reminder for ticket ${ticketId}:`, error);
          throw error; // Will trigger retry
        }
      },
      {
        connection: redisConnection,
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
          max: 10, // Max 10 jobs
          duration: 1000, // per second
        },
      }
    );

    // Worker event handlers
    maintenanceReminderWorker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    maintenanceReminderWorker.on('failed', (job, error) => {
      console.error(`❌ Job ${job?.id} failed:`, error);
    });

    maintenanceReminderWorker.on('error', (error) => {
      console.warn('⚠️  Worker error (Redis may be unavailable):', error.message);
      redisAvailable = false;
    });

    // Only log if Redis is available
    if (redisAvailable) {
      console.log('✅ Maintenance reminder worker initialized');
    }

    return maintenanceReminderWorker;
  } catch (error: any) {
    console.warn('⚠️  Failed to initialize worker:', error.message);
    redisAvailable = false;
    maintenanceReminderWorker = null; // Reset to allow retry
    return null;
  }
}

// Note: Worker will be initialized automatically when Redis connects
// via the 'connect' event handler in getRedisConnection()

/**
 * Graceful shutdown
 */
export async function shutdownQueues(): Promise<void> {
  console.log('Shutting down job queues...');
  
  try {
    if (maintenanceReminderWorker) {
      await maintenanceReminderWorker.close();
    }
    if (maintenanceReminderQueue) {
      await maintenanceReminderQueue.close();
    }
    if (connection) {
      await connection.quit();
    }
    console.log('✅ Job queues shut down');
  } catch (error: any) {
    console.warn('⚠️  Error shutting down queues:', error.message);
  }
}

// Handle process termination
process.on('SIGTERM', shutdownQueues);
process.on('SIGINT', shutdownQueues);

