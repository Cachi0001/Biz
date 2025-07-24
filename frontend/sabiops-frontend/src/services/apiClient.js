/**
 * API Client with Automatic Toast Handling
 * 
 * This service wraps the existing axios instance with interceptors that:
 * - Automatically handle toast notifications from backend responses
 * - Show consistent error toasts for network/timeout errors
 * - Integrate with the existing ToastService for unified notification handling
 */

import axios from 'axios';
import { toastService } from './ToastService';

// Import existing API configuration
import { getAuthToken } from './api';

// Determine the correct base URL based on environment (same logic as existing api.js)
const getBaseURL = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api'; // Use proxy in development
  }
  
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production fallback - use the Vercel backend URL
  return 'https://sabiops-backend.vercel.app/api';
};

// Create enhanced axios instance
const apiClient = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Increased timeout for better user experience
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for timeout tracking
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    // Handle request configuration errors
    toastService.error('Request configuration error. Please try again.');
    return Promise.reject(error);
  }
);

// Response interceptor for automatic toast handling
apiClient.interceptors.response.use(
  (response) => {
    // Allow suppressing the automatic toast handling on a per-request basis
    if (response.config?.suppressToast) {
      return response;
    }

    // Check for backend toast payload in response data
    const responseData = response.data;
    
    if (responseData && typeof responseData === 'object') {
      // Handle toast payload from backend: {toast: {type, message}}
      if (responseData.toast && responseData.toast.type && responseData.toast.message) {
        const { type, message } = responseData.toast;
        
        // Map backend toast types to ToastService methods
        switch (type.toLowerCase()) {
          case 'success':
            toastService.success(message);
            break;
          case 'error':
            toastService.error(message);
            break;
          case 'warning':
            toastService.warning(message);
            break;
          case 'info':
            toastService.info(message);
            break;
          default:
            // Fallback to info for unknown types
            toastService.info(message);
        }
      }

      // Handle multiple toasts: {toasts: [{type, message}, ...]}
      if (responseData.toasts && Array.isArray(responseData.toasts)) {
        responseData.toasts.forEach(toast => {
          if (toast.type && toast.message) {
            switch (toast.type.toLowerCase()) {
              case 'success':
                toastService.success(toast.message);
                break;
              case 'error':
                toastService.error(toast.message);
                break;
              case 'warning':
                toastService.warning(toast.message);
                break;
              case 'info':
                toastService.info(toast.message);
                break;
              default:
                toastService.info(toast.message);
            }
          }
        });
      }
    }

    return response;
  },
  (error) => {
    // Handle response errors with automatic toast notifications
    const originalRequest = error.config;
    
    // Extract timing information
    const duration = originalRequest.metadata ? 
      Date.now() - originalRequest.metadata.startTime : 0;

    // Handle network/connectivity errors
    if (!navigator.onLine) {
      toastService.error('No internet connection. Please check your connection and try again.', {
        duration: 8000,
        action: {
          label: 'Retry',
          callback: () => {
            // Retry the original request
            if (originalRequest && !originalRequest._retryAttempted) {
              originalRequest._retryAttempted = true;
              apiClient.request(originalRequest);
            }
          }
        }
      });
      return Promise.reject(error);
    }

    // Handle network errors (no response received)
    if (error.code === 'ERR_NETWORK' || error.message?.toLowerCase().includes('network')) {
      toastService.error('Network error. Please check your connection and try again.', {
        duration: 7000,
        action: {
          label: 'Retry',
          callback: () => {
            if (originalRequest && !originalRequest._retryAttempted) {
              originalRequest._retryAttempted = true;
              apiClient.request(originalRequest);
            }
          }
        }
      });
      return Promise.reject(error);
    }

    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || 
        error.message?.toLowerCase().includes('timeout') ||
        (duration > 25000)) { // Our timeout is 30s, so 25s+ is likely a timeout
      
      toastService.error('Request timed out – please retry', {
        duration: 8000,
        action: {
          label: 'Retry',
          callback: () => {
            if (originalRequest && !originalRequest._retryAttempted) {
              originalRequest._retryAttempted = true;
              // Reset timeout metadata
              originalRequest.metadata = { startTime: Date.now() };
              apiClient.request(originalRequest);
            }
          }
        }
      });
      return Promise.reject(error);
    }

    // Handle HTTP response errors
    if (error.response) {
      const { status, data } = error.response;
      
      // Check if backend provided toast information in error response
      if (data && typeof data === 'object') {
        if (data.toast && data.toast.type && data.toast.message) {
          const { type, message } = data.toast;
          switch (type.toLowerCase()) {
            case 'error':
              toastService.error(message);
              break;
            case 'warning':
              toastService.warning(message);
              break;
            case 'info':
              toastService.info(message);
              break;
            default:
              toastService.error(message);
          }
          return Promise.reject(error);
        }

        // Handle multiple error toasts
        if (data.toasts && Array.isArray(data.toasts)) {
          data.toasts.forEach(toast => {
            if (toast.type && toast.message) {
              switch (toast.type.toLowerCase()) {
                case 'error':
                  toastService.error(toast.message);
                  break;
                case 'warning':
                  toastService.warning(toast.message);
                  break;
                case 'info':
                  toastService.info(toast.message);
                  break;
                default:
                  toastService.error(toast.message);
              }
            }
          });
          return Promise.reject(error);
        }
      }

      // Handle specific HTTP status codes with appropriate toast messages
      switch (status) {
        case 400:
          toastService.error(data?.message || 'Invalid request. Please check your input and try again.');
          break;
        
        case 401:
          // Don't show toast for auth errors - let existing auth handler manage redirect
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        
        case 403:
          toastService.error('You do not have permission to perform this action.');
          break;
        
        case 404:
          toastService.error(data?.message || 'The requested resource was not found.');
          break;
        
        case 409:
          toastService.warning(data?.message || 'This action conflicts with existing data. Please refresh and try again.');
          break;
        
        case 422:
          // Handle validation errors
          if (data?.errors || data?.validation_errors) {
            toastService.error('Please fix the form errors and try again.');
          } else {
            toastService.error(data?.message || 'Please check your input and try again.');
          }
          break;
        
        case 429:
          toastService.warning('Too many requests. Please wait a moment and try again.');
          break;
        
        case 500:
          toastService.error('Server error. Please try again in a few moments.');
          break;
        
        case 502:
        case 503:
        case 504:
          toastService.error('Service temporarily unavailable. Please try again later.');
          break;
        
        default:
          // For other 4xx/5xx errors, show generic message with backend message if available
          if (status >= 400) {
            toastService.error(data?.message || 'An error occurred. Please try again.');
          }
      }
    } else {
      // Handle other types of errors (non-HTTP)
      toastService.error('An unexpected error occurred. Please try again.');
    }

    return Promise.reject(error);
  }
);

// Export the enhanced API client
export default apiClient;

// Re-export existing API functions but using the new apiClient
export const get = (url, config) => apiClient.get(url, config);
export const post = (url, data, config) => apiClient.post(url, data, config);
export const put = (url, data, config) => apiClient.put(url, data, config);
export const del = (url, config) => apiClient.delete(url, config);

// Enhanced API methods with automatic retry capability
export const getWithRetry = async (url, config = {}, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiClient.get(url, {
        ...config,
        metadata: { ...config.metadata, attempt: attempt + 1 }
      });
    } catch (error) {
      lastError = error;
      
      // Don't retry on certain error types
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
        throw error;
      }
      
      // Only retry on network/timeout/5xx errors
      if (attempt < maxRetries && (
        error.code === 'ERR_NETWORK' || 
        error.code === 'ECONNABORTED' ||
        error.response?.status >= 500
      )) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError;
};

export const postWithRetry = async (url, data, config = {}, maxRetries = 1) => {
  // More conservative retry for POST requests (only retry once on network errors)
  try {
    return await apiClient.post(url, data, config);
  } catch (error) {
    // Only retry POST on network errors, not server errors
    if (maxRetries > 0 && (
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNABORTED' ||
      !navigator.onLine
    )) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return await apiClient.post(url, data, config);
    }
    throw error;
  }
};

// Utility function to handle API calls with loading states and error handling
export const withLoadingToast = async (apiCall, loadingMessage = 'Loading...') => {
  const loadingToastId = toastService.loading(loadingMessage);
  
  try {
    const result = await apiCall();
    toastService.removeToast(loadingToastId);
    return result;
  } catch (error) {
    toastService.removeToast(loadingToastId);
    throw error;
  }
};

// Health check function that uses the enhanced client
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

// Debug information
if (import.meta.env.DEV) {
  console.log('[ApiClient] Enhanced API client initialized with automatic toast handling');
  console.log('[ApiClient] Base URL:', getBaseURL());
  console.log('[ApiClient] Timeout:', apiClient.defaults.timeout + 'ms');
}
