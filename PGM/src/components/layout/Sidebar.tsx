'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
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
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StayTrackLogo } from '@/components/common/StayTrackLogo';

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
              : "bg-gray-800/90 text-white hover:bg-gray-700"
          )}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4 text-white" />
          )}
        </Button>
      </div>


      {/* Sidebar */}
      <div
        className={cn(
          'w-64 bg-gray-900 backdrop-blur-md shadow-2xl border-r border-gray-800',
          'fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:block',
          'transform transition-all duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
            <StayTrackLogo size={36} color="#0b3b5a" showText={true} />
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
                      ? 'bg-[#0b3b5a]/30 text-[#5c9fc9] border-l-4 border-[#5c9fc9] shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-gray-100 hover:shadow-md'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn(
                    'h-5 w-5 mr-3 transition-colors duration-200',
                    isActive 
                      ? 'text-[#5c9fc9]' 
                      : 'text-gray-400 group-hover:text-[#5c9fc9]'
                  )} />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#0b3b5a] rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">
                  {session?.user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-100 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400 truncate capitalize font-medium">
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
