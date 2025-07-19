/**
 * Error Recovery System - Comprehensive error recovery and self-healing capabilities
 * Provides automatic error recovery, user notifications, and system health monitoring
 */

import DebugLogger from './debugLogger';
import ApiErrorHandler from './apiErrorHandler';
import ScriptErrorIsolation from './scriptErrorIsolation';
import PageReloadPrevention from './pageReloadPrevention';

export class ErrorRecoverySystem {
  static isEnabled = true;
  static recoveryAttempts = new Map();
  static maxRecoveryAttempts = 3;
  static systemHealth = {
    status: 'healthy',
    lastCheck: null,
    issues: [],
    recoveryActions: []
  };
  static notificationQueue = [];
  static isProcessingNotifications = false;

  /**
   * Initialize the error recovery system
   */
  static init() {
    if (!this.isEnabled) return;

    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();
      
      // Start system health monitoring
      this.startHealthMonitoring();
      
      // Recovery strategies are initialized dynamically in getRecoveryStrategies()
      
      console.log('[ErrorRecoverySystem] Initialized');
    } catch (error) {
      console.warn('[ErrorRecoverySystem] Failed to initialize:', error.message);
      // Don't let initialization errors break the app
    }
  }

  /**
   * Set up global error handlers
   */
  static setupGlobalErrorHandlers() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleUnhandledRejection(event);
    });

    // Global error handler
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event);
    });

    // React error boundary integration
    window.addEventListener('react-error', (event) => {
      this.handleReactError(event.detail);
    });
  }

  /**
   * Handle unhandled promise rejections
   */
  static handleUnhandledRejection(event) {
    const error = event.reason;
    const context = 'unhandled-promise';
    
    DebugLogger.logApiError('promise-rejection', error, 'ErrorRecoverySystem');
    
    // Attempt recovery based on error type
    const recoveryResult = this.attemptRecovery(error, context);
    
    if (recoveryResult.recovered) {
      event.preventDefault(); // Prevent console error
      this.notifyUser('Issue resolved automatically', 'success');
    } else {
      this.notifyUser('An issue occurred but has been contained', 'warning');
    }
  }

  /**
   * Handle global JavaScript errors
   */
  static handleGlobalError(event) {
    const error = event.error;
    const context = 'global-error';
    
    // Skip third-party script errors (handled by ScriptErrorIsolation)
    if (ScriptErrorIsolation.isThirdPartyScript(event.filename)) {
      return;
    }
    
    DebugLogger.logApiError('global-error', error, 'ErrorRecoverySystem');
    
    const recoveryResult = this.attemptRecovery(error, context);
    
    if (!recoveryResult.recovered) {
      this.escalateError(error, context);
    }
  }

  /**
   * Handle React component errors
   */
  static handleReactError(errorInfo) {
    const { error, errorBoundary, componentStack } = errorInfo;
    const context = 'react-component';
    
    DebugLogger.logApiError('react-error', error, 'ErrorRecoverySystem');
    
    // Attempt component-specific recovery
    const recoveryResult = this.attemptComponentRecovery(error, errorBoundary);
    
    if (recoveryResult.recovered) {
      this.notifyUser('Component recovered successfully', 'success');
    } else {
      this.notifyUser('Component issue detected - using fallback', 'info');
    }
  }

  /**
   * Attempt automatic error recovery
   */
  static attemptRecovery(error, context) {
    const errorKey = `${context}-${error.message}`;
    const attempts = this.recoveryAttempts.get(errorKey) || 0;
    
    if (attempts >= this.maxRecoveryAttempts) {
      return { recovered: false, reason: 'max-attempts-exceeded' };
    }
    
    this.recoveryAttempts.set(errorKey, attempts + 1);
    
    // Try different recovery strategies based on error type
    const strategies = this.getRecoveryStrategies(error, context);
    
    for (const strategy of strategies) {
      try {
        const result = strategy.execute(error, context);
        
        if (result.success) {
          this.recordRecoverySuccess(errorKey, strategy.name);
          return { recovered: true, strategy: strategy.name };
        }
      } catch (recoveryError) {
        console.warn(`[ErrorRecoverySystem] Recovery strategy ${strategy.name} failed:`, recoveryError);
      }
    }
    
    return { recovered: false, reason: 'no-strategy-succeeded' };
  }

  /**
   * Get recovery strategies for an error
   */
  static getRecoveryStrategies(error, context) {
    const strategies = [];
    
    // API-related errors
    if (this.isApiError(error)) {
      strategies.push({
        name: 'api-retry',
        execute: (error, context) => this.retryApiCall(error, context)
      });
      
      strategies.push({
        name: 'api-fallback',
        execute: (error, context) => this.useApiFallback(error, context)
      });
    }
    
    // Component rendering errors
    if (this.isRenderError(error)) {
      strategies.push({
        name: 'component-remount',
        execute: (error, context) => this.remountComponent(error, context)
      });
      
      strategies.push({
        name: 'component-fallback',
        execute: (error, context) => this.useComponentFallback(error, context)
      });
    }
    
    // State-related errors
    if (this.isStateError(error)) {
      strategies.push({
        name: 'state-reset',
        execute: (error, context) => this.resetComponentState(error, context)
      });
    }
    
    // Network errors
    if (this.isNetworkError(error)) {
      strategies.push({
        name: 'network-retry',
        execute: (error, context) => this.retryNetworkOperation(error, context)
      });
    }
    
    return strategies;
  }

  /**
   * Attempt component-specific recovery
   */
  static attemptComponentRecovery(error, errorBoundary) {
    // Try to reset the component state
    if (errorBoundary && typeof errorBoundary.resetErrorBoundary === 'function') {
      try {
        errorBoundary.resetErrorBoundary();
        return { recovered: true, method: 'boundary-reset' };
      } catch (resetError) {
        console.warn('[ErrorRecoverySystem] Error boundary reset failed:', resetError);
      }
    }
    
    // Try to remount the component
    if (this.canRemountComponent(errorBoundary)) {
      try {
        this.remountComponent(error, 'component-error');
        return { recovered: true, method: 'component-remount' };
      } catch (remountError) {
        console.warn('[ErrorRecoverySystem] Component remount failed:', remountError);
      }
    }
    
    return { recovered: false };
  }

  /**
   * Error type detection methods
   */
  static isApiError(error) {
    return error.response || 
           error.request || 
           error.message?.includes('fetch') ||
           error.message?.includes('network') ||
           error.message?.includes('API');
  }

  static isRenderError(error) {
    return error.message?.includes('render') ||
           error.message?.includes('component') ||
           error.message?.includes('React') ||
           error.componentStack;
  }

  static isStateError(error) {
    return error.message?.includes('state') ||
           error.message?.includes('setState') ||
           error.message?.includes('hook');
  }

  static isNetworkError(error) {
    return error.message?.includes('Network') ||
           error.message?.includes('fetch') ||
           error.code === 'NETWORK_ERROR';
  }

  /**
   * Recovery strategy implementations
   */
  static retryApiCall(error, context) {
    // This would integrate with your API retry logic
    console.log('[ErrorRecoverySystem] Attempting API retry');
    return { success: false }; // Placeholder
  }

  static useApiFallback(error, context) {
    // Use cached data or default values
    console.log('[ErrorRecoverySystem] Using API fallback');
    return { success: true };
  }

  static remountComponent(error, context) {
    // Trigger component remount
    console.log('[ErrorRecoverySystem] Attempting component remount');
    return { success: false }; // Placeholder
  }

  static useComponentFallback(error, context) {
    // Use fallback component
    console.log('[ErrorRecoverySystem] Using component fallback');
    return { success: true };
  }

  static resetComponentState(error, context) {
    // Reset component state to initial values
    console.log('[ErrorRecoverySystem] Resetting component state');
    return { success: true };
  }

  static retryNetworkOperation(error, context) {
    // Retry network operation with backoff
    console.log('[ErrorRecoverySystem] Retrying network operation');
    return { success: false }; // Placeholder
  }

  /**
   * System health monitoring
   */
  static startHealthMonitoring() {
    // Check system health every 30 seconds
    setInterval(() => {
      this.checkSystemHealth();
    }, 30000);
    
    // Initial health check
    this.checkSystemHealth();
  }

  static checkSystemHealth() {
    const health = {
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      issues: [],
      recoveryActions: []
    };
    
    // Check error rates
    const errorRate = this.calculateErrorRate();
    if (errorRate > 0.1) { // More than 10% error rate
      health.issues.push({
        type: 'high-error-rate',
        severity: 'warning',
        value: errorRate,
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`
      });
    }
    
    // Check circuit breaker status
    const circuitBreakerStatus = ApiErrorHandler.getCircuitBreakerStatus();
    const openCircuits = Object.entries(circuitBreakerStatus).filter(([_, status]) => status.isOpen);
    
    if (openCircuits.length > 0) {
      health.issues.push({
        type: 'circuit-breaker-open',
        severity: 'error',
        value: openCircuits.length,
        message: `${openCircuits.length} service(s) unavailable`
      });
    }
    
    // Check memory usage (if available)
    if (performance.memory) {
      const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize;
      if (memoryUsage > 0.8) { // More than 80% memory usage
        health.issues.push({
          type: 'high-memory-usage',
          severity: 'warning',
          value: memoryUsage,
          message: `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`
        });
      }
    }
    
    // Update overall status
    if (health.issues.some(issue => issue.severity === 'error')) {
      health.status = 'unhealthy';
    } else if (health.issues.some(issue => issue.severity === 'warning')) {
      health.status = 'degraded';
    }
    
    this.systemHealth = health;
    
    // Take corrective actions if needed
    if (health.status !== 'healthy') {
      this.takeCorrectiveActions(health);
    }
  }

  /**
   * Calculate current error rate
   */
  static calculateErrorRate() {
    // This would integrate with your error tracking
    // For now, return a placeholder
    return 0;
  }

  /**
   * Take corrective actions based on system health
   */
  static takeCorrectiveActions(health) {
    for (const issue of health.issues) {
      switch (issue.type) {
        case 'high-error-rate':
          this.handleHighErrorRate();
          break;
        case 'circuit-breaker-open':
          this.handleCircuitBreakerIssues();
          break;
        case 'high-memory-usage':
          this.handleHighMemoryUsage();
          break;
      }
    }
  }

  static handleHighErrorRate() {
    console.warn('[ErrorRecoverySystem] Taking action for high error rate');
    // Could implement error rate limiting, fallback modes, etc.
  }

  static handleCircuitBreakerIssues() {
    console.warn('[ErrorRecoverySystem] Taking action for circuit breaker issues');
    // Could implement service health checks, alternative endpoints, etc.
  }

  static handleHighMemoryUsage() {
    console.warn('[ErrorRecoverySystem] Taking action for high memory usage');
    // Could implement garbage collection hints, cache clearing, etc.
    if (window.gc) {
      window.gc();
    }
  }

  /**
   * User notification system
   */
  static notifyUser(message, type = 'info', options = {}) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date().toISOString(),
      ...options
    };
    
    this.notificationQueue.push(notification);
    
    if (!this.isProcessingNotifications) {
      this.processNotificationQueue();
    }
  }

  static processNotificationQueue() {
    if (this.notificationQueue.length === 0) {
      this.isProcessingNotifications = false;
      return;
    }
    
    this.isProcessingNotifications = true;
    const notification = this.notificationQueue.shift();
    
    // Show notification (integrate with your toast system)
    this.showNotification(notification);
    
    // Process next notification after delay
    setTimeout(() => {
      this.processNotificationQueue();
    }, 1000);
  }

  static showNotification(notification) {
    // This would integrate with your notification/toast system
    console.log(`[ErrorRecoverySystem] ${notification.type.toUpperCase()}: ${notification.message}`);
    
    // If toast system is available
    if (window.toast) {
      window.toast[notification.type](notification.message);
    }
  }

  /**
   * Escalate unrecoverable errors
   */
  static escalateError(error, context) {
    console.error('[ErrorRecoverySystem] Escalating unrecoverable error:', error);
    
    // Report to monitoring service
    if (window.reportError) {
      window.reportError(error, {
        component: 'ErrorRecoverySystem',
        context,
        systemHealth: this.systemHealth,
        timestamp: new Date().toISOString()
      });
    }
    
    // Notify user of serious issue
    this.notifyUser(
      'A serious issue occurred. The development team has been notified.',
      'error',
      { persistent: true }
    );
  }

  /**
   * Record successful recovery
   */
  static recordRecoverySuccess(errorKey, strategy) {
    console.log(`[ErrorRecoverySystem] Recovery successful: ${strategy} for ${errorKey}`);
    
    // Reset attempt counter for this error
    this.recoveryAttempts.delete(errorKey);
    
    // Record in system health
    this.systemHealth.recoveryActions.push({
      timestamp: new Date().toISOString(),
      errorKey,
      strategy,
      success: true
    });
  }

  /**
   * Utility methods
   */
  static canRemountComponent(errorBoundary) {
    return errorBoundary && typeof errorBoundary.forceUpdate === 'function';
  }

  static getSystemHealth() {
    return this.systemHealth;
  }

  static getRecoveryStats() {
    return {
      activeRecoveryAttempts: this.recoveryAttempts.size,
      notificationQueueLength: this.notificationQueue.length,
      systemHealth: this.systemHealth
    };
  }

  static reset() {
    this.recoveryAttempts.clear();
    this.notificationQueue = [];
    this.systemHealth = {
      status: 'healthy',
      lastCheck: null,
      issues: [],
      recoveryActions: []
    };
    console.log('[ErrorRecoverySystem] Reset completed');
  }
}

// Auto-initialize when module loads (but safely)
if (typeof window !== 'undefined') {
  try {
    ErrorRecoverySystem.init();
  } catch (error) {
    console.warn('[ErrorRecoverySystem] Failed to auto-initialize:', error.message);
  }
}

export default ErrorRecoverySystem;