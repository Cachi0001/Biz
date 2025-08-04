// Customer service with caching and subscription mechanisms
import api from './api';
import dropdownCache from './dropdownCache';

class CustomerService {
  constructor() {
    this.cacheKey = 'customers';
    this.isLoading = false;
    this.lastError = null;
  }

  // Fetch customers with caching
  async getCustomers(forceRefresh = false) {
    // Return cached data if available and not forcing refresh
    if (!forceRefresh && dropdownCache.has(this.cacheKey)) {
      return dropdownCache.get(this.cacheKey);
    }

    // Prevent multiple simultaneous requests
    if (this.isLoading) {
      return new Promise((resolve, reject) => {
        const unsubscribe = dropdownCache.subscribe(this.cacheKey, (data) => {
          unsubscribe();
          if (data) {
            resolve(data);
          } else if (this.lastError) {
            reject(this.lastError);
          }
        });
      });
    }

    this.isLoading = true;
    this.lastError = null;

    try {
      const response = await api.get('/customers');
      const customers = this.formatCustomers(response.data);
      
      // Cache the data
      dropdownCache.set(this.cacheKey, customers);
      
      this.isLoading = false;
      return customers;
    } catch (error) {
      this.isLoading = false;
      this.lastError = error;
      
      console.error('Failed to fetch customers:', error);
      
      // Return cached data if available, even if stale
      const cachedData = dropdownCache.get(this.cacheKey);
      if (cachedData) {
        console.warn('Using stale customer data due to API error');
        return cachedData;
      }
      
      throw error;
    }
  }

  // Format customers for dropdown consumption
  formatCustomers(rawCustomers) {
    if (!Array.isArray(rawCustomers)) {
      console.warn('Invalid customers data format:', rawCustomers);
      return [];
    }

    return rawCustomers.map(customer => ({
      id: customer.id?.toString() || '',
      name: customer.name || customer.customer_name || 'Unknown Customer',
      email: customer.email || '',
      phone: customer.phone || customer.phone_number || '',
      isWalkIn: false
    }));
  }

  // Get customer by ID
  async getCustomerById(customerId) {
    if (!customerId) return null;

    try {
      const customers = await this.getCustomers();
      return customers.find(customer => customer.id === customerId.toString()) || null;
    } catch (error) {
      console.error('Failed to get customer by ID:', error);
      return null;
    }
  }

  // Search customers by name
  async searchCustomers(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return this.getCustomers();
    }

    try {
      const customers = await this.getCustomers();
      const term = searchTerm.toLowerCase().trim();
      
      return customers.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term)
      );
    } catch (error) {
      console.error('Failed to search customers:', error);
      return [];
    }
  }

  // Subscribe to customer data changes
  subscribe(callback) {
    return dropdownCache.subscribe(this.cacheKey, callback);
  }

  // Invalidate customer cache
  invalidateCache() {
    dropdownCache.clear(this.cacheKey);
  }

  // Add new customer and update cache
  async addCustomer(customerData) {
    try {
      const response = await api.post('/customers', customerData);
      
      // Refresh cache to include new customer
      await this.getCustomers(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to add customer:', error);
      throw error;
    }
  }

  // Update customer and refresh cache
  async updateCustomer(customerId, customerData) {
    try {
      const response = await api.put(`/customers/${customerId}`, customerData);
      
      // Refresh cache to reflect updates
      await this.getCustomers(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to update customer:', error);
      throw error;
    }
  }

  // Delete customer and refresh cache
  async deleteCustomer(customerId) {
    try {
      const response = await api.delete(`/customers/${customerId}`);
      
      // Refresh cache to remove deleted customer
      await this.getCustomers(true);
      
      return response.data;
    } catch (error) {
      console.error('Failed to delete customer:', error);
      throw error;
    }
  }

  // Get walk-in customer option
  getWalkInCustomer() {
    return {
      id: null,
      name: 'Walk-in Customer',
      email: '',
      phone: '',
      isWalkIn: true
    };
  }

  // Retry failed requests
  async retry() {
    this.lastError = null;
    return this.getCustomers(true);
  }

  // Get service status
  getStatus() {
    return {
      isLoading: this.isLoading,
      hasError: !!this.lastError,
      error: this.lastError,
      cacheStatus: dropdownCache.has(this.cacheKey) ? 'cached' : 'empty',
      lastUpdated: dropdownCache.get(this.cacheKey) ? 
        new Date(dropdownCache.cache.get(this.cacheKey)?.timestamp).toISOString() : null
    };
  }
}

// Create singleton instance
const customerService = new CustomerService();

export default customerService;