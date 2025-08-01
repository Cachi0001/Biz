/**
 * Frontend Analytics Cache Service
 * Provides client-side caching for analytics data to improve performance
 */

class FrontendAnalyticsCacheService {
  constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    
    // Cache TTL settings (in milliseconds)
    this.TTL_SETTINGS = {
      'daily': 5 * 60 * 1000,    // 5 minutes for daily data
      'weekly': 15 * 60 * 1000,  // 15 minutes for weekly data
      'monthly': 30 * 60 * 1000, // 30 minutes for monthly data
      'yearly': 60 * 60 * 1000   // 1 hour for yearly data
    };
    
    // Maximum cache size to prevent memory issues
    this.MAX_CACHE_SIZE = 50;
    
    // Start periodic cleanup
    this.startCleanupInterval();
  }

  /**
   * Generate cache key for analytics data
   */
  getCacheKey(userId, analyticsType, timePeriod, additionalParams = {}) {
    const keyData = {
      userId,
      type: analyticsType,
      period: timePeriod,
      ...additionalParams
    };
    return JSON.stringify(keyData);
  }

  /**
   * Get cached data if it exists and is not expired
   */
  getCachedData(cacheKey) {
    try {
      if (!this.cache.has(cacheKey)) {
        return null;
      }

      const timestamp = this.cacheTimestamps.get(cacheKey);
      const now = Date.now();
      
      // Extract time period from cache key to determine TTL
      const keyData = JSON.parse(cacheKey);
      const ttl = this.TTL_SETTINGS[keyData.period] || this.TTL_SETTINGS.monthly;
      
      if (now - timestamp > ttl) {
        // Cache expired
        this.cache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
        return null;
      }

      const cachedData = this.cache.get(cacheKey);
      console.log(`[Analytics Cache] Cache hit for: ${keyData.type} (${keyData.period})`);
      return cachedData;
      
    } catch (error) {
      console.error('[Analytics Cache] Error retrieving cached data:', error);
      return null;
    }
  }

  /**
   * Store data in cache
   */
  setCachedData(cacheKey, data, timePeriod) {
    try {
      // Check cache size and clean up if necessary
      if (this.cache.size >= this.MAX_CACHE_SIZE) {
        this.cleanupOldestEntries(10); // Remove 10 oldest entries
      }

      this.cache.set(cacheKey, data);
      this.cacheTimestamps.set(cacheKey, Date.now());
      
      const keyData = JSON.parse(cacheKey);
      console.log(`[Analytics Cache] Data cached: ${keyData.type} (${keyData.period})`);
      return true;
      
    } catch (error) {
      console.error('[Analytics Cache] Error caching data:', error);
      return false;
    }
  }

  /**
   * Invalidate cache for specific user
   */
  invalidateUserCache(userId) {
    try {
      let removedCount = 0;
      
      for (const [cacheKey] of this.cache) {
        try {
          const keyData = JSON.parse(cacheKey);
          if (keyData.userId === userId) {
            this.cache.delete(cacheKey);
            this.cacheTimestamps.delete(cacheKey);
            removedCount++;
          }
        } catch (error) {
          // Invalid cache key format, remove it
          this.cache.delete(cacheKey);
          this.cacheTimestamps.delete(cacheKey);
          removedCount++;
        }
      }
      
      console.log(`[Analytics Cache] Invalidated ${removedCount} entries for user ${userId}`);
      return removedCount;
      
    } catch (error) {
      console.error('[Analytics Cache] Error invalidating user cache:', error);
      return 0;
    }
  }

  /**
   * Clear all expired cache entries
   */
  clearExpiredCache() {
    try {
      const now = Date.now();
      let removedCount = 0;
      
      for (const [cacheKey, timestamp] of this.cacheTimestamps) {
        try {
          const keyData = JSON.parse(cacheKey);
          const ttl = this.TTL_SETTINGS[keyData.period] || this.TTL_SETTINGS.monthly;
          
          if (now - timestamp > ttl) {
            this.cache.delete(cacheKey);
            this.cacheTimestamps.delete(cacheKey);
            removedCount++;
          }
        } catch (error) {
          // Invalid cache key, remove it
          this.cache.delete(cacheKey);
          this.cacheTimestamps.delete(cacheKey);
          removedCount++;
        }
      }
      
      if (removedCount > 0) {
        console.log(`[Analytics Cache] Cleared ${removedCount} expired entries`);
      }
      
      return removedCount;
      
    } catch (error) {
      console.error('[Analytics Cache] Error clearing expired cache:', error);
      return 0;
    }
  }

  /**
   * Remove oldest cache entries
   */
  cleanupOldestEntries(count) {
    try {
      // Convert to array and sort by timestamp
      const entries = Array.from(this.cacheTimestamps.entries())
        .sort((a, b) => a[1] - b[1]) // Sort by timestamp (oldest first)
        .slice(0, count); // Take the oldest entries
      
      for (const [cacheKey] of entries) {
        this.cache.delete(cacheKey);
        this.cacheTimestamps.delete(cacheKey);
      }
      
      console.log(`[Analytics Cache] Cleaned up ${entries.length} oldest entries`);
      return entries.length;
      
    } catch (error) {
      console.error('[Analytics Cache] Error cleaning up oldest entries:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    try {
      const now = Date.now();
      let expiredCount = 0;
      
      for (const [cacheKey, timestamp] of this.cacheTimestamps) {
        try {
          const keyData = JSON.parse(cacheKey);
          const ttl = this.TTL_SETTINGS[keyData.period] || this.TTL_SETTINGS.monthly;
          
          if (now - timestamp > ttl) {
            expiredCount++;
          }
        } catch (error) {
          expiredCount++;
        }
      }
      
      return {
        totalEntries: this.cache.size,
        activeEntries: this.cache.size - expiredCount,
        expiredEntries: expiredCount,
        maxCacheSize: this.MAX_CACHE_SIZE,
        cacheUtilization: (this.cache.size / this.MAX_CACHE_SIZE * 100).toFixed(1) + '%'
      };
      
    } catch (error) {
      console.error('[Analytics Cache] Error getting cache stats:', error);
      return {
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        error: error.message
      };
    }
  }

  /**
   * Clear all cache
   */
  clearAllCache() {
    try {
      const clearedCount = this.cache.size;
      this.cache.clear();
      this.cacheTimestamps.clear();
      
      console.log(`[Analytics Cache] Cleared all cache (${clearedCount} entries)`);
      return clearedCount;
      
    } catch (error) {
      console.error('[Analytics Cache] Error clearing all cache:', error);
      return 0;
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  startCleanupInterval() {
    // Clean up expired entries every 10 minutes
    setInterval(() => {
      this.clearExpiredCache();
    }, 10 * 60 * 1000);
    
    console.log('[Analytics Cache] Started periodic cleanup interval');
  }

  /**
   * Preload analytics data for better user experience
   */
  async preloadAnalyticsData(userId, currentPeriod, apiCall) {
    try {
      const periods = ['daily', 'weekly', 'monthly', 'yearly'];
      const otherPeriods = periods.filter(p => p !== currentPeriod);
      
      // Preload data for other time periods in the background
      for (const period of otherPeriods.slice(0, 2)) { // Only preload 2 other periods
        const cacheKey = this.getCacheKey(userId, 'business_analytics', period);
        
        if (!this.getCachedData(cacheKey)) {
          try {
            // Make API call in background
            setTimeout(async () => {
              try {
                const data = await apiCall(period);
                this.setCachedData(cacheKey, data, period);
              } catch (error) {
                console.warn(`[Analytics Cache] Preload failed for ${period}:`, error);
              }
            }, 1000); // Delay to not interfere with current request
          } catch (error) {
            console.warn(`[Analytics Cache] Preload setup failed for ${period}:`, error);
          }
        }
      }
      
    } catch (error) {
      console.error('[Analytics Cache] Error in preload setup:', error);
    }
  }
}

// Create and export singleton instance
const frontendAnalyticsCache = new FrontendAnalyticsCacheService();

export default frontendAnalyticsCache;