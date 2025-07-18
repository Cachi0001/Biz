/**
 * Enhanced Error Handling - Comprehensive error handling for UI focus and display issues
 * Provides specific error handlers and fallback mechanisms
 */

import DebugLogger from './debugLogger';
import FocusManager from './focusManager';

/**
 * Handles focus-related errors and attempts recovery
 * @param {Error} error - The focus error
 * @param {string} component - Component name where error occurred
 * @param {string} field - Field name that lost focus
 * @param {HTMLElement} element - The element that should have focus
 */
export const handleFocusError = (error, component, field, element = null) => {
  DebugLogger.logApiError(`focus-error-${field}`, error, component);
  
  console.error(`[${component}] Focus error on ${field}:`, error);
  
  // Attempt to restore focus
  if (element && element.focus) {
    try {
      setTimeout(() => {
        element.focus();
        DebugLogger.logFocusEvent(component, 'focus-restored', element);
      }, 100);
    } catch (restoreError) {
      console.warn(`[${component}] Failed to restore focus to ${field}:`, restoreError);
    }
  } else if (field) {
    // Try to find element by field name
    FocusManager.restoreFocusToElement(`[name="${field}"]`, 100);
  }
  
  return {
    message: `Focus lost on ${field}`,
    details: error.message,
    timestamp: new Date().toISOString(),
    recovery: 'Attempted focus restoration'
  };
};

/**
 * Handles API display errors with fallback data
 * @param {Error} error - The API error
 * @param {string} component - Component name
 * @param {string} dataType - Type of data (expenses, products, etc.)
 * @param {Function} fallbackProvider - Function that returns fallback data
 */
export const handleApiDisplayError = (error, component, dataType, fallbackProvider = null) => {
  DebugLogger.logApiError(`display-error-${dataType}`, error, component);
  
  console.error(`[${component}] Display error for ${dataType}:`, error);
  
  const fallbackData = fallbackProvider ? fallbackProvider() : getDefaultFallbackData(dataType);
  
  DebugLogger.logDisplayIssue(component, dataType, fallbackData, `Using fallback data due to error: ${error.message}`);
  
  return {
    data: fallbackData,
    error: {
      message: `Failed to display ${dataType}`,
      details: error.message,
      timestamp: new Date().toISOString(),
      fallbackUsed: true
    }
  };
};

/**
 * Handles form submission errors with field-specific recovery
 * @param {Error} error - The submission error
 * @param {string} component - Component name
 * @param {Object} formData - Form data that failed to submit
 * @param {Function} onRetry - Retry function
 */
export const handleFormSubmissionError = (error, component, formData, onRetry = null) => {
  DebugLogger.logFormSubmit(component, { error: error.message, formData }, 'submission-failed');
  
  console.error(`[${component}] Form submission error:`, error);
  
  // Extract field-specific errors from API response
  const fieldErrors = extractFieldErrors(error);
  
  // Focus on first error field if available
  if (fieldErrors && Object.keys(fieldErrors).length > 0) {
    const firstErrorField = Object.keys(fieldErrors)[0];
    FocusManager.restoreFocusToElement(`[name="${firstErrorField}"]`, 200);
  }
  
  return {
    fieldErrors,
    generalError: error.message,
    canRetry: !!onRetry,
    timestamp: new Date().toISOString()
  };
};

/**
 * Handles dropdown/select errors with fallback options
 * @param {Error} error - The dropdown error
 * @param {string} component - Component name
 * @param {string} dropdownType - Type of dropdown (products, customers, etc.)
 * @param {Array} currentOptions - Current options array
 */
export const handleDropdownError = (error, component, dropdownType, currentOptions = []) => {
  DebugLogger.logDropdownIssue(component, currentOptions, null, `Dropdown error: ${error.message}`);
  
  console.error(`[${component}] Dropdown error for ${dropdownType}:`, error);
  
  const fallbackOptions = getFallbackOptions(dropdownType);
  
  return {
    options: fallbackOptions,
    error: {
      message: `Failed to load ${dropdownType} options`,
      details: error.message,
      timestamp: new Date().toISOString(),
      fallbackUsed: true
    }
  };
};

/**
 * Extracts field-specific errors from API error response
 * @param {Error} error - API error
 * @returns {Object} - Field errors object
 */
const extractFieldErrors = (error) => {
  const fieldErrors = {};
  
  if (error.response?.data?.errors) {
    // Handle structured field errors
    Object.entries(error.response.data.errors).forEach(([field, messages]) => {
      fieldErrors[field] = Array.isArray(messages) ? messages[0] : messages;
    });
  } else if (error.response?.data?.message) {
    // Handle single error message
    const message = error.response.data.message;
    
    // Try to extract field name from common error patterns
    if (message.includes('required')) {
      const fieldMatch = message.match(/(\w+)\s+is\s+required/i);
      if (fieldMatch) {
        fieldErrors[fieldMatch[1].toLowerCase()] = message;
      }
    } else if (message.includes('invalid')) {
      const fieldMatch = message.match(/(\w+)\s+is\s+invalid/i);
      if (fieldMatch) {
        fieldErrors[fieldMatch[1].toLowerCase()] = message;
      }
    }
  }
  
  return fieldErrors;
};

/**
 * Provides default fallback data for different data types
 * @param {string} dataType - Type of data needed
 * @returns {*} - Fallback data
 */
const getDefaultFallbackData = (dataType) => {
  switch (dataType) {
    case 'expenses':
      return {
        expenses: [],
        summary: {
          total_expenses: 0,
          total_count: 0,
          today_expenses: 0,
          this_month_expenses: 0
        }
      };
      
    case 'products':
      return {
        products: [],
        categories: [
          'Electronics & Technology',
          'Fashion & Clothing',
          'Food & Beverages',
          'Health & Beauty',
          'Home & Garden',
          'Other'
        ]
      };
      
    case 'customers':
      return [];
      
    case 'sales':
      return {
        sales: [],
        summary: {
          total_sales: 0,
          total_transactions: 0,
          today_sales: 0,
          average_sale: 0
        }
      };
      
    default:
      return [];
  }
};

/**
 * Provides fallback options for dropdowns
 * @param {string} dropdownType - Type of dropdown
 * @returns {Array} - Fallback options
 */
const getFallbackOptions = (dropdownType) => {
  switch (dropdownType) {
    case 'products':
      return [
        { id: 'fallback-1', name: 'Sample Product 1', price: 0 },
        { id: 'fallback-2', name: 'Sample Product 2', price: 0 }
      ];
      
    case 'customers':
      return [
        { id: 'fallback-1', name: 'Walk-in Customer' }
      ];
      
    case 'categories':
      return [
        'Electronics & Technology',
        'Fashion & Clothing',
        'Food & Beverages',
        'Other'
      ];
      
    case 'payment-methods':
      return [
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'pos', label: 'POS' }
      ];
      
    default:
      return [];
  }
};

/**
 * Creates a retry mechanism for failed operations
 * @param {Function} operation - Operation to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries in ms
 * @returns {Function} - Retry function
 */
export const createRetryMechanism = (operation, maxRetries = 3, delay = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        DebugLogger.logApiCall('retry-mechanism', `Attempt ${attempt}/${maxRetries}`, 'RetryMechanism');
        
        const result = await operation(...args);
        
        if (attempt > 1) {
          DebugLogger.logApiCall('retry-mechanism', `Success on attempt ${attempt}`, 'RetryMechanism');
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        DebugLogger.logApiError('retry-mechanism', error, 'RetryMechanism');
        
        if (attempt < maxRetries) {
          console.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    console.error(`All ${maxRetries} retry attempts failed`);
    throw lastError;
  };
};

/**
 * Validates form data with comprehensive error reporting
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation errors
 */
export const validateFormDataEnhanced = (data, rules) => {
  const errors = {};
  
  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];
    
    // Required field validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rule.required) return;
    
    // Type validation
    if (rule.type === 'number') {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        errors[field] = `${rule.label || field} must be a valid number`;
        return;
      }
      
      if (rule.min !== undefined && numValue < rule.min) {
        errors[field] = `${rule.label || field} must be at least ${rule.min}`;
        return;
      }
      
      if (rule.max !== undefined && numValue > rule.max) {
        errors[field] = `${rule.label || field} must be at most ${rule.max}`;
        return;
      }
    }
    
    // Email validation
    if (rule.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = `${rule.label || field} must be a valid email address`;
        return;
      }
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value, data);
      if (customError) {
        errors[field] = customError;
        return;
      }
    }
    
    // Length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
      return;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be at most ${rule.maxLength} characters`;
      return;
    }
  });
  
  return errors;
};

/**
 * Safe array extractor with fallback
 * @param {*} data - Data to extract array from
 * @param {string} key - Key to extract array from
 * @param {Array} fallback - Fallback array
 * @returns {Array} - Safe array
 */
export const safeArrayExtract = (data, key = null, fallback = []) => {
  try {
    if (key && data?.[key] && Array.isArray(data[key])) {
      return data[key];
    }
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data && typeof data === 'object') {
      return [data];
    }
    
    return fallback;
  } catch (error) {
    console.warn('Safe array extraction failed:', error);
    return fallback;
  }
};

/**
 * Shows success toast notification
 * @param {string} message - Success message to display
 */
export const showToast = (message, type = 'success') => {
  // Try to use react-hot-toast if available
  if (typeof window !== 'undefined' && window.toast) {
    if (type === 'success') {
      window.toast.success(message);
    } else if (type === 'error') {
      window.toast.error(message);
    } else {
      window.toast(message);
    }
  } else {
    // Fallback to console
    console.log(`[${type.toUpperCase()}] ${message}`);
  }
};

/**
 * Shows success toast notification
 * @param {string} message - Success message to display
 */
export const showSuccessToast = (message) => {
  showToast(message, 'success');
};

/**
 * Shows error toast notification
 * @param {string} message - Error message to display
 */
export const showErrorToast = (message) => {
  showToast(message, 'error');
};

/**
 * Handles API errors and shows toast notification
 * @param {Error} error - The API error
 * @param {string} defaultMessage - Default error message
 * @param {boolean} showToastNotification - Whether to show toast
 * @returns {string} - Error message
 */
export const handleApiError = (error, defaultMessage = 'An error occurred', showToastNotification = true) => {
  let errorMessage = defaultMessage;
  
  if (error.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  console.error('API Error:', error);
  
  if (showToastNotification) {
    showErrorToast(errorMessage);
  }
  
  return errorMessage;
};

/**
 * Handles API errors with toast notification
 * @param {Error} error - The API error
 * @param {string} defaultMessage - Default error message
 * @returns {string} - Error message
 */
export const handleApiErrorWithToast = (error, defaultMessage = 'An error occurred') => {
  return handleApiError(error, defaultMessage, true);
};

/**
 * Validates form data with basic rules
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - Validation errors
 */
export const validateFormData = (data, rules) => {
  return validateFormDataEnhanced(data, rules);
};

/**
 * Safe array helper function
 * @param {*} data - Data to convert to array
 * @param {Array} fallback - Fallback array
 * @returns {Array} - Safe array
 */
export const safeArray = (data, fallback = []) => {
  return safeArrayExtract(data, null, fallback);
};

export default {
  handleFocusError,
  handleApiDisplayError,
  handleFormSubmissionError,
  handleDropdownError,
  createRetryMechanism,
  validateFormDataEnhanced,
  safeArrayExtract,
  showToast,
  showSuccessToast,
  showErrorToast,
  handleApiError,
  handleApiErrorWithToast,
  validateFormData,
  safeArray
};