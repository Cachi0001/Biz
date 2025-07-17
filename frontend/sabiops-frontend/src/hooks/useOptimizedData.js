/**
 * Optimized Data Hook for SabiOps
 * Provides performance-optimized data fetching with caching, loading states, and error handling
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  globalLoadingManager, 
  performanceMonitor,
  networkMonitor 
} from '../utils/performanceOptimizations';
import { handleApiError, showToast } from '../utils/errorHandling';

// Generic optimized data hook
export const useOptimizedData = (
  fetchFunction,
  dependencies = [],
  options = {}
) => {
  const {
    key,
    initialData = null,
    onSuccess,
    onError,
    showToast: showToastOnError = true,
    retryCount = 3,
    retryDelay = 1000,
    refreshInterval = null,
    enabled = true
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const fetchData = useCallback(async (showLoadingState = true, isRetry = false) => {
    if (!enabled) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      if (showLoadingState) {
        setLoading(true);
        if (key) {
          globalLoadingManager.setLoading(key, true);
        }
      }

      setError(null);

      // Start performance monitoring
      const perfKey = key || 'data-fetch';
      performanceMonitor.startTimer(perfKey);

      // Execute fetch function
      const result = await fetchFunction(abortControllerRef.current.signal);

      // End performance monitoring
      performanceMonitor.endTimer(perfKey);

      setData(result);
      setLastFetch(new Date());
      setRetryAttempt(0);

      if (onSuccess) {
        onSuccess(result);
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('[FETCH] Request aborted');
        return;
      }

      console.error('[FETCH ERROR]', err);
      const errorMessage = handleApiError(err, 'Failed to fetch data');
      setError(errorMessage);

      // Retry logic
      if (!isRetry && retryAttempt < retryCount && navigator.onLine) {
        setRetryAttempt(prev => prev + 1);
        
        retryTimeoutRef.current = setTimeout(() => {
          console.log(`[RETRY] Attempt ${retryAttempt + 1}/${retryCount}`);
          fetchData(false, true);
        }, retryDelay * Math.pow(2, retryAttempt)); // Exponential backoff
        
        return;
      }

      if (showToastOnError) {
        showToast('error', errorMessage);
      }

      if (onError) {
        onError(err);
      }

    } finally {
      if (showLoadingState) {
        setLoading(false);
        if (key) {
          globalLoadingManager.setLoading(key, false);
        }
      }
    }
  }, [fetchFunction, enabled, key, onSuccess, onError, showToastOnError, retryCount, retryDelay, retryAttempt]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Set up refresh interval
  useEffect(() => {
    if (refreshInterval && enabled) {
      refreshIntervalRef.current = setInterval(() => {
        fetchData(false);
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [fetchData, refreshInterval, enabled]);

  // Network status monitoring
  useEffect(() => {
    const removeNetworkListener = networkMonitor.addListener((isOnline) => {
      if (isOnline && error && retryAttempt < retryCount) {
        console.log('[NETWORK] Back online, retrying failed request');
        fetchData(false, true);
      }
    });

    return removeNetworkListener;
  }, [fetchData, error, retryAttempt, retryCount]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (key) {
        globalLoadingManager.setLoading(key, false);
      }
    };
  }, [key]);

  const refetch = useCallback(() => {
    setRetryAttempt(0);
    fetchData();
  }, [fetchData]);

  const refetchSilently = useCallback(() => {
    setRetryAttempt(0);
    fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    lastFetch,
    refetch,
    refetchSilently,
    isRetrying: retryAttempt > 0
  };
};

// Specialized hooks for different data types
export const useOptimizedCustomers = (page = 1, options = {}) => {
  return useOptimizedData(
    async () => {
      const { customerAPI } = await import('../services/optimizedApi');
      return customerAPI.getCustomers(page);
    },
    [page],
    {
      key: `customers-${page}`,
      ...options
    }
  );
};

export const useOptimizedProducts = (page = 1, options = {}) => {
  return useOptimizedData(
    async () => {
      const { productAPI } = await import('../services/optimizedApi');
      return productAPI.getProducts(page);
    },
    [page],
    {
      key: `products-${page}`,
      ...options
    }
  );
};

export const useOptimizedInvoices = (page = 1, options = {}) => {
  return useOptimizedData(
    async () => {
      const { invoiceAPI } = await import('../services/optimizedApi');
      return invoiceAPI.getInvoices(page);
    },
    [page],
    {
      key: `invoices-${page}`,
      ...options
    }
  );
};

export const useOptimizedSales = (page = 1, options = {}) => {
  return useOptimizedData(
    async () => {
      const { salesAPI } = await import('../services/optimizedApi');
      return salesAPI.getSales(page);
    },
    [page],
    {
      key: `sales-${page}`,
      ...options
    }
  );
};

export const useOptimizedExpenses = (page = 1, options = {}) => {
  return useOptimizedData(
    async () => {
      const { expenseAPI } = await import('../services/optimizedApi');
      return expenseAPI.getExpenses(page);
    },
    [page],
    {
      key: `expenses-${page}`,
      ...options
    }
  );
};

export const useOptimizedDashboard = (options = {}) => {
  return useOptimizedData(
    async () => {
      const { batchLoadDashboardData } = await import('../services/optimizedApi');
      return batchLoadDashboardData();
    },
    [],
    {
      key: 'dashboard',
      refreshInterval: 60000, // Refresh every minute
      ...options
    }
  );
};

// Pagination hook
export const usePagination = (initialPage = 1, pageSize = 20) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updatePagination = useCallback((total) => {
    setTotalItems(total);
    setTotalPages(Math.ceil(total / pageSize));
  }, [pageSize]);

  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      return true;
    }
    return false;
  }, [totalPages]);

  const nextPage = useCallback(() => {
    return goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    return goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    currentPage,
    totalItems,
    totalPages,
    pageSize,
    hasNextPage,
    hasPrevPage,
    goToPage,
    nextPage,
    prevPage,
    updatePagination,
    paginationInfo: {
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      hasNextPage,
      hasPrevPage,
      startItem: (currentPage - 1) * pageSize + 1,
      endItem: Math.min(currentPage * pageSize, totalItems)
    }
  };
};

// Search hook with debouncing
export const useOptimizedSearch = (searchFunction, delay = 300) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      const searchResults = await searchFunction(searchQuery, abortControllerRef.current.signal);
      setResults(searchResults);

    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('[SEARCH ERROR]', err);
        setError(handleApiError(err, 'Search failed'));
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  }, [searchFunction]);

  const debouncedSearch = useCallback((searchQuery) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      search(searchQuery);
    }, delay);
  }, [search, delay]);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    search: debouncedSearch
  };
};

// Global loading state hook
export const useGlobalLoading = () => {
  const [loadingStates, setLoadingStates] = useState(new Map());

  useEffect(() => {
    const removeListener = globalLoadingManager.addListener(setLoadingStates);
    return removeListener;
  }, []);

  const isLoading = (key) => loadingStates.get(key) || false;
  const isAnyLoading = () => Array.from(loadingStates.values()).some(loading => loading);

  return {
    isLoading,
    isAnyLoading,
    loadingStates: Object.fromEntries(loadingStates)
  };
};

export default {
  useOptimizedData,
  useOptimizedCustomers,
  useOptimizedProducts,
  useOptimizedInvoices,
  useOptimizedSales,
  useOptimizedExpenses,
  useOptimizedDashboard,
  usePagination,
  useOptimizedSearch,
  useGlobalLoading
};