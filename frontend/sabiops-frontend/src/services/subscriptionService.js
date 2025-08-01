import axios from 'axios';
import { getAuthToken, setAuthToken, removeAuthToken } from '../utils/auth';
import toastService from './ToastService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const subscriptionService = {
  /**
   * Verify a payment and update the user's subscription
   * @param {string} reference - The payment reference from Paystack
   * @param {string} planId - The ID of the plan being subscribed to
   * @returns {Promise<Object>} The updated subscription data
   */
  verifyPayment: async (reference, planId) => {
    try {
      console.log(`[SubscriptionService] Verifying payment for plan ${planId} with reference ${reference}`);
      
      const response = await axios.post(
        `${API_BASE_URL}/subscription/verify-payment`,
        { reference, plan_id: planId },
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 seconds timeout
        }
      );

      // If we get a new token in the response, update it
      if (response.data.access_token) {
        console.log('[SubscriptionService] Received new access token, updating...');
        
        // Store the new token
        setAuthToken(response.data.access_token);
        
        // Update axios default headers with new token
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        // Notify any listeners that the token was updated
        if (window.dispatchEvent) {
          const event = new CustomEvent('tokenUpdated', { 
            detail: { 
              token: response.data.access_token,
              subscription: response.data.subscription
            } 
          });
          window.dispatchEvent(event);
        }
      }

      console.log('[SubscriptionService] Payment verification successful:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[SubscriptionService] Error verifying payment:', error);
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        
        // If unauthorized, clear the token
        if (error.response.status === 401 || error.response.status === 403) {
          removeAuthToken();
          toastService.error('Your session has expired. Please log in again.');
        }
        
        throw error.response.data || { 
          error: error.response.statusText || 'Payment verification failed' 
        };
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw { error: 'No response from server. Please check your connection.' };
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        throw { error: error.message || 'Failed to process payment verification' };
      }
    }
  },

  /**
   * Get the current subscription status for the authenticated user
   * @returns {Promise<Object>} The subscription status data
   */
  getSubscriptionStatus: async () => {
    try {
      console.log('[SubscriptionService] Fetching subscription status...');
      
      const response = await axios.get(
        `${API_BASE_URL}/api/subscription/unified-status`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );
      
      console.log('[SubscriptionService] Subscription status:', response.data);
      return response.data.data || response.data;
      
    } catch (error) {
      console.error('[SubscriptionService] Error fetching subscription status:', error);
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          removeAuthToken();
          toastService.error('Your session has expired. Please log in again.');
        }
        throw error.response.data || { error: 'Failed to fetch subscription status' };
      }
      
      throw { error: error.message || 'Failed to fetch subscription status' };
    }
  },

  /**
   * Get the current usage status for the authenticated user
   * @returns {Promise<Object>} The usage status data
   */
  getUsageStatus: async () => {
    try {
      console.log('[SubscriptionService] Fetching usage status...');
      
      const response = await axios.get(
        `${API_BASE_URL}/subscription/usage-status`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );
      
      console.log('[SubscriptionService] Usage status:', response.data);
      return response.data.data || response.data;
      
    } catch (error) {
      console.error('[SubscriptionService] Error fetching usage status:', error);
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          removeAuthToken();
          toastService.error('Your session has expired. Please log in again.');
        }
        throw error.response.data || { error: 'Failed to fetch usage status' };
      }
      
      throw { error: error.message || 'Failed to fetch usage status' };
    }
  },

  /**
   * Get available subscription plans
   * @returns {Promise<Array>} List of available subscription plans
   */
  getPlans: async () => {
    try {
      console.log('[SubscriptionService] Fetching subscription plans...');
      
      const response = await axios.get(
        `${API_BASE_URL}/subscription/plans`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 seconds timeout
        }
      );
      
      console.log('[SubscriptionService] Subscription plans:', response.data);
      return response.data.data || response.data;
      
    } catch (error) {
      console.error('[SubscriptionService] Error fetching subscription plans:', error);
      
      if (error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          removeAuthToken();
          toastService.error('Your session has expired. Please log in again.');
        }
        throw error.response.data || { error: 'Failed to fetch subscription plans' };
      }
      
      throw { error: error.message || 'Failed to fetch subscription plans' };
    }
  },
};

export default subscriptionService;
