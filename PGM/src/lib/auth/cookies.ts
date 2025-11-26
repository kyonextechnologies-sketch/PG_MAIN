/**
 * Cookie Management Utilities
 * 
 * Handles per-tab cookie operations for session isolation.
 */

import { getTabId, getSessionCookieName } from './tabSession';

/**
 * Set a cookie with per-tab isolation
 */
export function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  
  const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax;Secure=${window.location.protocol === 'https:'}`;
  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const nameEQ = name + '=';
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Set session cookie for this tab
 */
export function setSessionCookie(token: string, days: number = 30): void {
  const cookieName = getSessionCookieName();
  setCookie(cookieName, token, days);
}

/**
 * Get session cookie for this tab
 */
export function getSessionCookie(): string | null {
  const cookieName = getSessionCookieName();
  return getCookie(cookieName);
}

/**
 * Delete session cookie for this tab
 */
export function deleteSessionCookie(): void {
  const cookieName = getSessionCookieName();
  deleteCookie(cookieName);
}

/**
 * Get all session cookies (for debugging)
 */
export function getAllSessionCookies(): Record<string, string> {
  if (typeof document === 'undefined') {
    return {};
  }

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');
  
  cookieArray.forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && name.startsWith('session_')) {
      cookies[name] = value || '';
    }
  });
  
  return cookies;
}

