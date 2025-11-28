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

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('⚠️  REDIS_URL not set, using in-memory cache');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      this.redis.on('connect', () => {
        console.log('✅ Redis connected');
        this.isRedisAvailable = true;
      });

      this.redis.on('error', (error) => {
        console.warn('⚠️  Redis error, falling back to memory cache:', error.message);
        this.isRedisAvailable = false;
      });

      this.redis.on('close', () => {
        console.warn('⚠️  Redis connection closed, using memory cache');
        this.isRedisAvailable = false;
      });

      // Attempt connection
      this.redis.connect().catch(() => {
        console.warn('⚠️  Redis connection failed, using memory cache');
        this.isRedisAvailable = false;
      });
    } catch (error) {
      console.warn('⚠️  Redis initialization failed, using memory cache:', error);
      this.isRedisAvailable = false;
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
        console.warn('Redis get error, falling back to memory:', error);
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
        console.warn('Redis set error, falling back to memory:', error);
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
        console.warn('Redis delete error, falling back to memory:', error);
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
        console.warn('Redis deletePattern error, falling back to memory:', error);
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
        console.warn('Redis exists error, falling back to memory:', error);
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

