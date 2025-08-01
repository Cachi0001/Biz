import { useState, useCallback, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

/**
 * Hook for enforcing subscription plan limits and managing upgrade prompts
 */
export const usePlanLimitEnforcement = () => {
  const { user, subscription } = useAuth();
  const [enforcementState, setEnforcementState] = useState({
    blockedActions: [],
    warnings: [],
    upgradePrompts: []
  });

  // Get plan limits based on subscription
  const getPlanLimits = useCallback(() => {
    const plan = subscription?.plan || 'free';
    
    const limits = {
      free: {
        invoices: 5,
        expenses: 20,
        sales: 50,
        customers: 50,
        products: 20,
        analytics: false,
        reports: false,
        team_members: 1
      },
      weekly: {
        invoices: 100,
        expenses: 100,
        sales: 250,
        customers: 500,
        products: 100,
        analytics: true,
        reports: true,
        team_members: 5
      },
      monthly: {
        invoices: 450,
        expenses: 500,
        sales: 1500,
        customers: 2000,
        products: 500,
        analytics: true,
        reports: true,
        team_members: 10
      },
      yearly: {
        invoices: 6000,
        expenses: 2000,
        sales: 18000,
        customers: 10000,
        products: 2000,
        analytics: true,
        reports: true,
        team_members: 25
      }
    };

    return limits[plan] || limits.free;
  }, [subscription?.plan]);

  // Get current usage from localStorage or API
  const getCurrentUsage = useCallback(() => {
    try {
      const stored = localStorage.getItem('usage_tracking');
      if (stored) {
        const usage = JSON.parse(stored);
        // Reset monthly usage if needed
        const now = new Date();
        const lastReset = new Date(usage.lastReset || 0);
        const shouldReset = now.getMonth() !== lastReset.getMonth() || 
                           now.getFullYear() !== lastReset.getFullYear();
        
        if (shouldReset) {
          const resetUsage = {
            invoices: 0,
            expenses: 0,
            customers: usage.customers || 0, // Don't reset cumulative counters
            products: usage.products || 0,
            lastReset: now.toISOString()
          };
          localStorage.setItem('usage_tracking', JSON.stringify(resetUsage));
          return resetUsage;
        }
        
        return usage;
      }
    } catch (error) {
      console.error('Error reading usage data:', error);
    }
    
    return {
      invoices: 0,
      expenses: 0,
      customers: 0,
      products: 0,
      lastReset: new Date().toISOString()
    };
  }, []);

  // Check if user can perform a specific action
  const canPerformAction = useCallback((action, context = {}) => {
    const limits = getPlanLimits();
    const usage = getCurrentUsage();
    
    // For team members, use owner's subscription
    const effectiveRole = user?.role || 'owner';
    if (effectiveRole !== 'owner' && subscription?.owner_subscription) {
      // Team members inherit owner's plan limits
      return true; // Simplified for now - in real app, check owner's limits
    }

    switch (action) {
      case 'create_invoice':
        return usage.invoices < limits.invoices;
      
      case 'create_expense':
        return usage.expenses < limits.expenses;
      
      case 'add_customer':
        return usage.customers < limits.customers;
      
      case 'add_product':
        return usage.products < limits.products;
      
      case 'access_analytics':
        return limits.analytics;
      
      case 'generate_reports':
        return limits.reports;
      
      case 'invite_team_member':
        const currentTeamSize = context.currentTeamSize || 1;
        return currentTeamSize < limits.team_members;
      
      default:
        return true;
    }
  }, [user, subscription, getPlanLimits, getCurrentUsage]);

  // Enforce action with appropriate blocking/warning
  const enforceAction = useCallback(async (action, context = {}) => {
    const canPerform = canPerformAction(action, context);
    const limits = getPlanLimits();
    const usage = getCurrentUsage();
    
    if (!canPerform) {
      const enforcement = {
        blocked: true,
        action,
        reason: getBlockReason(action, limits, usage),
        upgradeRequired: true,
        upgradeMessage: getUpgradeMessage(action, limits)
      };
      
      // Update enforcement state
      setEnforcementState(prev => ({
        ...prev,
        blockedActions: [...prev.blockedActions, enforcement]
      }));
      
      // Show upgrade prompt
      showUpgradePrompt(enforcement);
      
      return enforcement;
    }
    
    // Check if approaching limits (80% threshold)
    const warningThreshold = 0.8;
    const warnings = checkForWarnings(action, limits, usage, warningThreshold);
    
    if (warnings.length > 0) {
      setEnforcementState(prev => ({
        ...prev,
        warnings: [...prev.warnings, ...warnings]
      }));
      
      // Show warning toast
      warnings.forEach(warning => {
        toast.warning(warning.message, {
          duration: 5000,
          action: {
            label: 'Upgrade',
            onClick: () => showUpgradePrompt({ action, upgradeRequired: false })
          }
        });
      });
    }
    
    return {
      blocked: false,
      action,
      warnings,
      canProceed: true
    };
  }, [canPerformAction, getPlanLimits, getCurrentUsage]);

  // Get block reason message
  const getBlockReason = (action, limits, usage) => {
    switch (action) {
      case 'create_invoice':
        return `You've reached your monthly limit of ${limits.invoices} invoices (${usage.invoices}/${limits.invoices})`;
      case 'create_expense':
        return `You've reached your monthly limit of ${limits.expenses} expenses (${usage.expenses}/${limits.expenses})`;
      case 'add_customer':
        return `You've reached your limit of ${limits.customers} customers (${usage.customers}/${limits.customers})`;
      case 'add_product':
        return `You've reached your limit of ${limits.products} products (${usage.products}/${limits.products})`;
      case 'access_analytics':
        return 'Analytics access requires a paid subscription plan';
      case 'generate_reports':
        return 'Advanced reporting requires a paid subscription plan';
      case 'invite_team_member':
        return `You've reached your team member limit for your current plan`;
      default:
        return 'This action requires a higher subscription plan';
    }
  };

  // Get upgrade message
  const getUpgradeMessage = (action, limits) => {
    const plan = subscription?.plan || 'free';
    
    if (plan === 'free') {
      return 'Upgrade to Silver Weekly to unlock higher limits and premium features';
    }
    
    return 'Consider upgrading to a higher plan for increased limits';
  };

  // Check for warnings when approaching limits
  const checkForWarnings = (action, limits, usage, threshold) => {
    const warnings = [];
    
    switch (action) {
      case 'create_invoice':
        const invoicePercentage = usage.invoices / limits.invoices;
        if (invoicePercentage >= threshold) {
          warnings.push({
            type: 'approaching_limit',
            action: 'create_invoice',
            message: `You're approaching your invoice limit (${usage.invoices}/${limits.invoices})`,
            percentage: Math.round(invoicePercentage * 100)
          });
        }
        break;
      
      case 'create_expense':
        const expensePercentage = usage.expenses / limits.expenses;
        if (expensePercentage >= threshold) {
          warnings.push({
            type: 'approaching_limit',
            action: 'create_expense',
            message: `You're approaching your expense limit (${usage.expenses}/${limits.expenses})`,
            percentage: Math.round(expensePercentage * 100)
          });
        }
        break;
    }
    
    return warnings;
  };

  // Show upgrade prompt
  const showUpgradePrompt = (enforcement) => {
    const upgradePrompt = {
      id: Date.now(),
      action: enforcement.action,
      reason: enforcement.reason,
      upgradeMessage: enforcement.upgradeMessage,
      timestamp: new Date()
    };
    
    setEnforcementState(prev => ({
      ...prev,
      upgradePrompts: [...prev.upgradePrompts, upgradePrompt]
    }));
    
    // Show toast with upgrade option
    toast.error(enforcement.reason, {
      duration: 8000,
      action: {
        label: 'Upgrade Now',
        onClick: () => {
          // Navigate to upgrade page
          window.location.href = '/subscription-upgrade';
        }
      }
    });
  };

  // Get enforcement summary
  const getEnforcementSummary = useCallback(() => {
    const limits = getPlanLimits();
    const usage = getCurrentUsage();
    
    const summary = {
      plan: subscription?.plan || 'free',
      limits,
      usage,
      nearLimits: [],
      atLimits: [],
      blockedActions: enforcementState.blockedActions,
      warnings: enforcementState.warnings
    };
    
    // Check which limits are near or at capacity
    Object.keys(limits).forEach(key => {
      if (typeof limits[key] === 'number' && usage[key] !== undefined) {
        const percentage = (usage[key] / limits[key]) * 100;
        
        if (percentage >= 100) {
          summary.atLimits.push({
            type: key,
            usage: usage[key],
            limit: limits[key],
            percentage: 100
          });
        } else if (percentage >= 80) {
          summary.nearLimits.push({
            type: key,
            usage: usage[key],
            limit: limits[key],
            percentage: Math.round(percentage)
          });
        }
      }
    });
    
    return summary;
  }, [subscription, getPlanLimits, getCurrentUsage, enforcementState]);

  // Clear enforcement state
  const clearEnforcementState = useCallback(() => {
    setEnforcementState({
      blockedActions: [],
      warnings: [],
      upgradePrompts: []
    });
  }, []);

  // Get smart recommendations based on usage patterns
  const getSmartRecommendations = useCallback(() => {
    const limits = getPlanLimits();
    const usage = getCurrentUsage();
    const recommendations = [];
    
    // Check for blocked actions
    const blockedActions = [];
    Object.keys(limits).forEach(key => {
      if (typeof limits[key] === 'number' && usage[key] >= limits[key]) {
        blockedActions.push(key);
      }
    });
    
    if (blockedActions.length > 0) {
      recommendations.push({
        type: 'blocked_actions',
        priority: 'high',
        reason: `You've reached your limit for ${blockedActions.join(', ')}`,
        blockedActions,
        suggestedPlan: 'silver_weekly',
        benefits: ['100 invoices & expenses per week', 'Advanced analytics', 'Priority support']
      });
    }
    
    // Check for high usage (80%+)
    Object.keys(limits).forEach(key => {
      if (typeof limits[key] === 'number' && usage[key] !== undefined) {
        const percentage = (usage[key] / limits[key]) * 100;
        if (percentage >= 80 && percentage < 100) {
          recommendations.push({
            type: 'high_usage',
            priority: 'medium',
            reason: `You're using ${Math.round(percentage)}% of your ${key} limit`,
            suggestedPlan: 'silver_weekly',
            benefits: ['Higher limits', 'No interruptions', 'Advanced features']
          });
        }
      }
    });
    
    return recommendations;
  }, [getPlanLimits, getCurrentUsage]);

  return {
    canPerformAction,
    enforceAction,
    getEnforcementSummary,
    clearEnforcementState,
    getPlanLimits,
    getCurrentUsage,
    enforcementState,
    getSmartRecommendations
  };
};