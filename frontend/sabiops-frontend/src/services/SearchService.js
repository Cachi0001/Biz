/**
 * Search Service
 * Handles all search-related API calls
 */

import { apiClient } from './apiClient';

class SearchService {
  /**
   * Perform global search across all entities
   * @param {string} query - Search query
   * @param {string} type - Search type ('all', 'customers', 'products', 'invoices', 'expenses')
   * @param {number} limit - Number of results per category
   * @returns {Promise<Object>} Search results
   */
  async globalSearch(query, type = 'all', limit = 10) {
    try {
      const response = await apiClient.get('/api/search', {
        params: { q: query, type, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Global search error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions based on query
   * @param {string} query - Search query
   * @returns {Promise<Object>} Search suggestions
   */
  async getSearchSuggestions(query) {
    try {
      const response = await apiClient.get('/api/search/suggestions', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      console.error('Search suggestions error:', error);
      return { suggestions: [] };
    }
  }

  /**
   * Get user's recent searches
   * @returns {Promise<Object>} Recent searches
   */
  async getRecentSearches() {
    try {
      const response = await apiClient.get('/api/search/recent');
      return response.data;
    } catch (error) {
      console.error('Recent searches error:', error);
      return { recent_searches: [] };
    }
  }

  /**
   * Search customers specifically
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Object>} Customer search results
   */
  async searchCustomers(query, limit = 20) {
    return this.globalSearch(query, 'customers', limit);
  }

  /**
   * Search products specifically
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Object>} Product search results
   */
  async searchProducts(query, limit = 20) {
    return this.globalSearch(query, 'products', limit);
  }

  /**
   * Search invoices specifically
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Object>} Invoice search results
   */
  async searchInvoices(query, limit = 20) {
    return this.globalSearch(query, 'invoices', limit);
  }

  /**
   * Search expenses specifically
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Promise<Object>} Expense search results
   */
  async searchExpenses(query, limit = 20) {
    return this.globalSearch(query, 'expenses', limit);
  }

  /**
   * Advanced search with filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Object>} Filtered search results
   */
  async advancedSearch(filters) {
    try {
      const response = await apiClient.post('/api/search/advanced', filters);
      return response.data;
    } catch (error) {
      console.error('Advanced search error:', error);
      throw error;
    }
  }

  /**
   * Get search analytics for admin users
   * @returns {Promise<Object>} Search analytics
   */
  async getSearchAnalytics() {
    try {
      const response = await apiClient.get('/api/search/analytics');
      return response.data;
    } catch (error) {
      console.error('Search analytics error:', error);
      throw error;
    }
  }
}

export const searchService = new SearchService();
export default SearchService;

