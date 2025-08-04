// Custom hook for customer data management
import { useState, useEffect, useCallback } from 'react';
import customerService from '../services/customerService';

export const useCustomers = (options = {}) => {
  const {
    autoLoad = true,
    includeWalkIn = true,
    onError = null
  } = options;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Load customers
  const loadCustomers = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const customerData = await customerService.getCustomers(forceRefresh);
      let finalCustomers = [...customerData];

      // Add walk-in customer option if requested
      if (includeWalkIn) {
        finalCustomers.unshift(customerService.getWalkInCustomer());
      }

      setCustomers(finalCustomers);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  }, [includeWalkIn, onError]);

  // Refresh customers
  const refresh = useCallback(() => {
    return loadCustomers(true);
  }, [loadCustomers]);

  // Search customers
  const searchCustomers = useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === '') {
      return loadCustomers();
    }

    setLoading(true);
    setError(null);

    try {
      const results = await customerService.searchCustomers(searchTerm);
      let finalResults = [...results];

      // Add walk-in customer option if requested and search is not too specific
      if (includeWalkIn && searchTerm.toLowerCase().includes('walk')) {
        finalResults.unshift(customerService.getWalkInCustomer());
      }

      setCustomers(finalResults);
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [includeWalkIn, onError, loadCustomers]);

  // Get customer by ID
  const getCustomerById = useCallback(async (customerId) => {
    try {
      return await customerService.getCustomerById(customerId);
    } catch (err) {
      console.error('Failed to get customer by ID:', err);
      return null;
    }
  }, []);

  // Add new customer
  const addCustomer = useCallback(async (customerData) => {
    try {
      const newCustomer = await customerService.addCustomer(customerData);
      await loadCustomers(true); // Refresh list
      return newCustomer;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadCustomers, onError]);

  // Update customer
  const updateCustomer = useCallback(async (customerId, customerData) => {
    try {
      const updatedCustomer = await customerService.updateCustomer(customerId, customerData);
      await loadCustomers(true); // Refresh list
      return updatedCustomer;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadCustomers, onError]);

  // Delete customer
  const deleteCustomer = useCallback(async (customerId) => {
    try {
      const result = await customerService.deleteCustomer(customerId);
      await loadCustomers(true); // Refresh list
      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [loadCustomers, onError]);

  // Retry failed operations
  const retry = useCallback(async () => {
    setError(null);
    return customerService.retry().then(() => loadCustomers(true));
  }, [loadCustomers]);

  // Subscribe to customer data changes
  useEffect(() => {
    const unsubscribe = customerService.subscribe((data) => {
      if (data) {
        let finalCustomers = [...data];
        if (includeWalkIn) {
          finalCustomers.unshift(customerService.getWalkInCustomer());
        }
        setCustomers(finalCustomers);
        setLastUpdated(new Date().toISOString());
      }
    });

    return unsubscribe;
  }, [includeWalkIn]);

  // Auto-load customers on mount
  useEffect(() => {
    if (autoLoad) {
      loadCustomers();
    }
  }, [autoLoad, loadCustomers]);

  // Get service status
  const getStatus = useCallback(() => {
    return customerService.getStatus();
  }, []);

  return {
    customers,
    loading,
    error,
    lastUpdated,
    loadCustomers,
    refresh,
    searchCustomers,
    getCustomerById,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    retry,
    getStatus
  };
};