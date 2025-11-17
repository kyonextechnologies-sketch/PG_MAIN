'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, X, Trash2 } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      MAINTENANCE_REQUEST: '🔧',
      MAINTENANCE_REMINDER: '⏰',
      MAINTENANCE_UPDATE: '📝',
      OWNER_ACKNOWLEDGED: '✅',
      PAYMENT_DUE: '💰',
      PAYMENT_RECEIVED: '✅',
      SYSTEM_ALERT: '🔔',
    };
    return icons[type] || '🔔';
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-[#0d0d0d] bg-[#f5c518] rounded-full"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleOpen}
              className="fixed inset-0 z-40"
            />

            {/* Notification Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-96 max-h-[600px] bg-[#1a1a1a] border border-[#333333] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#333333]">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#f5c518]" />
                  <h3 className="font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-[#f5c518] text-[#0d0d0d] rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleOpen}
                  className="p-1 hover:bg-[#333333] rounded transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex gap-2 p-3 border-b border-[#333333]">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#f5c518]/10 hover:bg-[#f5c518]/20 rounded-lg transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      Mark all as read
                    </button>
                  )}
                  <button
                    onClick={clearNotifications}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-16 h-16 mb-4 bg-[#333333] rounded-full flex items-center justify-center">
                      <Bell className="w-8 h-8 text-gray-500" />
                    </div>
                    <p className="text-gray-400 font-medium">No notifications yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      We&apos;ll notify you when something important happens
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#333333]">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`
                          p-4 hover:bg-[#252525] transition-colors cursor-pointer
                          ${notification.read ? 'opacity-60' : ''}
                        `}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          {/* Icon */}
                          <div className="flex-shrink-0 text-2xl">
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-white text-sm leading-tight">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <button
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="flex-shrink-0 p-1 hover:bg-[#333333] rounded transition-colors"
                                  aria-label="Mark as read"
                                >
                                  <Check className="w-4 h-4 text-[#f5c518]" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-gray-500 mt-2 block">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f5c518]" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

