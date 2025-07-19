/**
 * Enhanced API error handler with specific error messages and suggested actions
 */
import { getApiErrorMessage, ERROR_MESSAGES } from './validationService';
import { showErrorToast, showSuccessToast, showToast } from '../utils/errorHandling';

/**
 * Enhanced API error handler with specific error types and suggested actions
 */
export class ApiErrorHandler {
  constructor() {
    this.retryAttempts = new Map();
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Handle API errors with specific error messages and suggested actions
   */
  handleError(error, context = '', options = {}) {
    const {
      showToast = true,
      enableRetry = false,
      onRetry = null,
      customMessage = null
    } = options;

    const errorInfo = this.analyzeError(error);
    const message = customMessage || getApiErrorMessage(error);

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.group(`[API ERROR] ${context}`);
      console.error('Error type:', errorInfo.type);
      console.error('Error message:', message);
      console.error('Error object:', error);
      console.error('Suggested action:', errorInfo.suggestedAction);
      console.groupEnd();
    }

    // Show appropriate toast notification
    if (showToast) {
      this.showErrorNotification(errorInfo, message, enableRetry, onRetry);
    }

    return {
      type: errorInfo.type,
      message,
      suggestedAction: errorInfo.suggestedAction,
      canRetry: errorInfo.canRetry,
      originalError: error
    };
  }

  /**
   * Analyze error to determine type and suggested actions
   */
  analyzeError(error) {
    // Network connectivity issues
    if (!navigator.onLine) {
      return {
        type: 'network',
        canRetry: true,
        suggestedAction: 'Check your internet connection and try again'
      };
    }

    // Network errors
    if (error?.code === 'ERR_NETWORK' || error?.message?.toLowerCase().includes('network')) {
      return {
        type: 'network',
        canRetry: true,
        suggestedAction: 'Check your internet connection and try again'
      };
    }

    // Timeout errors
    if (error?.code === 'ECONNABORTED' || error?.message?.toLowerCase().includes('timeout')) {
      return {
        type: 'timeout',
        canRetry: true,
        suggestedAction: 'The request timed out. Try again in a moment'
      };
    }

    // HTTP status code errors
    if (error?.response?.status) {
      const status = error.response.status;
      
      if (status >= 400 && status < 500) {
        return this.handleClientError(status);
      }
      
      if (status >= 500) {
        return {
          type: 'server',
          canRetry: true,
          suggestedAction: 'Server error. Please try again in a few moments'
        };
      }
    }

    // Generic error
    return {
      type: 'generic',
      canRetry: false,
      suggestedAction: 'Please try again or contact support if the problem persists'
    };
  }

  /**
   * Handle client errors (4xx status codes)
   */
  handleClientError(status) {
    switch (status) {
      case 400:
        return {
          type: 'validation',
          canRetry: false,
          suggestedAction: 'Please check your input and try again'
        };
      case 401:
        return {
          type: 'authentication',
          canRetry: false,
          suggestedAction: 'Please log in again'
        };
      case 403:
        return {
          type: 'authorization',
          canRetry: false,
          suggestedAction: 'You do not have permission for this action'
        };
      case 404:
        return {
          type: 'not_found',
          canRetry: false,
          suggestedAction: 'The requested resource was not found'
        };
      case 409:
        return {
          type: 'conflict',
          canRetry: true,
          suggestedAction: 'Please refresh the page and try again'
        };
      case 422:
        return {
          type: 'validation',
          canRetry: false,
          suggestedAction: 'Please check your input and correct any errors'
        };
      case 429:
        return {
          type: 'rate_limit',
          canRetry: true,
          suggestedAction: 'Too many requests. Please wait a moment and try again'
        };
      default:
        return {
          type: 'client',
          canRetry: false,
          suggestedAction: 'Please check your request and try again'
        };
    }
  }

  /**
   * Show appropriate error notification based on error type
   */
  showErrorNotification(errorInfo, message, enableRetry, onRetry) {
    const notificationOptions = {
      duration: this.getNotificationDuration(errorInfo.type),
      position: 'top-center'
    };

    switch (errorInfo.type) {
      case 'network':
      case 'timeout':
        if (enableRetry && onRetry) {
          showToast(`${message} Click to retry.`, {
            ...notificationOptions,
            onClick: onRetry
          });
        } else {
          showToast(message, notificationOptions);
        }
        break;
      
      case 'server':
        if (enableRetry && onRetry) {
          showErrorToast(`${message} Click to retry.`, {
            ...notificationOptions,
            onClick: onRetry
          });
        } else {
          showErrorToast(message, notificationOptions);
        }
        break;
      
      case 'authentication':
        showErrorToast(message, {
          ...notificationOptions,
          duration: 8000 // Longer duration for auth errors
        });
        break;
      
      default:
        showErrorToast(message, notificationOptions);
    }
  }

  /**
   * Get notification duration based on error type
   */
  getNotificationDuration(errorType) {
    switch (errorType) {
      case 'network':
      case 'timeout':
        return 6000;
      case 'authentication':
      case 'authorization':
        return 8000;
      case 'validation':
        return 7000;
      default:
        return 5000;
    }
  }

  /**
   * Retry API call with exponential backoff
   */
  async retryApiCall(apiCall, context = '', maxRetries = this.maxRetries) {
    const retryKey = context || 'default';
    
    try {
      const result = await retryApiCall(apiCall, maxRetries, this.retryDelay);
      
      // Reset retry count on success
      this.retryAttempts.delete(retryKey);
      
      return result;
    } catch (error) {
      const attempts = this.retryAttempts.get(retryKey) || 0;
      this.retryAttempts.set(retryKey, attempts + 1);
      
      throw error;
    }
  }

  /**
   * Handle form submission errors with specific validation feedback
   */
  handleFormSubmissionError(error, formData = {}) {
    const errorInfo = this.analyzeError(error);
    
    // Extract validation errors from API response
    const validationErrors = this.extractValidationErrors(error);
    
    if (validationErrors.length > 0) {
      return {
        type: 'validation',
        message: ERROR_MESSAGES.FORM_INVALID,
        validationErrors,
        suggestedAction: 'Please fix the highlighted errors and try again'
      };
    }
    
    return this.handleError(error, 'Form Submission', {
      customMessage: this.getFormSubmissionErrorMessage(errorInfo.type)
    });
  }

  /**
   * Extract validation errors from API response
   */
  extractValidationErrors(error) {
    const validationErrors = [];
    
    if (error?.response?.data?.errors) {
      const errors = error.response.data.errors;
      
      if (Array.isArray(errors)) {
        validationErrors.push(...errors);
      } else if (typeof errors === 'object') {
        Object.entries(errors).forEach(([field, message]) => {
          validationErrors.push(`${field}: ${message}`);
        });
      }
    }
    
    if (error?.response?.data?.validation_errors) {
      const errors = error.response.data.validation_errors;
      Object.entries(errors).forEach(([field, messages]) => {
        if (Array.isArray(messages)) {
          messages.forEach(message => {
            validationErrors.push(`${field}: ${message}`);
          });
        } else {
          validationErrors.push(`${field}: ${messages}`);
        }
      });
    }
    
    return validationErrors;
  }

  /**
   * Get specific error message for form submission failures
   */
  getFormSubmissionErrorMessage(errorType) {
    switch (errorType) {
      case 'network':
        return ERROR_MESSAGES.FORM_NETWORK_ISSUE;
      case 'validation':
        return ERROR_MESSAGES.FORM_INVALID;
      case 'server':
        return ERROR_MESSAGES.FORM_SUBMISSION_FAILED;
      default:
        return ERROR_MESSAGES.FORM_SUBMISSION_FAILED;
    }
  }

  /**
   * Handle specific invoice-related API errors
   */
  handleInvoiceError(error, operation = 'save') {
    const baseContext = `Invoice ${operation}`;
    const errorInfo = this.analyzeError(error);
    
    let customMessage;
    switch (operation) {
      case 'create':
        customMessage = errorInfo.type === 'validation' 
          ? 'Please check the invoice details and try again'
          : 'Failed to create invoice. Please try again.';
        break;
      case 'update':
        customMessage = errorInfo.type === 'conflict'
          ? 'This invoice has been modified by another user. Please refresh and try again.'
          : 'Failed to update invoice. Please try again.';
        break;
      case 'delete':
        customMessage = errorInfo.type === 'not_found'
          ? 'Invoice not found. It may have already been deleted.'
          : 'Failed to delete invoice. Please try again.';
        break;
      case 'fetch':
        customMessage = errorInfo.type === 'not_found'
          ? 'Invoice not found.'
          : 'Failed to load invoice. Please try again.';
        break;
      default:
        customMessage = null;
    }
    
    return this.handleError(error, baseContext, { customMessage });
  }

  /**
   * Clear retry attempts for a specific context
   */
  clearRetryAttempts(context = 'default') {
    this.retryAttempts.delete(context);
  }

  /**
   * Get retry count for a specific context
   */
  getRetryCount(context = 'default') {
    return this.retryAttempts.get(context) || 0;
  }
}

// Export singleton instance
export const apiErrorHandler = new ApiErrorHandler();

// Export convenience functions
export const handleApiError = (error, context, options) => 
  apiErrorHandler.handleError(error, context, options);

export const handleFormSubmissionError = (error, formData) => 
  apiErrorHandler.handleFormSubmissionError(error, formData);

export const handleInvoiceError = (error, operation) => 
  apiErrorHandler.handleInvoiceError(error, operation);

export const retryApiCallWithHandler = (apiCall, context, maxRetries) => 
  apiErrorHandler.retryApiCall(apiCall, context, maxRetries);