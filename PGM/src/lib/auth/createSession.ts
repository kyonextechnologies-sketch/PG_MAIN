/**
 * Create Session
 * 
 * Creates a per-tab session by storing JWT token in a tab-specific cookie.
 */

import { getTabId, getSessionCookieName } from './tabSession';
import { setSessionCookie } from './cookies';

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'TENANT' | 'ADMIN';
  accessToken: string;
}

/**
 * Create a session for the current tab
 * Stores JWT in a tab-specific cookie: session_<tabId>
 */
export async function createSession(sessionData: SessionData): Promise<void> {
  const tabId = getTabId();
  
  if (!tabId) {
    throw new Error('Failed to generate tab ID');
  }

  // Create JWT payload
  const payload = {
    userId: sessionData.userId,
    email: sessionData.email,
    name: sessionData.name,
    role: sessionData.role,
    tabId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  };

  // In a real implementation, you'd sign this with your JWT secret
  // For now, we'll store the accessToken directly and let the backend validate it
  const cookieName = getSessionCookieName();
  
  // Store accessToken in tab-specific session cookie (expires on browser close)
  // The backend will validate this token
  setSessionCookie(sessionData.accessToken, 0); // 0 = session-only cookie

  // Also store session data in sessionStorage for quick access
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('pgms_session_data', JSON.stringify({
        ...sessionData,
        tabId,
        createdAt: Date.now(),
      }));
    } catch (error) {
      console.warn('⚠️ Failed to store session in sessionStorage:', error);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Session created for tab ${tabId} (cookie: ${cookieName})`);
  }
}

