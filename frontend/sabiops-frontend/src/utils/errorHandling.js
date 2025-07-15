// Error handling utilities for SabiOps
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