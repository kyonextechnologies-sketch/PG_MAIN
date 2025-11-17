import admin from 'firebase-admin';
import path from 'path';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): admin.app.App => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    const serviceAccountPath = path.join(
      __dirname,
      '../..',
      'firebase-service-account.json'
    );

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error);
    throw error;
  }
};

/**
 * Send push notification via FCM
 */
export const sendFCMNotification = async (
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{ success: boolean; response?: string; error?: string }> => {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const messaging = admin.messaging(firebaseApp!);

    const message: admin.messaging.Message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          requireInteraction: true,
        },
      },
    };

    const response = await messaging.send(message);
    console.log('✅ FCM notification sent successfully:', response);
    
    return { success: true, response };
  } catch (error: any) {
    console.error('❌ FCM notification error:', error.message);
    
    // Handle specific errors
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('⚠️ Invalid FCM token, should be removed from database');
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Send push notifications to multiple tokens
 */
export const sendFCMNotificationMulticast = async (
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
): Promise<{ successCount: number; failureCount: number; responses: admin.messaging.SendResponse[] }> => {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const messaging = admin.messaging(firebaseApp!);

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        },
      },
    };

    const response = await messaging.sendEachForMulticast(message);
    
    console.log(`✅ FCM multicast sent: ${response.successCount} success, ${response.failureCount} failure`);
    
    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  } catch (error: any) {
    console.error('❌ FCM multicast error:', error.message);
    throw error;
  }
};

/**
 * Subscribe tokens to a topic
 */
export const subscribeToTopic = async (
  tokens: string[],
  topic: string
): Promise<void> => {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const messaging = admin.messaging(firebaseApp!);
    await messaging.subscribeToTopic(tokens, topic);
    
    console.log(`✅ Subscribed ${tokens.length} tokens to topic: ${topic}`);
  } catch (error: any) {
    console.error(`❌ Topic subscription error:`, error.message);
    throw error;
  }
};

/**
 * Unsubscribe tokens from a topic
 */
export const unsubscribeFromTopic = async (
  tokens: string[],
  topic: string
): Promise<void> => {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const messaging = admin.messaging(firebaseApp!);
    await messaging.unsubscribeFromTopic(tokens, topic);
    
    console.log(`✅ Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
  } catch (error: any) {
    console.error(`❌ Topic unsubscription error:`, error.message);
    throw error;
  }
};

export default firebaseApp;

