/**
 * Performance Optimization Utilities for SabiOps
 * Implements caching, loading states, pagination, and API optimization
 */

// Cache implementation with TTL (Time To Live)
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.ttlMap = new Map();
  }

  set(key, value, ttlMs = 300000) { // Default 5 minutes
    this.cache.set(key, value);
    this.ttlMap.set(key, Date.now() + ttlMs);
  }

  get(key) {
    const ttl = this.ttlMap.get(key);
    if (!ttl || Date.now() > ttl) {
      this.cache.delete(key);
      this.ttlMap.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
    this.ttlMap.clear();
  }

  delete(key) {
    this.cache.delete(key);
    this.ttlMap.delete(key);
  }

  // Clear expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, ttl] of this.ttlMap.entries()) {
      if (now > ttl) {
        this.cache.delete(key);
        this.ttlMap.delete(key);
      }
    }
  }
}

// Global cache instance
export const apiCache = new CacheManager();

// Cleanup expired cache entries every 5 minutes
setInterval(() => {
  apiCache.cleanup();
}, 300000);

// Request deduplication to prevent multiple identical API calls
class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
  }

  async deduplicate(key, requestFn) {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Cached API wrapper
export const cachedApiCall = async (cacheKey, apiFunction, ttlMs = 300000) => {
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }

  // Deduplicate identical requests
  return requestDeduplicator.deduplicate(cacheKey, async () => {
    console.log(`[CACHE MISS] ${cacheKey} - Fetching from API`);
    const result = await apiFunction();
    apiCache.set(cacheKey, result, ttlMs);
    return result;
  });
};

// Pagination utility
export class PaginationManager {
  constructor(pageSize = 20) {
    this.pageSize = pageSize;
    this.currentPage = 1;
    this.totalItems = 0;
    this.totalPages = 0;
    this.hasNextPage = false;
    this.hasPrevPage = false;
  }

  updatePagination(totalItems, currentPage = 1) {
    this.totalItems = totalItems;
    this.currentPage = currentPage;
    this.totalPages = Math.ceil(totalItems / this.pageSize);
    this.hasNextPage = currentPage < this.totalPages;
    this.hasPrevPage = currentPage > 1;
  }

  getOffset() {
    return (this.currentPage - 1) * this.pageSize;
  }

  getLimit() {
    return this.pageSize;
  }

  nextPage() {
    if (this.hasNextPage) {
      this.currentPage++;
      return true;
    }
    return false;
  }

  prevPage() {
    if (this.hasPrevPage) {
      this.currentPage--;
      return true;
    }
    return false;
  }

  goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      return true;
    }
    return false;
  }

  getPaginationInfo() {
    return {
      currentPage: this.currentPage,
      totalPages: this.totalPages,
      totalItems: this.totalItems,
      pageSize: this.pageSize,
      hasNextPage: this.hasNextPage,
      hasPrevPage: this.hasPrevPage,
      startItem: this.getOffset() + 1,
      endItem: Math.min(this.getOffset() + this.pageSize, this.totalItems)
    };
  }
}

// Loading state manager
export class LoadingStateManager {
  constructor() {
    this.loadingStates = new Map();
    this.listeners = new Set();
  }

  setLoading(key, isLoading) {
    this.loadingStates.set(key, isLoading);
    this.notifyListeners();
  }

  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }

  isAnyLoading() {
    return Array.from(this.loadingStates.values()).some(loading => loading);
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.loadingStates));
  }

  clear() {
    this.loadingStates.clear();
    this.notifyListeners();
  }
}

export const globalLoadingManager = new LoadingStateManager();

// Optimized API call wrapper with loading states
export const optimizedApiCall = async (key, apiFunction, options = {}) => {
  const {
    useCache = true,
    cacheTtl = 300000,
    showLoading = true,
    loadingKey = key
  } = options;

  try {
    if (showLoading) {
      globalLoadingManager.setLoading(loadingKey, true);
    }

    if (useCache) {
      return await cachedApiCall(key, apiFunction, cacheTtl);
    } else {
      return await apiFunction();
    }
  } finally {
    if (showLoading) {
      globalLoadingManager.setLoading(loadingKey, false);
    }
  }
};

// Batch API calls to reduce network requests
export const batchApiCalls = async (calls) => {
  const results = await Promise.allSettled(calls.map(call => call()));
  
  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return { success: true, data: result.value, index };
    } else {
      console.error(`Batch API call ${index} failed:`, result.reason);
      return { success: false, error: result.reason, index };
    }
  });
};

// Debounced search function
export const createDebouncedSearch = (searchFunction, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await searchFunction(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

// Lazy loading utility for components
export const createLazyLoader = (importFunction) => {
  let componentPromise = null;
  
  return () => {
    if (!componentPromise) {
      componentPromise = importFunction();
    }
    return componentPromise;
  };
};

// Performance monitoring
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(key) {
    this.metrics.set(key, { startTime: performance.now() });
  }

  endTimer(key) {
    const metric = this.metrics.get(key);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      console.log(`[PERFORMANCE] ${key}: ${metric.duration.toFixed(2)}ms`);
      return metric.duration;
    }
    return 0;
  }

  getMetric(key) {
    return this.metrics.get(key);
  }

  getAllMetrics() {
    return Array.from(this.metrics.entries()).map(([key, metric]) => ({
      key,
      ...metric
    }));
  }

  clear() {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Image optimization utility
export const optimizeImageUrl = (url, width = 400, height = 300, quality = 80) => {
  if (!url) return null;
  
  // If it's already optimized or a data URL, return as-is
  if (url.includes('w_') || url.startsWith('data:')) {
    return url;
  }
  
  // For Cloudinary URLs, add optimization parameters
  if (url.includes('cloudinary.com')) {
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/w_${width},h_${height},c_fill,q_${quality}/${parts[1]}`;
    }
  }
  
  return url;
};

// Memory usage monitoring
export const getMemoryUsage = () => {
  if ('memory' in performance) {
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    };
  }
  return null;
};

// Network status monitoring
export const createNetworkMonitor = () => {
  const listeners = new Set();
  
  const notifyListeners = (isOnline) => {
    listeners.forEach(callback => callback(isOnline));
  };
  
  window.addEventListener('online', () => notifyListeners(true));
  window.addEventListener('offline', () => notifyListeners(false));
  
  return {
    isOnline: () => navigator.onLine,
    addListener: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    }
  };
};

export const networkMonitor = createNetworkMonitor();

// Cache invalidation strategies
export const invalidateCache = (pattern) => {
  if (typeof pattern === 'string') {
    // Exact match
    apiCache.delete(pattern);
  } else if (pattern instanceof RegExp) {
    // Pattern match
    for (const key of apiCache.cache.keys()) {
      if (pattern.test(key)) {
        apiCache.delete(key);
      }
    }
  } else if (Array.isArray(pattern)) {
    // Multiple keys
    pattern.forEach(key => apiCache.delete(key));
  }
};

// Preload critical data
export const preloadCriticalData = async () => {
  const criticalCalls = [
    () => import('../services/api').then(api => api.getDashboardOverview()),
    () => import('../services/api').then(api => api.getCustomers()),
    () => import('../services/api').then(api => api.getProducts())
  ];
  
  try {
    await batchApiCalls(criticalCalls);
    console.log('[PRELOAD] Critical data preloaded successfully');
  } catch (error) {
    console.warn('[PRELOAD] Some critical data failed to preload:', error);
  }
};

// Export all utilities
export default {
  apiCache,
  requestDeduplicator,
  cachedApiCall,
  PaginationManager,
  LoadingStateManager,
  globalLoadingManager,
  optimizedApiCall,
  batchApiCalls,
  createDebouncedSearch,
  createLazyLoader,
  PerformanceMonitor,
  performanceMonitor,
  optimizeImageUrl,
  getMemoryUsage,
  networkMonitor,
  invalidateCache,
  preloadCriticalData
};