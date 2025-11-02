'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Topbar() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center space-x-4 pl-16 lg:pl-4">
          <h2 className="text-lg font-bold text-gray-900 hidden sm:block">
            Welcome back, {session?.user?.name}!
          </h2>
          <h2 className="text-lg font-bold text-gray-900 sm:hidden">
            Welcome!
          </h2>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-gray-900">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-600 capitalize font-medium">
                {session?.user?.role?.toLowerCase()}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
