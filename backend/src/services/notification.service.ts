import prisma from '../config/database';
import { sendEmail } from '../utils/email';
import twilio from 'twilio';
import { Server as SocketIOServer } from 'socket.io';
import { sendFCMNotification, initializeFirebase } from '../config/firebase';

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.warn('⚠️ Firebase not initialized - FCM notifications will be disabled');
}

// Initialize Twilio client
let twilioClient: ReturnType<typeof twilio> | null = null;

try {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    if (!process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
      console.warn('⚠️ TWILIO_ACCOUNT_SID must start with "AC". SMS notifications will be disabled.');
      console.warn('💡 Check your Twilio Console → Account Info → Account SID (not API Key)');
    } else {
      twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      console.log('✅ Twilio initialized successfully');
    }
  } else {
    console.warn('⚠️ Twilio credentials not configured - SMS notifications will be disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize Twilio:', error);
  console.warn('⚠️ SMS notifications will be disabled');
  twilioClient = null;
}

// Socket.IO server instance (will be set by the main server)
let io: SocketIOServer | null = null;

export function setSocketIO(socketServer: SocketIOServer) {
  io = socketServer;
  console.log('✅ Socket.IO instance set for notification service');
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

// Notification types
export type NotificationType =
  | 'MAINTENANCE_REQUEST'
  | 'MAINTENANCE_REMINDER'
  | 'MAINTENANCE_UPDATE'
  | 'OWNER_ACKNOWLEDGED'
  | 'PAYMENT_DUE'
  | 'PAYMENT_RECEIVED'
  | 'SYSTEM_ALERT';

export type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'WEBSOCKET';

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Send notification via WebSocket (real-time)
 */
async function sendWebSocketNotification(
  userId: string,
  notification: {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    createdAt: Date;
  }
): Promise<boolean> {
  if (!io) {
    console.warn('Socket.IO not initialized');
    return false;
  }

  try {
    // Emit to specific user's room
    io.to(`user:${userId}`).emit('notification', notification);
    console.log(`✅ WebSocket notification sent to user ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send WebSocket notification:', error);
    return false;
  }
}

/**
 * Send notification via Email
 */
async function sendEmailNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      console.error('User not found for email notification');
      return false;
    }

    await sendEmail({
      to: user.email,
      subject: title,
      template: 'notification',
      data: {
        name: user.name,
        title,
        message,
        ...data,
      },
    });

    console.log(`✅ Email notification sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email notification:', error);
    return false;
  }
}

/**
 * Send notification via FCM (Firebase Cloud Messaging)
 * TODO: Enable this after database migration adds fcmToken field
 */
async function sendFCMPushNotification(
  userId: string,
  title: string,
  message: string,
  data: Record<string, any> = {}
): Promise<boolean> {
  console.warn('⚠️ FCM notifications disabled - database migration pending');
  return false;
  
  /* UNCOMMENT AFTER DATABASE MIGRATION:
  try {
    // Get user's FCM token from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fcmToken: true },
    });

    if (!user || !user.fcmToken) {
      console.warn(`No FCM token found for user ${userId}`);
      return false;
    }

    // Convert data to string format (FCM requirement)
    const fcmData: Record<string, string> = {};
    Object.keys(data).forEach((key) => {
      fcmData[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
    });

    // Send FCM notification
    const result = await sendFCMNotification(user.fcmToken, {
      title,
      body: message,
      data: fcmData,
    });

    if (result.success) {
      console.log(`✅ FCM push notification sent to user ${userId}`);
      return true;
    } else {
      console.error(`❌ FCM push notification failed for user ${userId}:`, result.error);
      
      // If token is invalid, remove it from database
      if (result.error?.includes('invalid') || result.error?.includes('not-registered')) {
        await prisma.user.update({
          where: { id: userId },
          data: { fcmToken: null },
        });
        console.log(`🗑️ Removed invalid FCM token for user ${userId}`);
      }
      
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to send FCM push notification:', error);
    return false;
  }
  */
}

/**
 * Send notification via SMS
 */
async function sendSMSNotification(
  userId: string,
  message: string
): Promise<boolean> {
  if (!twilioClient) {
    console.warn('Twilio not configured for SMS notifications');
    return false;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true, phoneVerified: true },
    });

    if (!user || !user.phone || !user.phoneVerified) {
      console.warn('User phone not found or not verified for SMS notification');
      return false;
    }

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_FROM_NUMBER,
      to: user.phone,
    });

    console.log(`✅ SMS notification sent to ${user.phone}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send SMS notification:', error);
    return false;
  }
}

/**
 * Create and send notification
 */
export async function createNotification(payload: NotificationPayload): Promise<void> {
  const {
    userId,
    type,
    title,
    message,
    data = {},
    channels = ['WEBSOCKET', 'EMAIL'],
    priority = 'MEDIUM',
  } = payload;

  try {
    console.log(`📬 Notification for user ${userId}: ${title}`);

    // Send via requested channels (without database storage for now)
    const notificationData = {
      id: 'temp-' + Date.now(), // Temporary ID until migration
      type,
      title,
      message,
      data,
      createdAt: new Date(),
    };

    // Try WebSocket first (real-time)
    if (channels.includes('WEBSOCKET')) {
      await sendWebSocketNotification(userId, notificationData);
    }

    // Send FCM push notification
    if (channels.includes('PUSH')) {
      await sendFCMPushNotification(userId, title, message, data);
    }

    // Send email if requested or as fallback
    if (channels.includes('EMAIL')) {
      await sendEmailNotification(userId, title, message, data);
    }

    // Send SMS for high-priority notifications
    if (channels.includes('SMS') || (priority === 'HIGH' && channels.includes('EMAIL'))) {
      await sendSMSNotification(userId, `${title}: ${message}`);
    }

  } catch (error) {
    console.error('❌ Failed to create notification:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 * TODO: Enable after database migration
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
  console.warn('⚠️ Notification marking disabled - database migration pending');
  return;
  // await prisma.notification.update({
  //   where: { id: notificationId, userId },
  //   data: { read: true, readAt: new Date() },
  // });
}

/**
 * Mark all notifications as read for a user
 * TODO: Enable after database migration
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  console.warn('⚠️ Notification marking disabled - database migration pending');
  return;
  // await prisma.notification.updateMany({
  //   where: { userId, read: false },
  //   data: { read: true, readAt: new Date() },
  // });
}

/**
 * Get unread notification count
 * TODO: Enable after database migration
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return 0; // Return 0 until database is migrated
  // return await prisma.notification.count({
  //   where: { userId, read: false },
  // });
}

/**
 * Get user notifications (paginated)
 * TODO: Enable after database migration
 */
export async function getUserNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<{
  notifications: any[];
  total: number;
  unreadCount: number;
}> {
  return {
    notifications: [],
    total: 0,
    unreadCount: 0,
  };
  
  /* UNCOMMENT AFTER DATABASE MIGRATION:
  const { page = 1, limit = 20, unreadOnly = false } = options;
  const skip = (page - 1) * limit;
  const where = { userId, ...(unreadOnly ? { read: false } : {}) };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return { notifications, total, unreadCount };
  */
}

/**
 * Delete old read notifications (cleanup)
 * TODO: Enable after database migration
 */
export async function cleanupOldNotifications(daysOld: number = 30): Promise<number> {
  console.warn('⚠️ Notification cleanup disabled - database migration pending');
  return 0;
  
  /* UNCOMMENT AFTER DATABASE MIGRATION:
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      read: true,
      readAt: { lt: dateThreshold },
    },
  });

  console.log(`🗑️  Cleaned up ${result.count} old notifications`);
  return result.count;
  */
}

// ==================== Maintenance Ticket Notifications ====================

/**
 * Send maintenance request notification to owner
 */
export async function notifyOwnerOfMaintenanceRequest(
  ticketId: string,
  ownerId: string,
  tenantName: string,
  ticketTitle: string,
  priority: string
): Promise<void> {
  await createNotification({
    userId: ownerId,
    type: 'MAINTENANCE_REQUEST',
    title: `New ${priority} Priority Maintenance Request`,
    message: `${tenantName} has submitted a maintenance request: "${ticketTitle}"`,
    data: {
      ticketId,
      priority,
      tenantName,
    },
    channels: ['WEBSOCKET', 'EMAIL', priority === 'HIGH' || priority === 'URGENT' ? 'SMS' : 'EMAIL'],
    priority: priority as any,
  });
}

/**
 * Send reminder to owner about pending maintenance
 */
export async function sendMaintenanceReminder(
  ticketId: string,
  ownerId: string,
  ticketTitle: string,
  priority: string,
  daysPending: number
): Promise<void> {
  await createNotification({
    userId: ownerId,
    type: 'MAINTENANCE_REMINDER',
    title: `Reminder: Pending Maintenance Request`,
    message: `"${ticketTitle}" has been pending for ${daysPending} day(s). Please take action.`,
    data: {
      ticketId,
      priority,
      daysPending,
    },
    channels: ['WEBSOCKET', 'EMAIL'],
    priority: priority as any,
  });
}

/**
 * Notify tenant that owner acknowledged the request
 */
export async function notifyTenantOwnerAcknowledged(
  ticketId: string,
  tenantId: string,
  ticketTitle: string
): Promise<void> {
  await createNotification({
    userId: tenantId,
    type: 'OWNER_ACKNOWLEDGED',
    title: 'Owner Has Seen Your Request',
    message: `The owner has acknowledged your maintenance request: "${ticketTitle}"`,
    data: {
      ticketId,
    },
    channels: ['WEBSOCKET', 'EMAIL'],
    priority: 'MEDIUM',
  });
}

/**
 * Notify tenant of maintenance update
 */
export async function notifyTenantOfMaintenanceUpdate(
  ticketId: string,
  tenantId: string,
  ticketTitle: string,
  updateMessage: string
): Promise<void> {
  await createNotification({
    userId: tenantId,
    type: 'MAINTENANCE_UPDATE',
    title: 'Maintenance Request Update',
    message: `Update on "${ticketTitle}": ${updateMessage}`,
    data: {
      ticketId,
      update: updateMessage,
    },
    channels: ['WEBSOCKET', 'EMAIL'],
    priority: 'MEDIUM',
  });
}

/**
 * Notify about daily unresolved maintenance
 */
export async function sendUnresolvedMaintenanceNotification(
  ticketId: string,
  userId: string,
  ticketTitle: string,
  hoursUnresolved: number
): Promise<void> {
  await createNotification({
    userId,
    type: 'MAINTENANCE_REMINDER',
    title: 'Unresolved Maintenance Request',
    message: `"${ticketTitle}" has been unresolved for ${hoursUnresolved} hours. Please update the status.`,
    data: {
      ticketId,
      hoursUnresolved,
    },
    channels: ['WEBSOCKET', 'EMAIL'],
    priority: 'HIGH',
  });
}

