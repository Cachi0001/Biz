/**
 * Enhanced error handling system for SabiOps
 * Provides comprehensive error handling, validation, and user feedback
 */
import { toast } from 'react-hot-toast';

/**
 * Extract user-friendly error messages from API errors
 */
export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  // Check for network connectivity
  if (!navigator.onLine || (error && error.message && error.message.toLowerCase().includes('network error'))) {
    return 'No internet connection. Please check your connection and try again.';
  }

  // Handle different error response structures
  if (error?.response?.data) {
    // Prefer user-friendly message, then error code, then generic
    return (
      error.response.data.message ||
      error.response.data.error ||
      error.response.data.detail ||
      error.message ||
      fallback
    );
  }

  // Handle axios timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  // Handle network errors
  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your internet connection.';
  }

  // Handle specific HTTP status codes
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication failed. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'This action conflicts with existing data.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again later.';
      default:
        return fallback;
    }
  }

  return error?.message || fallback;
}

/**
 * Show success toast with green branding
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    style: {
      background: '#10b981',
      color: '#ffffff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#10b981',
    },
    duration: 4000,
    position: 'top-center',
  });
};

/**
 * Show error toast with red styling
 */
export const showErrorToast = (message) => {
  toast.error(message, {
    style: {
      background: '#ef4444',
      color: '#ffffff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: '#ef4444',
    },
    duration: 6000,
    position: 'top-center',
  });
};

/**
 * Show info toast with blue styling
 */
export const showInfoToast = (message) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#ffffff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
    },
    duration: 4000,
    position: 'top-center',
  });
};

/**
 * Show warning toast with yellow styling
 */
export const showWarningToast = (message) => {
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#ffffff',
      fontWeight: '500',
      borderRadius: '8px',
      padding: '12px 16px',
    },
    duration: 5000,
    position: 'top-center',
  });
};

/**
 * Handle API errors with consistent logging and user feedback
 */
export function handleApiError(error, context = '', showToast = true) {
  const message = getErrorMessage(error);
  
  // Log error for debugging (only in development)
  if (import.meta.env.DEV) {
    console.group(`[ERROR] ${context}`);
    console.error('Error object:', error);
    console.error('Error message:', error?.message);
    console.error('Error response:', error?.response);
    if (error?.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.groupEnd();
  }

  // Show user-friendly toast notification
  if (showToast) {
    toast.error(message);
  }

  return message;
}

/**
 * Retry mechanism for failed API calls
 */
export async function retryApiCall(apiCall, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 429) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
}

/**
 * Safe array operations to prevent map function errors
 */
export function safeArray(data, fallback = []) {
  if (Array.isArray(data)) {
    return data;
  }
  
  // Handle different response structures
  if (data?.data && Array.isArray(data.data)) {
    return data.data;
  }
  
  if (data?.items && Array.isArray(data.items)) {
    return data.items;
  }
  
  if (data?.results && Array.isArray(data.results)) {
    return data.results;
  }
  
  return fallback;
}

/**
 * Safe object property access
 */
export function safeGet(obj, path, fallback = null) {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) ?? fallback;
  } catch {
    return fallback;
  }
}

/**
 * Validate required fields
 */
export function validateRequired(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    const value = safeGet(data, field);
    if (value === null || value === undefined || value === '') {
      errors.push(`${field.replace('_', ' ')} is required`);
    }
  });
  
  return errors;
}

/**
 * Format currency values safely
 */
export function formatCurrency(value, currency = '₦') {
  try {
    const num = parseFloat(value) || 0;
    return `${currency}${num.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } catch {
    return `${currency}0.00`;
  }
}

/**
 * Format date safely
 */
export function formatDate(date, options = {}) {
  try {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    return dateObj.toLocaleDateString('en-NG', options);
  } catch {
    return 'N/A';
  }
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generic toast handler based on type
 */
export const showToast = (type, message) => {
  switch (type) {
    case 'success':
      showSuccessToast(message);
      break;
    case 'error':
      showErrorToast(message);
      break;
    case 'info':
      showInfoToast(message);
      break;
    case 'warning':
      showWarningToast(message);
      break;
    default:
      toast(message);
  }
};

/**
 * Handle API errors and show appropriate toast
 */
export const handleApiErrorWithToast = (error, fallbackMessage = 'An error occurred') => {
  const message = getErrorMessage(error, fallbackMessage);
  showErrorToast(message);
  return message;
};

/**
 * Validate form data and return errors
 */
export const validateFormData = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = data[field];
    
    // Required field validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field] = `${rule.label || field} is required`;
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value) return;
    
    // Email validation
    if (rule.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors[field] = 'Please enter a valid email address';
      }
    }
    
    // Phone validation (Nigerian format)
    if (rule.type === 'phone' && value) {
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length < 10 || cleaned.length > 13) {
        errors[field] = 'Please enter a valid Nigerian phone number';
      }
    }
    
    // Number validation
    if (rule.type === 'number' && value) {
      const num = Number(value);
      if (isNaN(num)) {
        errors[field] = 'Please enter a valid number';
      } else if (rule.min !== undefined && num < rule.min) {
        errors[field] = `${rule.label || field} must be at least ${rule.min}`;
      } else if (rule.max !== undefined && num > rule.max) {
        errors[field] = `${rule.label || field} must not exceed ${rule.max}`;
      }
    }
    
    // String length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${rule.label || field} must not exceed ${rule.maxLength} characters`;
    }
    
    // Custom validation function
    if (rule.validate && typeof rule.validate === 'function') {
      const customError = rule.validate(value, data);
      if (customError) {
        errors[field] = customError;
      }
    }
  });
  
  return errors;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (errors) => {
  if (!errors || Object.keys(errors).length === 0) return '';
  
  const errorMessages = Object.values(errors);
  if (errorMessages.length === 1) {
    return errorMessages[0];
  }
  
  return `Please fix the following errors:\n• ${errorMessages.join('\n• ')}`;
};

/**
 * Check if error is network related
 */
export const isNetworkError = (error) => {
  return !navigator.onLine || 
         error.code === 'NETWORK_ERROR' ||
         error.code === 'ERR_NETWORK' ||
         error.code === 'ECONNABORTED' ||
         error.message?.toLowerCase().includes('network') ||
         error.message?.toLowerCase().includes('timeout');
};

/**
 * Check if error is server related
 */
export const isServerError = (error) => {
  return error.response?.status >= 500;
};

/**
 * Check if error is client related
 */
export const isClientError = (error) => {
  return error.response?.status >= 400 && error.response?.status < 500;
};

/**
 * Safe local storage operations
 */
export const safeLocalStorage = {
  get: (key, fallback = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return fallback;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }
};