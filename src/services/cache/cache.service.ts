import { Injectable, Logger } from '@nestjs/common';
import { MetricsCacheException } from '../../src/exceptions/metrics.exceptions';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 300000; // 5 minutes in milliseconds

  constructor() {
    // Clean up expired cache entries every 10 minutes
    setInterval(() => this.cleanupExpiredEntries(), 600000);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = this.cache.get(key);
      if (!entry) {
        return null;
      }

      if (this.isExpired(entry)) {
        this.cache.delete(key);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${key}`);
      return entry.data;
    } catch (error) {
      this.logger.error(`Error getting cache entry: ${error.message}`);
      return null;
    }
  }

  async set<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };

      this.cache.set(key, entry);
      this.logger.debug(`Cache set for key: ${key} with TTL: ${ttl}ms`);
    } catch (error) {
      this.logger.error(`Error setting cache entry: ${error.message}`);
      throw new MetricsCacheException(`Failed to set cache: ${error.message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      this.cache.delete(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting cache entry: ${error.message}`);
      throw new MetricsCacheException(`Failed to delete cache: ${error.message}`);
    }
  }

  async clear(): Promise<void> {
    try {
      this.cache.clear();
      this.logger.debug('Cache cleared');
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
      throw new MetricsCacheException(`Failed to clear cache: ${error.message}`);
    }
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  async getTtl(key: string): Promise<number> {
    const entry = this.cache.get(key);
    if (!entry) {
      return 0;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return 0;
    }

    return Math.max(0, entry.ttl - (Date.now() - entry.timestamp));
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.debug(`Cleaned up ${deletedCount} expired cache entries`);
    }
  }

  generateCacheKey(prefix: string, ...params: string[]): string {
    const sanitizedParams = params.map(param => param.replace(/[^a-zA-Z0-9_-]/g, '_'));
    return `${prefix}:${sanitizedParams.join(':')}`;
  }

  getCacheStats(): {
    totalEntries: number;
    memoryUsage: string;
    hitRate?: number;
  } {
    const totalEntries = this.cache.size;
    const memoryUsage = this.calculateMemoryUsage();
    
    return {
      totalEntries,
      memoryUsage,
    };
  }

  private calculateMemoryUsage(): string {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      totalSize += key.length * 2; // Unicode string
      totalSize += JSON.stringify(entry).length * 2;
    }

    if (totalSize < 1024) {
      return `${totalSize} bytes`;
    } else if (totalSize < 1024 * 1024) {
      return `${(totalSize / 1024).toFixed(2)} KB`;
    } else {
      return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
    }
  }
}