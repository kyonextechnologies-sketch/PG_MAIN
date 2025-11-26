'use client';

/**
 * useTabSession Hook
 * 
 * React hook for managing per-tab sessions.
 * Provides session state and operations for the current tab.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTabId, getSessionCookieName, clearTabId } from './tabSession';
import { getSessionCookie, setSessionCookie, deleteSessionCookie } from './cookies';
import { readSession, hasSession, type Session } from './readSession';
import { createSession, type SessionData } from './createSession';
import { destroySession, destroyAllSessions } from './destroySession';
import { apiClient } from '@/lib/apiClient';

export interface UseTabSessionReturn {
  // Session state
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tabId: string;
  
  // Session operations
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // Utilities
  getSessionCookieName: () => string;
  setSession: (data: SessionData) => Promise<void>;
  clearSession: () => void;
}

/**
 * Custom hook for per-tab session management
 */
export function useTabSession(): UseTabSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const tabId = getTabId();

  // Load session on mount
  useEffect(() => {
    const loadSession = () => {
      try {
        const currentSession = readSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Failed to load session:', error);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    // Listen for storage changes (when session is updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pgms_session_data' || e.key === null) {
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

      // Call backend login API
      const response = await apiClient.post<{
        user: { id: string; email: string; name: string; role: string };
        accessToken: string;
      }>('/auth/login', {
        email,
        password,
      });

      if (!response.success || !response.data) {
        return { success: false, error: response.message || 'Login failed' };
      }

      const { user, accessToken } = response.data;

      // Create per-tab session
      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role as 'OWNER' | 'TENANT' | 'ADMIN',
        accessToken,
      });

      // Reload session
      const newSession = readSession();
      setSession(newSession);

      return { success: true };
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Login failed';
      console.error('Login error:', error);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Call backend logout API (optional - for server-side cleanup)
      try {
        await apiClient.post('/auth/logout');
      } catch (error) {
        // Ignore logout API errors - we'll still clear local session
        console.warn('Logout API call failed:', error);
      }

      // Destroy only this tab's session
      destroySession();
      setSession(null);

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
      const currentSession = readSession();
      if (!currentSession || !currentSession.accessToken) {
        setSession(null);
        return;
      }

      // Verify session with backend
      const response = await apiClient.get<{
        user: { id: string; email: string; name: string; role: string };
        accessToken: string;
      }>('/auth/me');

      if (response.success && response.data) {
        const { user, accessToken } = response.data;

        // Update session
        await createSession({
          userId: user.id,
          email: user.email,
          name: user.name,
          role: user.role as 'OWNER' | 'TENANT' | 'ADMIN',
          accessToken,
        });

        const updatedSession = readSession();
        setSession(updatedSession);
      } else {
        // Session invalid - clear it
        destroySession();
        setSession(null);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      destroySession();
      setSession(null);
    }
  }, []);

  // Set session manually
  const setSessionData = useCallback(async (data: SessionData): Promise<void> => {
    await createSession(data);
    const newSession = readSession();
    setSession(newSession);
  }, []);

  // Clear session
  const clearSessionData = useCallback((): void => {
    destroySession();
    setSession(null);
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated: hasSession(),
    tabId,
    login,
    logout,
    refreshSession,
    getSessionCookieName,
    setSession: setSessionData,
    clearSession: clearSessionData,
  };
}

