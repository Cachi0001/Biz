import React, { createContext, useContext, useEffect } from 'react';
import { usePlanLimitEnforcement } from '../hooks/usePlanLimitEnforcement';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const PlanLimitContext = createContext();

export const usePlanLimits = () => {
  const context = useContext(PlanLimitContext);
  if (!context) {
    throw new Error('usePlanLimits must be used within a PlanLimitProvider');
  }
  return context;
};

export const PlanLimitProvider = ({ children }) => {
  const { user, subscription } = useAuth();
  const enforcement = usePlanLimitEnforcement();
  const tracking = useUsageTracking();

  // Initialize usage tracking when user/subscription changes
  useEffect(() => {
    if (user && subscription) {
      tracking.loadUsageFromStorage();
    }
  }, [user, subscription, tracking]);

  // Monitor usage and show warnings
  useEffect(() => {
    const summary = tracking.getUsageSummary();
    
    // Show warnings for resources approaching limits
    summary.warnings.forEach(warning => {
      const message = `You're using ${warning.percentage}% of your ${warning.resource} limit (${warning.usage}/${warning.limit})`;
      
      toast.warning(message, {
        id: `warning-${warning.resource}`, // Prevent duplicate toasts
        duration: 5000,
        action: {
          label: 'Upgrade',
          onClick: () => {
            window.location.href = '/subscription-upgrade';
          }
        }
      });
    });
    
    // Show blocks for resources at limits
    summary.blocked.forEach(block => {
      const message = `You've reached your ${block.resource} limit (${block.usage}/${block.limit})`;
      
      toast.error(message, {
        id: `blocked-${block.resource}`, // Prevent duplicate toasts
        duration: 8000,
        action: {
          label: 'Upgrade Now',
          onClick: () => {
            window.location.href = '/subscription-upgrade';
          }
        }
      });
    });
  }, [tracking.usage]);

  const value = {
    // Enforcement methods
    canPerformAction: enforcement.canPerformAction,
    enforceAction: enforcement.enforceAction,
    getEnforcementSummary: enforcement.getEnforcementSummary,
    clearEnforcementState: enforcement.clearEnforcementState,
    
    // Usage tracking methods
    incrementUsage: tracking.incrementUsage,
    decrementUsage: tracking.decrementUsage,
    getUsageStatus: tracking.getUsageStatus,
    getUsagePercentage: tracking.getUsagePercentage,
    isApproachingLimit: tracking.isApproachingLimit,
    isAtLimit: tracking.isAtLimit,
    getRemainingUsage: tracking.getRemainingUsage,
    resetUsage: tracking.resetUsage,
    
    // Combined data
    getPlanLimits: enforcement.getPlanLimits,
    getUsageSummary: tracking.getUsageSummary,
    
    // State
    usage: tracking.usage,
    enforcementState: enforcement.enforcementState
  };

  return (
    <PlanLimitContext.Provider value={value}>
      {children}
    </PlanLimitContext.Provider>
  );
};