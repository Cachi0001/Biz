/**
 * Global Search Service
 * Centralized search functionality for the frontend with caching and debouncing
 */

import { searchGlobal } from './api';

class GlobalSearchService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.debounceTimeout = null;
    this.debounceDelay = 300; // 300ms
  }

  /**
   * Main search method with caching and debouncing
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async search(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        query: query,
        results: {
          products: [],
          customers: [],
          invoices: [],
          expenses: []
        },
        total_results: 0,
        cached: false
      };
    }

    const sanitizedQuery = this.sanitizeQuery(query);
    const cacheKey = this.getCacheKey(sanitizedQuery, options);

    // Check cache first
    const cachedResult = this.getFromCache(cacheKey);
    if (cachedResult) {
      return { ...cachedResult, cached: true };
    }

    try {
      const searchParams = {
        limit: options.limit || 10,
        type: options.type || 'all',
        ...options
      };

      const response = await searchGlobal(sanitizedQuery, searchParams.limit);
      
      const formattedResults = this.formatResults(response);
      
      // Cache the results
      this.cacheResults(cacheKey, formattedResults);
      
      return { ...formattedResults, cached: false };
    } catch (error) {
      console.error('[GlobalSearchService] Search failed:', error);
      return {
        success: false,
        error: {
          code: 'SEARCH_FAILED',
          message: 'Search failed. Please try again.',
          details: error.message
        },
        query: sanitizedQuery,
        suggestions: []
      };
    }
  }

  /**
   * Debounced search method
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @param {Function} callback - Callback function
   */
  debouncedSearch(query, options = {}, callback) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      try {
        const results = await this.search(query, options);
        callback(results);
      } catch (error) {
        callback({
          success: false,
          error: {
            code: 'SEARCH_ERROR',
            message: 'Search failed',
            details: error.message
          }
        });
      }
    }, this.debounceDelay);
  }

  /**
   * Search by specific type
   * @param {string} query - Search query
   * @param {string} type - Search type (products, customers, invoices, expenses)
   * @returns {Promise<Object>} Search results
   */
  async searchByType(query, type) {
    return this.search(query, { type, limit: 20 });
  }

  /**
   * Get search suggestions (simplified for now)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Search suggestions
   */
  async getSearchSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }

    try {
      const results = await this.search(query, { limit: 5 });
      const suggestions = [];

      // Extract suggestions from results
      if (results.success && results.results) {
        Object.entries(results.results).forEach(([type, items]) => {
          items.slice(0, 3).forEach(item => {
            suggestions.push({
              text: item.name || item.description || item.invoice_number,
              type: type.slice(0, -1), // Remove 's' from plural
              category: type.charAt(0).toUpperCase() + type.slice(1),
              id: item.id
            });
          });
        });
      }

      return suggestions.slice(0, 10);
    } catch (error) {
      console.error('[GlobalSearchService] Suggestions failed:', error);
      return [];
    }
  }

  /**
   * Format search results for consistent display
   * @param {Object} response - Raw API response
   * @returns {Object} Formatted results
   */
  formatResults(response) {
    if (!response || !response.success) {
      return {
        success: false,
        error: response?.error || { message: 'Invalid response format' },
        results: {
          products: [],
          customers: [],
          invoices: [],
          expenses: []
        },
        total_results: 0
      };
    }

    const results = response.results || {};
    
    return {
      success: true,
      query: response.query,
      results: {
        products: this.formatProductResults(results.products || []),
        customers: this.formatCustomerResults(results.customers || []),
        invoices: this.formatInvoiceResults(results.invoices || []),
        expenses: this.formatExpenseResults(results.expenses || [])
      },
      total_results: response.total_results || 0,
      response_time: response.response_time
    };
  }

  /**
   * Format product results
   */
  formatProductResults(products) {
    return products.map(product => ({
      id: product.id,
      type: 'product',
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.quantity || product.stock,
      category: product.category,
      highlight: product.highlight || product.name
    }));
  }

  /**
   * Format customer results
   */
  formatCustomerResults(customers) {
    return customers.map(customer => ({
      id: customer.id,
      type: 'customer',
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      highlight: customer.highlight || customer.name
    }));
  }

  /**
   * Format invoice results
   */
  formatInvoiceResults(invoices) {
    return invoices.map(invoice => ({
      id: invoice.id,
      type: 'invoice',
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name || invoice.customer?.name,
      total_amount: invoice.total_amount,
      status: invoice.status,
      due_date: invoice.due_date,
      created_at: invoice.created_at,
      highlight: invoice.highlight || invoice.invoice_number
    }));
  }

  /**
   * Format expense results
   */
  formatExpenseResults(expenses) {
    return expenses.map(expense => ({
      id: expense.id,
      type: 'expense',
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      date: expense.date || expense.created_at,
      payment_method: expense.payment_method,
      highlight: expense.highlight || expense.description
    }));
  }

  /**
   * Sanitize search query
   * @param {string} query - Raw query
   * @returns {string} Sanitized query
   */
  sanitizeQuery(query) {
    if (!query) return '';
    
    return query
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/['"]/g, '') // Remove quotes that might break queries
      .substring(0, 100); // Limit length
  }

  /**
   * Generate cache key
   */
  getCacheKey(query, options) {
    return `search_${query}_${JSON.stringify(options)}`;
  }

  /**
   * Get results from cache
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * Cache search results
   */
  cacheResults(key, results) {
    this.cache.set(key, {
      data: results,
      timestamp: Date.now()
    });

    // Clean old cache entries if cache gets too large
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear all cached results
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear cache for specific query
   */
  clearCacheForQuery(query) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(query)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Create singleton instance
const globalSearchService = new GlobalSearchService();

export default globalSearchService;