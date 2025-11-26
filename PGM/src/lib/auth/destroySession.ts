/**
 * Destroy Session
 * 
 * Destroys the session for the current tab only.
 * Other tabs' sessions remain unaffected.
 */

import { getTabId, getSessionCookieName, clearTabId } from './tabSession';
import { deleteSessionCookie } from './cookies';

/**
 * Destroy session for the current tab only
 * Does NOT affect other tabs' sessions
 */
export function destroySession(): void {
  const tabId = getTabId();
  const cookieName = getSessionCookieName();

  // Delete tab-specific cookie
  deleteSessionCookie();

  // Clear sessionStorage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('pgms_session_data');
    } catch (error) {
      console.warn('⚠️ Failed to clear sessionStorage:', error);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`🗑️ Session destroyed for tab ${tabId} (cookie: ${cookieName})`);
  }
}

/**
 * Destroy all sessions (for complete logout)
 * This will delete all session_* cookies
 */
export function destroyAllSessions(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Get all session cookies
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (name && name.startsWith('session_')) {
      // Delete each session cookie
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }
  });

  // Clear sessionStorage
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('pgms_session_data');
      clearTabId();
    } catch (error) {
      console.warn('⚠️ Failed to clear sessionStorage:', error);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ All sessions destroyed');
  }
}

