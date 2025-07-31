import axios from 'axios';
import { getAuthToken, setAuthToken } from '../utils/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const subscriptionService = {
  verifyPayment: async (reference, planId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/subscription/verify-payment`,
        { reference, plan_id: planId },
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // If we get a new token in the response, update it
      if (response.data.access_token) {
        // Store the new token
        setAuthToken(response.data.access_token);
        
        // Update axios default headers with new token
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        // Notify any listeners that the token was updated
        if (window.dispatchEvent) {
          const event = new CustomEvent('tokenUpdated', { 
            detail: { token: response.data.access_token } 
          });
          window.dispatchEvent(event);
        }
      }

      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error.response?.data || { error: 'Failed to verify payment' };
    }
  },

  getSubscriptionStatus: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/subscription/unified-status`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching subscription status:', error);
      throw error.response?.data || { error: 'Failed to fetch subscription status' };
    }
  },

  getUsageStatus: async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/subscription/usage-status`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching usage status:', error);
      throw error.response?.data || { error: 'Failed to fetch usage status' };
    }
  },
};

export default subscriptionService;
