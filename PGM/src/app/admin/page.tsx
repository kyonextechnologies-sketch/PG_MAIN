'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  Home, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle, 
  FileText,
  Shield,
  Activity,
  ArrowRight,
  Clock,
  Zap,
  Star
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DashboardStats {
  totalOwners: number;
  totalTenants: number;
  totalProperties: number;
  totalRooms: number;
  pendingVerifications: number;
  recentRegistrations: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setError(null);
      const response = await apiClient.get<DashboardStats>('/admin/dashboard-stats');
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError('Failed to load dashboard statistics');
        // Set default stats if API fails
        setStats({
          totalOwners: 0,
          totalTenants: 0,
          totalProperties: 0,
          totalRooms: 0,
          pendingVerifications: 0,
          recentRegistrations: 0,
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
      // Set default stats on error
      setStats({
        totalOwners: 0,
        totalTenants: 0,
        totalProperties: 0,
        totalRooms: 0,
        pendingVerifications: 0,
        recentRegistrations: 0,
      });
      setError('Unable to connect to backend. Showing default values.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Owners',
      value: stats?.totalOwners || 0,
      icon: Users,
      color: 'text-[#f5c518]',
      bgColor: 'bg-[#f5c518]/10',
      iconBg: 'bg-gradient-to-br from-[#f5c518] to-[#ffd000]',
    },
    {
      title: 'Total Tenants',
      value: stats?.totalTenants || 0,
      icon: Users,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      iconBg: 'bg-gradient-to-br from-green-400 to-green-600',
    },
    {
      title: 'Total Properties',
      value: stats?.totalProperties || 0,
      icon: Building2,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      iconBg: 'bg-gradient-to-br from-purple-400 to-purple-600',
    },
    {
      title: 'Total Rooms',
      value: stats?.totalRooms || 0,
      icon: Home,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
    },
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: Shield,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      iconBg: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      highlight: (stats?.pendingVerifications || 0) > 0,
    },
    {
      title: 'Recent Registrations',
      value: stats?.recentRegistrations || 0,
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      iconBg: 'bg-gradient-to-br from-blue-400 to-blue-600',
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="h-32 bg-gradient-to-r from-[#1a1a1a] to-[#252525] rounded-2xl animate-pulse" />
        
        {/* Loading Stats - 6 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-[#1a1a1a] rounded-2xl animate-pulse border border-[#333333]" />
          ))}
        </div>
        
        {/* Loading Actions - 3 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-[#1a1a1a] rounded-xl animate-pulse border border-[#333333]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header - Premium Style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-[#f5c518] via-[#ffd000] to-[#f5c518] rounded-2xl p-8 shadow-2xl shadow-[#f5c518]/20"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full -ml-24 -mb-24" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-[#0d0d0d]/20 rounded-xl backdrop-blur-sm">
                <Shield className="w-8 h-8 text-[#0d0d0d]" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-[#0d0d0d]">Admin Control Center</h1>
                <p className="text-[#0d0d0d]/80 text-lg mt-1">
                  Complete oversight of your PG Management System
                </p>
              </div>
            </div>
          </div>
          
          <motion.div 
            className="hidden lg:flex items-center gap-2 bg-[#0d0d0d]/10 backdrop-blur-sm px-6 py-3 rounded-xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          >
            <Activity className="w-5 h-5 text-[#0d0d0d]" />
            <span className="text-[#0d0d0d] font-semibold">System Active</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/50 rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-red-400 font-semibold">Error Loading Dashboard</p>
              <p className="text-red-300/80 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={loadStats}
            className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </motion.div>
      )}

      {/* Stats Grid - Premium Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: index * 0.1, 
              type: 'spring',
              stiffness: 100,
              damping: 15
            }}
            whileHover={{ 
              y: -8, 
              scale: 1.03,
              transition: { duration: 0.2 } 
            }}
          >
            <Card className={`
              relative overflow-hidden
              bg-gradient-to-br from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a]
              border-2 border-[#333333]
              hover:border-[#f5c518]
              hover:shadow-2xl hover:shadow-[#f5c518]/10
              transition-all duration-300
              ${card.highlight ? 'ring-2 ring-[#f5c518]/50 shadow-lg shadow-[#f5c518]/20' : ''}
            `}>
              {/* Gradient overlay for highlight */}
              {card.highlight && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#f5c518]/5 to-transparent" />
              )}
              
              <CardContent className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-4 rounded-2xl ${card.iconBg} shadow-lg shadow-${card.color}/20`}>
                    <card.icon className="w-8 h-8 text-white" />
                  </div>
                  {card.highlight && card.value > 0 && (
                    <motion.div 
                      className="px-3 py-1 bg-[#f5c518] rounded-full"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <span className="text-xs font-bold text-[#0d0d0d]">!</span>
                    </motion.div>
                  )}
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-2">{card.title}</p>
                  <motion.p 
                    className="text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-white bg-clip-text text-transparent"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ 
                      delay: index * 0.1 + 0.3,
                      type: 'spring',
                      stiffness: 200 
                    }}
                  >
                    {card.value}
                  </motion.p>
                </div>
                
                {card.value === 0 && (
                  <motion.p 
                    className="text-xs text-gray-600 mt-3 flex items-center gap-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 + 0.5 }}
                  >
                    <Clock className="w-3 h-3" />
                    Awaiting data
                  </motion.p>
                )}
                
                {card.highlight && card.value > 0 && (
                  <motion.div 
                    className="mt-4 flex items-center gap-2 px-3 py-2 bg-[#f5c518]/10 rounded-lg border border-[#f5c518]/30"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.6 }}
                  >
                    <Zap className="w-4 h-4 text-[#f5c518] animate-pulse" />
                    <span className="text-[#f5c518] text-sm font-semibold">Action Required</span>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'Manage Owners',
            description: 'View, verify and manage property owners',
            icon: Users,
            path: '/admin/owners',
            gradient: 'from-[#f5c518] to-[#ffd000]',
            iconColor: 'text-[#0d0d0d]',
            hoverBorder: 'hover:border-[#f5c518]',
          },
          {
            title: 'Properties',
            description: 'View all properties and room details',
            icon: Building2,
            path: '/admin/properties',
            gradient: 'from-purple-500 to-purple-700',
            iconColor: 'text-white',
            hoverBorder: 'hover:border-purple-500',
          },
          {
            title: 'Audit Logs',
            description: 'View system activity and logs',
            icon: FileText,
            path: '/admin/audit-logs',
            gradient: 'from-green-500 to-green-700',
            iconColor: 'text-white',
            hoverBorder: 'hover:border-green-500',
          },
        ].map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1, type: 'spring' }}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`
                group cursor-pointer
                bg-gradient-to-br from-[#1a1a1a] to-[#252525]
                border-2 border-[#333333]
                ${action.hoverBorder}
                hover:shadow-2xl hover:shadow-[#f5c518]/10
                transition-all duration-300
                overflow-hidden
              `}
              onClick={() => router.push(action.path)}
            >
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#f5c518]/0 to-[#f5c518]/0 group-hover:from-[#f5c518]/5 group-hover:to-transparent transition-all duration-500" />
              
              <CardContent className="p-6 relative z-10">
                <div className="flex flex-col items-center text-center gap-4">
                  {/* Icon with gradient background */}
                  <motion.div 
                    className={`p-5 rounded-2xl bg-gradient-to-br ${action.gradient} shadow-xl`}
                    whileHover={{ rotate: [0, -10, 10, -10, 0], transition: { duration: 0.5 } }}
                  >
                    <action.icon className={`w-10 h-10 ${action.iconColor}`} />
                  </motion.div>
                  
                  {/* Title */}
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#f5c518] transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {action.description}
                    </p>
                  </div>
                  
                  {/* Arrow indicator */}
                  <motion.div
                    className="mt-2 flex items-center gap-2 text-gray-500 group-hover:text-[#f5c518] transition-colors"
                    initial={{ x: 0 }}
                    whileHover={{ x: 5 }}
                  >
                    <span className="text-sm font-medium">View</span>
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

    </div>
  );
}

