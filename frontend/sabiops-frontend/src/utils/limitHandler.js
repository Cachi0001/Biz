import toastService from '../services/ToastService';

/**
 * Handle limit exceeded errors from API responses
 * @param {Object} error - The error response from API
 * @param {Function} showLimitModal - Function to show the limit exceeded modal
 * @returns {boolean} - Returns true if error was handled, false otherwise
 */
export const handleLimitExceeded = (error, showLimitModal) => {
  if (error.error === 'limit_exceeded' && error.limit_info) {
    const { limit_info } = error;
    
    // Show toast notification
    if (error.toast) {
      toastService.error(error.toast.message, {
        duration: error.toast.timeout || 5000,
        action: error.toast.action ? {
          label: error.toast.action.text,
          onClick: () => {
            if (error.toast.action.url) {
              window.location.href = error.toast.action.url;
            }
          }
        } : undefined
      });
    }
    
    // Show limit exceeded modal if handler provided
    if (showLimitModal) {
      showLimitModal({
        featureType: limit_info.feature_type,
        currentUsage: limit_info.current_usage,
        limit: limit_info.limit,
        currentPlan: limit_info.current_plan,
        suggestedPlans: limit_info.suggested_plans || []
      });
    }
    
    return true;
  }
  
  return false;
};

/**
 * Check if user is approaching their limit and show warning
 * @param {Object} usageData - Current usage data
 * @param {string} featureType - The feature type to check
 * @param {number} warningThreshold - Percentage threshold for warning (default 90)
 */
export const checkUsageWarning = (usageData, featureType, warningThreshold = 90) => {
  if (!usageData || !usageData.current_usage || !usageData.current_usage[featureType]) {
    return;
  }
  
  const usage = usageData.current_usage[featureType];
  const percentage = usage.percentage || 0;
  
  if (percentage >= warningThreshold && percentage < 100) {
    const remaining = usage.limit - usage.current;
    const featureName = getFeatureDisplayName(featureType);
    
    toastService.warning(
      `You're at ${percentage.toFixed(1)}% of your ${featureName.toLowerCase()} limit. ${remaining} remaining.`,
      {
        duration: 4000,
        action: {
          label: 'Upgrade',
          onClick: () => {
            window.location.href = '/subscription-upgrade';
          }
        }
      }
    );
  }
};

/**
 * Get user-friendly display name for feature types
 * @param {string} featureType - The feature type
 * @returns {string} - Display name
 */
export const getFeatureDisplayName = (featureType) => {
  const names = {
    'invoices': 'Invoices',
    'expenses': 'Expenses',
    'sales': 'Sales', 
    'products': 'Products'
  };
  return names[featureType] || featureType;
};

/**
 * Check usage limits before form submission
 * @param {string} featureType - The feature type to check
 * @param {Function} getUsageStatus - Function to get current usage status
 * @param {Function} showLimitModal - Function to show limit modal
 * @returns {Promise<boolean>} - Returns true if creation is allowed, false if limit reached
 */
export const checkLimitsBeforeSubmission = async (featureType, getUsageStatus, showLimitModal) => {
  try {
    const usageData = await getUsageStatus();
    
    if (!usageData || !usageData.current_usage || !usageData.current_usage[featureType]) {
      // If we can't get usage data, allow the submission and let backend handle it
      return true;
    }
    
    const usage = usageData.current_usage[featureType];
    
    if (usage.current >= usage.limit) {
      // Show limit exceeded modal
      if (showLimitModal) {
        showLimitModal({
          featureType,
          currentUsage: usage.current,
          limit: usage.limit,
          currentPlan: usageData.subscription?.plan || 'free'
        });
      }
      
      // Show toast notification
      toastService.error(
        `You've reached your ${getFeatureDisplayName(featureType).toLowerCase()} limit (${usage.current}/${usage.limit}). Upgrade to continue.`,
        {
          duration: 5000,
          action: {
            label: 'Upgrade Now',
            onClick: () => {
              window.location.href = '/subscription-upgrade';
            }
          }
        }
      );
      
      return false;
    }
    
    // Check for warning threshold
    checkUsageWarning(usageData, featureType);
    
    return true;
  } catch (error) {
    console.error('Error checking limits:', error);
    // If there's an error checking limits, allow submission and let backend handle it
    return true;
  }
};