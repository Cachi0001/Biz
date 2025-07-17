/**
 * Optimized API Service for SabiOps
 * Wraps the existing API with performance optimizations
 */

import * as api from './api';
import { 
  cachedApiCall, 
  optimizedApiCall, 
  batchApiCalls, 
  invalidateCache,
  PaginationManager,
  performanceMonitor
} from '../utils/performanceOptimizations';

// Cache TTL configurations (in milliseconds)
const CACHE_TTL = {
  SHORT: 60000,      // 1 minute - for frequently changing data
  MEDIUM: 300000,    // 5 minutes - for moderately changing data
  LONG: 900000,      // 15 minutes - for rarely changing data
  VERY_LONG: 3600000 // 1 hour - for static data
};

// Optimized Dashboard API
export const getDashboardOverview = () => 
  optimizedApiCall('dashboard-overview', api.getDashboardOverview, {
    cacheTtl: CACHE_TTL.SHORT,
    loadingKey: 'dashboard'
  });

export const getAccurateDashboardMetrics = () =>
  optimizedApiCall('dashboard-metrics', api.getAccurateDashboardMetrics, {
    cacheTtl: CACHE_TTL.SHORT,
    loadingKey: 'dashboard-metrics'
  });

export const getRevenueChart = () =>
  optimizedApiCall('revenue-chart', api.getRevenueChart, {
    cacheTtl: CACHE_TTL.MEDIUM,
    loadingKey: 'revenue-chart'
  });

// Optimized Customer API with pagination
export class CustomerAPI {
  constructor() {
    this.pagination = new PaginationManager(20);
  }

  async getCustomers(page = 1, useCache = true) {
    const cacheKey = `customers-page-${page}`;
    
    return optimizedApiCall(cacheKey, async () => {
      performanceMonitor.startTimer('customers-fetch');
      
      const result = await api.getCustomers();
      
      // Simulate pagination (since backend doesn't support it yet)
      const customers = result.customers || result || [];
      this.pagination.updatePagination(customers.length, page);
      
      const startIndex = this.pagination.getOffset();
      const endIndex = startIndex + this.pagination.getLimit();
      const paginatedCustomers = customers.slice(startIndex, endIndex);
      
      performanceMonitor.endTimer('customers-fetch');
      
      return {
        customers: paginatedCustomers,
        pagination: this.pagination.getPaginationInfo(),
        total: customers.length
      };
    }, {
      cacheTtl: useCache ? CACHE_TTL.MEDIUM : 0,
      loadingKey: 'customers'
    });
  }

  async createCustomer(customerData) {
    const result = await api.createCustomer(customerData);
    // Invalidate customer cache
    invalidateCache(/^customers-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async updateCustomer(customerId, customerData) {
    const result = await api.updateCustomer(customerId, customerData);
    // Invalidate customer cache
    invalidateCache(/^customers-/);
    return result;
  }

  async deleteCustomer(customerId) {
    const result = await api.deleteCustomer(customerId);
    // Invalidate customer cache
    invalidateCache(/^customers-/);
    invalidateCache('dashboard-overview');
    return result;
  }
}

// Optimized Product API with pagination
export class ProductAPI {
  constructor() {
    this.pagination = new PaginationManager(20);
  }

  async getProducts(page = 1, useCache = true) {
    const cacheKey = `products-page-${page}`;
    
    return optimizedApiCall(cacheKey, async () => {
      performanceMonitor.startTimer('products-fetch');
      
      const result = await api.getProducts();
      
      // Handle different response formats
      const products = result.products || result.data?.products || result || [];
      this.pagination.updatePagination(products.length, page);
      
      const startIndex = this.pagination.getOffset();
      const endIndex = startIndex + this.pagination.getLimit();
      const paginatedProducts = products.slice(startIndex, endIndex);
      
      performanceMonitor.endTimer('products-fetch');
      
      return {
        products: paginatedProducts,
        pagination: this.pagination.getPaginationInfo(),
        total: products.length,
        categories: result.categories || [],
        low_stock_count: result.low_stock_count || 0
      };
    }, {
      cacheTtl: useCache ? CACHE_TTL.MEDIUM : 0,
      loadingKey: 'products'
    });
  }

  async createProduct(productData) {
    const result = await api.createProduct(productData);
    // Invalidate product cache
    invalidateCache(/^products-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async updateProduct(productId, productData) {
    const result = await api.updateProduct(productId, productData);
    // Invalidate product cache
    invalidateCache(/^products-/);
    return result;
  }

  async deleteProduct(productId) {
    const result = await api.deleteProduct(productId);
    // Invalidate product cache
    invalidateCache(/^products-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async getCategories() {
    return optimizedApiCall('product-categories', api.getCategories, {
      cacheTtl: CACHE_TTL.LONG,
      loadingKey: 'categories'
    });
  }
}

// Optimized Invoice API with pagination
export class InvoiceAPI {
  constructor() {
    this.pagination = new PaginationManager(20);
  }

  async getInvoices(page = 1, useCache = true) {
    const cacheKey = `invoices-page-${page}`;
    
    return optimizedApiCall(cacheKey, async () => {
      performanceMonitor.startTimer('invoices-fetch');
      
      const result = await api.getInvoices();
      
      const invoices = result.invoices || result.data?.invoices || result || [];
      this.pagination.updatePagination(invoices.length, page);
      
      const startIndex = this.pagination.getOffset();
      const endIndex = startIndex + this.pagination.getLimit();
      const paginatedInvoices = invoices.slice(startIndex, endIndex);
      
      performanceMonitor.endTimer('invoices-fetch');
      
      return {
        invoices: paginatedInvoices,
        pagination: this.pagination.getPaginationInfo(),
        total: invoices.length
      };
    }, {
      cacheTtl: useCache ? CACHE_TTL.SHORT : 0,
      loadingKey: 'invoices'
    });
  }

  async createInvoice(invoiceData) {
    const result = await api.createInvoice(invoiceData);
    // Invalidate invoice cache
    invalidateCache(/^invoices-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async updateInvoice(invoiceId, invoiceData) {
    const result = await api.updateInvoice(invoiceId, invoiceData);
    // Invalidate invoice cache
    invalidateCache(/^invoices-/);
    return result;
  }

  async deleteInvoice(invoiceId) {
    const result = await api.deleteInvoice(invoiceId);
    // Invalidate invoice cache
    invalidateCache(/^invoices-/);
    invalidateCache('dashboard-overview');
    return result;
  }
}

// Optimized Sales API with pagination
export class SalesAPI {
  constructor() {
    this.pagination = new PaginationManager(20);
  }

  async getSales(page = 1, useCache = true) {
    const cacheKey = `sales-page-${page}`;
    
    return optimizedApiCall(cacheKey, async () => {
      performanceMonitor.startTimer('sales-fetch');
      
      const result = await api.getSales();
      
      const sales = result.sales || result.data?.sales || result || [];
      this.pagination.updatePagination(sales.length, page);
      
      const startIndex = this.pagination.getOffset();
      const endIndex = startIndex + this.pagination.getLimit();
      const paginatedSales = sales.slice(startIndex, endIndex);
      
      performanceMonitor.endTimer('sales-fetch');
      
      return {
        sales: paginatedSales,
        pagination: this.pagination.getPaginationInfo(),
        total: sales.length,
        summary: result.summary || {}
      };
    }, {
      cacheTtl: useCache ? CACHE_TTL.SHORT : 0,
      loadingKey: 'sales'
    });
  }

  async createSale(saleData) {
    const result = await api.createSale(saleData);
    // Invalidate related caches
    invalidateCache(/^sales-/);
    invalidateCache(/^products-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async getSalesReport(params) {
    const cacheKey = `sales-report-${JSON.stringify(params)}`;
    
    return optimizedApiCall(cacheKey, () => api.getSalesReport(params), {
      cacheTtl: CACHE_TTL.SHORT,
      loadingKey: 'sales-report'
    });
  }
}

// Optimized Expense API with pagination
export class ExpenseAPI {
  constructor() {
    this.pagination = new PaginationManager(20);
  }

  async getExpenses(page = 1, useCache = true) {
    const cacheKey = `expenses-page-${page}`;
    
    return optimizedApiCall(cacheKey, async () => {
      performanceMonitor.startTimer('expenses-fetch');
      
      const result = await api.getExpenses();
      
      const expenses = result.expenses || result.data?.expenses || result || [];
      this.pagination.updatePagination(expenses.length, page);
      
      const startIndex = this.pagination.getOffset();
      const endIndex = startIndex + this.pagination.getLimit();
      const paginatedExpenses = expenses.slice(startIndex, endIndex);
      
      performanceMonitor.endTimer('expenses-fetch');
      
      return {
        expenses: paginatedExpenses,
        pagination: this.pagination.getPaginationInfo(),
        total: expenses.length
      };
    }, {
      cacheTtl: useCache ? CACHE_TTL.SHORT : 0,
      loadingKey: 'expenses'
    });
  }

  async createExpense(expenseData) {
    const result = await api.createExpense(expenseData);
    // Invalidate expense cache
    invalidateCache(/^expenses-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async updateExpense(expenseId, expenseData) {
    const result = await api.updateExpense(expenseId, expenseData);
    // Invalidate expense cache
    invalidateCache(/^expenses-/);
    return result;
  }

  async deleteExpense(expenseId) {
    const result = await api.deleteExpense(expenseId);
    // Invalidate expense cache
    invalidateCache(/^expenses-/);
    invalidateCache('dashboard-overview');
    return result;
  }

  async getExpenseCategories() {
    return optimizedApiCall('expense-categories', api.getExpenseCategories, {
      cacheTtl: CACHE_TTL.LONG,
      loadingKey: 'expense-categories'
    });
  }
}

// Create API instances
export const customerAPI = new CustomerAPI();
export const productAPI = new ProductAPI();
export const invoiceAPI = new InvoiceAPI();
export const salesAPI = new SalesAPI();
export const expenseAPI = new ExpenseAPI();

// Batch operations for initial page loads
export const batchLoadDashboardData = async () => {
  performanceMonitor.startTimer('dashboard-batch-load');
  
  const calls = [
    () => getDashboardOverview(),
    () => getAccurateDashboardMetrics(),
    () => getRevenueChart()
  ];
  
  const results = await batchApiCalls(calls);
  
  performanceMonitor.endTimer('dashboard-batch-load');
  
  return {
    overview: results[0]?.success ? results[0].data : null,
    metrics: results[1]?.success ? results[1].data : null,
    chart: results[2]?.success ? results[2].data : null,
    errors: results.filter(r => !r.success).map(r => r.error)
  };
};

export const batchLoadPageData = async (page) => {
  performanceMonitor.startTimer(`${page}-batch-load`);
  
  let calls = [];
  
  switch (page) {
    case 'customers':
      calls = [
        () => customerAPI.getCustomers(),
        () => getDashboardOverview()
      ];
      break;
    case 'products':
      calls = [
        () => productAPI.getProducts(),
        () => productAPI.getCategories()
      ];
      break;
    case 'invoices':
      calls = [
        () => invoiceAPI.getInvoices(),
        () => customerAPI.getCustomers()
      ];
      break;
    case 'sales':
      calls = [
        () => salesAPI.getSales(),
        () => customerAPI.getCustomers(),
        () => productAPI.getProducts()
      ];
      break;
    case 'expenses':
      calls = [
        () => expenseAPI.getExpenses(),
        () => expenseAPI.getExpenseCategories()
      ];
      break;
    default:
      calls = [() => getDashboardOverview()];
  }
  
  const results = await batchApiCalls(calls);
  
  performanceMonitor.endTimer(`${page}-batch-load`);
  
  return results;
};

// Cache management utilities
export const clearAllCache = () => {
  invalidateCache(/^.*/);
  console.log('[CACHE] All cache cleared');
};

export const clearPageCache = (page) => {
  const patterns = {
    dashboard: /^dashboard-/,
    customers: /^customers-/,
    products: /^products-/,
    invoices: /^invoices-/,
    sales: /^sales-/,
    expenses: /^expenses-/
  };
  
  if (patterns[page]) {
    invalidateCache(patterns[page]);
    console.log(`[CACHE] ${page} cache cleared`);
  }
};

// Performance monitoring utilities
export const getPerformanceReport = () => {
  const metrics = performanceMonitor.getAllMetrics();
  const report = {
    totalRequests: metrics.length,
    averageResponseTime: metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / metrics.length,
    slowestRequest: metrics.reduce((slowest, m) => 
      (m.duration || 0) > (slowest.duration || 0) ? m : slowest, {}),
    fastestRequest: metrics.reduce((fastest, m) => 
      (m.duration || 0) < (fastest.duration || 0) ? m : fastest, { duration: Infinity }),
    requestsByType: metrics.reduce((acc, m) => {
      const type = m.key.split('-')[0];
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {})
  };
  
  console.log('[PERFORMANCE REPORT]', report);
  return report;
};

// Export original API functions that don't need optimization
export {
  // Auth functions
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  verifyToken,
  
  // Team functions
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  
  // Subscription functions
  getSubscriptionPlans,
  upgradeSubscription,
  
  // Payment functions
  initializePayment,
  verifyPayment
} from './api';

export default {
  // Dashboard
  getDashboardOverview,
  getAccurateDashboardMetrics,
  getRevenueChart,
  
  // API instances
  customerAPI,
  productAPI,
  invoiceAPI,
  salesAPI,
  expenseAPI,
  
  // Batch operations
  batchLoadDashboardData,
  batchLoadPageData,
  
  // Cache management
  clearAllCache,
  clearPageCache,
  
  // Performance monitoring
  getPerformanceReport
};