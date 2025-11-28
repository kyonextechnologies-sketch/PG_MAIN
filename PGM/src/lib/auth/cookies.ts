/**
 * Cookie Management Utilities
 * 
 * Handles per-tab cookie operations for session isolation.
 */

import { getTabId, getSessionCookieName } from './tabSession';

/**
 * Set a cookie with per-tab isolation
 * For session cookies, pass days as 0 or undefined
 */
export function setCookie(name: string, value: string, days?: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  const isSecure = window.location.protocol === 'https:';
  let cookieString = `${name}=${value};path=/;SameSite=Lax`;
  
  if (isSecure) {
    cookieString += ';Secure';
  }
  
  // If days is 0 or undefined, create a session cookie (no expires/maxAge)
  // Session cookies expire when browser closes
  if (days !== undefined && days > 0) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    cookieString += `;expires=${expires.toUTCString()}`;
  }
  // If days is 0 or undefined, don't set expires/maxAge = session cookie
  
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
 * Session cookies expire when browser closes (no maxAge/expires)
 */
export function setSessionCookie(token: string, days?: number): void {
  const cookieName = getSessionCookieName();
  // Pass 0 or undefined to create session-only cookie
  setCookie(cookieName, token, days === undefined ? 0 : days);
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

