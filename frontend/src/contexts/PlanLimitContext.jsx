import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

// Create context
const PlanLimitContext = createContext();

/**
 * Provider component for plan limits and usage tracking
 */
export const PlanLimitProvider = ({ children }) => {
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
      
      // Set default usage data based on plan limits
      if (user && user.subscription_plan) {
        const plan = user.subscription_plan.toLowerCase();
        const limits = planLimits[plan] || planLimits.free;
        
        // Create default usage data structure
        const defaultUsageData = {
          user_id: user.id,
          subscription_plan: plan,
          subscription_status: user.subscription_status || 'inactive',
          trial_days_left: user.trial_days_left || 0,
          features: {
            invoices: {
              feature_type: 'invoices',
              current_count: 0,
              limit_count: limits.invoices,
              usage_percentage: 0,
            },
            expenses: {
              feature_type: 'expenses',
              current_count: 0,
              limit_count: limits.expenses,
              usage_percentage: 0,
            },
            sales: {
              feature_type: 'sales',
              current_count: 0,
              limit_count: limits.sales,
              usage_percentage: 0,
            },
            products: {
              feature_type: 'products',
              current_count: 0,
              limit_count: limits.products,
              usage_percentage: 0,
            },
          },
        };
        
        setUsageData(defaultUsageData);
      }
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
      
      // Fallback to local check if API fails
      if (usageData && usageData.features && usageData.features[featureType]) {
        const feature = usageData.features[featureType];
        return {
          canUse: feature.current_count < feature.limit_count,
          currentCount: feature.current_count,
          limitCount: feature.limit_count,
          usagePercentage: feature.usage_percentage,
        };
      }
      
      return {
        canUse: false,
        error: err.response?.data?.detail || 'Failed to check feature access',
        currentCount: 0,
        limitCount: 0,
        usagePercentage: 0,
      };
    }
  }, [user, usageData]);

  // Get the limit for a specific feature based on the user's plan
  const getFeatureLimit = useCallback((featureType) => {
    // First try to get from API data
    if (usageData && usageData.features && usageData.features[featureType]) {
      return usageData.features[featureType].limit_count;
    }
    
    // Fallback to hardcoded limits
    if (!user || !user.subscription_plan) return planLimits.free[featureType] || 0;

    const plan = user.subscription_plan.toLowerCase();
    return (planLimits[plan] && planLimits[plan][featureType]) || planLimits.free[featureType] || 0;
  }, [user, usageData]);

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

  // Update local usage data after an action
  const updateLocalUsage = useCallback((featureType) => {
    if (!usageData || !usageData.features || !usageData.features[featureType]) return;
    
    setUsageData(prevData => {
      const newData = { ...prevData };
      const feature = { ...newData.features[featureType] };
      
      feature.current_count += 1;
      feature.usage_percentage = feature.limit_count > 0 
        ? Math.round((feature.current_count / feature.limit_count) * 100) 
        : 0;
      
      newData.features[featureType] = feature;
      return newData;
    });
  }, [usageData]);

  // Load usage data on component mount and when user changes
  useEffect(() => {
    fetchUsageData();
    
    // Refresh usage data every 5 minutes
    const intervalId = setInterval(fetchUsageData, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchUsageData]);

  // Context value
  const value = {
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
    updateLocalUsage,
    planLimits,
  };

  return <PlanLimitContext.Provider value={value}>{children}</PlanLimitContext.Provider>;
};

// Custom hook to use the plan limit context
export const usePlanLimit = () => {
  const context = useContext(PlanLimitContext);
  if (context === undefined) {
    throw new Error('usePlanLimit must be used within a PlanLimitProvider');
  }
  return context;
};

export default PlanLimitContext;