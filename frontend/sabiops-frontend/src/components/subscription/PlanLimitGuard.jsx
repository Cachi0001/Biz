import React, { useState } from 'react';
import { usePlanLimits } from '../../contexts/PlanLimitContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Crown, 
  AlertTriangle, 
  Lock, 
  TrendingUp,
  ArrowRight
} from 'lucide-react';

/**
 * Component that guards actions based on plan limits
 * Can be used to wrap buttons, forms, or entire sections
 */
export const PlanLimitGuard = ({ 
  action, 
  context = {}, 
  children, 
  fallback = null,
  showUpgradePrompt = true,
  className = ''
}) => {
  const { canPerformAction, enforceAction, getUsageStatus, getPlanLimits } = usePlanLimits();
  const [isChecking, setIsChecking] = useState(false);
  
  const canPerform = canPerformAction(action, context);
  const usage = getUsageStatus();
  const limits = getPlanLimits();

  const handleActionAttempt = async (originalHandler) => {
    setIsChecking(true);
    
    try {
      const enforcement = await enforceAction(action, context);
      
      if (!enforcement.blocked && originalHandler) {
        await originalHandler();
      }
    } catch (error) {
      console.error('Action enforcement error:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // If action is allowed, render children normally
  if (canPerform) {
    // Clone children and wrap handlers with enforcement
    const enhancedChildren = React.Children.map(children, child => {
      if (React.isValidElement(child) && child.props.onClick) {
        return React.cloneElement(child, {
          onClick: (e) => handleActionAttempt(() => child.props.onClick(e)),
          disabled: child.props.disabled || isChecking
        });
      }
      return child;
    });

    return <div className={className}>{enhancedChildren}</div>;
  }

  // If action is blocked and we have a custom fallback, use it
  if (fallback) {
    return <div className={className}>{fallback}</div>;
  }

  // Default blocked state with upgrade prompt
  if (showUpgradePrompt) {
    return (
      <div className={className}>
        <PlanUpgradePrompt 
          action={action} 
          usage={usage} 
          limits={limits}
          blockedChildren={children}
        />
      </div>
    );
  }

  // Just hide the content if no upgrade prompt requested
  return null;
};

/**
 * Upgrade prompt component shown when actions are blocked
 */
const PlanUpgradePrompt = ({ action, usage, limits, blockedChildren }) => {
  const getActionDetails = (action) => {
    const details = {
      create_invoice: {
        title: 'Invoice Limit Reached',
        description: `You've used all ${limits.invoices} invoices in your current plan`,
        icon: '📄',
        feature: 'invoice creation'
      },
      create_expense: {
        title: 'Expense Limit Reached',
        description: `You've used all ${limits.expenses} expenses in your current plan`,
        icon: '💰',
        feature: 'expense tracking'
      },
      add_customer: {
        title: 'Customer Limit Reached',
        description: `You've reached the ${limits.customers} customer limit`,
        icon: '👥',
        feature: 'customer management'
      },
      add_product: {
        title: 'Product Limit Reached',
        description: `You've reached the ${limits.products} product limit`,
        icon: '📦',
        feature: 'product catalog'
      },
      access_analytics: {
        title: 'Analytics Requires Upgrade',
        description: 'Advanced analytics are available with paid plans',
        icon: '📊',
        feature: 'analytics dashboard'
      },
      generate_reports: {
        title: 'Reports Require Upgrade',
        description: 'Advanced reporting is available with paid plans',
        icon: '📈',
        feature: 'detailed reporting'
      }
    };

    return details[action] || {
      title: 'Upgrade Required',
      description: 'This feature requires a higher subscription plan',
      icon: '🔒',
      feature: 'this feature'
    };
  };

  const actionDetails = getActionDetails(action);

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{actionDetails.icon}</div>
          <div>
            <CardTitle className="text-lg text-orange-800">
              {actionDetails.title}
            </CardTitle>
            <p className="text-sm text-orange-600 mt-1">
              {actionDetails.description}
            </p>
          </div>
          <Badge variant="outline" className="ml-auto">
            <Lock className="h-3 w-3 mr-1" />
            Blocked
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Usage Display */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {usage.invoices || 0}/{limits.invoices}
            </div>
            <div className="text-xs text-gray-500">Invoices Used</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {usage.expenses || 0}/{limits.expenses}
            </div>
            <div className="text-xs text-gray-500">Expenses Used</div>
          </div>
        </div>

        {/* Upgrade Benefits */}
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Upgrade to Silver Weekly and get:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• 100 invoices & expenses per week</li>
              <li>• Advanced analytics & reporting</li>
              <li>• Team collaboration</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Blocked Action Preview */}
        <div className="p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              This action is currently blocked:
            </span>
          </div>
          <div className="opacity-50 pointer-events-none">
            {blockedChildren}
          </div>
        </div>

        {/* Upgrade Button */}
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            onClick={() => window.location.href = '/subscription-upgrade'}
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/pricing'}
          >
            View Plans
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Hook for easy plan limit checking in components
 */
export const usePlanLimitGuard = () => {
  const { canPerformAction, enforceAction } = usePlanLimits();
  
  const guardAction = async (action, handler, context = {}) => {
    const enforcement = await enforceAction(action, context);
    
    if (!enforcement.blocked && handler) {
      return await handler();
    }
    
    return { blocked: true, enforcement };
  };

  return {
    canPerformAction,
    guardAction
  };
};

export default PlanLimitGuard;