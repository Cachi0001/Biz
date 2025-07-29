import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';

/**
 * Hook for tracking feature usage and enforcing plan limits
 * @returns {Object} Usage tracking methods and state
 */
export const useUsageTracking = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Define plan limits
  const planLimits = {
    free: {
      invoices: 5,
      expenses: 20,
      sales: 50,
      products: 20,
    },
    weekly: {
      invoices: 50,
      expenses: 100,
      sales: 200,
      products: 100,
    },
    monthly: {
      invoices: 200,
      expenses: 500,
      sales: 1000,
      products: 500,
    },
    yearly: {
      invoices: 1000,
      expenses: 2000,
      sales: 5000,
      products: 2000,
    },
    silver_weekly: {
      invoices: 50,
      expenses: 100,
      sales: 200,
      products: 100,
    },
    silver_monthly: {
      invoices: 200,
      expenses: 500,
      sales: 1000,
      products: 500,
    },
    silver_yearly: {
      invoices: 1000,
      expenses: 2000,
      sales: 5000,
      products: 2000,
    },
  };

  // Fetch usage data from the server
  const fetchUsageData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/usage/');
      setUsageData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check if a feature can be used based on current usage
  const checkFeatureAccess = useCallback(async (featureType) => {
    if (!user) return { canUse: false, error: 'Not authenticated' };

    try {
      const response = await api.post('/usage/check', { feature_type: featureType });
      return {
        canUse: response.data.can_use,
        currentCount: response.data.current_count,
        limitCount: response.data.limit_count,
        usagePercentage: response.data.usage_percentage,
      };
    } catch (err) {
      console.error(`Error checking ${featureType} access:`, err);
      return {
        canUse: false,
        error: err.response?.data?.detail || 'Failed to check feature access',
        currentCount: 0,
        limitCount: 0,
        usagePercentage: 0,
      };
    }
  }, [user]);

  // Get the limit for a specific feature based on the user's plan
  const getFeatureLimit = useCallback((featureType) => {
    if (!user || !user.subscription_plan) return planLimits.free[featureType] || 0;

    const plan = user.subscription_plan.toLowerCase();
    return (planLimits[plan] && planLimits[plan][featureType]) || planLimits.free[featureType] || 0;
  }, [user]);

  // Check if usage is approaching the limit (80% or more)
  const isApproachingLimit = useCallback((featureType) => {
    if (!usageData || !usageData.features) return false;

    const feature = usageData.features[featureType];
    if (!feature) return false;

    return feature.usage_percentage >= 80 && feature.usage_percentage < 100;
  }, [usageData]);

  // Check if usage has reached the limit
  const isAtLimit = useCallback((featureType) => {
    if (!usageData || !usageData.features) return false;

    const feature = usageData.features[featureType];
    if (!feature) return false;

    return feature.usage_percentage >= 100;
  }, [usageData]);

  // Get current usage count for a feature
  const getCurrentUsage = useCallback((featureType) => {
    if (!usageData || !usageData.features) return 0;

    const feature = usageData.features[featureType];
    return feature ? feature.current_count : 0;
  }, [usageData]);

  // Get usage percentage for a feature
  const getUsagePercentage = useCallback((featureType) => {
    if (!usageData || !usageData.features) return 0;

    const feature = usageData.features[featureType];
    return feature ? feature.usage_percentage : 0;
  }, [usageData]);

  // Load usage data on component mount and when user changes
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  return {
    usageData,
    loading,
    error,
    fetchUsageData,
    checkFeatureAccess,
    getFeatureLimit,
    isApproachingLimit,
    isAtLimit,
    getCurrentUsage,
    getUsagePercentage,
  };
};

export default useUsageTracking;