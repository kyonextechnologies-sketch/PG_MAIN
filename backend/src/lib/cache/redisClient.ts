/**
 * Redis Cache Client
 * 
 * Provides session caching with Elasticache/Redis support.
 * Falls back to in-memory cache for local development.
 */

import { Redis } from 'ioredis';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheClient {
  private redis: Redis | null = null;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private isRedisAvailable = false;
  private lastErrorLogTime = 0;
  private errorLogInterval = 60000; // Log errors at most once per minute
  private connectionAttempted = false;
  private shouldRetry = true;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      if (process.env.NODE_ENV === 'production') {
        console.log('ℹ️  REDIS_URL not set, using in-memory cache');
      }
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          // Stop retrying after 5 attempts
          if (times > 5) {
            this.shouldRetry = false;
            if (!this.connectionAttempted) {
              this.logErrorOnce('Redis connection failed after 5 retries - using in-memory cache');
              this.connectionAttempted = true;
            }
            return null; // Stop retrying
          }
          const delay = Math.min(times * 100, 2000);
          return delay;
        },
        maxRetriesPerRequest: 1, // Reduce retries per request
        enableReadyCheck: false, // Disable ready check to reduce connection attempts
        lazyConnect: true,
        connectTimeout: 5000, // 5 second timeout
        enableOfflineQueue: false, // Don't queue commands when offline
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected');
        this.isRedisAvailable = true;
        this.shouldRetry = true;
        this.connectionAttempted = false;
      });

      this.redis.on('ready', () => {
        this.isRedisAvailable = true;
        this.shouldRetry = true;
      });

      this.redis.on('error', (error) => {
        this.isRedisAvailable = false;
        // Only log errors occasionally to prevent log spam
        this.logErrorOnce(`Redis error, using memory cache: ${error.message}`);
      });

      this.redis.on('close', () => {
        this.isRedisAvailable = false;
        // Only log close events occasionally
        this.logErrorOnce('Redis connection closed, using memory cache');
      });

      // Attempt connection once
      this.redis.connect().catch(() => {
        this.isRedisAvailable = false;
        this.logErrorOnce('Redis connection failed, using memory cache');
      });
    } catch (error: any) {
      this.isRedisAvailable = false;
      this.logErrorOnce(`Redis initialization failed, using memory cache: ${error.message || error}`);
    }
  }

  /**
   * Log error only once per interval to prevent log spam
   */
  private logErrorOnce(message: string): void {
    const now = Date.now();
    if (now - this.lastErrorLogTime > this.errorLogInterval) {
      console.warn(`⚠️  ${message}`);
      this.lastErrorLogTime = now;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
        return null;
      } catch (error) {
        // Silently fall back to memory cache without logging
        this.isRedisAvailable = false;
      }
    }

    // Fallback to memory cache
    const entry = this.memoryCache.get(key);
    if (!entry) {
      return null;
    }

    // Check expiration
    if (entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        // Silently fall back to memory cache without logging
        this.isRedisAvailable = false;
      }
    }

    // Fallback to memory cache
    this.memoryCache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Clean up expired entries periodically
    if (this.memoryCache.size > 1000) {
      this.cleanupMemoryCache();
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (error) {
        // Silently fall back to memory cache without logging
        this.isRedisAvailable = false;
      }
    }

    this.memoryCache.delete(key);
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return;
      } catch (error) {
        // Silently fall back to memory cache without logging
        this.isRedisAvailable = false;
      }
    }

    // Fallback: delete matching keys from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (this.isRedisAvailable && this.redis) {
      try {
        const result = await this.redis.exists(key);
        return result === 1;
      } catch (error) {
        // Silently fall back to memory cache without logging
        this.isRedisAvailable = false;
      }
    }

    const entry = this.memoryCache.get(key);
    if (!entry) {
      return false;
    }

    if (entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Get Redis connection (for advanced usage)
   */
  getRedis(): Redis | null {
    return this.redis;
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.isRedisAvailable;
  }

  /**
   * Close connections
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    this.memoryCache.clear();
  }
}

// Singleton instance
export const cacheClient = new CacheClient();

// Session cache helpers
export const sessionCache = {
  get: (sessionId: string) => cacheClient.get<{ userId: string; role: string; email: string }>(`session:${sessionId}`),
  set: (sessionId: string, data: { userId: string; role: string; email: string }, ttl: number = 86400) =>
    cacheClient.set(`session:${sessionId}`, data, ttl),
  delete: (sessionId: string) => cacheClient.delete(`session:${sessionId}`),
  deleteAll: (userId: string) => cacheClient.deletePattern(`session:*:${userId}`),
};

