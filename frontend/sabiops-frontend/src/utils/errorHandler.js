/**
 * Comprehensive Error Handler for SabiOps
 * Provides centralized error processing, user-friendly messages, and debugging support
 */

import notificationService from '../services/notificationService';

class ErrorHandler {
  static errorCodes = {
    // Network errors
    NETWORK_ERROR: 'NETWORK_ERROR',
    TIMEOUT_ERROR: 'TIMEOUT_ERROR',
    
    // Authentication errors
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    AUTH_EXPIRED: 'AUTH_EXPIRED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    REQUIRED_FIELD: 'REQUIRED_FIELD',
    INVALID_FORMAT: 'INVALID_FORMAT',
    
    // Business logic errors
    INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
    PRODUCT_NOT_FOUND: 'PRODUCT_NOT_FOUND',
    CUSTOMER_NOT_FOUND: 'CUSTOMER_NOT_FOUND',
    
    // Server errors
    SERVER_ERROR: 'SERVER_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
  };

  /**
   * Main error handling method
   * @param {Error|Object} error - Error object or API error response
   * @param {string} context - Context where error occurred
   * @param {boolean} showToast - Whether to show toast notification
   * @returns {Object} - Processed error information
   */
  static handleError(error, context = '', showToast = true) {
    const errorInfo = this.processError(error, context);
    
    // Log error for debugging
    this.logError(errorInfo);
    
    // Show user notification if requested
    if (showToast) {
      this.showErrorNotification(errorInfo);
    }
    
    return errorInfo;
  }

  /**
   * Process error into standardized format
   * @param {Error|Object} error - Raw error
   * @param {string} context - Error context
   * @returns {Object} - Processed error info
   */
  static processError(error, context) {
    const errorInfo = {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again.',
      details: null,
      context,
      timestamp: new Date().toISOString(),
      recoverable: true,
      retryable: false
    };

    // Handle API response errors
    if (error.response) {
      return this.processApiError(error, errorInfo);
    }
    
    // Handle network errors
    if (error.request) {
      return this.processNetworkError(error, errorInfo);
    }
    
    // Handle JavaScript errors
    if (error instanceof Error) {
      return this.processJavaScriptError(error, errorInfo);
    }
    
    // Handle custom error objects
    if (typeof error === 'object' && error.message) {
      errorInfo.message = error.message;
      errorInfo.userMessage = this.getUserFriendlyMessage(error.message);
      errorInfo.code = error.code || 'CUSTOM_ERROR';
    }
    
    return errorInfo;
  }

  /**
   * Process API response errors
   * @param {Object} error - Axios error object
   * @param {Object} errorInfo - Base error info
   * @returns {Object} - Enhanced error info
   */
  static processApiError(error, errorInfo) {
    const { status, data } = error.response;
    
    errorInfo.httpStatus = status;
    errorInfo.details = data;
    
    switch (status) {
      case 400:
        errorInfo.code = this.errorCodes.VALIDATION_ERROR;
        errorInfo.message = data.error || 'Invalid request data';
        errorInfo.userMessage = this.getValidationErrorMessage(data);
        errorInfo.fieldErrors = this.extractFieldErrors(data);
        errorInfo.recoverable = true;
        break;
        
      case 401:
        errorInfo.code = this.errorCodes.AUTH_REQUIRED;
        errorInfo.message = 'Authentication required';
        errorInfo.userMessage = 'Please log in to continue';
        errorInfo.recoverable = true;
        errorInfo.requiresAuth = true;
        break;
        
      case 403:
        errorInfo.code = this.errorCodes.ACCESS_DENIED;
        errorInfo.message = 'Access denied';
        errorInfo.userMessage = 'You don\'t have permission to perform this action';
        errorInfo.recoverable = false;
        break;
        
      case 404:
        errorInfo.code = 'RESOURCE_NOT_FOUND';
        errorInfo.message = 'Resource not found';
        errorInfo.userMessage = 'The requested item could not be found';
        errorInfo.recoverable = false;
        break;
        
      case 422:
        errorInfo.code = this.errorCodes.VALIDATION_ERROR;
        errorInfo.message = 'Validation failed';
        errorInfo.userMessage = 'Please check your input and try again';
        errorInfo.fieldErrors = this.extractFieldErrors(data);
        errorInfo.recoverable = true;
        break;
        
      case 429:
        errorInfo.code = 'RATE_LIMITED';
        errorInfo.message = 'Too many requests';
        errorInfo.userMessage = 'Please wait a moment before trying again';
        errorInfo.recoverable = true;
        errorInfo.retryable = true;
        break;
        
      case 500:
        errorInfo.code = this.errorCodes.SERVER_ERROR;
        errorInfo.message = 'Internal server error';
        errorInfo.userMessage = 'Server error - please try again in a moment';
        errorInfo.recoverable = true;
        errorInfo.retryable = true;
        break;
        
      case 502:
      case 503:
      case 504:
        errorInfo.code = this.errorCodes.SERVICE_UNAVAILABLE;
        errorInfo.message = 'Service temporarily unavailable';
        errorInfo.userMessage = 'Service is temporarily unavailable. Please try again later.';
        errorInfo.recoverable = true;
        errorInfo.retryable = true;
        break;
        
      default:
        errorInfo.message = `Request failed (${status})`;
        errorInfo.userMessage = 'Request failed. Please try again.';
        errorInfo.retryable = status >= 500;
    }
    
    return errorInfo;
  }

  /**
   * Process network errors
   * @param {Object} error - Network error
   * @param {Object} errorInfo - Base error info
   * @returns {Object} - Enhanced error info
   */
  static processNetworkError(error, errorInfo) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorInfo.code = this.errorCodes.TIMEOUT_ERROR;
      errorInfo.message = 'Request timeout';
      errorInfo.userMessage = 'Request timed out. Please check your connection and try again.';
      errorInfo.retryable = true;
    } else {
      errorInfo.code = this.errorCodes.NETWORK_ERROR;
      errorInfo.message = 'Network error';
      errorInfo.userMessage = 'Network error. Please check your internet connection.';
      errorInfo.retryable = true;
    }
    
    return errorInfo;
  }

  /**
   * Process JavaScript errors
   * @param {Error} error - JavaScript error
   * @param {Object} errorInfo - Base error info
   * @returns {Object} - Enhanced error info
   */
  static processJavaScriptError(error, errorInfo) {
    errorInfo.message = error.message;
    errorInfo.stack = error.stack;
    errorInfo.userMessage = this.getUserFriendlyMessage(error.message);
    errorInfo.recoverable = false;
    
    // Specific error types
    if (error instanceof TypeError) {
      errorInfo.code = 'TYPE_ERROR';
      errorInfo.userMessage = 'A technical error occurred. Please refresh the page.';
    } else if (error instanceof ReferenceError) {
      errorInfo.code = 'REFERENCE_ERROR';
      errorInfo.userMessage = 'A technical error occurred. Please refresh the page.';
    }
    
    return errorInfo;
  }

  /**
   * Extract field-specific errors from API response
   * @param {Object} data - API response data
   * @returns {Object} - Field errors object
   */
  static extractFieldErrors(data) {
    const fieldErrors = {};
    
    if (data.errors && typeof data.errors === 'object') {
      Object.keys(data.errors).forEach(field => {
        fieldErrors[field] = Array.isArray(data.errors[field]) 
          ? data.errors[field][0] 
          : data.errors[field];
      });
    }
    
    // Handle specific error messages
    if (data.error) {
      if (data.error.includes('product_id')) {
        fieldErrors.product_id = 'Please select a product';
      }
      if (data.error.includes('customer_email')) {
        fieldErrors.customer_email = 'Please provide a valid email address';
      }
      if (data.error.includes('quantity')) {
        fieldErrors.quantity = 'Please enter a valid quantity';
      }
    }
    
    return fieldErrors;
  }

  /**
   * Get validation error message
   * @param {Object} data - API response data
   * @returns {string} - User-friendly validation message
   */
  static getValidationErrorMessage(data) {
    if (data.error) {
      // Handle specific validation errors
      if (data.error.includes('product_id is required')) {
        return 'Please select a product before creating the sale';
      }
      if (data.error.includes('customer_email')) {
        return 'Please provide a valid customer email address';
      }
      if (data.error.includes('quantity')) {
        return 'Please enter a valid quantity greater than 0';
      }
      if (data.error.includes('unit_price')) {
        return 'Please enter a valid unit price';
      }
      
      return data.error;
    }
    
    return 'Please check your input and try again';
  }

  /**
   * Get user-friendly message for technical errors
   * @param {string} technicalMessage - Technical error message
   * @returns {string} - User-friendly message
   */
  static getUserFriendlyMessage(technicalMessage) {
    const lowerMessage = technicalMessage.toLowerCase();
    
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection.';
    }
    
    if (lowerMessage.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('401')) {
      return 'Please log in to continue.';
    }
    
    if (lowerMessage.includes('forbidden') || lowerMessage.includes('403')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    if (lowerMessage.includes('not found') || lowerMessage.includes('404')) {
      return 'The requested item could not be found.';
    }
    
    if (lowerMessage.includes('server error') || lowerMessage.includes('500')) {
      return 'Server error. Please try again in a moment.';
    }
    
    return 'Something went wrong. Please try again.';
  }

  /**
   * Log error for debugging
   * @param {Object} errorInfo - Processed error info
   */
  static logError(errorInfo) {
    const logLevel = errorInfo.httpStatus >= 500 ? 'error' : 'warn';
    
    console[logLevel](`[ErrorHandler] ${errorInfo.context}:`, {
      code: errorInfo.code,
      message: errorInfo.message,
      userMessage: errorInfo.userMessage,
      httpStatus: errorInfo.httpStatus,
      timestamp: errorInfo.timestamp,
      details: errorInfo.details,
      stack: errorInfo.stack
    });
    
    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production' && errorInfo.httpStatus >= 500) {
      this.sendToLoggingService(errorInfo);
    }
  }

  /**
   * Show error notification to user
   * @param {Object} errorInfo - Processed error info
   */
  static showErrorNotification(errorInfo) {
    const notificationType = this.getNotificationType(errorInfo);
    
    notificationService.showToast(errorInfo.userMessage, notificationType, {
      duration: errorInfo.recoverable ? 5000 : 8000
    });
    
    // Add to notification bell for important errors
    if (errorInfo.httpStatus >= 500 || !errorInfo.recoverable) {
      notificationService.addNotification({
        type: 'error',
        title: 'Error Occurred',
        message: errorInfo.userMessage,
        data: {
          code: errorInfo.code,
          context: errorInfo.context,
          recoverable: errorInfo.recoverable
        }
      });
    }
  }

  /**
   * Get notification type based on error
   * @param {Object} errorInfo - Error information
   * @returns {string} - Notification type
   */
  static getNotificationType(errorInfo) {
    if (errorInfo.code === this.errorCodes.VALIDATION_ERROR) {
      return 'warning';
    }
    
    if (errorInfo.httpStatus >= 500) {
      return 'error';
    }
    
    if (errorInfo.recoverable) {
      return 'warning';
    }
    
    return 'error';
  }

  /**
   * Handle form validation errors
   * @param {Object} errors - Validation errors object
   * @param {string} context - Form context
   * @returns {Object} - Processed validation errors
   */
  static handleFormValidation(errors, context = 'Form') {
    if (!errors || Object.keys(errors).length === 0) {
      return {};
    }
    
    const errorMessages = Object.entries(errors).map(([field, message]) => 
      `${field.replace('_', ' ')}: ${message}`
    ).join(', ');
    
    notificationService.showToast(`Please fix: ${errorMessages}`, 'warning', {
      duration: 6000
    });
    
    this.logError({
      code: this.errorCodes.VALIDATION_ERROR,
      message: 'Form validation failed',
      context,
      fieldErrors: errors,
      timestamp: new Date().toISOString()
    });
    
    return errors;
  }

  /**
   * Create retry function for failed operations
   * @param {Function} operation - Operation to retry
   * @param {number} maxRetries - Maximum retry attempts
   * @param {number} delay - Delay between retries (ms)
   * @returns {Function} - Retry function
   */
  static createRetryFunction(operation, maxRetries = 3, delay = 1000) {
    return async (...args) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await operation(...args);
        } catch (error) {
          lastError = error;
          
          const errorInfo = this.processError(error, 'Retry Operation');
          
          if (!errorInfo.retryable || attempt === maxRetries) {
            throw error;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          
          console.log(`[ErrorHandler] Retrying operation (attempt ${attempt + 1}/${maxRetries})`);
        }
      }
      
      throw lastError;
    };
  }

  /**
   * Send error to external logging service
   * @param {Object} errorInfo - Error information
   */
  static sendToLoggingService(errorInfo) {
    // Implement external logging service integration
    // This could be Sentry, LogRocket, or custom logging endpoint
    console.log('[ErrorHandler] Would send to logging service:', errorInfo);
  }

  /**
   * Handle authentication errors
   * @param {Object} error - Authentication error
   */
  static handleAuthError(error) {
    const errorInfo = this.handleError(error, 'Authentication', false);
    
    if (errorInfo.requiresAuth) {
      // Clear stored auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Show login prompt
      notificationService.showToast('Please log in to continue', 'warning');
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
    
    return errorInfo;
  }
}

export default ErrorHandler;