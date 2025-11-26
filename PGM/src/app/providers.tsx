'use client';

import React, { useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { ThemeProvider } from '@/lib/theme';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { TabSessionManager } from '@/components/common/TabSessionManager';

// Safe toast function that checks if toast is available
const safeToastError = (message: string) => {
  if (typeof window !== 'undefined') {
    try {
      // Use setTimeout to ensure toast container is mounted
      setTimeout(() => {
        import('react-toastify').then(({ toast }) => {
          toast.error(message);
        }).catch(() => {
          console.error('Toast error:', message);
        });
      }, 100);
    } catch {
      console.error('Toast error:', message);
    }
  }
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => {
            // Global error handling for queries
            if (error instanceof Error) {
              console.error('Query error:', error.message);
              // Only show toast for non-401 errors (auth errors are handled separately)
              if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
                safeToastError(error.message || 'An error occurred while fetching data');
              }
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            // Global error handling for mutations
            if (error instanceof Error) {
              console.error('Mutation error:', error.message);
              if (!error.message.includes('401') && !error.message.includes('Unauthorized')) {
                safeToastError(error.message || 'An error occurred');
              }
            }
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (client errors)
              if (error instanceof Error) {
                if (error.message.includes('40')) return false;
                if (error.message.includes('401') || error.message.includes('403')) return false;
              }
              return failureCount < 2;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <SessionProvider
        refetchInterval={0}
        refetchOnWindowFocus={false}
        refetchWhenOffline={false}
        basePath="/api/auth"
      >
        <TabSessionManager />
        <QueryClientProvider client={queryClient}>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
