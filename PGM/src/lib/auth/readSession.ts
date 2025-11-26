/**
 * Read Session
 * 
 * Reads the session for the current tab from cookie and sessionStorage.
 */

import { getTabId, getSessionCookieName } from './tabSession';
import { getSessionCookie } from './cookies';

export interface Session {
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'TENANT' | 'ADMIN';
  accessToken: string;
  tabId: string;
  createdAt: number;
}

/**
 * Read session for the current tab
 */
export function readSession(): Session | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const tabId = getTabId();
  if (!tabId) {
    return null;
  }

  // Try to read from sessionStorage first (faster)
  try {
    const sessionData = sessionStorage.getItem('pgms_session_data');
    if (sessionData) {
      const session: Session = JSON.parse(sessionData);
      // Verify tab ID matches
      if (session.tabId === tabId) {
        // Verify cookie still exists
        const cookieName = getSessionCookieName();
        const token = getSessionCookie();
        if (token && token === session.accessToken) {
          return session;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Failed to read session from sessionStorage:', error);
  }

  // Fallback: try to read from cookie
  const cookieName = getSessionCookieName();
  const token = getSessionCookie();
  
  if (token) {
    // If we have a token but no sessionStorage data, return minimal session
    // The full session data should be fetched from the backend
    return {
      userId: '',
      email: '',
      name: '',
      role: 'TENANT',
      accessToken: token,
      tabId,
      createdAt: Date.now(),
    };
  }

  return null;
}

/**
 * Check if session exists for current tab
 */
export function hasSession(): boolean {
  return readSession() !== null;
}

