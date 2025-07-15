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

  // Free Plan Display
  if (plan === 'free' && isOwner) {
    return (
      <Card className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-orange-800 flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Free Plan - Limited Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
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
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-2"
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
          <CardTitle className={`text-sm font-medium flex items-center ${
            urgencyLevel === 'critical' ? 'text-red-800' : 
            urgencyLevel === 'warning' ? 'text-yellow-800' : 'text-blue-800'
          }`}>
            <Crown className="h-4 w-4 mr-2" />
            Free Weekly Plan Trial
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className={`text-sm font-bold ${
                urgencyLevel === 'critical' ? 'text-red-700' : 
                urgencyLevel === 'warning' ? 'text-yellow-700' : 'text-blue-700'
              }`}>
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </p>
              <p className={`text-xs mt-1 ${
                urgencyLevel === 'critical' ? 'text-red-600' : 
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
              className={`text-white text-xs px-3 py-2 ${
                urgencyLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
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

  // Active Paid Plan Display
  if (isOwner && (plan === 'weekly' || plan === 'monthly' || plan === 'yearly')) {
    const planNames = {
      weekly: 'Silver Weekly Plan',
      monthly: 'Silver Monthly Plan', 
      yearly: 'Silver Yearly Plan'
    };

    const planPrices = {
      weekly: '₦1,400/week',
      monthly: '₦4,500/month',
      yearly: '₦50,000/year'
    };

    return (
      <Card className="bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-green-800 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            {planNames[plan]} - Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-green-700 font-medium">
                All features unlocked
              </p>
              <p className="text-xs text-green-700">
                Plan: {planPrices[plan]}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Next billing: {subscription.next_billing_date || 'N/A'}
              </p>
            </div>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2"
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
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-700">
                Your subscription has {subscription.status === 'expired' ? 'expired' : 'been cancelled'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Reactivate to continue using premium features
              </p>
            </div>
            <Button 
              className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-3 py-2"
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