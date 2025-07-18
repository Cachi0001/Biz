/**
 * Service for tracking usage across the application
 * This service provides methods to track resource usage and integrate with existing components
 */

class UsageTrackingService {
  constructor() {
    this.listeners = new Set();
    this.usage = this.loadUsage();
  }

  // Load usage from localStorage
  loadUsage() {
    try {
      const stored = localStorage.getItem('usage_tracking');
      if (stored) {
        const usage = JSON.parse(stored);
        
        // Check if we need to reset monthly counters
        const now = new Date();
        const lastReset = new Date(usage.lastReset || 0);
        const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                           now.getFullYear() !== lastReset.getFullYear();
        
        if (shouldReset) {
          return this.resetMonthlyUsage(usage);
        }
        
        return usage;
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
    
    return this.getDefaultUsage();
  }

  // Get default usage structure
  getDefaultUsage() {
    return {
      invoices: 0,
      expenses: 0,
      customers: 0,
      products: 0,
      lastReset: new Date().toISOString()
    };
  }

  // Reset monthly usage counters
  resetMonthlyUsage(currentUsage) {
    const resetUsage = {
      invoices: 0,
      expenses: 0,
      customers: currentUsage.customers || 0, // Keep cumulative counters
      products: currentUsage.products || 0,
      lastReset: new Date().toISOString()
    };
    
    this.saveUsage(resetUsage);
    return resetUsage;
  }

  // Save usage to localStorage
  saveUsage(usage) {
    try {
      localStorage.setItem('usage_tracking', JSON.stringify(usage));
      this.notifyListeners(usage);
    } catch (error) {
      console.error('Error saving usage data:', error);
    }
  }

  // Add listener for usage changes
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of usage changes
  notifyListeners(usage) {
    this.listeners.forEach(callback => {
      try {
        callback(usage);
      } catch (error) {
        console.error('Error in usage listener:', error);
      }
    });
  }

  // Track invoice creation
  trackInvoiceCreated() {
    this.usage = {
      ...this.usage,
      invoices: (this.usage.invoices || 0) + 1
    };
    this.saveUsage(this.usage);
    return this.usage;
  }

  // Track expense creation
  trackExpenseCreated() {
    this.usage = {
      ...this.usage,
      expenses: (this.usage.expenses || 0) + 1
    };
    this.saveUsage(this.usage);
    return this.usage;
  }

  // Track customer addition
  trackCustomerAdded() {
    this.usage = {
      ...this.usage,
      customers: (this.usage.customers || 0) + 1
    };
    this.saveUsage(this.usage);
    return this.usage;
  }

  // Track product addition
  trackProductAdded() {
    this.usage = {
      ...this.usage,
      products: (this.usage.products || 0) + 1
    };
    this.saveUsage(this.usage);
    return this.usage;
  }

  // Track resource deletion (decrement usage)
  trackResourceDeleted(resourceType) {
    if (this.usage[resourceType] > 0) {
      this.usage = {
        ...this.usage,
        [resourceType]: this.usage[resourceType] - 1
      };
      this.saveUsage(this.usage);
    }
    return this.usage;
  }

  // Get current usage
  getCurrentUsage() {
    return { ...this.usage };
  }

  // Get usage for specific resource
  getResourceUsage(resourceType) {
    return this.usage[resourceType] || 0;
  }

  // Reset all usage (for testing)
  resetAllUsage() {
    this.usage = this.getDefaultUsage();
    this.saveUsage(this.usage);
    return this.usage;
  }

  // Integration helpers for existing components
  
  // Wrap invoice creation functions
  wrapInvoiceCreation(originalFunction) {
    return async (...args) => {
      try {
        const result = await originalFunction(...args);
        this.trackInvoiceCreated();
        return result;
      } catch (error) {
        // Don't track if creation failed
        throw error;
      }
    };
  }

  // Wrap expense creation functions
  wrapExpenseCreation(originalFunction) {
    return async (...args) => {
      try {
        const result = await originalFunction(...args);
        this.trackExpenseCreated();
        return result;
      } catch (error) {
        // Don't track if creation failed
        throw error;
      }
    };
  }

  // Wrap customer creation functions
  wrapCustomerCreation(originalFunction) {
    return async (...args) => {
      try {
        const result = await originalFunction(...args);
        this.trackCustomerAdded();
        return result;
      } catch (error) {
        // Don't track if creation failed
        throw error;
      }
    };
  }

  // Wrap product creation functions
  wrapProductCreation(originalFunction) {
    return async (...args) => {
      try {
        const result = await originalFunction(...args);
        this.trackProductAdded();
        return result;
      } catch (error) {
        // Don't track if creation failed
        throw error;
      }
    };
  }

  // Wrap deletion functions
  wrapResourceDeletion(resourceType, originalFunction) {
    return async (...args) => {
      try {
        const result = await originalFunction(...args);
        this.trackResourceDeleted(resourceType);
        return result;
      } catch (error) {
        // Don't track if deletion failed
        throw error;
      }
    };
  }

  // Get usage statistics
  getUsageStats() {
    return {
      total: Object.values(this.usage).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0
      ),
      breakdown: { ...this.usage },
      lastReset: this.usage.lastReset
    };
  }

  // Methods for AuthContext compatibility
  startTracking(userData) {
    // Initialize tracking for the user
    console.log('Usage tracking started for user:', userData?.email);
    this.currentUser = userData;
    return this;
  }

  stopTracking() {
    // Stop tracking
    console.log('Usage tracking stopped');
    this.currentUser = null;
    return this;
  }

  hasReachedLimit(limitType, user) {
    if (!user?.subscription?.usage_limits) return false;
    const currentUsage = this.usage[limitType] || 0;
    const limit = user.subscription.usage_limits[limitType];
    return currentUsage >= limit;
  }

  isNearLimit(limitType, user, threshold = 0.8) {
    if (!user?.subscription?.usage_limits) return false;
    const currentUsage = this.usage[limitType] || 0;
    const limit = user.subscription.usage_limits[limitType];
    return (currentUsage / limit) >= threshold;
  }

  validateAction(actionType, user) {
    const limitType = this.getActionLimitType(actionType);
    if (!limitType) return { allowed: true };
    
    const hasReached = this.hasReachedLimit(limitType, user);
    return {
      allowed: !hasReached,
      limitType,
      currentUsage: this.usage[limitType] || 0,
      limit: user?.subscription?.usage_limits?.[limitType] || 0
    };
  }

  getUsageStatus(limitType, user) {
    const currentUsage = this.usage[limitType] || 0;
    const limit = user?.subscription?.usage_limits?.[limitType] || 0;
    return {
      current: currentUsage,
      limit,
      percentage: limit > 0 ? Math.round((currentUsage / limit) * 100) : 0,
      remaining: Math.max(0, limit - currentUsage)
    };
  }

  getEffectiveSubscription(user) {
    return user?.subscription || {
      plan: 'free',
      status: 'active',
      usage_limits: { invoices: 5, expenses: 5 }
    };
  }

  getUpgradeRecommendations(user) {
    const recommendations = [];
    const limits = user?.subscription?.usage_limits || {};
    
    Object.keys(limits).forEach(limitType => {
      if (this.isNearLimit(limitType, user, 0.8)) {
        recommendations.push({
          type: limitType,
          reason: `Approaching ${limitType} limit`,
          urgency: this.hasReachedLimit(limitType, user) ? 'high' : 'medium'
        });
      }
    });
    
    return recommendations;
  }

  showIntelligentUpgradePrompt(user, actionType) {
    const recommendations = this.getUpgradeRecommendations(user);
    if (recommendations.length > 0) {
      console.log('Upgrade recommended for:', actionType, recommendations);
      // In a real app, this would show a modal or toast
    }
  }

  getActionLimitType(actionType) {
    const actionMap = {
      'create_invoice': 'invoices',
      'create_expense': 'expenses',
      'add_customer': 'customers',
      'add_product': 'products'
    };
    return actionMap[actionType];
  }
}

// Create singleton instance
const usageTrackingService = new UsageTrackingService();

// Export service and helper functions
export default usageTrackingService;

// Helper functions for easy integration
export const trackInvoiceCreated = () => usageTrackingService.trackInvoiceCreated();
export const trackExpenseCreated = () => usageTrackingService.trackExpenseCreated();
export const trackCustomerAdded = () => usageTrackingService.trackCustomerAdded();
export const trackProductAdded = () => usageTrackingService.trackProductAdded();
export const trackResourceDeleted = (type) => usageTrackingService.trackResourceDeleted(type);
export const getCurrentUsage = () => usageTrackingService.getCurrentUsage();
export const addUsageListener = (callback) => usageTrackingService.addListener(callback);

// Integration helpers
export const wrapWithUsageTracking = {
  invoice: (fn) => usageTrackingService.wrapInvoiceCreation(fn),
  expense: (fn) => usageTrackingService.wrapExpenseCreation(fn),
  customer: (fn) => usageTrackingService.wrapCustomerCreation(fn),
  product: (fn) => usageTrackingService.wrapProductCreation(fn),
  deletion: (type, fn) => usageTrackingService.wrapResourceDeletion(type, fn)
};