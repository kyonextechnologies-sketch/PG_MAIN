/**
 * Per-Tab Session Management
 * 
 * Allows different accounts to be logged in different browser tabs.
 * Each tab maintains its own independent session using sessionStorage.
 * When a tab is closed, its session is automatically destroyed.
 */

const TAB_SESSION_KEY = 'pgms_tab_session';
const TAB_ID_KEY = 'pgms_tab_id';

export interface TabSession {
  tabId: string;
  userId: string;
  email: string;
  name: string;
  role: 'OWNER' | 'TENANT' | 'ADMIN';
  accessToken: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * Generate a unique tab ID
 */
function generateTabId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create a unique tab ID for this browser tab
 */
export function getTabId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    let tabId = sessionStorage.getItem(TAB_ID_KEY);
    
    if (!tabId) {
      tabId = generateTabId();
      sessionStorage.setItem(TAB_ID_KEY, tabId);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🆔 [TabSession] New tab ID created: ${tabId}`);
      }
    }

    return tabId;
  } catch (error) {
    console.warn('⚠️ [TabSession] Failed to get tab ID:', error);
    return generateTabId();
  }
}

/**
 * Store session data for this tab
 */
export function setTabSession(session: Omit<TabSession, 'tabId' | 'createdAt' | 'expiresAt'>): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const tabId = getTabId();
    const now = Date.now();
    const expiresAt = now + (30 * 24 * 60 * 60 * 1000); // 30 days

    const tabSession: TabSession = {
      ...session,
      tabId,
      createdAt: now,
      expiresAt,
    };

    sessionStorage.setItem(TAB_SESSION_KEY, JSON.stringify(tabSession));
    
    // Also store in localStorage for cross-tab communication (optional)
    // This allows us to track all active tabs
    updateActiveTabs(tabId, session.userId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ [TabSession] Session stored for tab ${tabId}`);
    }
  } catch (error) {
    console.error('❌ [TabSession] Failed to store session:', error);
  }
}

/**
 * Get session data for this tab
 */
export function getTabSession(): TabSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const sessionData = sessionStorage.getItem(TAB_SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const session: TabSession = JSON.parse(sessionData);
    
    // Check if session has expired
    if (Date.now() > session.expiresAt) {
      clearTabSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('❌ [TabSession] Failed to get session:', error);
    return null;
  }
}

/**
 * Clear session data for this tab
 */
export function clearTabSession(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const tabId = getTabId();
    sessionStorage.removeItem(TAB_SESSION_KEY);
    
    // Remove from active tabs
    removeActiveTab(tabId);

    if (process.env.NODE_ENV === 'development') {
      console.log(`🗑️ [TabSession] Session cleared for tab ${tabId}`);
    }
  } catch (error) {
    console.error('❌ [TabSession] Failed to clear session:', error);
  }
}

/**
 * Check if this tab has an active session
 */
export function hasTabSession(): boolean {
  const session = getTabSession();
  return session !== null;
}

/**
 * Update active tabs list in localStorage
 */
function updateActiveTabs(tabId: string, userId: string): void {
  try {
    const activeTabs = getActiveTabs();
    activeTabs[tabId] = {
      userId,
      lastActive: Date.now(),
    };
    localStorage.setItem('pgms_active_tabs', JSON.stringify(activeTabs));
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Remove tab from active tabs list
 */
function removeActiveTab(tabId: string): void {
  try {
    const activeTabs = getActiveTabs();
    delete activeTabs[tabId];
    localStorage.setItem('pgms_active_tabs', JSON.stringify(activeTabs));
  } catch (error) {
    // Ignore errors
  }
}

/**
 * Get all active tabs
 */
function getActiveTabs(): Record<string, { userId: string; lastActive: number }> {
  try {
    const data = localStorage.getItem('pgms_active_tabs');
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

/**
 * Initialize tab session cleanup on page unload
 */
export function initializeTabCleanup(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Clean up session when tab is closed
  window.addEventListener('beforeunload', () => {
    const tabId = getTabId();
    removeActiveTab(tabId);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🧹 [TabSession] Cleaning up tab ${tabId} on unload`);
    }
  });

  // Also listen for visibility change (when user switches tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Tab is hidden, update last active time
      const tabId = getTabId();
      const session = getTabSession();
      if (session) {
        updateActiveTabs(tabId, session.userId);
      }
    }
  });
}

/**
 * Check if session is valid and not expired
 */
export function isTabSessionValid(): boolean {
  const session = getTabSession();
  if (!session) {
    return false;
  }

  return Date.now() < session.expiresAt;
}

