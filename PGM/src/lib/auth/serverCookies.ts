/**
 * Server-Side Cookie Utilities
 * 
 * Handles reading per-tab session cookies on the server.
 * Used in API routes and middleware to access tab-specific cookies.
 */

import { cookies } from 'next/headers';

/**
 * Get the session cookie name for a specific tab
 */
export function getSessionCookieName(tabId: string): string {
  return tabId ? `session_${tabId}` : 'session_default';
}

/**
 * Read session cookie for a specific tab (server-side)
 */
export async function getServerSessionCookie(tabId?: string): Promise<string | null> {
  const cookieStore = await cookies();
  
  if (!tabId) {
    // Try to get tabId from cookies or return null
    return null;
  }
  
  const cookieName = getSessionCookieName(tabId);
  const cookie = cookieStore.get(cookieName);
  
  return cookie?.value || null;
}

/**
 * Read session cookie from request headers (for middleware)
 */
export function getSessionCookieFromRequest(
  request: Request,
  tabId?: string
): string | null {
  if (!tabId) {
    // Try to extract tabId from headers
    tabId = request.headers.get('x-tab-id') || undefined;
  }
  
  if (!tabId) {
    return null;
  }
  
  const cookieName = getSessionCookieName(tabId);
  const cookieHeader = request.headers.get('cookie');
  
  if (!cookieHeader) {
    return null;
  }
  
  // Parse cookie header
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      acc[name] = decodeURIComponent(value);
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies[cookieName] || null;
}

/**
 * Set session cookie for a specific tab (server-side)
 */
export async function setServerSessionCookie(
  tabId: string,
  token: string,
  maxAge: number = 30 * 24 * 60 * 60 // 30 days
): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName(tabId);
  
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  });
}

/**
 * Delete session cookie for a specific tab (server-side)
 */
export async function deleteServerSessionCookie(tabId: string): Promise<void> {
  const cookieStore = await cookies();
  const cookieName = getSessionCookieName(tabId);
  
  cookieStore.delete(cookieName);
}

/**
 * Get tabId from request headers
 */
export function getTabIdFromRequest(request: Request): string | null {
  return request.headers.get('x-tab-id');
}


