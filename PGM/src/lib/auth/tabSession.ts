/**
 * Tab Session Management
 * 
 * Generates and manages unique tab IDs for cookie isolation.
 * Each browser tab gets its own session cookie.
 */

const TAB_ID_KEY = 'pgms_tab_id';

/**
 * Get or create a unique tab ID for this browser tab
 * Uses sessionStorage so each tab gets a fresh ID
 */
export function getTabId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    let tabId = sessionStorage.getItem(TAB_ID_KEY);
    
    if (!tabId) {
      // Generate unique tab ID
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        tabId = crypto.randomUUID();
      } else {
        // Fallback for older browsers
        tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      sessionStorage.setItem(TAB_ID_KEY, tabId);
    }

    return tabId;
  } catch (error) {
    // Fallback if sessionStorage is unavailable
    console.warn('⚠️ sessionStorage not available, using fallback tab ID');
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Get the cookie name for this tab's session
 */
export function getSessionCookieName(): string {
  const tabId = getTabId();
  return tabId ? `session_${tabId}` : 'session_default';
}

/**
 * Clear tab ID (useful for testing or logout)
 */
export function clearTabId(): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(TAB_ID_KEY);
    } catch (error) {
      console.warn('⚠️ Failed to clear tab ID:', error);
    }
  }
}

/**
 * Check if tab ID exists
 */
export function hasTabId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return !!sessionStorage.getItem(TAB_ID_KEY);
  } catch {
    return false;
  }
}

