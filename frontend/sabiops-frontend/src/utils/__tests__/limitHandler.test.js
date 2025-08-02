/**
 * Test limit handler functionality
 */
import { handleLimitExceeded, checkUsageWarning, checkLimitsBeforeSubmission } from '../limitHandler';
import toastService from '../../services/ToastService';

// Mock toast service
jest.mock('../../services/ToastService', () => ({
  error: jest.fn(),
  warning: jest.fn()
}));

describe('limitHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('handleLimitExceeded', () => {
    it('should handle limit exceeded error correctly', () => {
      const mockShowLimitModal = jest.fn();
      const error = {
        error: 'limit_exceeded',
        limit_info: {
          feature_type: 'expenses',
          current_usage: 100,
          limit: 100,
          current_plan: 'monthly'
        },
        toast: {
          message: 'You have reached your expense limit',
          timeout: 5000,
          action: {
            text: 'Upgrade Now',
            url: '/subscription-upgrade'
          }
        }
      };

      const result = handleLimitExceeded(error, mockShowLimitModal);

      expect(result).toBe(true);
      expect(toastService.error).toHaveBeenCalledWith(
        'You have reached your expense limit',
        expect.objectContaining({
          duration: 5000
        })
      );
      expect(mockShowLimitModal).toHaveBeenCalledWith({
        featureType: 'expenses',
        currentUsage: 100,
        limit: 100,
        currentPlan: 'monthly',
        suggestedPlans: []
      });
    });

    it('should return false for non-limit errors', () => {
      const mockShowLimitModal = jest.fn();
      const error = {
        error: 'validation_error',
        message: 'Invalid data'
      };

      const result = handleLimitExceeded(error, mockShowLimitModal);

      expect(result).toBe(false);
      expect(toastService.error).not.toHaveBeenCalled();
      expect(mockShowLimitModal).not.toHaveBeenCalled();
    });
  });

  describe('checkUsageWarning', () => {
    it('should show warning when usage is at 90%', () => {
      const usageData = {
        current_usage: {
          expenses: {
            current: 90,
            limit: 100,
            percentage: 90
          }
        }
      };

      checkUsageWarning(usageData, 'expenses', 90);

      expect(toastService.warning).toHaveBeenCalledWith(
        "You're at 90.0% of your expenses limit. 10 remaining.",
        expect.objectContaining({
          duration: 4000
        })
      );
    });

    it('should not show warning when usage is below threshold', () => {
      const usageData = {
        current_usage: {
          expenses: {
            current: 50,
            limit: 100,
            percentage: 50
          }
        }
      };

      checkUsageWarning(usageData, 'expenses', 90);

      expect(toastService.warning).not.toHaveBeenCalled();
    });
  });

  describe('checkLimitsBeforeSubmission', () => {
    it('should return true when within limits', async () => {
      const mockGetUsageStatus = jest.fn().mockResolvedValue({
        current_usage: {
          expenses: {
            current: 50,
            limit: 100
          }
        }
      });
      const mockShowLimitModal = jest.fn();

      const result = await checkLimitsBeforeSubmission(
        'expenses',
        mockGetUsageStatus,
        mockShowLimitModal
      );

      expect(result).toBe(true);
      expect(mockShowLimitModal).not.toHaveBeenCalled();
    });

    it('should return false when at limit', async () => {
      const mockGetUsageStatus = jest.fn().mockResolvedValue({
        current_usage: {
          expenses: {
            current: 100,
            limit: 100
          }
        },
        subscription: {
          plan: 'monthly'
        }
      });
      const mockShowLimitModal = jest.fn();

      const result = await checkLimitsBeforeSubmission(
        'expenses',
        mockGetUsageStatus,
        mockShowLimitModal
      );

      expect(result).toBe(false);
      expect(mockShowLimitModal).toHaveBeenCalledWith({
        featureType: 'expenses',
        currentUsage: 100,
        limit: 100,
        currentPlan: 'monthly'
      });
      expect(toastService.error).toHaveBeenCalledWith(
        "You've reached your expenses limit (100/100). Upgrade to continue.",
        expect.objectContaining({
          duration: 5000
        })
      );
    });

    it('should return true when usage data is unavailable', async () => {
      const mockGetUsageStatus = jest.fn().mockRejectedValue(new Error('Network error'));
      const mockShowLimitModal = jest.fn();

      const result = await checkLimitsBeforeSubmission(
        'expenses',
        mockGetUsageStatus,
        mockShowLimitModal
      );

      expect(result).toBe(true);
      expect(mockShowLimitModal).not.toHaveBeenCalled();
    });
  });
});