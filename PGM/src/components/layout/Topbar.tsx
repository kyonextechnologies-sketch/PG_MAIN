'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { clearTabSession } from '@/lib/tabSession';
import { getTabId } from '@/lib/auth/tabSession';
import { destroySession } from '@/lib/auth/destroySession';

export function Topbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      // Get tab ID for per-tab cookie deletion
      const tabId = getTabId();
      
      // Call logout API to delete per-tab cookie
      if (tabId) {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ tabId }),
          });
        } catch (error) {
          console.warn('Logout API call failed:', error);
        }
      }
      
      // Destroy per-tab session (new system)
      destroySession();
      
      // Clear old tab session (backward compatibility)
      clearTabSession();
      
      // Sign out from NextAuth
      signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Logout error:', error);
      // Still try to sign out even if there's an error
      signOut({ callbackUrl: '/' });
    }
  };

  const handleNotificationClick = () => {
    const role = session?.user?.role?.toLowerCase();
    if (role === 'owner') {
      router.push('/owner/notifications');
    } else if (role === 'tenant') {
      router.push('/tenant/notifications');
    } else if (role === 'admin') {
      router.push('/admin/notifications');
    }
  };

  return (
    <header className="bg-[#1a1a1a]/80 backdrop-blur-md shadow-lg border-b border-[#333333]/50">
      <div className="flex w-full items-center justify-between h-16 px-4 sm:px-6 lg:px-6">
        <div className="flex items-center space-x-4 pl-12 sm:pl-0">
          <h2 className="text-lg font-bold text-white hidden sm:block">
            Welcome back, <span className="text-[#f5c518]">{session?.user?.name}</span>!
          </h2>
          <h2 className="text-lg font-bold text-white sm:hidden">
            Welcome!
          </h2>
        </div>

        

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNotificationClick}
            className="relative hover:bg-[#2b2b2b] text-white transition-all hover:scale-110"
          >
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#f5c518] rounded-full border-2 border-[#1a1a1a] animate-pulse-slow" />
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#f5c518] to-[#e6b800] rounded-full flex items-center justify-center shadow-lg shadow-[#f5c518]/20">
              <User className="h-4 w-4 text-[#0d0d0d]" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-white">
                {session?.user?.name}
              </p>
              <p className="text-xs text-[#737373] capitalize font-medium">
                {session?.user?.role?.toLowerCase() === 'admin' 
                  ? 'Logged in as Admin' 
                  : session?.user?.role?.toLowerCase()}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleSignOut}
              className="group hover:bg-red-900/30 text-white transition-all duration-200 flex items-center gap-2"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4 group-hover:text-red-400 transition-colors" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
