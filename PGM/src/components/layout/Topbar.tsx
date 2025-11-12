'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';

export function Topbar() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-lg border-b border-white/20 dark:border-gray-800/20">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center space-x-4 pl-16 lg:pl-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 hidden sm:block">
            Welcome back, {session?.user?.name}!
          </h2>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 sm:hidden">
            Welcome!
          </h2>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Theme Toggle */}
         {/* <ThemeToggle /> */}

          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
          >
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          </Button>

          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {session?.user?.name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize font-medium">
                {session?.user?.role?.toLowerCase()}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              className="group hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-200 transition-all duration-200"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-700 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
