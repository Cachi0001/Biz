import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const RoleBasedWrapper = ({ 
  allowedRoles = [], 
  allowedSubscriptions = [], 
  children, 
  fallback = null,
  requireAll = false 
}) => {
  const { user } = useAuth();

  if (!user) {
    return fallback;
  }

  const userRole = user.role?.toLowerCase() || 'standard_user';
  const userSubscription = user.subscription_status?.toLowerCase() || 'free_trial';

  // Check role permissions
  const hasRoleAccess = allowedRoles.length === 0 || 
    allowedRoles.some(role => role.toLowerCase() === userRole);

  // Check subscription permissions
  const hasSubscriptionAccess = allowedSubscriptions.length === 0 || 
    allowedSubscriptions.some(sub => sub.toLowerCase() === userSubscription);

  // Determine access based on requireAll flag
  const hasAccess = requireAll 
    ? hasRoleAccess && hasSubscriptionAccess
    : hasRoleAccess || hasSubscriptionAccess;

  // If no restrictions specified, allow access
  if (allowedRoles.length === 0 && allowedSubscriptions.length === 0) {
    return children;
  }

  return hasAccess ? children : fallback;
};

export default RoleBasedWrapper;

