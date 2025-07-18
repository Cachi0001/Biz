/**
 * Optimized API service with caching, request deduplication, and performance improvements
 * Implements requirement 11.4 for debounced API calls and performance optimization
 */

import { getCustomers as getCustomersOriginal, getProducts as getProductsOriginal } from './api';

/**
 * API cache with TTL (Time To Live) support
 */
class ApiCache {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }
  
  /**
   * Get cached data if still valid
   */
  get(key, ttl = 5 * 60 * 1000) { // Default 5 minutes TTL
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }
  
  /**
   * Set cached data with timestamp
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  /**
   * Clear specific cache entry or all cache
   */
  clear(key) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * Get pending request if exists
   */
  getPendingRequest(key) {
    return this.pendingRequests.get(key);
  }
  
  /**
   * Set pending request
   */
  setPendingRequest(key, promise) {
    this.pendingRequests.set(key, promise);
  }
  
  /**
   * Clear pending request
   */
  clearPendingRequest(key) {
    this.pendingRequests.delete(key);
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      cacheKeys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const apiCache = new ApiCache();

/**
 * Generic optimized API loader with caching and deduplication
 */
const createOptimizedApiLoader = (apiFunction, cacheKey, ttl = 5 * 60 * 1000) => {
  return async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey, ttl);
      if (cached) {
        console.log(`[PERF] Cache hit for ${cacheKey}`);
        return cached;
      }
    }
    
    // Check if request is already pending
    const pendingRequest = apiCache.getPendingRequest(cacheKey);
    if (pendingRequest) {
      console.log(`[PERF] Deduplicating request for ${cacheKey}`);
      return pendingRequest;
    }
    
    // Create new request with performance monitoring
    const startTime = Date.now();
    const request = apiFunction()
      .then(data => {
        const duration = Date.now() - startTime;
        console.log(`[PERF] API call ${cacheKey} completed in ${duration}ms`);
        
        // Cache the result
        apiCache.set(cacheKey, data);
        
        // Clear pending request
        apiCache.clearPendingRequest(cacheKey);
        
        return data;
      })
      .catch(error => {
        const duration = Date.now() - startTime;
        console.error(`[PERF] API call ${cacheKey} failed after ${duration}ms:`, error);
        
        // Clear pending request on error
        apiCache.clearPendingRequest(cacheKey);
        
        throw error;
      });
    
    // Store pending request to prevent duplicates
    apiCache.setPendingRequest(cacheKey, request);
    
    return request;
  };
};

/**
 * Optimized customer loading with caching and deduplication
 */
export const getCustomersOptimized = createOptimizedApiLoader(
  getCustomersOriginal,
  'customers',
  5 * 60 * 1000 // 5 minutes cache
);

/**
 * Optimized product loading with caching and deduplication
 */
export const getProductsOptimized = createOptimizedApiLoader(
  getProductsOriginal,
  'products',
  5 * 60 * 1000 // 5 minutes cache
);

/**
 * Preload data in the background for better UX
 */
export const preloadApiData = async () => {
  try {
    console.log('[PERF] Preloading API data...');
    
    // Preload customers and products in parallel
    const preloadPromises = [
      getCustomersOptimized().catch(error => {
        console.warn('[PERF] Preload customers failed:', error);
      }),
      getProductsOptimized().catch(error => {
        console.warn('[PERF] Preload products failed:', error);
      })
    ];
    
    await Promise.allSettled(preloadPromises);
    console.log('[PERF] API data preloading completed');
  } catch (error) {
    console.warn('[PERF] API data preloading failed:', error);
  }
};

/**
 * Batch API loader for multiple resources
 */
export const loadApiDataBatch = async (resources = ['customers', 'products'], forceRefresh = false) => {
  const loaders = {
    customers: () => getCustomersOptimized(forceRefresh),
    products: () => getProductsOptimized(forceRefresh)
  };
  
  const startTime = Date.now();
  
  try {
    const promises = resources.map(resource => {
      const loader = loaders[resource];
      if (!loader) {
        console.warn(`[PERF] Unknown resource: ${resource}`);
        return Promise.resolve(null);
      }
      return loader();
    });
    
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - startTime;
    
    console.log(`[PERF] Batch loaded ${resources.length} resources in ${duration}ms`);
    
    // Process results
    const data = {};
    resources.forEach((resource, index) => {
      const result = results[index];
      if (result.status === 'fulfilled') {
        data[resource] = result.value;
      } else {
        console.error(`[PERF] Failed to load ${resource}:`, result.reason);
        data[resource] = [];
      }
    });
    
    return data;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PERF] Batch loading failed after ${duration}ms:`, error);
    throw error;
  }
};

/**
 * Smart cache invalidation based on user actions
 */
export const invalidateCache = (resource) => {
  switch (resource) {
    case 'customers':
      apiCache.clear('customers');
      console.log('[PERF] Customers cache invalidated');
      break;
    case 'products':
      apiCache.clear('products');
      console.log('[PERF] Products cache invalidated');
      break;
    case 'all':
      apiCache.clear();
      console.log('[PERF] All cache invalidated');
      break;
    default:
      console.warn(`[PERF] Unknown cache resource: ${resource}`);
  }
};

/**
 * Cache warming strategy - preload data when user is likely to need it
 */
export const warmCache = async () => {
  // Warm cache during idle time
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      preloadApiData();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      preloadApiData();
    }, 100);
  }
};

/**
 * Performance monitoring and cache statistics
 */
export const getPerformanceStats = () => {
  return {
    cache: apiCache.getStats(),
    timestamp: Date.now()
  };
};

/**
 * Optimized search functionality with debouncing
 */
export const createOptimizedSearch = (data, searchFields, delay = 300) => {
  let timeoutId;
  
  return (searchTerm, callback) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(() => {
      const startTime = Date.now();
      
      if (!searchTerm.trim()) {
        callback(data);
        return;
      }
      
      const filtered = data.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
      
      const duration = Date.now() - startTime;
      console.log(`[PERF] Search completed in ${duration}ms, ${filtered.length}/${data.length} results`);
      
      callback(filtered);
    }, delay);
  };
};

/**
 * Memory management - periodic cache cleanup
 */
export const startCacheCleanup = (interval = 10 * 60 * 1000) => { // 10 minutes
  return setInterval(() => {
    const stats = apiCache.getStats();
    console.log(`[PERF] Cache cleanup - ${stats.cacheSize} entries, ${stats.pendingRequests} pending`);
    
    // Clear old cache entries (older than 30 minutes)
    const maxAge = 30 * 60 * 1000;
    const now = Date.now();
    
    for (const [key, value] of apiCache.cache.entries()) {
      if (now - value.timestamp > maxAge) {
        apiCache.cache.delete(key);
        console.log(`[PERF] Cleaned up old cache entry: ${key}`);
      }
    }
  }, interval);
};

// Export cache instance for advanced usage
export { apiCache };