'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  FileText,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Owners', href: '/admin/owners', icon: Users },
  { name: 'Properties', href: '/admin/properties', icon: Building2 },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: FileText },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Type assertion for admin role
  const userRole = session?.user?.role as string | undefined;

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (userRole !== 'ADMIN') {
      router.push('/');
    }
  }, [session, status, router, userRole]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#f5c518] animate-spin" />
      </div>
    );
  }

  if (userRole !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0d0d0d]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed on desktop, overlay on mobile */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 
          bg-[#1a1a1a] border-r border-[#333333]
          transform transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:block
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#333333]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f5c518] rounded-lg">
                <Shield className="w-6 h-6 text-[#0d0d0d]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Admin Portal</h1>
                <p className="text-xs text-gray-400">StayTrack</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'bg-[#f5c518] text-[#0d0d0d] font-semibold'
                        : 'text-gray-300 hover:bg-[#252525] hover:text-white'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-[#333333]">
            <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-[#252525] rounded-lg">
              <div className="w-10 h-10 bg-[#f5c518] rounded-full flex items-center justify-center">
                <span className="text-[#0d0d0d] font-bold">
                  {session?.user?.name?.[0] || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/api/auth/signout')}
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-[#1a1a1a] border-b border-[#333333] px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-300 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#f5c518]" />
              <h2 className="text-lg font-semibold text-white">
                {navigation.find((item) => pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href)))?.name || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-400">
                Logged in as <span className="text-[#f5c518] font-semibold">Admin</span>
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

