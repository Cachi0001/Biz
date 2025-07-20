import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Crown, Calendar, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils/index.js';

const SubscriptionStatus = ({
  subscription,
  role,
  currentUsage = {},
  onUpgrade
}) => {
  if (!subscription || role !== 'Owner') return null;

  const isOwner = role === 'Owner';
  const isTrial = subscription.status === 'trial';
  const plan = subscription.plan || 'free';
  const trialDaysLeft = subscription.trial_days_left || 0;

  // Basic/Free Plan Display (No Crown) - Show as "Basic Plan - Active"
  if ((plan === 'free' || plan === 'basic') && isOwner) {
    return (
      <Card className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Basic Plan - Active
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="text-xs text-orange-700">
                {currentUsage?.invoices || 0}/5 invoices used this month
              </p>
              <p className="text-xs text-orange-700">
                {currentUsage?.expenses || 0}/5 expenses used this month
              </p>
              <p className="text-xs text-orange-600 mt-1 font-medium">
                Upgrade to unlock unlimited features
              </p>
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

  // Trial Period Display
  if (isTrial && isOwner) {
    const urgencyLevel = trialDaysLeft <= 1 ? 'critical' : trialDaysLeft <= 3 ? 'warning' : 'normal';
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
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
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

  // Active Paid Plan Display (With Crown)
  if (isOwner && (plan === 'weekly' || plan === 'silver_weekly' || plan === 'monthly' || plan === 'silver_monthly' || plan === 'yearly' || plan === 'silver_yearly')) {
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

    const planLimits = {
      weekly: { invoices: 100, expenses: 100, period: 'week' },
      silver_weekly: { invoices: 100, expenses: 100, period: 'week' },
      monthly: { invoices: 450, expenses: 450, period: 'month' },
      silver_monthly: { invoices: 450, expenses: 450, period: 'month' },
      yearly: { invoices: 6000, expenses: 6000, period: 'year' },
      silver_yearly: { invoices: 6000, expenses: 6000, period: 'year' }
    };

    const currentPlanLimits = planLimits[plan];

    return (
      <Card className="bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-green-800 flex items-center">
            <Crown className="h-4 w-4 mr-2 text-yellow-600" />
            {planNames[plan]} - Active
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="text-xs text-green-700">
                Plan: {planPrices[plan]}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Next billing: {subscription.next_billing_date || 'N/A'}
              </p>
              {/* Only show referral earnings for monthly and yearly plans, not weekly */}
              {(plan === 'monthly' || plan === 'silver_monthly' || plan === 'yearly' || plan === 'silver_yearly') && (
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Crown className="h-3 w-3 mr-1" />
                  Referral earnings: 10% for 3 months per user
                </p>
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
  if (subscription.status === 'expired' || subscription.status === 'cancelled') {
    return (
      <Card className="bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-gray-800 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Subscription {subscription.status === 'expired' ? 'Expired' : 'Cancelled'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <div className="flex-1">
              <p className="text-xs text-gray-700">
                Your subscription has {subscription.status === 'expired' ? 'expired' : 'been cancelled'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Reactivate to continue using premium features
              </p>
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

  return null;
};

export { SubscriptionStatus };
export default SubscriptionStatus;