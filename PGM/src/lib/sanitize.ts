/**
 * Input sanitization utilities
 * Prevents XSS attacks and ensures data safety
 */

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  if (typeof window === 'undefined') {
    // Server-side: basic sanitization
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Client-side: use DOMPurify if available, otherwise basic sanitization
  try {
    // You can install DOMPurify: npm install dompurify @types/dompurify
    // const DOMPurify = require('dompurify');
    // return DOMPurify.sanitize(html);
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  } catch {
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}

/**
 * Sanitize user input (removes potentially dangerous characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/script/gi, '') // Remove script tags
    .slice(0, 10000); // Limit length
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '')
    .slice(0, 254); // Email max length
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(phone: string): string {
  return phone
    .trim()
    .replace(/[^\d+\-() ]/g, '')
    .slice(0, 20);
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Invalid protocol');
    }
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]) as T[Extract<keyof T, string>];
    }
  }
  
  return sanitized;
}

