/**
 * PaystackService - Handles all Paystack payment operations
 * Integrates with SabiOps backend for subscription management
 */

import api from './api';

class PaystackService {
  static PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  
  /**
   * Initialize Paystack payment for subscription upgrade
   * @param {Object} options - Payment options
   * @param {string} options.planId - Plan ID (weekly, monthly, yearly)
   * @param {string} options.userEmail - User's email address
   * @param {number} options.amount - Amount in kobo
   * @param {Object} options.metadata - Additional metadata
   * @param {Function} options.onSuccess - Success callback
   * @param {Function} options.onCancel - Cancel callback
   * @returns {Promise} Payment handler
   */
  static async initializePayment({
    planId,
    userEmail,
    amount,
    metadata = {},
    onSuccess,
    onCancel
  }) {
    try {
      // Check if Paystack is loaded
      if (!window.PaystackPop) {
        throw new Error('Paystack not loaded. Please refresh the page and try again.');
      }

      // Validate required parameters
      if (!planId || !userEmail || !amount) {
        throw new Error('Missing required payment parameters');
      }

      // Generate unique reference
      const reference = this.generateReference(planId);

      const handler = window.PaystackPop.setup({
        key: this.PAYSTACK_PUBLIC_KEY,
        email: userEmail,
        amount: amount, // Amount in kobo
        currency: 'NGN',
        ref: reference,
        metadata: {
          plan_id: planId,
          reference: reference,
          ...metadata
        },
        callback: function(response) {
          console.log('Paystack payment successful:', response);
          if (onSuccess) {
            onSuccess(response);
          }
        },
        onClose: function() {
          console.log('Paystack payment cancelled');
          if (onCancel) {
            onCancel();
          }
        }
      });

      return handler;
    } catch (error) {
      console.error('PaystackService: Payment initialization failed:', error);
      throw error;
    }
  }

  /**
   * Verify payment with backend
   * @param {string} reference - Payment reference
   * @param {Object} planData - Plan information
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object>} Verification result
   */
  static async verifyPayment(reference, planData, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    try {
      console.log(`PaystackService: Verifying payment (attempt ${retryCount + 1}):`, reference);

      const response = await api.post('/subscription/verify-payment', {
        reference: reference,
        plan_id: planData.id,
        amount: planData.price
      });

      // Axios automatically handles JSON parsing and throws errors for HTTP error status codes
      const result = response.data;

      // Validate response structure
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response format from server.');
      }

      if (!result.success) {
        throw new Error(result.message || result.error || 'Payment verification failed');
      }

      console.log('PaystackService: Payment verified successfully:', result);
      return result;

    } catch (error) {
      console.error('PaystackService: Payment verification failed:', error);
      
      // Handle axios errors
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 405) {
          throw new Error('Payment verification endpoint not available. Please try again or contact support.');
        } else if (status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (status >= 500) {
          // Server error - retry if we haven't exceeded max retries
          if (retryCount < maxRetries) {
            console.warn(`Server error (${status}), retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return this.verifyPayment(reference, planData, retryCount + 1);
          }
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(errorData?.message || errorData?.error || `HTTP ${status} error`);
        }
      } else if (error.request) {
        // Network error - retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.warn(`Network error, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return this.verifyPayment(reference, planData, retryCount + 1);
        }
        throw new Error('Network error. Please check your connection.');
      } else {
        // Other error
        throw error;
      }
    }
  }

  /**
   * Update subscription status after successful payment
   * @param {Object} paymentData - Payment verification data
   * @returns {Promise<Object>} Update result
   */
  static async updateSubscription(paymentData) {
    try {
      console.log('PaystackService: Updating subscription:', paymentData);

      const response = await api.post('/subscription/upgrade', {
        plan_id: paymentData.plan_id,
        payment_reference: paymentData.reference,
        amount: paymentData.amount
      });

      const result = response.data;
      console.log('PaystackService: Subscription updated successfully:', result);
      return result;

    } catch (error) {
      console.error('PaystackService: Subscription update failed:', error);
      throw error;
    }
  }

  /**
   * Get current subscription status
   * @returns {Promise<Object>} Subscription data
   */
  static async getSubscriptionStatus() {
    try {
      const response = await api.get('/subscription/status');
      const result = response.data;
      return result;

    } catch (error) {
      console.error('PaystackService: Failed to fetch subscription status:', error);
      throw error;
    }
  }

  /**
   * Get usage status for all features
   * @returns {Promise<Object>} Usage data
   */
  static async getUsageStatus() {
    try {
      const response = await api.get('/subscription/usage-status');
      const result = response.data;
      return result;

    } catch (error) {
      console.error('PaystackService: Failed to fetch usage status:', error);
      throw error;
    }
  }

  /**
   * Handle complete payment flow
   * @param {Object} planData - Selected plan data
   * @param {Object} userData - User data
   * @param {Function} onSuccess - Success callback
   * @param {Function} onError - Error callback
   * @param {Function} onCancel - Cancel callback
   */
  static async processPayment(planData, userData, onSuccess, onError, onCancel) {
    try {
      // Initialize payment
      const handler = await this.initializePayment({
        planId: planData.id,
        userEmail: userData.email,
        amount: planData.price,
        metadata: {
          user_id: userData.id,
          full_name: userData.full_name,
          business_name: userData.business_name,
          plan_name: planData.name
        },
        onSuccess: async (response) => {
          try {
            // Verify payment and upgrade subscription in one call
            const verificationResult = await this.verifyPayment(response.reference, planData);

            if (onSuccess) {
              onSuccess(verificationResult);
            }

          } catch (error) {
            console.error('PaystackService: Post-payment processing failed:', error);
            if (onError) {
              onError(error);
            }
          }
        },
        onCancel: onCancel
      });

      // Open payment modal
      handler.openIframe();

    } catch (error) {
      console.error('PaystackService: Payment processing failed:', error);
      if (onError) {
        onError(error);
      }
    }
  }

  /**
   * Generate unique payment reference
   * @param {string} planId - Plan identifier
   * @returns {string} Unique reference
   */
  static generateReference(planId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `SABI_${planId.toUpperCase()}_${timestamp}_${random}`;
  }

  /**
   * Format amount for display
   * @param {number} amountInKobo - Amount in kobo
   * @returns {string} Formatted amount
   */
  static formatAmount(amountInKobo) {
    const amount = amountInKobo / 100;
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Get plan configuration
   * @param {string} planId - Plan identifier
   * @returns {Object} Plan configuration
   */
  static getPlanConfig(planId) {
    const plans = {
      free: {
        id: 'free',
        name: 'Free Plan',
        price: 0,
        displayPrice: '₦0',
        period: 'forever',
        duration: 'Forever',
        features: ['5 invoices per month', '5 expenses per month', 'Basic reporting', 'Email support'],
        referral_earning: 0,
        popular: false
      },
      weekly: {
        id: 'weekly',
        name: 'Silver Weekly (7-Day Free Trial)',
        price: 140000, // ₦1,400 in kobo
        displayPrice: '₦1,400',
        period: 'week',
        duration: '7 days',
        trial_days: 7,
        features: ['7-day free trial', '100 invoices per week', '100 expenses per week', 'Advanced reporting', 'Team management', 'Priority support'],
        referral_earning: 0,
        popular: true,
        note: 'No referral earnings during trial'
      },
      monthly: {
        id: 'monthly',
        name: 'Silver Monthly',
        price: 450000, // ₦4,500 in kobo
        displayPrice: '₦4,500',
        period: 'month',
        duration: '30 days',
        features: ['450 invoices per month', '450 expenses per month', 'Advanced reporting', 'Team management', 'Priority support', 'Referral earnings (10% for 3 months)'],
        referral_earning: 450, // 10% of ₦4,500
        popular: false
      },
      yearly: {
        id: 'yearly',
        name: 'Silver Yearly',
        price: 5000000, // ₦50,000 in kobo
        displayPrice: '₦50,000',
        period: 'year',
        duration: '365 days',
        features: ['6000 invoices per year', '6000 expenses per year', 'Advanced reporting', 'Team management', 'Priority support', 'Referral earnings (10% for 3 months)'],
        referral_earning: 5000, // 10% of ₦50,000
        popular: false,
        savings: '₦4,000 saved vs monthly'
      }
    };

    return plans[planId] || null;
  }

  /**
   * Calculate prorated amount for mid-cycle upgrades
   * @param {string} currentPlan - Current plan ID
   * @param {string} newPlan - New plan ID
   * @param {number} daysRemaining - Days remaining in current cycle
   * @returns {number} Prorated amount in kobo
   */
  static calculateProratedAmount(currentPlan, newPlan, daysRemaining) {
    const currentConfig = this.getPlanConfig(currentPlan);
    const newConfig = this.getPlanConfig(newPlan);

    if (!currentConfig || !newConfig) {
      return newConfig?.price || 0;
    }

    // Calculate daily rates
    const currentDailyRate = currentConfig.price / (currentConfig.period === 'week' ? 7 : currentConfig.period === 'month' ? 30 : 365);
    const newDailyRate = newConfig.price / (newConfig.period === 'week' ? 7 : newConfig.period === 'month' ? 30 : 365);

    // Calculate refund for unused days
    const refund = currentDailyRate * daysRemaining;

    // Calculate prorated amount
    const proratedAmount = newConfig.price - refund;

    return Math.max(0, Math.round(proratedAmount));
  }
}

export default PaystackService;