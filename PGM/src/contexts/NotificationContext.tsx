'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { socketService } from '@/services/socket.service';
import { toast, type ToastIcon } from 'react-toastify';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (session?.user) {
      // Connect to WebSocket with access token
      const token = (session as any).accessToken;
      
      if (token) {
        console.log('🔌 Initializing WebSocket connection...');
        socketService.connect(token);

        // Listen for connection status
        socketService.on('connect', () => {
          console.log('✅ WebSocket connected');
          setIsConnected(true);
        });

        socketService.on('disconnect', () => {
          console.log('🔌 WebSocket disconnected');
          setIsConnected(false);
        });

        // Listen for notifications
        socketService.onNotification(handleNewNotification);

        // Cleanup on unmount
        return () => {
          console.log('🔌 Cleaning up WebSocket connection');
          socketService.disconnect();
        };
      }
    }
  }, [session]);

  // Handle new notification
  const handleNewNotification = useCallback((notification: Notification) => {
    console.log('📬 New notification:', notification);

    // Add to notifications list
    setNotifications(prev => [notification, ...prev]);

    // Show toast notification
    const createIcon = (symbol: string, label: string): ToastIcon => (
      <span role="img" aria-label={label} className="text-lg">
        {symbol}
      </span>
    );

    const notificationTypeConfig: Record<
      Notification['type'],
      { icon: ToastIcon; color: 'error' | 'warning' | 'info' | 'success' }
    > = {
      MAINTENANCE_REQUEST: { icon: createIcon('🔧', 'Maintenance request'), color: 'error' },
      MAINTENANCE_REMINDER: { icon: createIcon('⏰', 'Maintenance reminder'), color: 'warning' },
      MAINTENANCE_UPDATE: { icon: createIcon('📝', 'Maintenance update'), color: 'info' },
      OWNER_ACKNOWLEDGED: { icon: createIcon('✅', 'Owner acknowledged'), color: 'success' },
      PAYMENT_DUE: { icon: createIcon('💰', 'Payment due'), color: 'warning' },
      PAYMENT_RECEIVED: { icon: createIcon('✅', 'Payment received'), color: 'success' },
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

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
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

