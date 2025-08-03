/**
 * Subscription Monitor Service
 * Real-time subscription status monitoring with automatic day countdown
 */

import subscriptionService from './subscriptionService';

class SubscriptionMonitor {
  constructor() {
    this.listeners = new Set();
    this.currentStatus = null;
    this.intervalId = null;
    this.isMonitoring = false;
    this.updateInterval = 60000; // Check every minute
    this.lastUpdate = null;
  }

  /**
   * Start monitoring subscription status
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    console.log('[SubscriptionMonitor] Starting subscription monitoring...');
    this.isMonitoring = true;
    
    // Initial fetch
    this.fetchSubscriptionStatus();
    
    // Set up interval for regular updates
    this.intervalId = setInterval(() => {
      this.fetchSubscriptionStatus();
    }, this.updateInterval);

    // Listen for visibility changes to refresh when tab becomes active
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for focus events to refresh when window gains focus
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
  }

  /**
   * Stop monitoring subscription status
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('[SubscriptionMonitor] Stopping subscription monitoring...');
    this.isMonitoring = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    window.removeEventListener('focus', this.handleWindowFocus.bind(this));
  }

  /**
   * Handle visibility change (tab active/inactive)
   */
  handleVisibilityChange() {
    if (!document.hidden && this.isMonitoring) {
      // Tab became active, refresh subscription status
      console.log('[SubscriptionMonitor] Tab became active, refreshing subscription status...');
      this.fetchSubscriptionStatus();
    }
  }

  /**
   * Handle window focus
   */
  handleWindowFocus() {
    if (this.isMonitoring) {
      // Window gained focus, refresh subscription status
      console.log('[SubscriptionMonitor] Window gained focus, refreshing subscription status...');
      this.fetchSubscriptionStatus();
    }
  }

  /**
   * Fetch current subscription status
   */
  async fetchSubscriptionStatus() {
    try {
      const status = await subscriptionService.getCurrentSubscription();
      
      // Check if status has changed
      const hasChanged = this.hasStatusChanged(status);
      
      if (hasChanged) {
        console.log('[SubscriptionMonitor] Subscription status changed:', {
          previous: this.currentStatus,
          current: status
        });
        
        this.currentStatus = status;
        this.lastUpdate = new Date();
        this.notifyListeners(status);
        
        // Dispatch global event for other components
        window.dispatchEvent(new CustomEvent('subscriptionUpdated', {
          detail: status
        }));
      }
      
      // Always update last update time
      this.lastUpdate = new Date();
      
    } catch (error) {
      console.error('[SubscriptionMonitor] Failed to fetch subscription status:', error);
      
      // If we have a current status, check if it should be marked as expired
      if (this.currentStatus && this.shouldMarkAsExpired()) {
        const expiredStatus = {
          ...this.currentStatus,
          status: 'expired',
          is_expired: true,
          days_remaining: 0
        };
        
        this.currentStatus = expiredStatus;
        this.notifyListeners(expiredStatus);
      }
    }
  }

  /**
   * Check if subscription status has meaningfully changed
   */
  hasStatusChanged(newStatus) {
    if (!this.currentStatus) {
      return true;
    }

    // Check key fields that matter for UI updates
    const keyFields = [
      'status',
      'days_remaining',
      'is_expired',
      'is_expiring_soon',
      'plan_name',
      'plan_id'
    ];

    return keyFields.some(field => {
      const oldValue = this.currentStatus[field];
      const newValue = newStatus[field];
      
      // Handle null/undefined comparisons
      if (oldValue === null || oldValue === undefined) {
        return newValue !== null && newValue !== undefined;
      }
      
      return oldValue !== newValue;
    });
  }

  /**
   * Check if subscription should be marked as expired based on time
   */
  shouldMarkAsExpired() {
    if (!this.currentStatus || !this.currentStatus.end_date) {
      return false;
    }

    const endDate = new Date(this.currentStatus.end_date);
    const now = new Date();
    
    return now > endDate && this.currentStatus.status === 'active';
  }

  /**
   * Add a listener for subscription status changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // If we have current status, immediately notify the new listener
    if (this.currentStatus) {
      callback(this.currentStatus);
    }
    
    // Start monitoring if this is the first listener
    if (this.listeners.size === 1) {
      this.startMonitoring();
    }
    
    // Return unsubscribe function
    return () => {
      this.removeListener(callback);
    };
  }

  /**
   * Remove a listener
   */
  removeListener(callback) {
    this.listeners.delete(callback);
    
    // Stop monitoring if no more listeners
    if (this.listeners.size === 0) {
      this.stopMonitoring();
    }
  }

  /**
   * Notify all listeners of status change
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[SubscriptionMonitor] Error in listener callback:', error);
      }
    });
  }

  /**
   * Get current subscription status (cached)
   */
  getCurrentStatus() {
    return this.currentStatus;
  }

  /**
   * Force refresh subscription status
   */
  async refresh() {
    console.log('[SubscriptionMonitor] Force refreshing subscription status...');
    await this.fetchSubscriptionStatus();
  }

  /**
   * Check if subscription is expired
   */
  isExpired() {
    return this.currentStatus?.is_expired || false;
  }

  /**
   * Check if subscription is expiring soon
   */
  isExpiringSoon() {
    return this.currentStatus?.is_expiring_soon || false;
  }

  /**
   * Get days remaining
   */
  getDaysRemaining() {
    return this.currentStatus?.days_remaining || null;
  }

  /**
   * Get plan name
   */
  getPlanName() {
    return this.currentStatus?.plan_name || 'Unknown';
  }

  /**
   * Set update interval (in milliseconds)
   */
  setUpdateInterval(interval) {
    this.updateInterval = interval;
    
    // Restart monitoring with new interval if currently monitoring
    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }

  /**
   * Get monitoring status
   */
  getMonitoringInfo() {
    return {
      isMonitoring: this.isMonitoring,
      updateInterval: this.updateInterval,
      lastUpdate: this.lastUpdate,
      listenersCount: this.listeners.size,
      currentStatus: this.currentStatus
    };
  }
}

// Create singleton instance
const subscriptionMonitor = new SubscriptionMonitor();

// Export both the class and the singleton
export { SubscriptionMonitor };
export default subscriptionMonitor;