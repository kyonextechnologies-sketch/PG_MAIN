/**
 * Session Isolation Per Tab
 * 
 * Creates a unique session ID for each browser tab using sessionStorage.
 * This ensures each tab has independent UI state while still sharing auth cookies.
 */

const SESSION_ID_KEY = 'pgms_session_id';

/**
 * Get or create a unique session ID for this tab
 * Uses sessionStorage (not localStorage) so each tab gets a fresh ID
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string
    return '';
  }

  try {
    // Check if session ID already exists in sessionStorage
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

    if (!sessionId) {
      // Generate new UUID for this tab
      sessionId = generateUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🆔 [Session] New session ID created for this tab: ${sessionId}`);
      }
    }

    return sessionId;
  } catch (error) {
    // Fallback if sessionStorage is not available
    console.warn('⚠️ [Session] sessionStorage not available, using fallback');
    return generateUUID();
  }
}

/**
 * Generate a UUID v4
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Clear session ID (useful for testing or logout)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_ID_KEY);
    } catch (error) {
      console.warn('⚠️ [Session] Failed to clear session ID:', error);
    }
  }
}

/**
 * Check if session ID exists
 */
export function hasSessionId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return !!sessionStorage.getItem(SESSION_ID_KEY);
  } catch {
    return false;
  }
}


