import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiClient } from '../services/apiClient';
import { enhancedNotificationService } from '../services/EnhancedNotificationService';

const PlanLimitContext = createContext();

export const usePlanLimitContext = () => {
  const context = useContext(PlanLimitContext);
  if (!context) {
    throw new Error('usePlanLimitContext must be used within a PlanLimitProvider');
  }
  return context;
};

export const PlanLimitProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Plan limits and usage state
  const [planLimits, setPlanLimits] = useState({});
  const [usage, setUsage] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Subscription state
  const [subscription, setSubscription] = useState(null);
  const [upgradePrompts, setUpgradePrompts] = useState([]);
  
  // Cache and refresh control
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const CACHE_DURATION = 60000; // 1 minute cache

  /**
   * Fetch usage limits and current usage
   */
  const fetchUsageLimits = useCallback(async (force = false) => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Check cache unless forced
    const now = Date.now();
    if (!force && (now - lastFetchTime) < CACHE_DURATION) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get('/api/subscription/usage-limits');
      const data = response.data;

      if (data) {
        setPlanLimits(data.limits || {});
        setUsage(data.usage || {});
        setSubscription(data.subscription || null);
        setUpgradePrompts(data.upgrade_suggestions || []);
        setLastFetchTime(now);
      }

    } catch (err) {
      console.error('Failed to fetch usage limits:', err);
      setError('Failed to load usage limits');
      
      // Don't clear existing data on error, just log it
      if (err.response?.status === 401) {
        // Authentication error - clear data
        setPlanLimits({});
        setUsage({});
        setSubscription(null);
        setUpgradePrompts([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, lastFetchTime]);

  /**
   * Initialize and set up periodic refresh
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUsageLimits(true);
      
      // Set up periodic refresh every 5 minutes
      const interval = setInterval(() => {
        fetchUsageLimits(false);
      }, 300000); // 5 minutes
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Clear data when not authenticated
      setPlanLimits({});
      setUsage({});
      setSubscription(null);
      setUpgradePrompts([]);
      
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [isAuthenticated, user, fetchUsageLimits]);

  /**
   * Check if a feature limit is exceeded
   */
  const isLimitExceeded = useCallback((featureType) => {
    if (!planLimits[featureType] || planLimits.unlimited) {
      return false;
    }
    
    const currentUsage = usage[featureType] || 0;
    const limit = planLimits[featureType] || 0;
    
    return currentUsage >= limit;
  }, [planLimits, usage]);

  /**
   * Check if approaching limit (80% threshold)
   */
  const isApproachingLimit = useCallback((featureType, threshold = 0.8) => {
    if (!planLimits[featureType] || planLimits.unlimited) {
      return false;
    }
    
    const currentUsage = usage[featureType] || 0;
    const limit = planLimits[featureType] || 0;
    
    return (currentUsage / limit) >= threshold;
  }, [planLimits, usage]);

  /**
   * Get usage percentage for a feature
   */
  const getUsagePercentage = useCallback((featureType) => {
    if (!planLimits[featureType] || planLimits.unlimited) {
      return 0;
    }
    
    const currentUsage = usage[featureType] || 0;
    const limit = planLimits[featureType] || 1;
    
    return Math.min((currentUsage / limit) * 100, 100);
  }, [planLimits, usage]);

  /**
   * Get remaining usage for a feature
   */
  const getRemainingUsage = useCallback((featureType) => {
    if (!planLimits[featureType] || planLimits.unlimited) {
      return Infinity;
    }
    
    const currentUsage = usage[featureType] || 0;
    const limit = planLimits[featureType] || 0;
    
    return Math.max(limit - currentUsage, 0);
  }, [planLimits, usage]);

  /**
   * Check if user can perform an action
   */
  const canPerformAction = useCallback((featureType, quantity = 1) => {
    if (!planLimits[featureType] || planLimits.unlimited) {
      return true;
    }
    
    const remaining = getRemainingUsage(featureType);
    return remaining >= quantity;
  }, [planLimits, getRemainingUsage]);

  /**
   * Show limit warning notification
   */
  const showLimitWarning = useCallback((featureType) => {
    const percentage = getUsagePercentage(featureType);
    const remaining = getRemainingUsage(featureType);
    
    if (percentage >= 90) {
      enhancedNotificationService.showToast(
        `You've used ${percentage.toFixed(0)}% of your ${featureType} limit. Only ${remaining} remaining.`,
        'warning',
        { duration: 8000 }
      );
    } else if (percentage >= 80) {
      enhancedNotificationService.showToast(
        `You're approaching your ${featureType} limit (${percentage.toFixed(0)}% used).`,
        'warning',
        { duration: 6000 }
      );
    }
  }, [getUsagePercentage, getRemainingUsage]);

  /**
   * Show limit exceeded notification
   */
  const showLimitExceeded = useCallback((featureType) => {
    enhancedNotificationService.showToast(
      `You've reached your ${featureType} limit. Upgrade your plan to continue.`,
      'error',
      { duration: 10000 }
    );
  }, []);

  /**
   * Increment usage for a feature (optimistic update)
   */
  const incrementUsage = useCallback((featureType, quantity = 1) => {
    setUsage(prevUsage => ({
      ...prevUsage,
      [featureType]: (prevUsage[featureType] || 0) + quantity
    }));
    
    // Check if we should show warnings
    setTimeout(() => {
      if (isLimitExceeded(featureType)) {
        showLimitExceeded(featureType);
      } else if (isApproachingLimit(featureType)) {
        showLimitWarning(featureType);
      }
    }, 100);
    
    // Refresh actual usage from server
    setTimeout(() => {
      fetchUsageLimits(true);
    }, 1000);
  }, [isLimitExceeded, isApproachingLimit, showLimitExceeded, showLimitWarning, fetchUsageLimits]);

  /**
   * Get plan upgrade suggestions
   */
  const getUpgradeSuggestions = useCallback(() => {
    return upgradePrompts.filter(prompt => {
      // Show urgent prompts always
      if (prompt.urgent) return true;
      
      // Show limit warnings if approaching or exceeded
      const featureType = prompt.limitType;
      return featureType && (isLimitExceeded(featureType) || isApproachingLimit(featureType));
    });
  }, [upgradePrompts, isLimitExceeded, isApproachingLimit]);

  /**
   * Check multiple features at once
   */
  const checkLimits = useCallback((features) => {
    const results = {};
    
    features.forEach(feature => {
      results[feature] = {
        exceeded: isLimitExceeded(feature),
        approaching: isApproachingLimit(feature),
        percentage: getUsagePercentage(feature),
        remaining: getRemainingUsage(feature),
        canPerform: canPerformAction(feature)
      };
    });
    
    return results;
  }, [isLimitExceeded, isApproachingLimit, getUsagePercentage, getRemainingUsage, canPerformAction]);

  /**
   * Get plan information
   */
  const getPlanInfo = useCallback(() => {
    if (!subscription) {
      return {
        plan: 'free',
        status: 'unknown',
        isTrialUser: false,
        trialDaysLeft: 0,
        isFreePlan: true
      };
    }
    
    return {
      plan: subscription.plan || 'free',
      status: subscription.status || 'unknown',
      isTrialUser: subscription.is_trial || false,
      trialDaysLeft: subscription.trial_days_left || 0,
      isFreePlan: subscription.plan === 'free',
      subscriptionEnd: subscription.subscription_end,
      features: subscription.features || []
    };
  }, [subscription]);

  /**
   * Force refresh usage data
   */
  const refreshUsage = useCallback(() => {
    return fetchUsageLimits(true);
  }, [fetchUsageLimits]);

  /**
   * Get feature status summary
   */
  const getFeatureStatusSummary = useCallback(() => {
    const features = ['invoices', 'expenses', 'sales', 'products'];
    const summary = {
      totalFeatures: features.length,
      exceededCount: 0,
      approachingCount: 0,
      warningFeatures: [],
      exceededFeatures: []
    };
    
    features.forEach(feature => {
      if (isLimitExceeded(feature)) {
        summary.exceededCount++;
        summary.exceededFeatures.push(feature);
      } else if (isApproachingLimit(feature)) {
        summary.approachingCount++;
        summary.warningFeatures.push(feature);
      }
    });
    
    return summary;
  }, [isLimitExceeded, isApproachingLimit]);

  const contextValue = {
    // State
    planLimits,
    usage,
    subscription,
    upgradePrompts,
    isLoading,
    error,
    
    // Limit checking functions
    isLimitExceeded,
    isApproachingLimit,
    canPerformAction,
    checkLimits,
    
    // Usage functions
    getUsagePercentage,
    getRemainingUsage,
    incrementUsage,
    
    // Plan information
    getPlanInfo,
    getUpgradeSuggestions,
    getFeatureStatusSummary,
    
    // Actions
    refreshUsage,
    showLimitWarning,
    showLimitExceeded,
    
    // Utility functions for components
    checkLimit: (featureType) => getUsagePercentage(featureType) / 100, // Returns 0-1 for progress bars
    hasUnlimitedAccess: () => planLimits.unlimited || false,
    isFreePlan: () => getPlanInfo().isFreePlan,
    isTrialUser: () => getPlanInfo().isTrialUser,
    getTrialDaysLeft: () => getPlanInfo().trialDaysLeft
  };

  return (
    <PlanLimitContext.Provider value={contextValue}>
      {children}
    </PlanLimitContext.Provider>
  );
};

