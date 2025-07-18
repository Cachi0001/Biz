import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for tracking real-time usage of plan-limited resources
 */
export const useUsageTracking = () => {
  const { user, subscription } = useAuth();
  const [usage, setUsage] = useState({
    invoices: 0,
    expenses: 0,
    customers: 0,
    products: 0,
    lastReset: new Date().toISOString()
  });

  // Load usage from localStorage on mount
  useEffect(() => {
    loadUsageFromStorage();
  }, []);

  // Load usage data from localStorage
  const loadUsageFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem('usage_tracking');
      if (stored) {
        const parsedUsage = JSON.parse(stored);
        
        // Check if we need to reset monthly counters
        const now = new Date();
        const lastReset = new Date(parsedUsage.lastReset || 0);
        const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                           now.getFullYear() !== lastReset.getFullYear();
        
        if (shouldReset) {
          const resetUsage = {
            invoices: 0,
            expenses: 0,
            customers: parsedUsage.customers || 0, // Keep cumulative counters
            products: parsedUsage.products || 0,
            lastReset: now.toISOString()
          };
          
          setUsage(resetUsage);
          localStorage.setItem('usage_tracking', JSON.stringify(resetUsage));
        } else {
          setUsage(parsedUsage);
        }
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
      // Initialize with default values
      const defaultUsage = {
        invoices: 0,
        expenses: 0,
        customers: 0,
        products: 0,
        lastReset: new Date().toISOString()
      };
      setUsage(defaultUsage);
      localStorage.setItem('usage_tracking', JSON.stringify(defaultUsage));
    }
  }, []);

  // Save usage to localStorage
  const saveUsageToStorage = useCallback((newUsage) => {
    try {
      localStorage.setItem('usage_tracking', JSON.stringify(newUsage));
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }, []);

  // Increment usage for a specific resource
  const incrementUsage = useCallback(async (resourceType, amount = 1) => {
    const newUsage = {
      ...usage,
      [resourceType]: (usage[resourceType] || 0) + amount
    };
    
    setUsage(newUsage);
    saveUsageToStorage(newUsage);
    
    // In a real app, you might also sync with the server
    try {
      await syncUsageWithServer(resourceType, newUsage[resourceType]);
    } catch (error) {
      console.warn('Failed to sync usage with server:', error);
      // Continue with local tracking even if server sync fails
    }
    
    return newUsage;
  }, [usage, saveUsageToStorage]);

  // Decrement usage for a specific resource (e.g., when deleting)
  const decrementUsage = useCallback(async (resourceType, amount = 1) => {
    const newUsage = {
      ...usage,
      [resourceType]: Math.max(0, (usage[resourceType] || 0) - amount)
    };
    
    setUsage(newUsage);
    saveUsageToStorage(newUsage);
    
    try {
      await syncUsageWithServer(resourceType, newUsage[resourceType]);
    } catch (error) {
      console.warn('Failed to sync usage with server:', error);
    }
    
    return newUsage;
  }, [usage, saveUsageToStorage]);

  // Set usage for a specific resource (for corrections or server sync)
  const setUsageCount = useCallback(async (resourceType, count) => {
    const newUsage = {
      ...usage,
      [resourceType]: Math.max(0, count)
    };
    
    setUsage(newUsage);
    saveUsageToStorage(newUsage);
    
    return newUsage;
  }, [usage, saveUsageToStorage]);

  // Get current usage status
  const getUsageStatus = useCallback(() => {
    return { ...usage };
  }, [usage]);

  // Get usage percentage for a resource
  const getUsagePercentage = useCallback((resourceType) => {
    const planLimits = getPlanLimits();
    const currentUsage = usage[resourceType] || 0;
    const limit = planLimits[resourceType];
    
    if (!limit || typeof limit !== 'number') return 0;
    
    return Math.min(100, Math.round((currentUsage / limit) * 100));
  }, [usage]);

  // Get plan limits based on subscription
  const getPlanLimits = useCallback(() => {
    const plan = subscription?.plan || 'free';
    
    const limits = {
      free: {
        invoices: 5,
        expenses: 5,
        customers: 50,
        products: 20
      },
      silver_weekly: {
        invoices: 100,
        expenses: 100,
        customers: 500,
        products: 200
      },
      silver_monthly: {
        invoices: 500,
        expenses: 500,
        customers: 2000,
        products: 1000
      },
      silver_yearly: {
        invoices: 6000,
        expenses: 6000,
        customers: 10000,
        products: 5000
      }
    };

    return limits[plan] || limits.free;
  }, [subscription?.plan]);

  // Check if approaching limit (default 80% threshold)
  const isApproachingLimit = useCallback((resourceType, threshold = 0.8) => {
    const planLimits = getPlanLimits();
    const currentUsage = usage[resourceType] || 0;
    const limit = planLimits[resourceType];
    
    if (!limit || typeof limit !== 'number') return false;
    
    return (currentUsage / limit) >= threshold;
  }, [usage, getPlanLimits]);

  // Check if at or over limit
  const isAtLimit = useCallback((resourceType) => {
    const planLimits = getPlanLimits();
    const currentUsage = usage[resourceType] || 0;
    const limit = planLimits[resourceType];
    
    if (!limit || typeof limit !== 'number') return false;
    
    return currentUsage >= limit;
  }, [usage, getPlanLimits]);

  // Get remaining usage for a resource
  const getRemainingUsage = useCallback((resourceType) => {
    const planLimits = getPlanLimits();
    const currentUsage = usage[resourceType] || 0;
    const limit = planLimits[resourceType];
    
    if (!limit || typeof limit !== 'number') return Infinity;
    
    return Math.max(0, limit - currentUsage);
  }, [usage, getPlanLimits]);

  // Reset usage (for testing or new billing period)
  const resetUsage = useCallback(async (resourceTypes = null) => {
    let newUsage;
    
    if (resourceTypes) {
      // Reset specific resource types
      newUsage = { ...usage };
      resourceTypes.forEach(type => {
        newUsage[type] = 0;
      });
    } else {
      // Reset all usage
      newUsage = {
        invoices: 0,
        expenses: 0,
        customers: 0,
        products: 0,
        lastReset: new Date().toISOString()
      };
    }
    
    setUsage(newUsage);
    saveUsageToStorage(newUsage);
    
    return newUsage;
  }, [usage, saveUsageToStorage]);

  // Sync usage with server (placeholder for real implementation)
  const syncUsageWithServer = useCallback(async (resourceType, count) => {
    // In a real app, this would make an API call to update server-side usage tracking
    // For now, we'll just simulate the call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Synced ${resourceType} usage: ${count}`);
        resolve({ success: true });
      }, 100);
    });
  }, []);

  // Fetch usage from server (for initial load or sync)
  const fetchUsageFromServer = useCallback(async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll just return the local usage
      return usage;
    } catch (error) {
      console.error('Failed to fetch usage from server:', error);
      return usage;
    }
  }, [usage]);

  // Get usage summary with warnings and limits
  const getUsageSummary = useCallback(() => {
    const planLimits = getPlanLimits();
    const summary = {
      plan: subscription?.plan || 'free',
      usage: { ...usage },
      limits: planLimits,
      warnings: [],
      blocked: []
    };
    
    // Check each resource for warnings and blocks
    Object.keys(planLimits).forEach(resourceType => {
      const currentUsage = usage[resourceType] || 0;
      const limit = planLimits[resourceType];
      
      if (typeof limit === 'number') {
        const percentage = (currentUsage / limit) * 100;
        
        if (percentage >= 100) {
          summary.blocked.push({
            resource: resourceType,
            usage: currentUsage,
            limit,
            percentage: 100
          });
        } else if (percentage >= 80) {
          summary.warnings.push({
            resource: resourceType,
            usage: currentUsage,
            limit,
            percentage: Math.round(percentage)
          });
        }
      }
    });
    
    return summary;
  }, [usage, subscription, getPlanLimits]);

  return {
    // Usage data
    usage,
    getUsageStatus,
    getUsagePercentage,
    getUsageSummary,
    
    // Usage modification
    incrementUsage,
    decrementUsage,
    setUsageCount,
    resetUsage,
    
    // Limit checking
    isApproachingLimit,
    isAtLimit,
    getRemainingUsage,
    getPlanLimits,
    
    // Server sync
    syncUsageWithServer,
    fetchUsageFromServer,
    
    // Utility
    loadUsageFromStorage
  };
};