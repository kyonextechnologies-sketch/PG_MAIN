/**
 * Security System
 * 
 * Industry-level security with input sanitization, XSS protection,
 * CSRF protection, and security headers
 */

import { logger, logSecurity } from './logger';
import { CustomError, ErrorCode } from './errors';

export interface SecurityConfig {
  enableXSSProtection: boolean;
  enableCSRFProtection: boolean;
  enableContentSecurityPolicy: boolean;
  enableRateLimiting: boolean;
  maxRequestSize: number;
  allowedFileTypes: string[];
  maxFileSize: number;
}

export interface SecurityEvent {
  type: 'xss_attempt' | 'csrf_attempt' | 'rate_limit_exceeded' | 'suspicious_activity';
  details: Record<string, any>;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}

class SecurityManager {
  private static instance: SecurityManager;
  private config: SecurityConfig;
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private securityEvents: SecurityEvent[] = [];

  private constructor() {
    this.config = {
      enableXSSProtection: true,
      enableCSRFProtection: true,
      enableContentSecurityPolicy: true,
      enableRateLimiting: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      maxFileSize: 5 * 1024 * 1024, // 5MB
    };
  }

  public static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  /**
   * Sanitize input to prevent XSS attacks
   */
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  /**
   * Sanitize string input
   */
  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/script/gi, '') // Remove script tags
      .replace(/iframe/gi, '') // Remove iframe tags
      .replace(/object/gi, '') // Remove object tags
      .replace(/embed/gi, '') // Remove embed tags
      .replace(/link/gi, '') // Remove link tags
      .replace(/meta/gi, '') // Remove meta tags
      .trim();
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File, userId?: string): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.config.maxFileSize) {
      this.logSecurityEvent('suspicious_activity', {
        reason: 'file_size_exceeded',
        fileSize: file.size,
        maxSize: this.config.maxFileSize,
        userId,
      });
      return { isValid: false, error: 'File size exceeds maximum allowed size' };
    }

    // Check file type
    if (!this.config.allowedFileTypes.includes(file.type)) {
      this.logSecurityEvent('suspicious_activity', {
        reason: 'invalid_file_type',
        fileType: file.type,
        allowedTypes: this.config.allowedFileTypes,
        userId,
      });
      return { isValid: false, error: 'File type not allowed' };
    }

    // Check file name for suspicious patterns
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|pif|scr|vbs|js)$/i,
      /\.(php|asp|jsp|py|rb|pl)$/i,
      /\.(sh|bash|zsh|fish)$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      this.logSecurityEvent('suspicious_activity', {
        reason: 'suspicious_file_name',
        fileName: file.name,
        userId,
      });
      return { isValid: false, error: 'File name contains suspicious patterns' };
    }

    return { isValid: true };
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(identifier: string, limit: number = 100, windowMs: number = 60000): boolean {
    if (!this.config.enableRateLimiting) return true;

    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    const current = this.rateLimitMap.get(key);

    if (!current) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (now > current.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (current.count >= limit) {
      this.logSecurityEvent('rate_limit_exceeded', {
        identifier,
        count: current.count,
        limit,
        windowMs,
      });
      return false;
    }

    current.count++;
    return true;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   */
  validateCSRFToken(token: string, sessionToken: string): boolean {
    if (!this.config.enableCSRFProtection) return true;

    if (!token || !sessionToken) {
      this.logSecurityEvent('csrf_attempt', {
        reason: 'missing_token',
        hasToken: !!token,
        hasSessionToken: !!sessionToken,
      });
      return false;
    }

    if (token !== sessionToken) {
      this.logSecurityEvent('csrf_attempt', {
        reason: 'token_mismatch',
      });
      return false;
    }

    return true;
  }

  /**
   * Validate request headers
   */
  validateHeaders(headers: Record<string, string>): { isValid: boolean; violations: string[] } {
    const violations: string[] = [];

    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-cluster-client-ip',
    ];

    for (const header of suspiciousHeaders) {
      if (headers[header] && !this.isValidIP(headers[header])) {
        violations.push(`Suspicious ${header} header: ${headers[header]}`);
      }
    }

    // Check for XSS attempts in headers
    for (const [key, value] of Object.entries(headers)) {
      if (this.containsXSS(value)) {
        violations.push(`XSS attempt in ${key} header`);
        this.logSecurityEvent('xss_attempt', {
          location: 'header',
          header: key,
          value: value.substring(0, 100), // Truncate for logging
        });
      }
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  /**
   * Check if string contains XSS patterns
   */
  private containsXSS(str: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(str));
  }

  /**
   * Validate IP address
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Log security event
   */
  private logSecurityEvent(type: SecurityEvent['type'], details: Record<string, any>): void {
    const event: SecurityEvent = {
      type,
      details,
      timestamp: new Date().toISOString(),
      ip: typeof window !== 'undefined' ? window.location.hostname : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    };

    this.securityEvents.push(event);
    logSecurity(`Security event: ${type}`, { action: 'security_event' }, details);

    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
  }

  /**
   * Get security events
   */
  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit);
  }

  /**
   * Clear security events
   */
  clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  /**
   * Get security headers for responses
   */
  getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.enableXSSProtection) {
      headers['X-XSS-Protection'] = '1; mode=block';
    }

    if (this.config.enableContentSecurityPolicy) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ');
    }

    headers['X-Frame-Options'] = 'DENY';
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

    return headers;
  }

  /**
   * Hash sensitive data
   */
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate secure random string
   */
  generateSecureRandom(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}

// Export singleton instance
export const securityManager = SecurityManager.getInstance();

// Security middleware for API routes (Next.js compatible)
export const securityMiddleware = (req: Request) => {
  // Validate headers
  const headerValidation = securityManager.validateHeaders(req.headers as any);
  if (!headerValidation.isValid) {
    logSecurity('Invalid headers detected', { action: 'security_middleware' }, {
      violations: headerValidation.violations,
    });
    return new Response(JSON.stringify({ error: 'Invalid request headers' }), { 
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Check rate limiting
  const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  if (!securityManager.checkRateLimit(clientIP)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return null; // No error, continue processing
};

// Input sanitization helper
export const sanitizeInput = (data: any) => {
  return securityManager.sanitizeInput(data);
};
