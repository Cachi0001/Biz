import { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import useUsageTracking from './useUsageTracking';
import { useNavigate } from 'react-router-dom';

/**
 * Hook for enforcing plan limits and showing appropriate UI feedback
 * @returns {Object} Plan limit enforcement methods
 */
const usePlanLimitEnforcement = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const {
    checkFeatureAccess,
    isAtLimit,
    isApproachingLimit,
    getCurrentUsage,
    getFeatureLimit,
  } = useUsageTracking();

  /**
   * Validate if an action can be performed based on usage limits
   * @param {string} featureType - The feature type (invoices, expenses, sales, products)
   * @param {Object} options - Additional options
   * @param {boolean} options.showToast - Whether to show a toast message if limit is reached
   * @param {boolean} options.redirectToUpgrade - Whether to redirect to upgrade page if limit is reached
   * @returns {Promise<boolean>} Whether the action can be performed
   */
  const validateAction = useCallback(
    async (featureType, { showToastMessage = true, redirectToUpgrade = false } = {}) => {
      // Check if the feature can be used
      const result = await checkFeatureAccess(featureType);

      if (!result.canUse) {
        if (showToastMessage) {
          showToast({
            title: 'Usage Limit Reached',
            message: `You've reached your ${featureType} limit (${result.currentCount}/${result.limitCount}). Please upgrade your plan to continue.`,
            type: 'error',
            duration: 5000,
          });
        }

        if (redirectToUpgrade) {
          navigate('/settings?tab=subscription');
        }

        return false;
      }

      // Show warning if approaching limit
      if (result.usagePercentage >= 80 && result.usagePercentage < 100 && showToastMessage) {
        showToast({
          title: 'Approaching Usage Limit',
          message: `You're approaching your ${featureType} limit (${result.currentCount}/${result.limitCount}). Consider upgrading your plan.`,
          type: 'warning',
          duration: 5000,
        });
      }

      return true;
    },
    [checkFeatureAccess, showToast, navigate]
  );

  /**
   * Get a message about the current usage status
   * @param {string} featureType - The feature type (invoices, expenses, sales, products)
   * @returns {Object|null} Message object or null if no warning needed
   */
  const getUsageStatusMessage = useCallback(
    (featureType) => {
      if (isAtLimit(featureType)) {
        return {
          type: 'error',
          title: 'Usage Limit Reached',
          message: `You've reached your ${featureType} limit (${getCurrentUsage(featureType)}/${getFeatureLimit(
            featureType
          )}). Please upgrade your plan to continue.`,
        };
      }

      if (isApproachingLimit(featureType)) {
        return {
          type: 'warning',
          title: 'Approaching Usage Limit',
          message: `You're approaching your ${featureType} limit (${getCurrentUsage(featureType)}/${getFeatureLimit(
            featureType
          )}). Consider upgrading your plan.`,
        };
      }

      return null;
    },
    [isAtLimit, isApproachingLimit, getCurrentUsage, getFeatureLimit]
  );

  /**
   * Show a usage limit prompt if needed
   * @param {string} featureType - The feature type (invoices, expenses, sales, products)
   * @returns {boolean} Whether a prompt was shown
   */
  const showUsageLimitPromptIfNeeded = useCallback(
    (featureType) => {
      const message = getUsageStatusMessage(featureType);

      if (message) {
        showToast({
          title: message.title,
          message: message.message,
          type: message.type,
          duration: 5000,
          action: isAtLimit(featureType)
            ? {
                label: 'Upgrade',
                onClick: () => navigate('/settings?tab=subscription'),
              }
            : undefined,
        });
        return true;
      }

      return false;
    },
    [getUsageStatusMessage, showToast, isAtLimit, navigate]
  );

  return {
    validateAction,
    getUsageStatusMessage,
    showUsageLimitPromptIfNeeded,
  };
};

export default usePlanLimitEnforcement;