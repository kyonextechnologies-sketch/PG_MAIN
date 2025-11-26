'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { getTabSession, setTabSession, clearTabSession, hasTabSession, isTabSessionValid, initializeTabCleanup, getTabId } from '@/lib/tabSession';
import type { TabSession } from '@/lib/tabSession';

export interface UseTabSessionReturn {
  session: TabSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  tabId: string;
}

/**
 * Custom hook for per-tab session management
 * Each browser tab maintains its own independent authentication session
 */
export function useTabSession(): UseTabSessionReturn {
  const [session, setSession] = useState<TabSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize tab cleanup on mount
  useEffect(() => {
    initializeTabCleanup();
  }, []);

  // Load session from sessionStorage on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const tabSession = getTabSession();
        if (tabSession && isTabSessionValid()) {
          setSession(tabSession);
        } else {
          setSession(null);
          clearTabSession();
        }
      } catch (error) {
        console.error('Failed to load tab session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for storage changes (when session is updated in another part of the app)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pgms_tab_session' || e.key === null) {
        loadSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      // Use NextAuth signIn but store session in tab sessionStorage
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        return { success: false, error: result.error };
      }

      // Get the session from NextAuth
      // We need to fetch it manually since NextAuth stores it in cookies
      const response = await fetch('/api/auth/session');
      const nextAuthSession = await response.json();

      if (nextAuthSession?.user) {
        // Store in tab sessionStorage
        const tabSessionData = {
          userId: nextAuthSession.user.id || '',
          email: nextAuthSession.user.email || email,
          name: nextAuthSession.user.name || '',
          role: nextAuthSession.user.role || 'TENANT',
          accessToken: (nextAuthSession as any).accessToken || '',
        };

        setTabSession(tabSessionData);
        setSession({
          ...tabSessionData,
          tabId: getTabId(),
          createdAt: Date.now(),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
        });

        return { success: true };
      }

      return { success: false, error: 'Failed to create session' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Clear tab session
      clearTabSession();
      setSession(null);

      // Also logout from NextAuth (this will clear cookies)
      await signOut({ redirect: false });

      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/session');
      const nextAuthSession = await response.json();

      if (nextAuthSession?.user) {
        const tabSessionData = {
          userId: nextAuthSession.user.id || '',
          email: nextAuthSession.user.email || '',
          name: nextAuthSession.user.name || '',
          role: nextAuthSession.user.role || 'TENANT',
          accessToken: (nextAuthSession as any).accessToken || '',
        };

        setTabSession(tabSessionData);
        setSession({
          ...tabSessionData,
          tabId: getTabId(),
          createdAt: Date.now(),
          expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
        });
      } else {
        clearTabSession();
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      clearTabSession();
      setSession(null);
    }
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated: hasTabSession() && isTabSessionValid(),
    login,
    logout,
    refreshSession,
    tabId: getTabId(),
  };
}

