/**
 * CacheManager Service
 * Manages local data caching using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CachedData } from '../types/common';

const CACHE_PREFIX = '@cloudflare_analytics:';
const DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  /**
   * Save data to cache with optional TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttl Time to live in milliseconds (default: 7 days)
   */
  async saveData<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(key);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      
      const serialized = JSON.stringify(entry);
      await AsyncStorage.setItem(cacheKey, serialized);
    } catch (error) {
      console.error('CacheManager: Failed to save data', error);
      throw new Error('Failed to save data to cache');
    }
  }

  /**
   * Get data from cache
   * @param key Cache key
   * @returns Cached data with metadata or null if not found/expired
   */
  async getData<T>(key: string): Promise<CachedData<T> | null> {
    try {
      const cacheKey = this.getCacheKey(key);
      const serialized = await AsyncStorage.getItem(cacheKey);
      
      if (!serialized) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);
      const now = Date.now();
      const age = now - entry.timestamp;
      const isExpired = age > entry.ttl;

      if (isExpired) {
        // Clean up expired cache
        await this.clearCache(key);
        return null;
      }

      return {
        data: entry.data,
        timestamp: new Date(entry.timestamp),
        isStale: false,
      };
    } catch (error) {
      console.error('CacheManager: Failed to get data', error);
      return null;
    }
  }

  /**
   * Check if cache is valid (exists and not expired)
   * @param key Cache key
   * @returns True if cache is valid
   */
  async isCacheValid(key: string): Promise<boolean> {
    const data = await this.getData(key);
    return data !== null;
  }

  /**
   * Clear cache for a specific key or all cache
   * @param key Optional cache key. If not provided, clears all cache
   */
  async clearCache(key?: string): Promise<void> {
    try {
      if (key) {
        const cacheKey = this.getCacheKey(key);
        await AsyncStorage.removeItem(cacheKey);
      } else {
        // Clear all cache with our prefix
        const allKeys = await AsyncStorage.getAllKeys();
        const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('CacheManager: Failed to clear cache', error);
      throw new Error('Failed to clear cache');
    }
  }

  /**
   * Get total cache size in bytes
   * @returns Cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(k => k.startsWith(CACHE_PREFIX));
      
      if (cacheKeys.length === 0) {
        return 0;
      }

      const entries = await AsyncStorage.multiGet(cacheKeys);
      let totalSize = 0;

      for (const [key, value] of entries) {
        if (value) {
          // Calculate size: key length + value length in bytes
          totalSize += key.length + value.length;
        }
      }

      return totalSize;
    } catch (error) {
      console.error('CacheManager: Failed to get cache size', error);
      return 0;
    }
  }

  /**
   * Get cache key with prefix
   * @param key Original key
   * @returns Prefixed cache key
   */
  private getCacheKey(key: string): string {
    return `${CACHE_PREFIX}${key}`;
  }
}

// Export singleton instance
export default new CacheManager();
