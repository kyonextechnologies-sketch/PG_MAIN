'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { socketService } from '@/services/socket.service';
import { apiClient } from '@/lib/apiClient';
import { toast, type ToastIcon } from 'react-toastify';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
  category?: string;
}

interface NotificationApiResponse {
  notifications?: AppNotification[];
  total?: number;
  unreadCount?: number;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  refreshNotifications: (options?: { limit?: number; page?: number }) => Promise<void>;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearReadNotifications: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const normalizeNotification = (notification: Partial<AppNotification>): AppNotification => ({
  id: notification.id || `temp-${Date.now()}`,
  type: notification.type || 'SYSTEM_ALERT',
  title: notification.title || 'Notification',
  message: notification.message || '',
  data: notification.data ?? {},
  read: notification.read ?? false,
  createdAt: notification.createdAt || (notification as any)?.timestamp || new Date().toISOString(),
  category: notification.category,
});

const extractNotifications = (payload: NotificationApiResponse | AppNotification[] | undefined): AppNotification[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) {
    return payload.map(normalizeNotification);
  }
  if (Array.isArray(payload.notifications)) {
    return payload.notifications.map(normalizeNotification);
  }
  return [];
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNewNotification = useCallback((notification: AppNotification) => {
    console.log('📬 New notification:', notification);

    // Add to notifications list
    setNotifications(prev => [normalizeNotification(notification), ...prev]);

    // If payment settings updated, trigger refresh event for UPI settings hook
    if (notification.type === 'SYSTEM' && notification.title === 'Payment Details Updated') {
      // Dispatch custom event to trigger UPI settings refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paymentSettingsNotification', { detail: notification }));
      }
    }

    // Show toast notification
    const createIcon = (symbol: string, label: string): ToastIcon => (
      <span role="img" aria-label={label} className="text-lg">
        {symbol}
      </span>
    );

    const notificationTypeConfig: Record<
      AppNotification['type'],
      { icon: ToastIcon; color: 'error' | 'warning' | 'info' | 'success' }
    > = {
      MAINTENANCE_REQUEST: { icon: createIcon('🔧', 'Maintenance request'), color: 'error' },
      MAINTENANCE_REMINDER: { icon: createIcon('⏰', 'Maintenance reminder'), color: 'warning' },
      MAINTENANCE_UPDATE: { icon: createIcon('📝', 'Maintenance update'), color: 'info' },
      OWNER_ACKNOWLEDGED: { icon: createIcon('✅', 'Owner acknowledged'), color: 'success' },
      PAYMENT_DUE: { icon: createIcon('💰', 'Payment due'), color: 'warning' },
      PAYMENT_RECEIVED: { icon: createIcon('✅', 'Payment received'), color: 'success' },
      RENT_REMINDER: { icon: createIcon('⏰', 'Rent reminder'), color: 'warning' },
      SYSTEM: { icon: createIcon('🔔', 'System notification'), color: 'info' },
      SYSTEM_ALERT: { icon: createIcon('🔔', 'System alert'), color: 'info' },
    };

    const config =
      notificationTypeConfig[notification.type as keyof typeof notificationTypeConfig] || {
        icon: createIcon('🔔', 'Notification'),
        color: 'info',
      };

    // Show toast based on type
    const toastMessage = (
      <div className="flex flex-col">
        <span className="font-semibold">{notification.title}</span>
        <span className="text-sm">{notification.message}</span>
      </div>
    );

    switch (config.color) {
      case 'error':
        toast.error(toastMessage, { icon: config.icon });
        break;
      case 'warning':
        toast.warning(toastMessage, { icon: config.icon });
        break;
      case 'success':
        toast.success(toastMessage, { icon: config.icon });
        break;
      default:
        toast.info(toastMessage, { icon: config.icon });
    }

    // Play notification sound (optional)
    if (typeof window !== 'undefined' && 'Audio' in window) {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        // Ignore audio errors
      }
    }
  }, []);

  const refreshNotifications = useCallback(
    async (options?: { limit?: number; page?: number }) => {
      if (!session?.user) return;
      setIsLoading(true);
      try {
        const response = await apiClient.get<NotificationApiResponse | AppNotification[]>('/notifications', {
          params: {
            limit: options?.limit ?? 50,
            page: options?.page ?? 1,
          },
        });

        if (response.success) {
          const normalized = extractNotifications(response.data as NotificationApiResponse | AppNotification[]);
          setNotifications(normalized);
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        const isConnectionError = errorMsg.includes('Failed to fetch') ||
                                 errorMsg.includes('ERR_CONNECTION_REFUSED') ||
                                 errorMsg.includes('NetworkError');
        
        // Handle 404 or route not found gracefully - endpoint may not exist yet
        if (error?.message?.includes('Route not found') || error?.message?.includes('404') || error?.response?.status === 404) {
          console.log('ℹ️ Notifications API endpoint not available yet. Using WebSocket only.');
          // Don't set error state - WebSocket notifications will still work
          setNotifications([]);
        } else if (isConnectionError) {
          // Connection errors are expected if backend is not running
          // Don't log as error - WebSocket will handle notifications
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Backend not reachable - notifications will use WebSocket only');
          }
          setNotifications([]);
        } else {
          // Only log non-connection errors
          console.error('❌ Failed to load notifications:', error);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [session?.user]
  );

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (!session?.user) {
      // Disconnect if user logs out
      socketService.disconnect();
      setIsConnected(false);
      return;
    }

    refreshNotifications();

    const token = (session as any)?.accessToken;

    if (!token) {
      console.warn('⚠️ Cannot initialize WebSocket: No access token in session');
      return;
    }

    console.log('🔌 Initializing WebSocket connection...');
    
    // Small delay to ensure session is fully established
    const connectTimeout = setTimeout(() => {
      socketService.connect(token);
    }, 500);

    socketService.on('connect', () => {
      console.log('✅ WebSocket connected');
      setIsConnected(true);
    });

    socketService.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setIsConnected(false);
    });

    socketService.on('connect_error', (error: any) => {
      console.error('❌ WebSocket connection error:', error);
      setIsConnected(false);
      // Don't show error to user - this is expected if server is not running
    });

    socketService.onNotification(handleNewNotification);

    return () => {
      clearTimeout(connectTimeout);
      console.log('🔌 Cleaning up WebSocket connection');
      socketService.disconnect();
    };
  }, [session, handleNewNotification, refreshNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // Notify server
    socketService.markNotificationAsRead(notificationId);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // TODO: Call API to mark all as read
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearReadNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    clearNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

