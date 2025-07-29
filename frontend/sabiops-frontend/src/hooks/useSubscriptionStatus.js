import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import PaystackService from '../services/PaystackService';

/**
 * Custom hook for managing subscription status and usage tracking
 */
export const useSubscriptionStatus = (options = {}) => {
  const { 
    refreshInterval = 30000, // 30 seconds
    autoRefresh = true,
    includeUsage = true 
  } = options;
  
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [usageStatus, setUsageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSubscriptionData = useCallback(async (showLoading = true) => {
    if (!user) return;
    
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const promises = [PaystackService.getSubscriptionStatus()];
      
      if (includeUsage) {
        promises.push(PaystackService.getUsageStatus());
      }
      
      const responses = await Promise.all(promises);
      const [statusResponse, usageResponse] = responses;
      
      if (statusResponse?.success) {
        setSubscriptionStatus(statusResponse.data);
      } else {
        throw new Error(statusResponse?.message || 'Failed to fetch subscription status');
      }
      
      if (includeUsage && usageResponse?.success) {
        setUsageStatus(usageResponse.data);
      }
      
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user, includeUsage]);

  // Initial fetch
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;
    
    const interval = setInterval(() => {
      fetchSubscriptionData(false); // Don't show loading for background refreshes
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSubscriptionData, user]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchSubscriptionData(true);
  }, [fetchSubscriptionData]);

  // Check if user can create a specific feature
  const canCreateFeature = useCallback((featureType) => {
    if (!usageStatus?.current_usage?.[featureType]) {
      return { canCreate: true, reason: null };
    }
    
    const usage = usageStatus.current_usage[featureType];
    
    if (usage.current >= usage.limit) {
      return {
        canCreate: false,
        reason: `You have reached your ${featureType} limit (${usage.current}/${usage.limit}). Please upgrade to continue.`,
        usage
      };
    }
    
    return { canCreate: true, usage };
  }, [usageStatus]);

  // Get usage warnings
  const getUsageWarnings = useCallback(() => {
    if (!usageStatus?.current_usage) return [];
    
    const warnings = [];
    
    Object.entries(usageStatus.current_usage).forEach(([feature, data]) => {
      if (data.percentage >= 80 && data.percentage < 100) {
        warnings.push({
          feature,
          percentage: data.percentage,
          current: data.current,
          limit: data.limit,
          type: 'warning',
          message: `You've used ${data.percentage.toFixed(0)}% of your ${feature} limit`
        });
      } else if (data.percentage >= 100) {
        warnings.push({
          feature,
          percentage: data.percentage,
          current: data.current,
          limit: data.limit,
          type: 'limit_reached',
          message: `You've reached your ${feature} limit. Upgrade to continue.`
        });
      }
    });
    
    return warnings;
  }, [usageStatus]);

  // Check if subscription is expiring soon
  const isExpiringSoon = useCallback((days = 3) => {
    if (!subscriptionStatus) return false;
    
    const { remaining_days, subscription_plan } = subscriptionStatus;
    
    if (subscription_plan === 'free') return false;
    
    return remaining_days > 0 && remaining_days <= days;
  }, [subscriptionStatus]);

  // Get subscription status summary
  const getStatusSummary = useCallback(() => {
    if (!subscriptionStatus) return null;
    
    const { subscription_plan, is_trial, is_active, remaining_days } = subscriptionStatus;
    
    let status = 'inactive';
    let message = 'No active subscription';
    let color = 'gray';
    
    if (subscription_plan === 'free') {
      status = 'free';
      message = 'Free Plan';
      color = 'gray';
    } else if (is_trial) {
      status = 'trial';
      message = `Trial - ${remaining_days} days left`;
      color = 'blue';
    } else if (is_active) {
      status = 'active';
      message = remaining_days === -1 ? 'Active' : `Active - ${remaining_days} days left`;
      color = 'green';
    }
    
    return {
      status,
      message,
      color,
      isActive: is_active,
      isTrial: is_trial,
      remainingDays: remaining_days,
      plan: subscription_plan
    };
  }, [subscriptionStatus]);

  return {
    // Data
    subscriptionStatus,
    usageStatus,
    loading,
    error,
    lastUpdated,
    
    // Functions
    refresh,
    canCreateFeature,
    getUsageWarnings,
    isExpiringSoon,
    getStatusSummary,
    
    // Computed values
    isActive: subscriptionStatus?.is_active || false,
    isTrial: subscriptionStatus?.is_trial || false,
    plan: subscriptionStatus?.subscription_plan || 'free',
    remainingDays: subscriptionStatus?.remaining_days || 0,
    warnings: getUsageWarnings()
  };
};

export default useSubscriptionStatus;