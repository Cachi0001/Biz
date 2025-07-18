import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Users, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Component that shows team members their access status based on owner's subscription
 */
const TeamMemberAccessStatus = ({ className = '' }) => {
  const { user, subscription, role, isOwner, getEffectiveSubscription } = useAuth();

  // Only show for team members (non-owners)
  if (!user || isOwner || role === 'Owner') {
    return null;
  }

  const effectiveSubscription = getEffectiveSubscription();
  const ownerPlan = effectiveSubscription?.plan || subscription?.plan || 'free';
  const ownerStatus = effectiveSubscription?.status || subscription?.status || 'trial';

  const getPlanDisplayName = (plan) => {
    switch (plan) {
      case 'free':
      case 'basic':
        return 'Basic Plan';
      case 'silver_weekly':
        return 'Silver Weekly Plan';
      case 'silver_monthly':
        return 'Silver Monthly Plan';
      case 'silver_yearly':
        return 'Silver Yearly Plan';
      default:
        return 'Basic Plan';
    }
  };

  const getPlanLimits = (plan) => {
    switch (plan) {
      case 'free':
      case 'basic':
        return { invoices: 5, expenses: 5, features: 'Basic' };
      case 'silver_weekly':
        return { invoices: 100, expenses: 100, features: 'Advanced' };
      case 'silver_monthly':
        return { invoices: 450, expenses: 450, features: 'Advanced' };
      case 'silver_yearly':
        return { invoices: 6000, expenses: 6000, features: 'Advanced' };
      default:
        return { invoices: 5, expenses: 5, features: 'Basic' };
    }
  };

  const planLimits = getPlanLimits(ownerPlan);
  const planName = getPlanDisplayName(ownerPlan);

  const getStatusColor = (status, plan) => {
    if (status === 'active' && plan !== 'free') return 'green';
    if (status === 'trial') return 'blue';
    return 'gray';
  };

  const getStatusIcon = (status, plan) => {
    if (status === 'active' && plan !== 'free') return CheckCircle;
    if (status === 'trial') return Info;
    return AlertCircle;
  };

  const statusColor = getStatusColor(ownerStatus, ownerPlan);
  const StatusIcon = getStatusIcon(ownerStatus, ownerPlan);

  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Users className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <p className="font-medium">Team Member Access</p>
              <Badge variant="outline" className="text-xs">
                {role}
              </Badge>
            </div>
            <p className="text-sm">
              You have access to <strong>{planName}</strong> features through your organization's subscription.
            </p>
            <div className="flex items-center space-x-4 mt-2 text-xs">
              <div className="flex items-center space-x-1">
                <StatusIcon className={`h-3 w-3 text-${statusColor}-600`} />
                <span>
                  {ownerStatus === 'trial' ? 'Trial Active' : 
                   ownerStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Invoices: {planLimits.invoices}/month</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Expenses: {planLimits.expenses}/month</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>Features: {planLimits.features}</span>
              </div>
            </div>
          </div>
          {ownerPlan === 'free' && (
            <div className="text-center">
              <p className="text-xs text-blue-700 mb-1">
                Limited features available
              </p>
              <p className="text-xs text-blue-600">
                Contact your admin about upgrading
              </p>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default TeamMemberAccessStatus;