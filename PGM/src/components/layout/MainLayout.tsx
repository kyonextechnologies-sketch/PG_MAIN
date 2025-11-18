'use client';

import React, { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ToastContainer } from 'react-toastify';
import { Loading } from '@/components/common/Loading';
import 'react-toastify/dist/ReactToastify.css';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-[#0d0d0d]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d0d]">
        <Topbar />
        <main 
          id="main-content"
          className="flex-1 overflow-x-hidden overflow-y-auto bg-[#0d0d0d] px-3 sm:px-4 lg:px-6 py-6 relative"
          tabIndex={-1}
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none" />
          
          <div className="relative z-10 w-full space-y-6">
            <Suspense fallback={<Loading text="Loading..." />}>
              {children}
            </Suspense>
          </div>
        </main>
      </div>
      
      {/* Toast Container with premium styling */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        className="toast-container"
        toastClassName="bg-[#1a1a1a] border border-[#333333] text-white shadow-xl"
        progressClassName="bg-[#f5c518]"
      />
    </div>
  );
}
