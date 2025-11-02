'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useInvoices } from '@/hooks/useInvoices';
import { useUIStore } from '@/store/ui';
import { 
  Home, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  TrendingUp, 
  Shield, 
  Star,
  Bell,
  ArrowRight,
  CheckCircle,
  Clock,
  DollarSign,
  Building,
  User,
  Settings,
  Sparkles,
  Zap,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/apiClient';

export default function TenantDashboard() {
  const { data: session } = useSession();
  const { addNotification } = useUIStore();
  const { invoices, loading: invoicesLoading } = useInvoices();
  
  const [tenantProfile, setTenantProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Fetch tenant profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiClient.get('/tenants/profile/me');
        if (response.success) {
          setTenantProfile(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch tenant profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    loadProfile();
  }, []);

  // Calculate statistics from real invoices
  const nextDueInvoice = invoices.find(inv => inv.status === 'DUE');
  const outstandingDues = invoices
    .filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + Number(inv.amount), 0);
  
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
  const upcomingInvoices = invoices.filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE').slice(0, 3);

  const handleQuickAction = (action: string) => {
    addNotification({
      type: 'info',
      title: 'Quick Action',
      message: `${action} action triggered!`,
      read: false,
    });
  };

  const handlePayment = () => {
    addNotification({
      type: 'success',
      title: 'Payment Initiated',
      message: 'Redirecting to payment gateway...',
      read: false,
    });
  };

  const handleMaintenanceRequest = () => {
    addNotification({
      type: 'info',
      title: 'Maintenance Request',
      message: 'Opening maintenance request form...',
      read: false,
    });
  };

  if (loadingProfile || invoicesLoading) {
    return (
      <RequireRole role="TENANT">
        <MainLayout>
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <p className="text-gray-600 font-medium">Loading your dashboard...</p>
          </div>
        </MainLayout>
      </RequireRole>
    );
  }

  return (
    <RequireRole role="TENANT">
      <MainLayout>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-xl animate-float-delay"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-green-200/20 rounded-full blur-xl animate-float-delay-2"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-pink-200/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-yellow-200/10 rounded-full blur-2xl animate-pulse"></div>
        </div>

        <div className="relative space-y-8">
          {/* Enhanced Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-full shadow-lg">
              <Sparkles className="h-5 w-5 text-yellow-500 mr-2 animate-pulse" />
              <span className="text-sm font-semibold text-gray-700">Welcome to your dashboard</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-xl text-gray-800 max-w-2xl mx-auto font-semibold">
              Welcome back, <span className="font-bold text-blue-800">{session?.user?.name || 'Tenant'}</span>! 
              Here's your personalized overview.
            </p>
          </motion.div>

          {/* Enhanced Key Metrics */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Current Room */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-300/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Home className="h-5 w-5 text-blue-700" />
                        <p className="text-sm font-bold text-blue-800 uppercase tracking-wide">Current Room</p>
                      </div>
                      <p className="text-4xl font-bold text-blue-900">{tenantProfile?.room?.roomNumber || 'N/A'}</p>
                      <p className="text-sm text-blue-800 font-semibold">{tenantProfile?.bed?.bedNumber || 'N/A'} • {tenantProfile?.property?.name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                      <Home className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Next Due Date */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-orange-50 via-orange-100 to-red-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-300/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-5 w-5 text-orange-700" />
                        <p className="text-sm font-bold text-orange-800 uppercase tracking-wide">Next Due Date</p>
                      </div>
                      <p className="text-4xl font-bold text-orange-900">{nextDueInvoice ? formatDate(nextDueInvoice.dueDate) : 'N/A'}</p>
                      <p className="text-sm text-orange-800 font-semibold">Payment due: {nextDueInvoice ? formatDate(nextDueInvoice.dueDate) : 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                      <Calendar className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Outstanding Dues */}
            <motion.div
              whileHover={{ scale: 1.02, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-red-50 via-red-100 to-pink-200 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-300/10 rounded-full -translate-y-16 translate-x-16"></div>
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5 text-red-700" />
                        <p className="text-sm font-bold text-red-800 uppercase tracking-wide">Outstanding Dues</p>
                      </div>
                      <p className="text-4xl font-bold text-red-900">{formatCurrency(outstandingDues)}</p>
                      <p className="text-sm text-red-800 font-semibold">Payment required</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                      <AlertCircle className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-gray-50 to-white border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full mb-4">
                  <Zap className="h-4 w-4 text-purple-600 mr-2" />
                  <span className="text-sm font-semibold text-purple-700">Quick Actions</span>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Get Things Done</CardTitle>
                <CardDescription className="text-gray-600">Common tasks and shortcuts for your convenience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/tenant/payments">
                    <Button 
                      onClick={handlePayment}
                      className="w-full justify-start bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 text-white h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <CreditCard className="h-5 w-5 mr-3" />
                      Make Payment
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/tenant/requests">
                    <Button 
                      onClick={() => handleMaintenanceRequest()}
                      variant="outline" 
                      className="w-full justify-start h-14 text-lg font-semibold border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                    >
                      <AlertCircle className="h-5 w-5 mr-3" />
                      Raise Maintenance Request
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link href="/tenant/profile">
                    <Button 
                      onClick={() => handleQuickAction('Update Profile')}
                      variant="outline" 
                      className="w-full justify-start h-14 text-lg font-semibold border-2 hover:bg-purple-50 hover:border-purple-300 transition-all duration-300"
                    >
                      <User className="h-5 w-5 mr-3" />
                      Update Profile
                      <ArrowRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enhanced Recent Activity */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {/* Upcoming Invoices */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Upcoming Invoices</CardTitle>
                      <CardDescription className="text-gray-600">Your upcoming rent payments</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingInvoices.map((invoice, index) => (
                      <motion.div 
                        key={invoice.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{invoice.month}</p>
                            <p className="text-sm text-gray-500">Due: {formatDate(invoice.dueDate)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900">{formatCurrency(invoice.amount)}</p>
                          <Badge 
                            variant="default"
                            className="mt-1"
                          >
                            {invoice.status}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                    {upcomingInvoices.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No upcoming invoices</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Payments */}
            <motion.div
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">Recent Payments</CardTitle>
                      <CardDescription className="text-gray-600">Your payment history</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                     {paidInvoices.map((payment, index) => (
                        <motion.div 
                         key={payment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                         transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                             <p className="font-semibold text-gray-900">{payment.month}</p>
                             <p className="text-sm text-gray-500">UPI</p>
                            </div>
                          </div>
                          <div className="text-right">
                           <p className="font-bold text-lg text-gray-900">{formatCurrency(payment.amount)}</p>
                           <p className="text-sm text-gray-500">{formatDate(payment.paidAt || payment.createdAt)}</p>
                          </div>
                        </motion.div>
                     ))}
                     {paidInvoices.length === 0 && (
                       <div className="text-center py-8">
                         <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                         <p className="text-gray-500 font-medium">No payment history yet</p>
                       </div>
                     )}
                    </div>
                  </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </MainLayout>
    </RequireRole>
  );
}