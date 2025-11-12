/**
 * Client-side rate limiting utilities
 * Prevents excessive API calls and improves performance
 */

interface RateLimitOptions {
  maxCalls: number;
  windowMs: number;
}

class RateLimiter {
  private calls: Map<string, number[]> = new Map();

  /**
   * Check if a call is allowed
   */
  isAllowed(key: string, options: RateLimitOptions): boolean {
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Get or create call history for this key
    let callHistory = this.calls.get(key) || [];
    
    // Filter out calls outside the time window
    callHistory = callHistory.filter(timestamp => timestamp > windowStart);
    
    // Check if we've exceeded the limit
    if (callHistory.length >= options.maxCalls) {
      return false;
    }
    
    // Record this call
    callHistory.push(now);
    this.calls.set(key, callHistory);
    
    return true;
  }

  /**
   * Get time until next allowed call
   */
  getTimeUntilNext(key: string, options: RateLimitOptions): number {
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    const callHistory = this.calls.get(key) || [];
    const recentCalls = callHistory.filter(timestamp => timestamp > windowStart);
    
    if (recentCalls.length < options.maxCalls) {
      return 0;
    }
    
    const oldestCall = Math.min(...recentCalls);
    return oldestCall + options.windowMs - now;
  }

  /**
   * Clear rate limit for a key
   */
  clear(key: string): void {
    this.calls.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.calls.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit decorator for functions
 */
export function rateLimit<T extends (...args: any[]) => any>(
  fn: T,
  key: string,
  options: RateLimitOptions
): T {
  return ((...args: Parameters<T>) => {
    if (!rateLimiter.isAllowed(key, options)) {
      const waitTime = rateLimiter.getTimeUntilNext(key, options);
      console.warn(`Rate limit exceeded for ${key}. Wait ${waitTime}ms`);
      throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
    }
    return fn(...args);
  }) as T;
}

/**
 * Default rate limit options
 */
export const defaultRateLimits = {
  apiCall: { maxCalls: 10, windowMs: 60000 }, // 10 calls per minute
  search: { maxCalls: 5, windowMs: 1000 }, // 5 calls per second
  formSubmit: { maxCalls: 3, windowMs: 10000 }, // 3 calls per 10 seconds
};

