// Custom hook for payment method data management
// Mirrors the API & fallback behaviour described in enhanced-payment-sales-management/design.md
// Provides: paymentMethods, loading, error, refresh, retry, getMethodById

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// Fallback mock list (matches PaymentMethodSelector.jsx sample)
const FALLBACK_PAYMENT_METHODS = [
  {
    id: 'cash',
    name: 'Cash',
    type: 'Cash',
    is_pos: false,
    requires_reference: false,
    description: 'Cash payments',
    display_name: 'Cash'
  },
  {
    id: 'pos_cash',
    name: 'POS (Cash)',
    type: 'Cash',
    is_pos: true,
    requires_reference: true,
    description: 'POS cash collection',
    display_name: 'POS Cash'
  },
  {
    id: 'transfer',
    name: 'Bank Transfer',
    type: 'Digital',
    is_pos: false,
    requires_reference: true,
    description: 'Bank transfer',
    display_name: 'Bank Transfer'
  },
  {
    id: 'credit',
    name: 'Credit',
    type: 'Credit',
    is_pos: false,
    requires_reference: false,
    description: 'Credit sales (pay later)',
    display_name: 'Credit'
  }
];

const paymentMethodService = {
  async fetchPaymentMethods(forceRefresh = false) {
    // In future this could cache results; for now forceRefresh unused
    try {
      const res = await fetch('/api/payments/methods');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      // Expect array of records in API; fallback to mock if unexpected
      if (Array.isArray(json) && json.length) return json;
      return FALLBACK_PAYMENT_METHODS;
    } catch (err) {
      console.error('[paymentMethodService] fetch error:', err);
      return FALLBACK_PAYMENT_METHODS;
    }
  }
};

export const usePaymentMethods = (options = {}) => {
  const { autoLoad = true, onError = null } = options;

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMethods = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentMethodService.fetchPaymentMethods(forceRefresh);
      setPaymentMethods(data);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      setError(err);
      if (onError) onError(err);
      toast.error('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const refresh = useCallback(() => loadMethods(true), [loadMethods]);

  const retry = useCallback(() => {
    setError(null);
    return loadMethods(true);
  }, [loadMethods]);

  const getMethodById = useCallback(
    (id) => paymentMethods.find((m) => String(m.id) === String(id)) || null,
    [paymentMethods]
  );

  useEffect(() => {
    if (autoLoad) loadMethods();
  }, [autoLoad, loadMethods]);

  return {
    paymentMethods,
    loading,
    error,
    lastUpdated,
    refresh,
    retry,
    getMethodById
  };
};
