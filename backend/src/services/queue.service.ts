import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import prisma from '../config/database';
import {
  sendMaintenanceReminder,
  sendUnresolvedMaintenanceNotification,
} from './notification.service';

// Redis connection
const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  password: process.env.REDIS_PASSWORD,
});

// Queues
export const maintenanceReminderQueue = new Queue('maintenance-reminders', {
  connection,
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
  // Determine reminder interval based on priority
  const intervalMinutes = priority === 'HIGH' || priority === 'URGENT' ? 30 : 60;

  // Add repeatable job
  const job = await maintenanceReminderQueue.add(
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
  // Schedule job to run after 24 hours
  const job = await maintenanceReminderQueue.add(
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
  // Add repeatable job for daily reminders
  const job = await maintenanceReminderQueue.add(
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
}

/**
 * Cancel all reminders for a ticket
 */
export async function cancelMaintenanceReminders(ticketId: string): Promise<void> {
  try {
    // Remove all jobs related to this ticket
    const jobIds = [
      `reminder-${ticketId}`,
      `24h-check-${ticketId}`,
      `daily-reminder-${ticketId}`,
    ];

    for (const jobId of jobIds) {
      try {
        const job = await maintenanceReminderQueue.getJob(jobId);
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
    const repeatableJobs = await maintenanceReminderQueue.getRepeatableJobs();
    for (const repeatableJob of repeatableJobs) {
      if (repeatableJob.id?.includes(ticketId)) {
        await maintenanceReminderQueue.removeRepeatableByKey(repeatableJob.key);
        console.log(`✅ Removed repeatable job for ticket ${ticketId}`);
      }
    }

    console.log(`✅ Cancelled all reminders for ticket ${ticketId}`);
  } catch (error) {
    console.error(`❌ Error cancelling reminders for ticket ${ticketId}:`, error);
  }
}

/**
 * Worker to process maintenance reminder jobs
 */
const maintenanceReminderWorker = new Worker(
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
    connection,
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
  console.error('❌ Worker error:', error);
});

/**
 * Graceful shutdown
 */
export async function shutdownQueues(): Promise<void> {
  console.log('Shutting down job queues...');
  await maintenanceReminderWorker.close();
  await maintenanceReminderQueue.close();
  await connection.quit();
  console.log('✅ Job queues shut down');
}

// Handle process termination
process.on('SIGTERM', shutdownQueues);
process.on('SIGINT', shutdownQueues);

