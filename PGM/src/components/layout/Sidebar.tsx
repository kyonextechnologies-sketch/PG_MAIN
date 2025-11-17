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
              : "bg-[#1a1a1a]/90 border-[#f5c518] text-[#f5c518] hover:bg-[#222222]"
          )}
        >
          {isMobileMenuOpen ? (
            <X className="h-4 w-4" />
          ) : (
            <Menu className="h-4 w-4" />
          )}
        </Button>
      </div>


      {/* Sidebar */}
      <div
        className={cn(
          'w-64 bg-[#0d0d0d] backdrop-blur-md shadow-2xl border-r border-[#222222]',
          'fixed inset-y-0 left-0 z-40 lg:relative lg:z-auto lg:block',
          'transform transition-all duration-300 ease-in-out',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-[#222222]">
            <StayTrackLogo size={36} color="#f5c518" showText={true} />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                  <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 group relative overflow-hidden',
                    isActive
                      ? 'bg-[#f5c518]/10 text-[#f5c518] border-l-4 border-[#f5c518] shadow-lg shadow-[#f5c518]/10'
                      : 'text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white hover:shadow-md'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {/* Active indicator glow */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#f5c518]/5 to-transparent" />
                  )}
                  
                  <item.icon className={cn(
                    'h-5 w-5 mr-3 transition-all duration-200 relative z-10',
                    isActive 
                      ? 'text-[#f5c518]' 
                      : 'text-[#737373] group-hover:text-[#f5c518] group-hover:scale-110'
                  )} />
                  <span className="group-hover:translate-x-1 transition-transform duration-200 relative z-10">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-[#222222]">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] transition-colors duration-300 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-[#f5c518] to-[#e6b800] rounded-full flex items-center justify-center shadow-lg shadow-[#f5c518]/20">
                <span className="text-sm font-bold text-[#0d0d0d]">
                  {session?.user?.name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate group-hover:text-[#f5c518] transition-colors">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-[#737373] truncate capitalize font-medium">
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
                className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            )}
    </>
  );
}
