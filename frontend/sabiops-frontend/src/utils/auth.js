const TOKEN_KEY = 'sabiops_auth_token';
const SUBSCRIPTION_KEY = 'sabiops_subscription_data';

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The JWT token or null if not found
 */
export const getAuthToken = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    // Handle case where token is literally the string "null" or "undefined"
    if (!token || token === 'null' || token === 'undefined' || token.trim() === '') {
      return null;
    }
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Set the authentication token in localStorage
 * @param {string} token - The JWT token to store
 * @param {Object} [subscriptionData] - Optional subscription data to store
 */
export const setAuthToken = (token, subscriptionData = null) => {
  try {
    if (!token) {
      console.warn('Attempted to set empty token');
      return;
    }
    
    localStorage.setItem(TOKEN_KEY, token);
    
    // If subscription data is provided, store it as well
    if (subscriptionData) {
      localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(subscriptionData));
      console.log('[Auth] Stored subscription data:', subscriptionData);
    }
    
    // Update axios default headers
    if (typeof axios !== 'undefined') {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('[Auth] Token updated successfully');
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Remove the authentication token from localStorage
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SUBSCRIPTION_KEY);
    
    // Remove from axios defaults if it exists
    if (typeof axios !== 'undefined' && axios.defaults.headers.common['Authorization']) {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    console.log('[Auth] Token removed');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Get the stored subscription data
 * @returns {Object|null} The subscription data or null if not found
 */
export const getSubscriptionData = () => {
  try {
    const data = localStorage.getItem(SUBSCRIPTION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting subscription data:', error);
    return null;
  }
};

/**
 * Check if the user is authenticated
 * @returns {boolean} True if a valid token exists, false otherwise
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

/**
 * Check if the user has an active subscription
 * @returns {boolean} True if the user has an active subscription
 */
export const hasActiveSubscription = () => {
  try {
    const subscription = getSubscriptionData();
    if (!subscription) return false;
    
    // Check if subscription is active based on the status
    return subscription.is_active || subscription.status === 'active' || subscription.status === 'trial';
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return false;
  }
};

/**
 * Check if the user is on a trial
 * @returns {boolean} True if the user is on a trial
 */
export const isOnTrial = () => {
  try {
    const subscription = getSubscriptionData();
    return subscription ? subscription.is_trial || subscription.status === 'trial' : false;
  } catch (error) {
    console.error('Error checking trial status:', error);
    return false;
  }
};

/**
 * Get the remaining trial days
 * @returns {number} The number of days remaining in the trial, or 0 if not on trial
 */
export const getTrialDaysLeft = () => {
  try {
    const subscription = getSubscriptionData();
    if (!subscription) return 0;
    
    return subscription.trial_days_left || subscription.remaining_days || 0;
  } catch (error) {
    console.error('Error getting trial days left:', error);
    return 0;
  }
};

/**
 * Get the current subscription plan
 * @returns {string} The subscription plan name or 'free' if not subscribed
 */
export const getCurrentPlan = () => {
  try {
    const subscription = getSubscriptionData();
    if (!subscription) return 'free';
    
    return subscription.plan || subscription.subscription_plan || 'free';
  } catch (error) {
    console.error('Error getting current plan:', error);
    return 'free';
  }
};

/**
 * Clear all authentication and subscription data
 */
export const clearAuthData = () => {
  removeAuthToken();
  // Clear any other auth-related data if needed
  console.log('[Auth] All authentication data cleared');
};

// Initialize axios headers if we have a token
if (typeof window !== 'undefined') {
  const token = getAuthToken();
  if (token && typeof axios !== 'undefined') {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getSubscriptionData,
  isAuthenticated,
  hasActiveSubscription,
  isOnTrial,
  getTrialDaysLeft,
  getCurrentPlan,
  clearAuthData
};
