import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let firebaseApp: admin.app.App | null = null;
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 */
export const initializeFirebase = (): admin.app.App | null => {
  if (firebaseApp) {
    return firebaseApp;
  }

  if (firebaseInitialized) {
    // Already tried to initialize, return null to avoid repeated errors
    return null;
  }

  firebaseInitialized = true;

  try {
    // Option 1: Try environment variable (most secure for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin SDK initialized from environment variable');
        return firebaseApp;
      } catch (parseError: any) {
        console.warn('⚠️  Failed to parse FIREBASE_SERVICE_ACCOUNT env variable:', parseError.message);
      }
    }

    // Option 2: Try file path
    const serviceAccountPath = path.join(
      __dirname,
      '../..',
      'firebase-service-account.json'
    );

    if (fs.existsSync(serviceAccountPath)) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log('✅ Firebase Admin SDK initialized from file');
      return firebaseApp;
    } else {
      console.warn('⚠️  Firebase service account file not found at:', serviceAccountPath);
      console.warn('⚠️  Firebase features will be disabled. To enable:');
      console.warn('   1. Download service account JSON from Firebase Console');
      console.warn('   2. Save it as: backend/firebase-service-account.json');
      console.warn('   3. OR set FIREBASE_SERVICE_ACCOUNT environment variable with JSON content');
      return null;
    }
  } catch (error: any) {
    console.warn('⚠️  Firebase initialization failed (notifications will be disabled):', error.message);
    return null;
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
      const app = initializeFirebase();
      if (!app) {
        return { success: false, error: 'Firebase not configured' };
      }
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
      const app = initializeFirebase();
      if (!app) {
        throw new Error('Firebase not configured');
      }
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
      const app = initializeFirebase();
      if (!app) {
        throw new Error('Firebase not configured');
      }
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
      const app = initializeFirebase();
      if (!app) {
        throw new Error('Firebase not configured');
      }
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

