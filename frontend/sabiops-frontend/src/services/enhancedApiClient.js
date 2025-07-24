/**
 * Enhanced API Client - Integration Layer
 * 
 * This service provides enhanced versions of existing API functions
 * that use the new apiClient with automatic toast handling.
 * 
 * It allows gradual migration from the existing API to the toast-enabled version
 * while maintaining backward compatibility.
 */

import apiClient, { get, post, put, del, getWithRetry, postWithRetry, withLoadingToast } from './apiClient';
import { toastService } from './ToastService';

// Import existing utility functions
import { getAuthToken, setAuthToken, removeAuthToken } from './api';

// Re-export auth utilities
export { getAuthToken, setAuthToken, removeAuthToken };

/**
 * Authentication API with enhanced toast handling
 */
export const authApi = {
  async register(userData) {
    try {
      const response = await post('/auth/register', userData);
      
      if (response.data?.data?.access_token) {
        setAuthToken(response.data.data.access_token);
      } else if (response.data?.access_token) {
        setAuthToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      // Toast already handled by apiClient interceptor
      throw error;
    }
  },

  async login(credentials) {
    try {
      const response = await post('/auth/login', credentials);
      
      if (response.data?.data?.access_token) {
        setAuthToken(response.data.data.access_token);
      } else if (response.data?.access_token) {
        setAuthToken(response.data.access_token);
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async logout() {
    removeAuthToken();
    return Promise.resolve();
  },

  async getProfile() {
    try {
      const response = await get('/auth/profile');
      return response.data?.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  async updateProfile(userData) {
    const response = await put('/auth/profile', userData);
    return response.data;
  },

  async requestPasswordReset(data) {
    const response = await post('/auth/forgot-password', data);
    return response.data;
  },

  async resetPassword(data) {
    const response = await post('/auth/reset-password', {
      token: data.token,
      password: data.password
    });
    return response.data;
  },

  async verifyToken() {
    try {
      const response = await post('/auth/verify-token');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        removeAuthToken();
      }
      throw error;
    }
  }
};

/**
 * Customer API with enhanced toast handling
 */
export const customerApi = {
  async getCustomers() {
    const response = await getWithRetry('/customers/');
    return response.data?.data || response.data;
  },

  async createCustomer(customerData) {
    return await withLoadingToast(
      async () => {
        const response = await post('/customers/', customerData);
        toastService.success('Customer created successfully!');
        return response.data;
      },
      'Creating customer...'
    );
  },

  async updateCustomer(customerId, customerData) {
    return await withLoadingToast(
      async () => {
        const response = await put(`/customers/${customerId}`, customerData);
        toastService.success('Customer updated successfully!');
        return response.data;
      },
      'Updating customer...'
    );
  },

  async deleteCustomer(customerId) {
    return await withLoadingToast(
      async () => {
        const response = await del(`/customers/${customerId}`);
        toastService.success('Customer deleted successfully!');
        return response.data;
      },
      'Deleting customer...'
    );
  }
};

/**
 * Product API with enhanced toast handling
 */
export const productApi = {
  async getProducts() {
    const response = await getWithRetry('/products/');
    return response.data?.data || response.data;
  },

  async createProduct(productData) {
    return await withLoadingToast(
      async () => {
        const response = await post('/products/', productData);
        toastService.success('Product created successfully!');
        return response.data;
      },
      'Creating product...'
    );
  },

  async updateProduct(productId, productData) {
    return await withLoadingToast(
      async () => {
        const response = await put(`/products/${productId}`, productData);
        toastService.success('Product updated successfully!');
        return response.data;
      },
      'Updating product...'
    );
  },

  async deleteProduct(productId) {
    return await withLoadingToast(
      async () => {
        const response = await del(`/products/${productId}`);
        toastService.success('Product deleted successfully!');
        return response.data;
      },
      'Deleting product...'
    );
  },

  async getCategories() {
    const response = await getWithRetry('/products/categories');
    return response.data?.data || response.data;
  }
};

/**
 * Sales API with enhanced toast handling
 */
export const salesApi = {
  async getSales(params = {}) {
    const response = await getWithRetry('/sales/', { params });
    return response.data?.data || response.data;
  },

  async createSale(saleData) {
    return await withLoadingToast(
      async () => {
        const response = await post('/sales/', saleData);
        toastService.success('Sale recorded successfully!');
        return response.data;
      },
      'Recording sale...'
    );
  },

  async getSalesReport(params) {
    return await withLoadingToast(
      async () => {
        let apiParams = {};
        
        if (params.date) {
          apiParams = { 
            start_date: params.date,
            end_date: params.date 
          };
        } else if (params.start_date && params.end_date) {
          apiParams = { 
            start_date: params.start_date,
            end_date: params.end_date 
          };
        } else {
          const today = new Date().toISOString().split('T')[0];
          apiParams = { 
            start_date: today,
            end_date: today 
          };
        }
        
        const response = await get('/sales', { params: apiParams });
        
        // Transform response to expected format
        let salesData = [];
        if (response.data?.success && response.data?.data?.sales) {
          salesData = response.data.data.sales;
        } else if (response.data?.sales && Array.isArray(response.data.sales)) {
          salesData = response.data.sales;
        } else if (Array.isArray(response.data)) {
          salesData = response.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          salesData = response.data.data;
        }
        
        // Calculate summary
        const summary = {
          total_sales: salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0), 0),
          total_transactions: salesData.length,
          total_quantity: salesData.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0),
          average_sale: salesData.length > 0 ? 
            salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0), 0) / salesData.length : 0
        };
        
        const payment_breakdown = {};
        salesData.forEach(sale => {
          const method = sale.payment_method || 'cash';
          if (!payment_breakdown[method]) {
            payment_breakdown[method] = { amount: 0, count: 0 };
          }
          payment_breakdown[method].amount += parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0;
          payment_breakdown[method].count += 1;
        });
        
        const transactions = salesData.map(sale => ({
          id: sale.id,
          created_at: sale.created_at || sale.date || sale.sale_date,
          customer_name: sale.customer_name || sale.customer?.name || 'Walk-in Customer',
          customer_email: sale.customer_email || sale.customer?.email || null,
          product_name: sale.product_name || sale.product?.name || 'Unknown Product',
          items: sale.sale_items || [{ 
            product_name: sale.product_name || 'Unknown Product', 
            quantity: sale.quantity || 1 
          }],
          total_quantity: parseInt(sale.quantity) || 0,
          payment_method: sale.payment_method || 'cash',
          total_amount: parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0
        }));
        
        return { summary, payment_breakdown, transactions };
      },
      'Generating sales report...'
    );
  }
};

/**
 * Invoice API with enhanced toast handling
 */
export const invoiceApi = {
  async getInvoices() {
    const response = await getWithRetry('/invoices/');
    return response.data?.data || response.data;
  },

  async getInvoice(invoiceId) {
    const response = await get(`/invoices/${invoiceId}`);
    return response.data?.data || response.data;
  },

  async createInvoice(invoiceData) {
    return await withLoadingToast(
      async () => {
        const response = await post('/invoices/', invoiceData, { suppressToast: true });
        toastService.success('Invoice created successfully!');
        return response.data;
      },
      'Creating invoice...'
    );
  },

  async updateInvoice(invoiceId, invoiceData) {
    return await withLoadingToast(
      async () => {
        const response = await put(`/invoices/${invoiceId}`, invoiceData, { suppressToast: true });
        toastService.success('Invoice updated successfully!');
        return response.data;
      },
      'Updating invoice...'
    );
  },

  async deleteInvoice(invoiceId) {
    return await withLoadingToast(
      async () => {
        const response = await del(`/invoices/${invoiceId}`, { suppressToast: true });
        toastService.success('Invoice deleted successfully!');
        return response.data;
      },
      'Deleting invoice...'
    );
  },

  async updateInvoiceStatus(invoiceId, statusData) {
    return await withLoadingToast(
      async () => {
        const response = await put(`/invoices/${invoiceId}/status`, statusData, { suppressToast: true });
        toastService.success('Invoice status updated successfully!');
        return response.data;
      },
      'Updating invoice status...'
    );
  },

  async sendInvoice(invoiceId) {
    return await withLoadingToast(
      async () => {
        const response = await post(`/invoices/${invoiceId}/send`, { suppressToast: true });
        toastService.success('Invoice sent successfully!');
        return response.data;
      },
      'Sending invoice...'
    );
  }
};

/**
 * Expense API with enhanced toast handling
 */
export const expenseApi = {
  async getExpenses() {
    const response = await getWithRetry('/expenses/');
    return response.data?.data || response.data;
  },

  async createExpense(expenseData) {
    return await withLoadingToast(
      async () => {
        const response = await post('/expenses/', expenseData);
        toastService.success('Expense recorded successfully!');
        return response.data;
      },
      'Recording expense...'
    );
  },

  async updateExpense(expenseId, expenseData) {
    return await withLoadingToast(
      async () => {
        const response = await put(`/expenses/${expenseId}`, expenseData);
        toastService.success('Expense updated successfully!');
        return response.data;
      },
      'Updating expense...'
    );
  },

  async deleteExpense(expenseId) {
    return await withLoadingToast(
      async () => {
        const response = await del(`/expenses/${expenseId}`);
        toastService.success('Expense deleted successfully!');
        return response.data;
      },
      'Deleting expense...'
    );
  },

  async getExpenseCategories() {
    const response = await getWithRetry('/expenses/categories');
    return response.data?.data || response.data;
  }
};

/**
 * Dashboard API with enhanced toast handling
 */
export const dashboardApi = {
  async getDashboardOverview() {
    const response = await getWithRetry('/dashboard/overview');
    
    if (response.data && typeof response.data === 'object') {
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data.revenue || response.data.customers || response.data.products) {
        return response.data;
      } else {
        return response.data;
      }
    } else {
      return response.data;
    }
  },

  async getRevenueChart() {
    const response = await getWithRetry('/dashboard/revenue-chart');
    return response.data?.data || response.data;
  },

  async getAccurateDashboardMetrics() {
    const response = await getWithRetry('/dashboard/metrics');
    return response.data?.data || response.data;
  },

  async validateDataConsistency() {
    return await withLoadingToast(
      async () => {
        const response = await get('/dashboard/validate');
        return response.data?.data || response.data;
      },
      'Validating data consistency...'
    );
  },

  async fixDataInconsistencies() {
    return await withLoadingToast(
      async () => {
        const response = await post('/dashboard/fix-inconsistencies');
        toastService.success('Data inconsistencies fixed successfully!');
        return response.data?.data || response.data;
      },
      'Fixing data inconsistencies...'
    );
  }
};

/**
 * Utility functions with enhanced error handling
 */
export const utilityApi = {
  async healthCheck() {
    const response = await get('/health');
    return response.data;
  },

  async globalSearch(query, limit = 5) {
    const response = await get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  }
};

// Export the main apiClient for direct use when needed
export { apiClient as default };

// Export individual HTTP methods
export { get, post, put, del, getWithRetry, postWithRetry, withLoadingToast };

// Export ToastService for manual toast management
export { toastService };

// Debug information
if (import.meta.env.DEV) {
  console.log('[EnhancedApiClient] Enhanced API services initialized');
  console.log('[EnhancedApiClient] Available services:', {
    auth: Object.keys(authApi),
    customer: Object.keys(customerApi),
    product: Object.keys(productApi),
    sales: Object.keys(salesApi),
    invoice: Object.keys(invoiceApi),
    expense: Object.keys(expenseApi),
    dashboard: Object.keys(dashboardApi),
    utility: Object.keys(utilityApi)
  });
}
