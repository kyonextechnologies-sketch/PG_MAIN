'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock,
  Check,
  Trash2,
  Search,
  Calendar,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationContext';

export default function TenantNotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
  } = useNotifications();
  
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'PAYMENT' | 'MAINTENANCE' | 'SYSTEM'>('ALL');
  const [search, setSearch] = useState('');

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
    // Read/Unread filter
    if (filter === 'READ' && !n.read) return false;
    if (filter === 'UNREAD' && n.read) return false;

    // Category filter
    if (categoryFilter !== 'ALL' && n.category !== categoryFilter) return false;

    // Search filter
    if (search && !(
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.message.toLowerCase().includes(search.toLowerCase())
    )) return false;

    return true;
  });
  }, [notifications, filter, categoryFilter, search]);

  const hasNotifications = filteredNotifications.length > 0;

  return (
    <RequireRole role="TENANT">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Bell className="w-8 h-8 text-blue-600" />
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                    {unreadCount} New
                  </span>
                )}
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                    isConnected
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  {isConnected ? 'Live updates' : 'Offline'}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage all your notifications in real time
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                onClick={() => refreshNotifications()}
                variant="secondary"
                size="sm"
                disabled={isLoading}
                className="flex-1 sm:flex-none"
              >
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button
                  onClick={markAllAsRead}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Mark All as Read
                </Button>
              )}
              <Button
                onClick={() => router.push('/tenant/dashboard')}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{notifications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <EyeOff className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                    <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
                    <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {notifications.filter(n => {
                        const notifDate = new Date(n.createdAt);
                        const today = new Date();
                        return notifDate.toDateString() === today.toDateString();
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
            <CardContent className="p-4">
              <div className="flex flex-col xl:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search notifications..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Read/Unread Filter */}
                <div className="flex gap-2 flex-wrap">
                  {['ALL', 'UNREAD', 'READ'].map((f) => (
                    <Button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      size="sm"
                      variant={filter === f ? 'default' : 'outline'}
                      className={filter === f ? 'bg-blue-600 text-white' : ''}
                    >
                      {f}
                    </Button>
                  ))}
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  {['ALL', 'PAYMENT', 'MAINTENANCE', 'SYSTEM'].map((cat) => (
                    <Button
                      key={cat}
                      onClick={() => setCategoryFilter(cat as any)}
                      size="sm"
                      variant={categoryFilter === cat ? 'default' : 'outline'}
                      className={categoryFilter === cat ? 'bg-purple-600 text-white' : ''}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>

                {/* Delete All Read */}
                {notifications.some(n => n.read) && (
                  <Button
                    onClick={clearReadNotifications}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear Read
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications List */}
          <div className="space-y-3">
            {!hasNotifications ? (
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-0">
                <CardContent className="p-12 text-center">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-semibold">
                    {isLoading ? 'Loading notifications...' : 'No notifications found'}
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    {search || filter !== 'ALL' || categoryFilter !== 'ALL'
                      ? 'Try adjusting your filters'
                      : 'You\'re all caught up!'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AnimatePresence>
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={`
                        ${notification.read ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}
                        shadow-lg border-0 hover:shadow-xl transition-all duration-300
                        ${!notification.read && 'border-l-4 border-l-blue-500'}
                      `}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className={`p-3 rounded-xl ${getNotificationBg(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className={`text-lg font-bold ${
                                  notification.read 
                                    ? 'text-gray-600 dark:text-gray-400' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {notification.title}
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                {formatTimestamp(notification.createdAt)}
                                  </div>
                                  {notification.category && (
                                    <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                                      {notification.category}
                                    </span>
                                  )}
                                  {!notification.read && (
                                    <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                      NEW
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <p className={`text-sm ${
                              notification.read 
                                ? 'text-gray-500 dark:text-gray-500' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {!notification.read && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Mark Read
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Summary Footer */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {filteredNotifications.length} of {notifications.length} notifications
                  </p>
                  {unreadCount > 0 && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      {unreadCount} unread notification{unreadCount !== 1 && 's'} remaining
                    </p>
                  )}
                </div>
                {filteredNotifications.length > 0 && (
                  <p className="text-sm text-gray-500">
                    Last update: {formatTimestamp(filteredNotifications[0]?.createdAt)}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RequireRole>
  );
}

