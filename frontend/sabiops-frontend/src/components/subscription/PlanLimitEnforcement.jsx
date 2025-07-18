import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Lock, 
  Crown, 
  AlertTriangle, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import IntelligentUpgradePrompt from './IntelligentUpgradePrompt';

/**
 * Component that enforces plan limits and shows appropriate UI based on usage status
 * Wraps form buttons or actions to prevent execution when limits are reached
 */
const PlanLimitEnforcement = ({ 
  actionType, // 'invoices' or 'expenses'
  children, // The button or component to wrap
  onUpgrade,
  showUpgradePrompt = true,
  blockAction = true, // Whether to block the action when limit is reached
  className = ''
}) => {
  const { user, subscription } = useAuth();
  const { validateAction, getUsageStatus } = useUsageTracking();
  const [validation, setValidation] = useState({ allowed: true });
  const [usageStatus, setUsageStatus] = useState(null);

  useEffect(() => {
    if (user && actionType) {
      const validationResult = validateAction(actionType);
      const status = getUsageStatus(actionType);
      
      setValidation(validationResult);
      setUsageStatus(status);
    }
  }, [user, actionType, validateAction, getUsageStatus]);

  if (!user || !subscription || !actionType) {
    return children;
  }

  // For unlimited plans, always allow
  if (usageStatus?.isUnlimited) {
    return children;
  }

  const handleBlockedAction = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  // If action is blocked and we should enforce limits
  if (!validation.allowed && blockAction) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Blocked Action Alert */}
        <Alert className="border-red-300 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium">
                  {actionType.charAt(0).toUpperCase() + actionType.slice(1)} limit reached
                </p>
                <p className="text-sm">
                  You've used {usageStatus?.current} of {usageStatus?.limit} {actionType} this month.
                </p>
              </div>
              <Button 
                onClick={handleBlockedAction}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Continue
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Disabled Button */}
        <div className="relative">
          {React.cloneElement(children, {
            disabled: true,
            className: `${children.props.className || ''} opacity-50 cursor-not-allowed`,
            onClick: handleBlockedAction
          })}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10 rounded">
            <Lock className="h-4 w-4 text-gray-600" />
          </div>
        </div>

        {/* Upgrade Prompt */}
        {showUpgradePrompt && (
          <IntelligentUpgradePrompt
            limitType={actionType}
            variant="card"
            onUpgrade={onUpgrade}
          />
        )}
      </div>
    );
  }

  // If approaching limit, show warning but allow action
  if (usageStatus?.status === 'warning' || usageStatus?.status === 'critical') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Warning Alert */}
        <Alert className="border-orange-300 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium">
                  Approaching {actionType} limit
                </p>
                <p className="text-sm">
                  {usageStatus.remaining} {actionType} remaining this month
                </p>
              </div>
              {onUpgrade && (
                <Button 
                  onClick={onUpgrade}
                  variant="outline"
                  className="border-orange-600 text-orange-600 hover:bg-orange-600 hover:text-white"
                  size="sm"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Original Button */}
        {children}

        {/* Upgrade Prompt for critical status */}
        {showUpgradePrompt && usageStatus?.status === 'critical' && (
          <IntelligentUpgradePrompt
            limitType={actionType}
            variant="alert"
            onUpgrade={onUpgrade}
          />
        )}
      </div>
    );
  }

  // Normal status - just return the children
  return children;
};

/**
 * Higher-order component that wraps a component with plan limit enforcement
 */
export const withPlanLimitEnforcement = (WrappedComponent, actionType) => {
  return React.forwardRef((props, ref) => {
    const { onUpgrade, ...otherProps } = props;
    
    return (
      <PlanLimitEnforcement 
        actionType={actionType}
        onUpgrade={onUpgrade}
        {...otherProps}
      >
        <WrappedComponent ref={ref} {...otherProps} />
      </PlanLimitEnforcement>
    );
  });
};

/**
 * Hook for checking if an action is allowed
 */
export const usePlanLimitCheck = (actionType) => {
  const { validateAction, getUsageStatus } = useUsageTracking();
  const [status, setStatus] = useState({ allowed: true, usageStatus: null });

  useEffect(() => {
    if (actionType) {
      const validation = validateAction(actionType);
      const usageStatus = getUsageStatus(actionType);
      
      setStatus({
        allowed: validation.allowed,
        validation,
        usageStatus,
        canProceed: validation.allowed,
        needsUpgrade: validation.needsUpgrade,
        isNearLimit: usageStatus.status === 'warning' || usageStatus.status === 'critical',
        isAtLimit: usageStatus.status === 'exceeded'
      });
    }
  }, [actionType, validateAction, getUsageStatus]);

  return status;
};

export default PlanLimitEnforcement;

// Export TeamMemberAccessStatus for convenience
export { default as TeamMemberAccessStatus } from './TeamMemberAccessStatus';