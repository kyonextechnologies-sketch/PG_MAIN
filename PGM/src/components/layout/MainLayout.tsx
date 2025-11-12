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
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0 bg-gray-900">
        <Topbar />
        <main 
          id="main-content"
          className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 p-4 sm:p-6"
          tabIndex={-1}
        >
          <Suspense fallback={<Loading text="Loading..." />}>
            {children}
          </Suspense>
        </main>
      </div>
      
      {/* Toast Container */}
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
      />
    </div>
  );
}
