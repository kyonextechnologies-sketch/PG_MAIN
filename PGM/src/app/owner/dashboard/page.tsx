'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { RequireRole } from '@/components/common/RBAC';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat-card';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonCard } from '@/components/common/Skeleton';
import { Button } from '@/components/ui/button';
import { LineChartComponent, BarChartComponent, PieChartComponent } from '@/components/ui/charts';
import { 
  Building, 
  Users, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Calendar,
  CreditCard,
  Home,
  Star,
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Bell,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useInvoices } from '@/hooks/useInvoices';
import { useProperties } from '@/hooks/useProperties';
import { useTenants } from '@/hooks/useTenants';
import { useMaintenanceTickets } from '@/hooks/useMaintenanceTickets';
import { useUIStore } from '@/store/ui';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Mock data for owner dashboard
const mockStats = {
  totalProperties: 2,
  totalTenants: 18,
  monthlyRevenue: 270000,
  occupancyRate: 85,
  outstandingDues: 45000,
  maintenanceRequests: 3,
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'PAYMENT',
    description: 'Jane Smith paid February rent',
    amount: 15000,
    date: '2024-02-15',
  },
  {
    id: '2',
    type: 'REQUEST',
    description: 'New maintenance request from Room 101',
    date: '2024-02-14',
  },
  {
    id: '3',
    type: 'TENANT',
    description: 'New tenant Mike Johnson added',
    date: '2024-02-13',
  },
];

const mockUpcomingDues = [
  {
    id: '1',
    tenantName: 'Sarah Wilson',
    property: 'Green Valley PG',
    amount: 12000,
    dueDate: '2024-02-28',
  },
  {
    id: '2',
    tenantName: 'Alex Brown',
    property: 'Sunshine PG',
    amount: 15000,
    dueDate: '2024-02-29',
  },
];

// Revenue data will be fetched from API



export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Dashboard Debug - Session Status:', status);
    console.log('🔍 Dashboard Debug - Session Data:', session);
    if (session?.user) {
      console.log('🔍 Dashboard Debug - User ID:', session.user.id);
      console.log('🔍 Dashboard Debug - User Role:', session.user.role);
    }
  }, [session, status]);
  
  // ✅ DATA ISOLATION - All data is automatically filtered by ownerId at backend level
  // - properties: Only this owner's properties
  // - tenants: Only this owner's tenants  
  // - invoices: Only this owner's invoices
  // - tickets: Only this owner's maintenance requests
  const { properties } = useProperties();
  const { tenants } = useTenants();
  const { invoices } = useInvoices();
  const { tickets } = useMaintenanceTickets();
  const { addNotification, setModalOpen } = useUIStore();

  // Fetch revenue trend data from API
  const [revenueData, setRevenueData] = React.useState<Array<{ name: string; value: number; revenue: number; expenses: number; profit: number }>>([]);
  const [revenueLoading, setRevenueLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setRevenueLoading(true);
        const response = await fetch('/api/dashboard/revenue');
        const result = await response.json();
        
        if (result.success && result.data?.chartData) {
          // Transform API data to chart format
          const chartData = result.data.chartData.map((item: { month: string; paid: number; pending: number }) => {
            const date = new Date(item.month + '-01');
            const monthName = date.toLocaleDateString('en-US', { month: 'short' });
            return {
              name: monthName,
              value: item.paid,
              revenue: item.paid,
              expenses: 0, // Expenses not tracked yet
              profit: item.paid,
            };
          });
          setRevenueData(chartData);
        } else {
          // Fallback to empty data if API fails
          setRevenueData([]);
        }
      } catch (error) {
        console.error('Failed to fetch revenue data:', error);
        setRevenueData([]);
      } finally {
        setRevenueLoading(false);
      }
    };

    if (session?.user && status === 'authenticated') {
      fetchRevenueData();
    }
  }, [session, status]);

  // Calculate stats from real data
  const totalRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => {
      const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  const outstandingDues = invoices
    .filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE')
    .reduce((sum, inv) => {
      const amount = typeof inv.amount === 'string' ? parseFloat(inv.amount) : inv.amount;
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

  // Calculate occupancy rate from real data
  const totalRoomCapacity = properties.reduce((sum, prop) => sum + (prop.totalBeds || 0), 0);
  const occupiedBeds = tenants.filter(t => t.status === 'ACTIVE').length;
  const occupancyRate = totalRoomCapacity > 0 
    ? Math.round((occupiedBeds / totalRoomCapacity) * 100) 
    : 0;

  // Calculate revenue growth percentage
  const paidThisMonth = invoices
    .filter(inv => inv.status === 'PAID')
    .length;
  const totalInvoices = invoices.length;
  const revenueGrowth = totalInvoices > 0 
    ? Math.round((paidThisMonth / totalInvoices) * 100)
    : 0;

  const ticketStats = {
    open: tickets.filter(t => t.status === 'OPEN').length,
    inProgress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
    highPriority: tickets.filter(t => t.priority === 'HIGH').length,
  };

// ✅ REAL OCCUPANCY DATA - Calculate from actual properties and tenants
  const occupancyData = properties.map(property => {
    const propertyTenants = tenants.filter(t => t.propertyId === property.id && t.status === 'ACTIVE');
    const occupancyPercentage = property.totalBeds && property.totalBeds > 0
      ? Math.round((propertyTenants.length / property.totalBeds) * 100)
      : 0;
    return {
      name: property.name || `Property ${property.id}`,
      value: occupancyPercentage,
    };
  }).filter(item => item.name); // Filter out invalid entries

  const handleQuickAction = (action: string) => {
      addNotification({
        type: 'info',
        title: 'Quick Action',
        message: `${action} action triggered!`,
        read: false,
      });
  };

  const handleViewDetails = (type: string, id: string) => {
    addNotification({
      type: 'success',
      title: 'View Details',
      message: `Viewing ${type} details for ID: ${id}`,
      read: false,
    });
  };

  return (
    <RequireRole role="OWNER">
      <MainLayout>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-purple-200/20 rounded-full blur-xl animate-float-delay"></div>
          <div className="absolute bottom-20 left-1/4 w-28 h-28 bg-green-200/20 rounded-full blur-xl animate-float-delay-2"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-pink-200/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-yellow-200/10 rounded-full blur-2xl animate-pulse"></div>
        </div>

        <motion.div 
          className="space-y-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Background Decorative Icons */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <Building className="absolute top-20 right-10 w-64 h-64 text-blue-100 dark:text-blue-900/20 opacity-30" />
            <Users className="absolute top-40 left-20 w-48 h-48 text-green-100 dark:text-green-900/20 opacity-25" />
            <DollarSign className="absolute bottom-20 right-1/4 w-56 h-56 text-purple-100 dark:text-purple-900/20 opacity-30" />
            <TrendingUp className="absolute bottom-40 left-1/3 w-52 h-52 text-orange-100 dark:text-orange-900/20 opacity-25" />
            <CreditCard className="absolute top-1/2 left-10 w-40 h-40 text-blue-100 dark:text-blue-900/20 opacity-20" />
            <BarChart3 className="absolute top-1/3 right-1/3 w-44 h-44 text-purple-100 dark:text-purple-900/20 opacity-25" />
          </div>
          {/* Enhanced Header */}
          <PageHeader
            title={`Welcome back, ${session?.user?.name || 'User'}!`}
            description="Here's what's happening with your properties today."
            breadcrumbs={[
              { label: 'Dashboard', href: '/owner/dashboard' }
            ]}
          />

          {/* Key Metrics */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <StatCard
              title="Total Properties"
              value={properties.length}
              description="Active properties"
              icon={Building}
              iconClassName="bg-blue-500"
              onClick={() => router.push('/owner/properties')}
            />
            <StatCard
              title="Total Tenants"
              value={tenants.length}
              description="Active tenants"
              icon={Users}
              iconClassName="bg-green-500"
              onClick={() => router.push('/owner/tenants')}
            />
            <StatCard
              title="Monthly Revenue"
              value={formatCurrency(totalRevenue)}
              description="This month"
              icon={DollarSign}
              iconClassName="bg-purple-500"
              trend={{
                value: revenueGrowth,
                label: 'vs last month',
                isPositive: revenueGrowth >= 0,
              }}
            />
            <StatCard
              title="Occupancy Rate"
              value={`${occupancyRate}%`}
              description="Average occupancy"
              icon={TrendingUp}
              iconClassName="bg-orange-500"
            />
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/owner/properties">
              <Card 
                glow
                className="cursor-pointer"
                onClick={() => handleQuickAction('Properties Management')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#f5c518]/10 border border-[#f5c518]/20 rounded-xl shadow-md">
                      <Building className="h-8 w-8 text-[#f5c518]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Properties</h3>
                      <p className="text-sm text-[#a1a1a1] font-medium">Manage properties</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/owner/tenants">
              <Card 
                glow
                className="cursor-pointer"
                onClick={() => handleQuickAction('Tenants Management')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl shadow-md">
                      <Users className="h-8 w-8 text-[#10b981]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Tenants</h3>
                      <p className="text-sm text-[#a1a1a1] font-medium">Manage tenants</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/owner/billing">
              <Card 
                glow
                className="cursor-pointer"
                onClick={() => handleQuickAction('Billing Management')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-xl shadow-md">
                      <CreditCard className="h-8 w-8 text-[#f59e0b]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Billing</h3>
                      <p className="text-sm text-[#a1a1a1] font-medium">Manage invoices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/owner/reports">
              <Card 
                glow
                className="cursor-pointer"
                onClick={() => handleQuickAction('Reports & Analytics')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-xl shadow-md">
                      <TrendingUp className="h-8 w-8 text-[#3b82f6]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Reports</h3>
                      <p className="text-sm text-[#a1a1a1] font-medium">View analytics</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Recent Activity */}
            <Card glow>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-bold text-white">Recent Activity</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#a1a1a1] font-medium">Latest updates from your properties</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Real Activity: Recent Paid Invoices */}
                  {invoices
                    .filter(inv => inv.status === 'PAID')
                    .sort((a, b) => new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime())
                    .slice(0, 3)
                    .map((invoice) => (
                      <div key={invoice.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 rounded-full flex items-center justify-center shadow-md">
                          <CreditCard className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Invoice {invoice.month} Paid</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{formatDate(invoice.paidAt || invoice.updatedAt || '')}</p>
                        </div>
                        <div className="text-sm font-bold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                          {formatCurrency(invoice.amount)}
                        </div>
                      </div>
                    ))}
                  
                  {/* Real Activity: Recent Maintenance Requests */}
                  {tickets
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 2)
                    .map((ticket) => (
                      <div key={ticket.id} className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50 rounded-full flex items-center justify-center shadow-md">
                          <AlertCircle className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{ticket.title}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{formatDate(ticket.createdAt)}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 dark:bg-blue-500 dark:border-blue-500 dark:hover:bg-blue-600 font-semibold"
                          onClick={() => handleViewDetails('REQUEST', ticket.id)}
                        >
                          View
                        </Button>
                      </div>
                    ))}

                  {/* No Activity Message */}
                  {invoices.filter(inv => inv.status === 'PAID').length === 0 && tickets.length === 0 && (
                    <EmptyState
                      icon={Activity}
                      title="No recent activity"
                      description="Your recent activities will appear here once you start using the system."
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Dues */}
            <Card glow>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg font-bold text-white">Upcoming Dues</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-[#a1a1a1] font-medium">Tenants with pending payments</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Real Upcoming Dues: DUE and OVERDUE Invoices */}
                  {invoices
                    .filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE')
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 5)
                    .map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/30 dark:to-red-900/30 rounded-lg border border-orange-200 dark:border-orange-800/50 hover:shadow-md transition-all duration-200">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-base">Invoice {invoice.month}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">Tenant ID: {invoice.tenantId}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="font-bold text-red-700 dark:text-red-400 text-lg">{formatCurrency(invoice.amount)}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Due: {formatDate(invoice.dueDate)}</p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 font-semibold shadow-md"
                            onClick={() => {
                              addNotification({
                                type: 'info',
                                title: 'Send Reminder',
                                message: `Sending payment reminder for invoice ${invoice.month}`,
                                read: false,
                              });
                            }}
                          >
                            Remind
                          </Button>
                        </div>
                      </div>
                    ))}

                  {/* No Dues Message */}
                  {invoices.filter(inv => inv.status === 'DUE' || inv.status === 'OVERDUE').length === 0 && (
                    <EmptyState
                      icon={CheckCircle}
                      title="All Clear!"
                      description="All invoices are paid. No pending dues at this time."
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerts and Notifications */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-red-50 to-red-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-red-800 dark:text-red-800">Outstanding Dues</CardTitle>
                <div className="p-2 bg-red-500 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-red-900 dark:text-red-800">
                  {formatCurrency(outstandingDues)}
                </div>
                <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium">
                  Pending payments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-orange-800 dark:text-orange-800">Maintenance Requests</CardTitle>
                <div className="p-2 bg-orange-500 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-orange-900 dark:text-orange-800">
                  {ticketStats.open}
                </div>
                <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-400 font-medium">
                  Open requests
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold text-green-800 dark:text-green-800">Revenue Growth</CardTitle>
                <div className="p-2 bg-green-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-800">+{revenueGrowth}%</div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-400 font-medium">
                  vs last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Charts Section */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <LineChartComponent
              data={revenueLoading ? [] : revenueData}
              title="Revenue Trend"
              description={revenueLoading ? "Loading revenue data..." : "Monthly revenue over time"}
            />
            <PieChartComponent
              data={occupancyData}
              title="Property Occupancy"
              description="Occupancy rates by property"
            />
          </motion.div>
        </motion.div>
      </MainLayout>
    </RequireRole>
  );
}
