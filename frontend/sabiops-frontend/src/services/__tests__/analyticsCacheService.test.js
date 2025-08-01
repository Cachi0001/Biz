/**
 * Unit tests for Analytics Cache Service
 * Tests the frontend caching functionality for analytics data
 */

import { jest } from '@jest/globals';
import frontendAnalyticsCache from '../analyticsCacheService';

describe('Frontend Analytics Cache Service', () => {
  beforeEach(() => {
    // Clear cache before each test
    frontendAnalyticsCache.clearAllCache();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    frontendAnalyticsCache.clearAllCache();
  });

  describe('Cache Key Generation', () => {
    test('generates consistent cache keys', () => {
      const key1 = frontendAnalyticsCache.getCacheKey('user123', 'revenue', 'monthly');
      const key2 = frontendAnalyticsCache.getCacheKey('user123', 'revenue', 'monthly');
      
      expect(key1).toBe(key2);
      expect(typeof key1).toBe('string');
    });

    test('generates different keys for different parameters', () => {
      const key1 = frontendAnalyticsCache.getCacheKey('user123', 'revenue', 'monthly');
      const key2 = frontendAnalyticsCache.getCacheKey('user123', 'revenue', 'weekly');
      const key3 = frontendAnalyticsCache.getCacheKey('user456', 'revenue', 'monthly');
      
      expect(key1).not.toBe(key2);
      expect(key1).not.toBe(key3);
      expect(key2).not.toBe(key3);
    });

    test('includes additional parameters in cache key', () => {
      const key1 = frontendAnalyticsCache.getCacheKey('user123', 'revenue', 'monthly');
      const key2 = frontendAnalyticsCache.getCacheKey('user123', 'revenue', 'monthly', { filter: 'active' });
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('Cache Storage and Retrieval', () => {
    test('stores and retrieves data successfully', () => {
      const testData = { revenue: 10000, customers: 50 };
      const cacheKey = frontendAnalyticsCache.getCacheKey('user123', 'analytics', 'monthly');
      
      const stored = frontendAnalyticsCache.setCachedData(cacheKey, testData, 'monthly');
      expect(stored).toBe(true);
      
      const retrieved = frontendAnalyticsCache.getCachedData(cacheKey);
      expect(retrieved).toEqual(testData);
    });

    test('returns null for non-existent cache key', () => {
      const nonExistentKey = 'non-existent-key';
      const retrieved = frontendAnalyticsCache.getCachedData(nonExistentKey);
      
      expect(retrieved).toBeNull();
    });

    test('handles cache expiration correctly', (done) => {
      const testData = { revenue: 10000 };
      const cacheKey = frontendAnalyticsCache.getCacheKey('user123', 'analytics', 'daily');
      
      // Mock TTL to be very short for testing
      const originalTTL = frontendAnalyticsCache.TTL_SETTINGS.daily;
      frontendAnalyticsCache.TTL_SETTINGS.daily = 10; // 10ms
      
      frontendAnalyticsCache.setCachedData(cacheKey, testData, 'daily');
      
      // Should be available immediately
      expect(frontendAnalyticsCache.getCachedData(cacheKey)).toEqual(testData);
      
      // Should expire after TTL
      setTimeout(() => {
        expect(frontendAnalyticsCache.getCachedData(cacheKey)).toBeNull();
        
        // Restore original TTL
        frontendAnalyticsCache.TTL_SETTINGS.daily = originalTTL;
        done();
      }, 15);
    });
  });

  describe('Cache Management', () => {
    test('invalidates user cache correctly', () => {
      const user1Data = { revenue: 10000 };
      const user2Data = { revenue: 20000 };
      
      const user1Key = frontendAnalyticsCache.getCacheKey('user1', 'analytics', 'monthly');
      const user2Key = frontendAnalyticsCache.getCacheKey('user2', 'analytics', 'monthly');
      
      frontendAnalyticsCache.setCachedData(user1Key, user1Data, 'monthly');
      frontendAnalyticsCache.setCachedData(user2Key, user2Data, 'monthly');
      
      // Both should be cached
      expect(frontendAnalyticsCache.getCachedData(user1Key)).toEqual(user1Data);
      expect(frontendAnalyticsCache.getCachedData(user2Key)).toEqual(user2Data);
      
      // Invalidate user1 cache
      const removedCount = frontendAnalyticsCache.invalidateUserCache('user1');
      expect(removedCount).toBe(1);
      
      // User1 cache should be gone, user2 should remain
      expect(frontendAnalyticsCache.getCachedData(user1Key)).toBeNull();
      expect(frontendAnalyticsCache.getCachedData(user2Key)).toEqual(user2Data);
    });

    test('clears all cache correctly', () => {
      const testData1 = { revenue: 10000 };
      const testData2 = { customers: 50 };
      
      const key1 = frontendAnalyticsCache.getCacheKey('user1', 'analytics', 'monthly');
      const key2 = frontendAnalyticsCache.getCacheKey('user2', 'analytics', 'weekly');
      
      frontendAnalyticsCache.setCachedData(key1, testData1, 'monthly');
      frontendAnalyticsCache.setCachedData(key2, testData2, 'weekly');
      
      const clearedCount = frontendAnalyticsCache.clearAllCache();
      expect(clearedCount).toBe(2);
      
      expect(frontendAnalyticsCache.getCachedData(key1)).toBeNull();
      expect(frontendAnalyticsCache.getCachedData(key2)).toBeNull();
    });

    test('handles cache size limits', () => {
      const originalMaxSize = frontendAnalyticsCache.MAX_CACHE_SIZE;
      frontendAnalyticsCache.MAX_CACHE_SIZE = 3; // Set small limit for testing
      
      // Add items up to the limit
      for (let i = 0; i < 5; i++) {
        const key = frontendAnalyticsCache.getCacheKey(`user${i}`, 'analytics', 'monthly');
        frontendAnalyticsCache.setCachedData(key, { data: i }, 'monthly');
      }
      
      const stats = frontendAnalyticsCache.getCacheStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(frontendAnalyticsCache.MAX_CACHE_SIZE);
      
      // Restore original max size
      frontendAnalyticsCache.MAX_CACHE_SIZE = originalMaxSize;
    });
  });

  describe('Cache Statistics', () => {
    test('provides accurate cache statistics', () => {
      const testData = { revenue: 10000 };
      
      // Add some cache entries
      for (let i = 0; i < 3; i++) {
        const key = frontendAnalyticsCache.getCacheKey(`user${i}`, 'analytics', 'monthly');
        frontendAnalyticsCache.setCachedData(key, testData, 'monthly');
      }
      
      const stats = frontendAnalyticsCache.getCacheStats();
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.activeEntries).toBe(3);
      expect(stats.expiredEntries).toBe(0);
      expect(typeof stats.cacheUtilization).toBe('string');
      expect(stats.cacheUtilization).toMatch(/\d+\.\d+%/);
    });

    test('handles statistics calculation errors gracefully', () => {
      // Force an error by corrupting internal state
      const originalCache = frontendAnalyticsCache.cache;
      frontendAnalyticsCache.cache = null;
      
      const stats = frontendAnalyticsCache.getCacheStats();
      
      expect(stats.totalEntries).toBe(0);
      expect(stats.activeEntries).toBe(0);
      expect(stats.expiredEntries).toBe(0);
      expect(stats.error).toBeDefined();
      
      // Restore original cache
      frontendAnalyticsCache.cache = originalCache;
    });
  });

  describe('Expired Cache Cleanup', () => {
    test('clears expired entries correctly', (done) => {
      const testData = { revenue: 10000 };
      
      // Mock TTL to be very short
      const originalTTL = frontendAnalyticsCache.TTL_SETTINGS.daily;
      frontendAnalyticsCache.TTL_SETTINGS.daily = 10; // 10ms
      
      const expiredKey = frontendAnalyticsCache.getCacheKey('user1', 'analytics', 'daily');
      const validKey = frontendAnalyticsCache.getCacheKey('user2', 'analytics', 'monthly');
      
      frontendAnalyticsCache.setCachedData(expiredKey, testData, 'daily');
      frontendAnalyticsCache.setCachedData(validKey, testData, 'monthly');
      
      setTimeout(() => {
        const clearedCount = frontendAnalyticsCache.clearExpiredCache();
        expect(clearedCount).toBe(1);
        
        expect(frontendAnalyticsCache.getCachedData(expiredKey)).toBeNull();
        expect(frontendAnalyticsCache.getCachedData(validKey)).toEqual(testData);
        
        // Restore original TTL
        frontendAnalyticsCache.TTL_SETTINGS.daily = originalTTL;
        done();
      }, 15);
    });

    test('handles cleanup of corrupted cache keys', () => {
      const testData = { revenue: 10000 };
      const validKey = frontendAnalyticsCache.getCacheKey('user1', 'analytics', 'monthly');
      
      frontendAnalyticsCache.setCachedData(validKey, testData, 'monthly');
      
      // Add corrupted cache key directly
      frontendAnalyticsCache.cache.set('invalid-json-key', testData);
      frontendAnalyticsCache.cacheTimestamps.set('invalid-json-key', Date.now());
      
      const clearedCount = frontendAnalyticsCache.clearExpiredCache();
      expect(clearedCount).toBe(1); // Should clean up the corrupted key
      
      // Valid key should remain
      expect(frontendAnalyticsCache.getCachedData(validKey)).toEqual(testData);
    });
  });

  describe('Preload Functionality', () => {
    test('preloads analytics data for other periods', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' });
      
      await frontendAnalyticsCache.preloadAnalyticsData('user123', 'monthly', mockApiCall);
      
      // Should be called for other periods (not monthly)
      // Wait a bit for the setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(mockApiCall).toHaveBeenCalled();
      expect(mockApiCall).not.toHaveBeenCalledWith('monthly');
    });

    test('handles preload errors gracefully', async () => {
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));
      
      // Should not throw error
      await expect(
        frontendAnalyticsCache.preloadAnalyticsData('user123', 'monthly', mockApiCall)
      ).resolves.toBeUndefined();
    });

    test('skips preload for already cached data', async () => {
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' });
      
      // Pre-cache data for weekly period
      const weeklyKey = frontendAnalyticsCache.getCacheKey('user123', 'business_analytics', 'weekly');
      frontendAnalyticsCache.setCachedData(weeklyKey, { data: 'cached' }, 'weekly');
      
      await frontendAnalyticsCache.preloadAnalyticsData('user123', 'monthly', mockApiCall);
      
      // Wait for preload attempts
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Should not call API for weekly since it's already cached
      expect(mockApiCall).not.toHaveBeenCalledWith('weekly');
    });
  });

  describe('Error Handling', () => {
    test('handles cache storage errors gracefully', () => {
      // Force an error by making cache read-only
      const originalSet = frontendAnalyticsCache.cache.set;
      frontendAnalyticsCache.cache.set = jest.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });
      
      const result = frontendAnalyticsCache.setCachedData('test-key', { data: 'test' }, 'monthly');
      expect(result).toBe(false);
      
      // Restore original method
      frontendAnalyticsCache.cache.set = originalSet;
    });

    test('handles cache retrieval errors gracefully', () => {
      // Force an error by corrupting cache
      const originalGet = frontendAnalyticsCache.cache.get;
      frontendAnalyticsCache.cache.get = jest.fn().mockImplementation(() => {
        throw new Error('Retrieval error');
      });
      
      const result = frontendAnalyticsCache.getCachedData('test-key');
      expect(result).toBeNull();
      
      // Restore original method
      frontendAnalyticsCache.cache.get = originalGet;
    });

    test('handles invalidation errors gracefully', () => {
      // Force an error during invalidation
      const originalDelete = frontendAnalyticsCache.cache.delete;
      frontendAnalyticsCache.cache.delete = jest.fn().mockImplementation(() => {
        throw new Error('Delete error');
      });
      
      const result = frontendAnalyticsCache.invalidateUserCache('user123');
      expect(result).toBe(0);
      
      // Restore original method
      frontendAnalyticsCache.cache.delete = originalDelete;
    });
  });

  describe('TTL Settings', () => {
    test('uses correct TTL for different periods', () => {
      const dailyTTL = frontendAnalyticsCache.TTL_SETTINGS.daily;
      const weeklyTTL = frontendAnalyticsCache.TTL_SETTINGS.weekly;
      const monthlyTTL = frontendAnalyticsCache.TTL_SETTINGS.monthly;
      const yearlyTTL = frontendAnalyticsCache.TTL_SETTINGS.yearly;
      
      expect(dailyTTL).toBeLessThan(weeklyTTL);
      expect(weeklyTTL).toBeLessThan(monthlyTTL);
      expect(monthlyTTL).toBeLessThan(yearlyTTL);
      
      // Verify they are reasonable values (in milliseconds)
      expect(dailyTTL).toBeGreaterThan(0);
      expect(yearlyTTL).toBeLessThan(24 * 60 * 60 * 1000); // Less than 24 hours
    });
  });
});