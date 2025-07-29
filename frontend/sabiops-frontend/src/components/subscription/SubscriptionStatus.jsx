import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Crown, Calendar, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/index.js';
import useSubscriptionStatus from '../../hooks/useSubscriptionStatus';

const SubscriptionStatus = ({
  subscription,
  role,
  currentUsage = {},
  onUpgrade
}) => {
  // Use the new subscription hook for real-time data
  const {
    subscriptionStatus: realTimeStatus,
    usageStatus: realTimeUsage,
    loading,
    error,
    getStatusSummary,
    warnings
  } = useSubscriptionStatus();

  // Use real-time data if available, fallback to props
  const effectiveSubscription = realTimeStatus || subscription;
  const effectiveUsage = realTimeUsage?.current_usage || currentUsage;

  if (!effectiveSubscription || role !== 'Owner') return null;

  const isOwner = role === 'Owner';
  const statusSummary = getStatusSummary();
  const isTrial = statusSummary?.isTrial || false;
  const plan = statusSummary?.plan || 'free';
  const remainingDays = statusSummary?.remainingDays || 0;

  // Basic/Free Plan Display (No Crown) - Show as "Basic Plan - Active"
  if ((plan === 'free' || plan === 'basic') && isOwner) {
    const invoiceUsage = effectiveUsage?.invoices || { current: 0, limit: 5 };
    const expenseUsage = effectiveUsage?.expenses || { current: 0, limit: 20 };
    
    return (
      <Card className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Free Plan - Active
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="text-xs text-orange-700">
                {invoiceUsage.current}/{invoiceUsage.limit} invoices used this month
              </p>
              <p className="text-xs text-orange-700">
                {expenseUsage.current}/{expenseUsage.limit} expenses used this month
              </p>
              <p className="text-xs text-orange-600 mt-1 font-medium">
                Upgrade to unlock unlimited features
              </p>
              {warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {warnings.slice(0, 2).map((warning, index) => (
                    <p key={index} className="text-xs text-red-600 font-medium">
                      ⚠️ {warning.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-4 py-2 w-full sm:w-auto"
              onClick={onUpgrade}
            >
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Trial Period Display - Show accurate remaining days
  if (isTrial && isOwner && remainingDays > 0) {
    const urgencyLevel = remainingDays <= 1 ? 'critical' : remainingDays <= 3 ? 'warning' : 'normal';
    const gradientClass = urgencyLevel === 'critical'
      ? 'from-red-100 to-red-200 border-red-300'
      : urgencyLevel === 'warning'
        ? 'from-yellow-100 to-yellow-200 border-yellow-300'
        : 'from-blue-100 to-purple-200 border-blue-300';

    return (
      <Card className={`bg-gradient-to-r ${gradientClass} shadow-lg`}>
        <CardHeader>
          <CardTitle className={`text-sm font-medium flex items-center ${urgencyLevel === 'critical' ? 'text-red-800' :
            urgencyLevel === 'warning' ? 'text-yellow-800' : 'text-blue-800'
            }`}>
            <Crown className="h-4 w-4 mr-2" />
            Silver Weekly Plan - Trial
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className={`text-sm font-bold ${urgencyLevel === 'critical' ? 'text-red-700' :
                urgencyLevel === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                }`}>
                {remainingDays} day{remainingDays !== 1 ? 's' : ''} remaining
              </p>
              <p className={`text-xs mt-1 ${urgencyLevel === 'critical' ? 'text-red-600' :
                urgencyLevel === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                Full access to all weekly plan features
              </p>
              {urgencyLevel !== 'normal' && (
                <p className="text-xs mt-1 font-medium text-red-600">
                  {urgencyLevel === 'critical' ? 'Trial expires soon!' : 'Trial ending soon!'}
                </p>
              )}
              {warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {warnings.slice(0, 2).map((warning, index) => (
                    <p key={index} className="text-xs text-orange-600 font-medium">
                      ⚠️ {warning.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <Button
              className={`text-white text-xs px-4 py-2 w-full sm:w-auto ${urgencyLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                urgencyLevel === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-blue-600 hover:bg-blue-700'
                }`}
              onClick={onUpgrade}
            >
              {urgencyLevel === 'critical' ? 'Upgrade Now!' : 'Continue Trial'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Active Paid Plan Display (With Crown) - Maintain exact crown styling
  if (isOwner && statusSummary?.isActive && !isTrial && plan !== 'free') {
    const planNames = {
      weekly: 'Silver Weekly Plan',
      silver_weekly: 'Silver Weekly Plan',
      monthly: 'Silver Monthly Plan', 
      silver_monthly: 'Silver Monthly Plan',
      yearly: 'Silver Yearly Plan',
      silver_yearly: 'Silver Yearly Plan'
    };

    const planPrices = {
      weekly: '₦1,400/week',
      silver_weekly: '₦1,400/week',
      monthly: '₦4,500/month',
      silver_monthly: '₦4,500/month',
      yearly: '₦50,000/year',
      silver_yearly: '₦50,000/year'
    };

    const planConfig = realTimeStatus?.plan_config;
    const nextBillingDate = effectiveSubscription.next_billing_date || 
                           (remainingDays > 0 ? `${remainingDays} days remaining` : 'N/A');

    return (
      <Card className="bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-green-800 flex items-center">
            <Crown className="h-4 w-4 mr-2 text-yellow-600" />
            {planNames[plan] || planConfig?.name || 'Active Plan'} - Active
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="text-xs text-green-700">
                Plan: {planPrices[plan] || planConfig?.displayPrice || 'Active'}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {remainingDays > 0 ? `${remainingDays} days remaining` : nextBillingDate}
              </p>
              {/* Show real-time usage */}
              {effectiveUsage && (
                <div className="mt-1 space-y-1">
                  {Object.entries(effectiveUsage).slice(0, 2).map(([feature, usage]) => (
                    <p key={feature} className="text-xs text-green-600">
                      {feature}: {usage.current}/{usage.limit} used
                    </p>
                  ))}
                </div>
              )}
              {/* Only show referral earnings for monthly and yearly plans, not weekly */}
              {(plan === 'monthly' || plan === 'silver_monthly' || plan === 'yearly' || plan === 'silver_yearly') && (
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Crown className="h-3 w-3 mr-1" />
                  Referral earnings: 10% for 3 months per user
                </p>
              )}
              {warnings.length > 0 && (
                <div className="mt-2 space-y-1">
                  {warnings.slice(0, 2).map((warning, index) => (
                    <p key={index} className="text-xs text-orange-600 font-medium">
                      ⚠️ {warning.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 w-full sm:w-auto"
              onClick={onUpgrade}
            >
              Manage Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Expired/Cancelled Plan Display
  if (effectiveSubscription.status === 'expired' || effectiveSubscription.status === 'cancelled' || 
      (statusSummary && !statusSummary.isActive && plan !== 'free')) {
    return (
      <Card className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Subscription {effectiveSubscription.status === 'expired' ? 'Expired' : 
                         effectiveSubscription.status === 'cancelled' ? 'Cancelled' : 'Inactive'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="text-xs text-gray-700">
                Your subscription has {effectiveSubscription.status === 'expired' ? 'expired' : 
                                     effectiveSubscription.status === 'cancelled' ? 'been cancelled' : 'expired'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Reactivate to continue using premium features
              </p>
              {remainingDays === 0 && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  You've been downgraded to the free plan
                </p>
              )}
            </div>
            <Button
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-4 py-2 w-full sm:w-auto"
              onClick={onUpgrade}
            >
              Reactivate
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading && !effectiveSubscription) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
            <Crown className="h-4 w-4 mr-2 animate-pulse" />
            Loading subscription status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return null;
};

export { SubscriptionStatus };
export default SubscriptionStatus;