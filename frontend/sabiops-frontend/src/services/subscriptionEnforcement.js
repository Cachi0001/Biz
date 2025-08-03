/**
 * Subscription Enforcement Service
 * Enforces subscription limits and prevents actions when limits are exceeded
 */

import subscriptionService from './subscriptionService';
import subscriptionMonitor from './subscriptionMonitor';

class SubscriptionEnforcement {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes cache
  }

  /**
   * Check if user can perform an action based on feature limits
   */
  async canPerformAction(feature, actionName = 'perform this action') {
    try {
      // Get current subscription status
      const subscriptionStatus = subscriptionMonitor.getCurrentStatus();
      
      // If subscription is expired, only allow free plan limits
      if (subscriptionStatus?.is_expired) {
        return this.checkFreeplanAccess(feature, actionName);
      }

      // Check feature access from API
      const access = await this.getFeatureAccess(feature);
      
      if (!access.has_access) {
        this.showAccessDeniedMessage(feature, actionName, access);
        return false;
      }

      // Show warning if approaching limit
      if (access.usage_percentage >= 80 && access.usage_percentage < 100) {
        this.showApproachingLimitWarning(feature, access);
      }

      return true;
    } catch (error) {
      console.error(`[SubscriptionEnforcement] Error checking ${feature} access:`, error);
      // Default to allowing action on error, but log it
      return true;
    }
  }

  /**
   * Get feature access information with caching
   */
  async getFeatureAccess(feature) {
    const cacheKey = `feature_access_${feature}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const access = await subscriptionService.checkFeatureAccess(feature);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: access,
        timestamp: Date.now()
      });
      
      return access;
    } catch (error) {
      console.error(`Failed to get ${feature} access:`, error);
      // Return restrictive access on error
      return {
        has_access: false,
        current_usage: 0,
        feature_limit: 0,
        usage_percentage: 100,
        plan_name: 'Unknown',
        is_expired: true
      };
    }
  }

  /**
   * Check access for free plan features when subscription is expired
   */
  async checkFreeplanAccess(feature, actionName) {
    const freePlanLimits = {
      invoices: 10,
      products: 10,
      customers: 25,
      sales: 50,
      storage_mb: 100
    };

    const limit = freePlanLimits[feature];
    if (!limit) {
      this.showFeatureNotAvailableMessage(feature, actionName);
      return false;
    }

    // Get current usage
    const access = await this.getFeatureAccess(feature);
    
    if (access.current_usage >= limit) {
      this.showFreePlanLimitMessage(feature, actionName, limit);
      return false;
    }

    return true;
  }

  /**
   * Show access denied message
   */
  showAccessDeniedMessage(feature, actionName, access) {
    const message = access.is_expired 
      ? `Your subscription has expired. Please renew to ${actionName}.`
      : `You've reached your ${feature} limit (${access.current_usage}/${access.feature_limit}). Upgrade to ${actionName}.`;

    this.showToast('error', message, {
      action: {
        label: 'Upgrade Plan',
        onClick: () => this.navigateToUpgrade()
      }
    });
  }

  /**
   * Show approaching limit warning
   */
  showApproachingLimitWarning(feature, access) {
    const remaining = access.feature_limit - access.current_usage;
    const message = `You're approaching your ${feature} limit. ${remaining} remaining out of ${access.feature_limit}.`;

    this.showToast('warning', message, {
      action: {
        label: 'View Plans',
        onClick: () => this.navigateToUpgrade()
      }
    });
  }

  /**
   * Show free plan limit message
   */
  showFreePlanLimitMessage(feature, actionName, limit) {
    const message = `You've reached the free plan ${feature} limit (${limit}). Upgrade to ${actionName}.`;

    this.showToast('error', message, {
      action: {
        label: 'Upgrade Now',
        onClick: () => this.navigateToUpgrade()
      }
    });
  }

  /**
   * Show feature not available message
   */
  showFeatureNotAvailableMessage(feature, actionName) {
    const message = `${feature} is not available in the free plan. Upgrade to ${actionName}.`;

    this.showToast('error', message, {
      action: {
        label: 'View Plans',
        onClick: () => this.navigateToUpgrade()
      }
    });
  }

  /**
   * Show toast notification
   */
  showToast(type, message, options = {}) {
    // Create a custom event for toast notifications
    const event = new CustomEvent('showToast', {
      detail: {
        type,
        message,
        duration: options.duration || 6000,
        action: options.action
      }
    });
    
    window.dispatchEvent(event);
    
    // Also log to console for debugging
    console.log(`[SubscriptionEnforcement] ${type.toUpperCase()}: ${message}`);
  }

  /**
   * Navigate to upgrade page
   */
  navigateToUpgrade() {
    // Dispatch navigation event
    const event = new CustomEvent('navigateToUpgrade');
    window.dispatchEvent(event);
    
    // Fallback: try to navigate directly
    if (window.location) {
      window.location.href = '/subscription/upgrade';
    }
  }

  /**
   * Pre-check multiple actions at once
   */
  async canPerformMultipleActions(actions) {
    const results = {};
    
    for (const { feature, actionName } of actions) {
      results[feature] = await this.canPerformAction(feature, actionName);
    }
    
    return results;
  }

  /**
   * Clear cache (useful after subscription changes)
   */
  clearCache() {
    this.cache.clear();
    console.log('[SubscriptionEnforcement] Cache cleared');
  }

  /**
   * Get usage summary for dashboard
   */
  async getUsageSummary() {
    try {
      const features = ['invoices', 'products', 'customers', 'sales'];
      const results = {};
      
      for (const feature of features) {
        results[feature] = await this.getFeatureAccess(feature);
      }
      
      // Calculate overall health
      let featuresAtLimit = 0;
      let featuresNearLimit = 0;
      
      Object.values(results).forEach(access => {
        if (access.usage_percentage >= 100) {
          featuresAtLimit++;
        } else if (access.usage_percentage >= 80) {
          featuresNearLimit++;
        }
      });
      
      let overallHealth = 'good';
      if (featuresAtLimit > 0) {
        overallHealth = 'critical';
      } else if (featuresNearLimit > 0) {
        overallHealth = 'warning';
      }
      
      return {
        features: results,
        summary: {
          total_features: features.length,
          features_at_limit: featuresAtLimit,
          features_near_limit: featuresNearLimit,
          overall_health: overallHealth
        }
      };
    } catch (error) {
      console.error('[SubscriptionEnforcement] Error getting usage summary:', error);
      return {
        features: {},
        summary: {
          total_features: 0,
          features_at_limit: 0,
          features_near_limit: 0,
          overall_health: 'unknown'
        }
      };
    }
  }

  /**
   * Check if specific feature is locked due to subscription
   */
  async isFeatureLocked(feature) {
    const subscriptionStatus = subscriptionMonitor.getCurrentStatus();
    
    // If subscription is expired, check against free plan
    if (subscriptionStatus?.is_expired) {
      const freePlanFeatures = ['invoices', 'products', 'customers', 'sales'];
      return !freePlanFeatures.includes(feature);
    }
    
    const access = await this.getFeatureAccess(feature);
    return !access.has_access;
  }

  /**
   * Get feature display name for UI
   */
  getFeatureDisplayName(feature) {
    const displayNames = {
      invoices: 'Invoices',
      products: 'Products',
      customers: 'Customers',
      sales: 'Sales',
      storage_mb: 'Storage',
      expenses: 'Expenses',
      reports: 'Reports',
      analytics: 'Analytics'
    };
    
    return displayNames[feature] || feature.charAt(0).toUpperCase() + feature.slice(1);
  }
}

// Create singleton instance
const subscriptionEnforcement = new SubscriptionEnforcement();

// Export both the class and the singleton
export { SubscriptionEnforcement };
export default subscriptionEnforcement;