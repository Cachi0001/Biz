/**
 * Performance optimization utilities for invoice form
 * Implements debouncing, memoization, and API call optimization
 */

import { useMemo, useCallback, useRef, useState, useEffect } from 'react';

/**
 * Enhanced debounce hook with configurable delay
 * Prevents excessive function calls during rapid user input
 */
export const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(() => {
        resolve(callback(...args));
      }, delay);
    });
  }, [callback, delay]);
};

/**
 * Debounced validation hook specifically for form fields
 * Implements 300ms delay as specified in requirements
 */
export const useDebouncedValidation = (validationFn, delay = 300) => {
  const [isValidating, setIsValidating] = useState(false);
  const timeoutRef = useRef(null);
  
  const debouncedValidate = useCallback(async (...args) => {
    setIsValidating(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await validationFn(...args);
          resolve(result);
        } catch (error) {
          console.error('Validation error:', error);
          resolve(null);
        } finally {
          setIsValidating(false);
        }
      }, delay);
    });
  }, [validationFn, delay]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  return { debouncedValidate, isValidating };
};

/**
 * Memoized calculation hook for expensive operations
 * Prevents recalculation when dependencies haven't changed
 */
export const useMemoizedCalculation = (calculationFn, dependencies) => {
  return useMemo(() => {
    try {
      return calculationFn();
    } catch (error) {
      console.error('Calculation error:', error);
      return 0;
    }
  }, dependencies);
};

/**
 * Optimized API data loader with caching and deduplication
 * Prevents multiple simultaneous requests for the same data
 */
export const useOptimizedApiLoader = () => {
  const cacheRef = useRef(new Map());
  const pendingRequestsRef = useRef(new Map());
  
  const loadData = useCallback(async (key, apiFunction, cacheTimeout = 5 * 60 * 1000) => {
    // Check cache first
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < cacheTimeout) {
      return cached.data;
    }
    
    // Check if request is already pending
    const pendingRequest = pendingRequestsRef.current.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }
    
    // Create new request
    const request = apiFunction()
      .then(data => {
        // Cache the result
        cacheRef.current.set(key, {
          data,
          timestamp: Date.now()
        });
        
        // Remove from pending requests
        pendingRequestsRef.current.delete(key);
        
        return data;
      })
      .catch(error => {
        // Remove from pending requests on error
        pendingRequestsRef.current.delete(key);
        throw error;
      });
    
    // Store pending request
    pendingRequestsRef.current.set(key, request);
    
    return request;
  }, []);
  
  const clearCache = useCallback((key) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);
  
  const preloadData = useCallback(async (key, apiFunction) => {
    // Preload data without waiting for it
    loadData(key, apiFunction).catch(error => {
      console.warn(`Preload failed for ${key}:`, error);
    });
  }, [loadData]);
  
  return { loadData, clearCache, preloadData };
};

/**
 * Throttled function execution to limit frequency of expensive operations
 */
export const useThrottle = (callback, delay = 100) => {
  const lastExecutedRef = useRef(0);
  const timeoutRef = useRef(null);
  
  return useCallback((...args) => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecutedRef.current;
    
    if (timeSinceLastExecution >= delay) {
      lastExecutedRef.current = now;
      return callback(...args);
    } else {
      // Schedule execution for later
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        lastExecutedRef.current = Date.now();
        callback(...args);
      }, delay - timeSinceLastExecution);
    }
  }, [callback, delay]);
};

/**
 * Memoized calculation functions for invoice totals
 * Prevents recalculation when item data hasn't changed
 */
export const calculateItemTotalMemoized = (item) => {
  // Create a stable key for memoization
  const key = `${item.quantity}-${item.unit_price}-${item.tax_rate}-${item.discount_rate}`;
  
  // Use a simple memoization cache
  if (!calculateItemTotalMemoized.cache) {
    calculateItemTotalMemoized.cache = new Map();
  }
  
  if (calculateItemTotalMemoized.cache.has(key)) {
    return calculateItemTotalMemoized.cache.get(key);
  }
  
  // Prevent negative values using Math.max()
  const quantity = Math.max(0, parseFloat(item.quantity) || 0);
  const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
  const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
  
  // Limit discount rates to 0-100% range
  const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));
  
  let total = quantity * unitPrice;
  total -= total * (discountRate / 100);
  total += total * (taxRate / 100);
  
  // Add proper rounding to 2 decimal places using Math.round()
  const result = Math.round(total * 100) / 100;
  
  // Cache the result
  calculateItemTotalMemoized.cache.set(key, result);
  
  // Limit cache size to prevent memory leaks
  if (calculateItemTotalMemoized.cache.size > 100) {
    const firstKey = calculateItemTotalMemoized.cache.keys().next().value;
    calculateItemTotalMemoized.cache.delete(firstKey);
  }
  
  return result;
};

/**
 * Memoized invoice total calculation
 */
export const calculateInvoiceTotalMemoized = (items, discountAmount = 0) => {
  // Create a stable key for memoization
  const itemsKey = items.map(item => 
    `${item.quantity}-${item.unit_price}-${item.tax_rate}-${item.discount_rate}`
  ).join('|');
  const key = `${itemsKey}-${discountAmount}`;
  
  // Use a simple memoization cache
  if (!calculateInvoiceTotalMemoized.cache) {
    calculateInvoiceTotalMemoized.cache = new Map();
  }
  
  if (calculateInvoiceTotalMemoized.cache.has(key)) {
    return calculateInvoiceTotalMemoized.cache.get(key);
  }
  
  const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotalMemoized(item), 0);
  // Prevent negative discount amounts
  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const total = itemsTotal - discount;
  
  // Add proper rounding to 2 decimal places using Math.round()
  const result = Math.round(Math.max(0, total) * 100) / 100;
  
  // Cache the result
  calculateInvoiceTotalMemoized.cache.set(key, result);
  
  // Limit cache size to prevent memory leaks
  if (calculateInvoiceTotalMemoized.cache.size > 100) {
    const firstKey = calculateInvoiceTotalMemoized.cache.keys().next().value;
    calculateInvoiceTotalMemoized.cache.delete(firstKey);
  }
  
  return result;
};

/**
 * Performance monitoring hook for development
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef(Date.now());
  
  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${componentName} render #${renderCountRef.current}, ${timeSinceLastRender}ms since last render`);
    }
    
    lastRenderTimeRef.current = now;
  });
  
  return {
    renderCount: renderCountRef.current,
    logPerformance: (operation, duration) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${componentName} - ${operation}: ${duration}ms`);
      }
    }
  };
};

/**
 * Optimized search/filter hook with debouncing
 */
export const useOptimizedSearch = (data, searchFields, delay = 300) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const debouncedSearch = useDebounce((term) => {
    if (!term.trim()) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term.toLowerCase());
      });
    });
    
    setFilteredData(filtered);
  }, delay);
  
  useEffect(() => {
    setFilteredData(data);
  }, [data]);
  
  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);
  
  return {
    searchTerm,
    setSearchTerm,
    filteredData
  };
};

/**
 * Clear all memoization caches (useful for testing or memory management)
 */
export const clearAllCaches = () => {
  if (calculateItemTotalMemoized.cache) {
    calculateItemTotalMemoized.cache.clear();
  }
  if (calculateInvoiceTotalMemoized.cache) {
    calculateInvoiceTotalMemoized.cache.clear();
  }
};

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  timers: new Map(),
  
  startTimer: (name) => {
    performanceMonitor.timers.set(name, Date.now());
  },
  
  endTimer: (name) => {
    const startTime = performanceMonitor.timers.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      performanceMonitor.timers.delete(name);
      if (process.env.NODE_ENV === 'development') {
        console.log(`[PERF] ${name}: ${duration}ms`);
      }
      return duration;
    }
    return 0;
  }
};

/**
 * Global loading manager for coordinating loading states
 */
export const globalLoadingManager = {
  loadingStates: new Map(),
  
  setLoading: (key, isLoading) => {
    globalLoadingManager.loadingStates.set(key, isLoading);
  },
  
  isLoading: (key) => {
    return globalLoadingManager.loadingStates.get(key) || false;
  },
  
  isAnyLoading: () => {
    return Array.from(globalLoadingManager.loadingStates.values()).some(loading => loading);
  }
};

/**
 * Optimized API call wrapper with caching and loading management
 */
export const optimizedApiCall = async (key, apiFunction, options = {}) => {
  const {
    cacheTtl = 60000,
    useCache = true,
    showLoading = true
  } = options;
  
  try {
    if (showLoading) {
      globalLoadingManager.setLoading(key, true);
    }
    
    // Simple cache implementation
    if (useCache && optimizedApiCall.cache) {
      const cached = optimizedApiCall.cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        return cached.data;
      }
    }
    
    const result = await apiFunction();
    
    // Cache the result
    if (useCache) {
      if (!optimizedApiCall.cache) {
        optimizedApiCall.cache = new Map();
      }
      optimizedApiCall.cache.set(key, {
        data: result,
        timestamp: Date.now()
      });
    }
    
    return result;
  } finally {
    if (showLoading) {
      globalLoadingManager.setLoading(key, false);
    }
  }
};

