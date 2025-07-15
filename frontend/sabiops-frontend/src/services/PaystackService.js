/**
 * PaystackService - Handles all Paystack payment operations
 * Integrates with SabiOps backend for subscription management
 */

class PaystackService {
  static PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here';
  
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
   * @returns {Promise<Object>} Verification result
   */
  static async verifyPayment(reference, planData) {
    try {
      console.log('PaystackService: Verifying payment:', reference);

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reference: reference,
          plan_id: planData.id,
          plan_name: planData.name,
          amount: planData.price
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Payment verification failed');
      }

      console.log('PaystackService: Payment verified successfully:', result);
      return result;

    } catch (error) {
      console.error('PaystackService: Payment verification failed:', error);
      throw error;
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

      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          plan_id: paymentData.plan_id,
          payment_reference: paymentData.reference,
          transaction_id: paymentData.transaction_id,
          amount: paymentData.amount
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Subscription update failed');
      }

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
      const response = await fetch('/api/subscription/status', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to fetch subscription status');
      }

      return result;

    } catch (error) {
      console.error('PaystackService: Failed to fetch subscription status:', error);
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
            // Verify payment
            const verificationResult = await this.verifyPayment(response.reference, planData);
            
            // Update subscription
            const updateResult = await this.updateSubscription({
              ...verificationResult,
              plan_id: planData.id,
              reference: response.reference
            });

            if (onSuccess) {
              onSuccess(updateResult);
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
      weekly: {
        id: 'weekly',
        name: 'Silver Weekly',
        price: 140000, // ₦1,400 in kobo
        displayPrice: '₦1,400',
        period: 'week',
        trial_days: 7
      },
      monthly: {
        id: 'monthly',
        name: 'Silver Monthly',
        price: 450000, // ₦4,500 in kobo
        displayPrice: '₦4,500',
        period: 'month',
        trial_days: 0
      },
      yearly: {
        id: 'yearly',
        name: 'Silver Yearly',
        price: 5000000, // ₦50,000 in kobo
        displayPrice: '₦50,000',
        period: 'year',
        trial_days: 0
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