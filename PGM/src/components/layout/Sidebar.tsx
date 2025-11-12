'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  Home,
  Menu,
  X,
  LogOut,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ownerNavigation = [
  { name: 'Dashboard', href: '/owner/dashboard', icon: Home },
  { name: 'Properties', href: '/owner/properties', icon: Building },
  { name: 'Tenants', href: '/owner/tenants', icon: Users },
  { name: 'Requests', href: '/owner/requests', icon: MessageSquare },
  { name: 'Billing', href: '/owner/billing', icon: CreditCard },
  { name: 'Electricity', href: '/owner/electricity', icon: Zap },
  { name: 'Reports', href: '/owner/reports', icon: BarChart3 },
  { name: 'Settings', href: '/owner/settings', icon: Settings },
];

const tenantNavigation = [
  { name: 'Dashboard', href: '/tenant/dashboard', icon: Home },
  { name: 'Payments', href: '/tenant/payments', icon: CreditCard },
  { name: 'Electricity', href: '/tenant/electricity', icon: Zap },
  { name: 'Requests', href: '/tenant/requests', icon: Building },
  { name: 'Profile', href: '/tenant/profile', icon: Users },
];

export function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const navigation = session?.user?.role === 'OWNER' ? ownerNavigation : tenantNavigation;

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "backdrop-blur-md shadow-lg border-0 transition-all duration-300",
            isMobileMenuOpen 
              ? "bg-red-500/90 text-white hover:bg-red-600/90" 
              : "bg-white/90 text-gray-700 hover:bg-white"
          )}
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>


      {/* Sidebar */}
      <div
        className={cn(
          'w-64 bg-gradient-to-b from-white via-blue-50/95 to-purple-50/95 dark:from-gray-900 dark:via-gray-800/95 dark:to-gray-800/95 backdrop-blur-md shadow-2xl',
          'fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:block',
          'transform transition-transform duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Smart PG Manager
              </h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 group',
                    isActive
                      ? 'bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-800 dark:text-blue-200 border-l-4 border-blue-600 dark:border-blue-400 shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-md'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn(
                    'h-5 w-5 mr-3 transition-colors duration-200',
                    isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600'
                  )} />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate capitalize font-medium">
                  {session?.user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

            {/* Mobile overlay */}
            {isMobileMenuOpen && (
              <div
                className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
    </>
  );
}
