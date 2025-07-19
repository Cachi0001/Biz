/**
 * Comprehensive API Error Handler
 * Provides robust error handling, retry mechanisms, and fallback strategies
 */

import DebugLogger from './debugLogger';

export class ApiErrorHandler {
  static retryAttempts = new Map();
  static maxRetries = 3;
  static retryDelay = 1000;
  static circuitBreaker = new Map();
  static circuitBreakerThreshold = 5;
  static circuitBreakerTimeout = 30000;

  /**
   * Handle API errors with comprehensive error recovery
   * @param {Error} error - The error object
   * @param {string} context - Context where the error occurred
   * @param {Object} options - Error handling options
   * @returns {Object} - Error handling result
   */
  static handleError(error, context = 'API', options = {}) {
    const {
      showToast = true,
      logError = true,
      fallbackData = null,
      retryable = false,
      endpoint = 'unknown'
    } = options;

    // Log the error
    if (logError) {
      DebugLogger.logApiError(endpoint, error, context);
    }

    // Determine error type and severity
    const errorInfo = this.analyzeError(error);
    
    // Check circuit breaker
    if (this.isCircuitBreakerOpen(endpoint)) {
      return {
        success: false,
        error: 'Service temporarily unavailable',
        data: fallbackData,
        shouldRetry: false,
        errorType: 'circuit_breaker'
      };
    }

    // Handle different error types
    switch (errorInfo.type) {
      case 'network':
        return this.handleNetworkError(error, context, options);
      case 'timeout':
        return this.handleTimeoutError(error, context, options);
      case 'server':
        return this.handleServerError(error, context, options);
      case 'client':
        return this.handleClientError(error, context, options);
      case 'validation':
        return this.handleValidationError(error, context, options);
      default:
        return this.handleUnknownError(error, context, options);
    }
  }

  /**
   * Analyze error to determine type and severity
   */
  static analyzeError(error) {
    if (!error) {
      return { type: 'unknown', severity: 'low', message: 'Unknown error' };
    }

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
      return { type: 'network', severity: 'high', message: 'Network connection failed' };
    }

    // Timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return { type: 'timeout', severity: 'medium', message: 'Request timed out' };
    }

    // HTTP status errors
    if (error.response?.status) {
      const status = error.response.status;
      
      if (status >= 500) {
        return { type: 'server', severity: 'high', message: 'Server error' };
      } else if (status >= 400) {
        return { type: 'client', severity: 'medium', message: 'Client error' };
      }
    }

    // Validation errors
    if (error.response?.data?.errors || error.response?.data?.validation) {
      return { type: 'validation', severity: 'low', message: 'Validation failed' };
    }

    return { type: 'unknown', severity: 'medium', message: error.message || 'Unknown error' };
  }

  /**
   * Handle network errors
   */
  static handleNetworkError(error, context, options) {
    const { fallbackData, endpoint } = options;
    
    this.recordFailure(endpoint);
    
    return {
      success: false,
      error: 'Network connection failed. Please check your internet connection.',
      data: fallbackData,
      shouldRetry: true,
      errorType: 'network',
      userMessage: 'Connection problem. Please try again.'
    };
  }

  /**
   * Handle timeout errors
   */
  static handleTimeoutError(error, context, options) {
    const { fallbackData, endpoint } = options;
    
    this.recordFailure(endpoint);
    
    return {
      success: false,
      error: 'Request timed out. The server is taking too long to respond.',
      data: fallbackData,
      shouldRetry: true,
      errorType: 'timeout',
      userMessage: 'Request timed out. Please try again.'
    };
  }

  /**
   * Handle server errors (5xx)
   */
  static handleServerError(error, context, options) {
    const { fallbackData, endpoint } = options;
    const status = error.response?.status;
    
    this.recordFailure(endpoint);
    
    return {
      success: false,
      error: `Server error (${status}). Please try again later.`,
      data: fallbackData,
      shouldRetry: status !== 501, // Don't retry "Not Implemented"
      errorType: 'server',
      userMessage: 'Server is experiencing issues. Please try again later.'
    };
  }

  /**
   * Handle client errors (4xx)
   */
  static handleClientError(error, context, options) {
    const { fallbackData } = options;
    const status = error.response?.status;
    const data = error.response?.data;
    
    let userMessage = 'Request failed. Please check your input.';
    let shouldRetry = false;
    
    switch (status) {
      case 401:
        userMessage = 'Authentication required. Please log in again.';
        break;
      case 403:
        userMessage = 'Access denied. You don\'t have permission for this action.';
        break;
      case 404:
        userMessage = 'Resource not found.';
        break;
      case 409:
        userMessage = 'Conflict. The resource already exists or is in use.';
        break;
      case 422:
        userMessage = data?.message || 'Invalid data provided.';
        break;
      case 429:
        userMessage = 'Too many requests. Please wait a moment and try again.';
        shouldRetry = true;
        break;
    }
    
    return {
      success: false,
      error: data?.message || `Client error (${status})`,
      data: fallbackData,
      shouldRetry,
      errorType: 'client',
      userMessage
    };
  }

  /**
   * Handle validation errors
   */
  static handleValidationError(error, context, options) {
    const { fallbackData } = options;
    const data = error.response?.data;
    
    const validationErrors = data?.errors || data?.validation || {};
    const firstError = Object.values(validationErrors)[0];
    
    return {
      success: false,
      error: firstError || 'Validation failed',
      data: fallbackData,
      shouldRetry: false,
      errorType: 'validation',
      userMessage: firstError || 'Please check your input and try again.',
      validationErrors
    };
  }

  /**
   * Handle unknown errors
   */
  static handleUnknownError(error, context, options) {
    const { fallbackData } = options;
    
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      data: fallbackData,
      shouldRetry: false,
      errorType: 'unknown',
      userMessage: 'Something went wrong. Please try again.'
    };
  }

  /**
   * Record API failure for circuit breaker
   */
  static recordFailure(endpoint) {
    if (!endpoint) return;
    
    const failures = this.circuitBreaker.get(endpoint) || { count: 0, lastFailure: null };
    failures.count++;
    failures.lastFailure = Date.now();
    
    this.circuitBreaker.set(endpoint, failures);
    
    console.warn(`[ApiErrorHandler] Recorded failure for ${endpoint}: ${failures.count} failures`);
  }

  /**
   * Record API success for circuit breaker
   */
  static recordSuccess(endpoint) {
    if (!endpoint) return;
    
    this.circuitBreaker.delete(endpoint);
  }

  /**
   * Check if circuit breaker is open for an endpoint
   */
  static isCircuitBreakerOpen(endpoint) {
    if (!endpoint) return false;
    
    const failures = this.circuitBreaker.get(endpoint);
    if (!failures) return false;
    
    const isOverThreshold = failures.count >= this.circuitBreakerThreshold;
    const isWithinTimeout = Date.now() - failures.lastFailure < this.circuitBreakerTimeout;
    
    return isOverThreshold && isWithinTimeout;
  }

  /**
   * Retry an API call with exponential backoff
   */
  static async retryApiCall(apiCall, endpoint, maxRetries = this.maxRetries) {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        this.recordSuccess(endpoint);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          this.recordFailure(endpoint);
          break;
        }
        
        // Don't retry client errors (4xx) except 429
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          this.recordFailure(endpoint);
          break;
        }
        
        // Exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.log(`[ApiErrorHandler] Retrying ${endpoint} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Create a safe API wrapper with error handling
   */
  static createSafeApiCall(apiCall, endpoint, options = {}) {
    return async (...args) => {
      try {
        // Check circuit breaker
        if (this.isCircuitBreakerOpen(endpoint)) {
          throw new Error('Service temporarily unavailable');
        }
        
        // Execute API call with retry if enabled
        let result;
        if (options.retry) {
          result = await this.retryApiCall(() => apiCall(...args), endpoint, options.maxRetries);
        } else {
          result = await apiCall(...args);
          this.recordSuccess(endpoint);
        }
        
        return result;
      } catch (error) {
        const errorResult = this.handleError(error, options.context || endpoint, {
          ...options,
          endpoint
        });
        
        if (options.throwOnError) {
          throw error;
        }
        
        return errorResult;
      }
    };
  }

  /**
   * Get circuit breaker status for monitoring
   */
  static getCircuitBreakerStatus() {
    const status = {};
    
    for (const [endpoint, failures] of this.circuitBreaker.entries()) {
      status[endpoint] = {
        failures: failures.count,
        lastFailure: new Date(failures.lastFailure).toISOString(),
        isOpen: this.isCircuitBreakerOpen(endpoint)
      };
    }
    
    return status;
  }

  /**
   * Reset circuit breaker for an endpoint
   */
  static resetCircuitBreaker(endpoint) {
    if (endpoint) {
      this.circuitBreaker.delete(endpoint);
      console.log(`[ApiErrorHandler] Circuit breaker reset for ${endpoint}`);
    } else {
      this.circuitBreaker.clear();
      console.log('[ApiErrorHandler] All circuit breakers reset');
    }
  }
}

export default ApiErrorHandler;