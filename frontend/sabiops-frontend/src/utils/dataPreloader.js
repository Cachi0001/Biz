/**
 * Data Preloader for SabiOps
 * Preloads critical data to improve perceived performance
 */

import { 
  batchApiCalls, 
  apiCache, 
  performanceMonitor 
} from './performanceOptimizations';

// Critical data that should be preloaded
const CRITICAL_DATA_LOADERS = {
  dashboard: async () => {
    const { getDashboardOverview, getAccurateDashboardMetrics } = await import('../services/optimizedApi');
    return Promise.allSettled([
      getDashboardOverview(),
      getAccurateDashboardMetrics()
    ]);
  },
  
  customers: async () => {
    const { customerAPI } = await import('../services/optimizedApi');
    return customerAPI.getCustomers(1, false); // Don't use cache for preload
  },
  
  products: async () => {
    const { productAPI } = await import('../services/optimizedApi');
    return Promise.allSettled([
      productAPI.getProducts(1, false),
      productAPI.getCategories()
    ]);
  },
  
  staticData: async () => {
    const { getBusinessCategories, getExpenseCategories } = await import('./formatting');
    return Promise.resolve({
      businessCategories: getBusinessCategories(),
      expenseCategories: getExpenseCategories()
    });
  }
};

// Preload strategy based on user behavior patterns
const PRELOAD_STRATEGIES = {
  // Immediate: Load right after app initialization
  immediate: ['dashboard', 'staticData'],
  
  // Early: Load after initial render
  early: ['customers', 'products'],
  
  // Lazy: Load when user is likely to need it
  lazy: ['invoices', 'sales', 'expenses']
};

class DataPreloader {
  constructor() {
    this.preloadStatus = new Map();
    this.preloadPromises = new Map();
    this.listeners = new Set();
  }

  // Preload data based on strategy
  async preload(strategy = 'immediate') {
    const dataTypes = PRELOAD_STRATEGIES[strategy] || [];
    
    if (dataTypes.length === 0) {
      return { success: true, results: [] };
    }

    performanceMonitor.startTimer(`preload-${strategy}`);
    
    const loaders = dataTypes
      .filter(type => CRITICAL_DATA_LOADERS[type])
      .map(type => ({
        type,
        loader: CRITICAL_DATA_LOADERS[type]
      }));

    try {
      const results = await Promise.allSettled(
        loaders.map(async ({ type, loader }) => {
          this.setPreloadStatus(type, 'loading');
          
          try {
            const result = await loader();
            this.setPreloadStatus(type, 'success');
            return { type, success: true, data: result };
          } catch (error) {
            this.setPreloadStatus(type, 'error');
            console.warn(`[PRELOAD] Failed to preload ${type}:`, error);
            return { type, success: false, error };
          }
        })
      );

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const totalCount = results.length;

      performanceMonitor.endTimer(`preload-${strategy}`);
      
      console.log(`[PRELOAD] ${strategy} strategy completed: ${successCount}/${totalCount} successful`);
      
      this.notifyListeners();
      
      return {
        success: successCount > 0,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }),
        successCount,
        totalCount
      };

    } catch (error) {
      performanceMonitor.endTimer(`preload-${strategy}`);
      console.error(`[PRELOAD] ${strategy} strategy failed:`, error);
      
      return {
        success: false,
        error,
        results: [],
        successCount: 0,
        totalCount: loaders.length
      };
    }
  }

  // Preload data for a specific page
  async preloadForPage(pageName) {
    const pageDataMap = {
      dashboard: ['dashboard'],
      customers: ['customers'],
      products: ['products'],
      invoices: ['customers', 'products'], // Invoices need customer and product data
      sales: ['customers', 'products'],
      expenses: ['staticData']
    };

    const dataTypes = pageDataMap[pageName] || [];
    
    if (dataTypes.length === 0) {
      return { success: true, results: [] };
    }

    // Check if data is already preloaded
    const alreadyLoaded = dataTypes.filter(type => 
      this.getPreloadStatus(type) === 'success'
    );

    const needsLoading = dataTypes.filter(type => 
      !alreadyLoaded.includes(type)
    );

    if (needsLoading.length === 0) {
      console.log(`[PRELOAD] Page ${pageName} data already loaded`);
      return { success: true, results: [], cached: true };
    }

    console.log(`[PRELOAD] Loading data for page ${pageName}:`, needsLoading);
    
    const loaders = needsLoading
      .filter(type => CRITICAL_DATA_LOADERS[type])
      .map(type => CRITICAL_DATA_LOADERS[type]);

    try {
      const results = await batchApiCalls(loaders);
      
      needsLoading.forEach((type, index) => {
        if (results[index]?.success) {
          this.setPreloadStatus(type, 'success');
        } else {
          this.setPreloadStatus(type, 'error');
        }
      });

      this.notifyListeners();
      
      return {
        success: results.some(r => r.success),
        results,
        preloaded: needsLoading,
        cached: alreadyLoaded
      };

    } catch (error) {
      console.error(`[PRELOAD] Failed to preload for page ${pageName}:`, error);
      return { success: false, error };
    }
  }

  // Smart preloading based on user navigation patterns
  async smartPreload(currentPage, userHistory = []) {
    // Predict next likely pages based on common patterns
    const navigationPatterns = {
      dashboard: ['customers', 'products', 'sales'],
      customers: ['invoices', 'sales'],
      products: ['sales', 'invoices'],
      sales: ['customers', 'products'],
      invoices: ['customers', 'products'],
      expenses: ['dashboard']
    };

    const likelyNextPages = navigationPatterns[currentPage] || [];
    
    // Also consider user's recent history
    const recentPages = userHistory.slice(-3);
    const frequentPages = [...new Set([...likelyNextPages, ...recentPages])];

    // Preload data for likely next pages
    const preloadPromises = frequentPages.map(page => 
      this.preloadForPage(page)
    );

    try {
      await Promise.allSettled(preloadPromises);
      console.log(`[SMART PRELOAD] Preloaded data for likely pages:`, frequentPages);
    } catch (error) {
      console.warn('[SMART PRELOAD] Some preloads failed:', error);
    }
  }

  // Get preload status
  getPreloadStatus(type) {
    return this.preloadStatus.get(type) || 'idle';
  }

  // Set preload status
  setPreloadStatus(type, status) {
    this.preloadStatus.set(type, status);
  }

  // Check if data is preloaded
  isPreloaded(type) {
    return this.getPreloadStatus(type) === 'success';
  }

  // Get all preload statuses
  getAllStatuses() {
    return Object.fromEntries(this.preloadStatus);
  }

  // Add listener for preload status changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners of status changes
  notifyListeners() {
    const statuses = this.getAllStatuses();
    this.listeners.forEach(callback => {
      try {
        callback(statuses);
      } catch (error) {
        console.error('[PRELOAD] Listener error:', error);
      }
    });
  }

  // Clear preload cache
  clearPreloadCache() {
    this.preloadStatus.clear();
    this.preloadPromises.clear();
    console.log('[PRELOAD] Cache cleared');
  }

  // Get preload statistics
  getStatistics() {
    const statuses = this.getAllStatuses();
    const total = Object.keys(statuses).length;
    const successful = Object.values(statuses).filter(s => s === 'success').length;
    const failed = Object.values(statuses).filter(s => s === 'error').length;
    const loading = Object.values(statuses).filter(s => s === 'loading').length;

    return {
      total,
      successful,
      failed,
      loading,
      successRate: total > 0 ? (successful / total) * 100 : 0
    };
  }
}

// Create singleton instance
export const dataPreloader = new DataPreloader();

// Convenience functions
export const preloadCriticalData = () => dataPreloader.preload('immediate');
export const preloadEarlyData = () => dataPreloader.preload('early');
export const preloadForPage = (page) => dataPreloader.preloadForPage(page);
export const smartPreload = (currentPage, history) => dataPreloader.smartPreload(currentPage, history);

// Hook for using preloader in components
export const useDataPreloader = () => {
  const [statuses, setStatuses] = React.useState(dataPreloader.getAllStatuses());

  React.useEffect(() => {
    const removeListener = dataPreloader.addListener(setStatuses);
    return removeListener;
  }, []);

  return {
    statuses,
    isPreloaded: (type) => dataPreloader.isPreloaded(type),
    preloadForPage: (page) => dataPreloader.preloadForPage(page),
    statistics: dataPreloader.getStatistics()
  };
};

export default dataPreloader;