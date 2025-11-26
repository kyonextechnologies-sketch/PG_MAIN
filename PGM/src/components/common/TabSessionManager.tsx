'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getTabSession, setTabSession, clearTabSession, initializeTabCleanup } from '@/lib/tabSession';

/**
 * TabSessionManager Component
 * 
 * Manages per-tab session synchronization with NextAuth.
 * - Initializes tab cleanup on mount
 * - Syncs NextAuth session with tab sessionStorage
 * - Clears tab session when user logs out
 */
export function TabSessionManager() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Initialize tab cleanup listeners
    initializeTabCleanup();
  }, []);

  useEffect(() => {
    // Sync NextAuth session with tab sessionStorage
    if (status === 'authenticated' && session?.user) {
      const tabSession = getTabSession();
      const accessToken = (session as any).accessToken;

      // Only update if session data has changed or tab session doesn't exist
      if (!tabSession || 
          tabSession.userId !== session.user.id ||
          tabSession.email !== session.user.email ||
          tabSession.accessToken !== accessToken) {
        
        setTabSession({
          userId: session.user.id || '',
          email: session.user.email || '',
          name: session.user.name || '',
          role: session.user.role || 'TENANT',
          accessToken: accessToken || '',
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [TabSession] Synced NextAuth session with tab session');
        }
      }
    } else if (status === 'unauthenticated') {
      // Clear tab session when user logs out
      clearTabSession();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🗑️ [TabSession] Cleared tab session (user logged out)');
      }
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}

