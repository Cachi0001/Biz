import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Crown, Calendar, CreditCard, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { getCurrentUsage, getSubscriptionLimits } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const UnifiedSubscriptionStatus = ({ onUpgrade }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUnifiedStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch unified subscription status from backend
      const response = await fetch('/api/subscription/unified-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }
      
      const data = await response.json();
      setSubscriptionStatus(data.data || data);
      
    } catch (err) {
      console.error('Error fetching unified subscription status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUnifiedStatus();
  };

  useEffect(() => {
    if (user) {
      fetchUnifiedStatus();
    }
  }, [user]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchUnifiedStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading, refreshing]);

  if (loading && !subscriptionStatus) {
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

  if (error) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-red-600 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Error loading subscription status
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-xs text-red-600 mb-2">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionStatus) {
    return null;
  }

  const { unified_status, remaining_days, subscription_plan, display_message, is_trial, is_active, is_expired } = subscriptionStatus;

  // Single status display based on unified_status priority
  const renderStatusCard = () => {
    switch (unified_status) {
      case 'expired':
        return (
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-red-800 flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Subscription Inactive
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-red-600 hover:text-red-700"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p className="text-sm text-red-700 font-medium">
                    Your subscription has expired
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Reactivate to continue using premium features
                  </p>
                  <p className="text-xs text-red-500 mt-1 font-medium">
                    You've been downgraded to the free plan
                  </p>
                </div>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 w-full sm:w-auto"
                  onClick={onUpgrade}
                >
                  Reactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'trial':
        const urgencyLevel = remaining_days <= 1 ? 'critical' : remaining_days <= 3 ? 'warning' : 'normal';
        const gradientClass = urgencyLevel === 'critical'
          ? 'from-red-100 to-red-200 border-red-300'
          : urgencyLevel === 'warning'
            ? 'from-yellow-100 to-yellow-200 border-yellow-300'
            : 'from-blue-100 to-purple-200 border-blue-300';

        return (
          <Card className={`bg-gradient-to-r ${gradientClass} shadow-lg`}>
            <CardHeader>
              <CardTitle className={`text-sm font-medium flex items-center justify-between ${
                urgencyLevel === 'critical' ? 'text-red-800' :
                urgencyLevel === 'warning' ? 'text-yellow-800' : 'text-blue-800'
              }`}>
                <div className="flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-yellow-600" />
                  7-Day Free Trial
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-current hover:opacity-70"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p className={`text-sm font-bold ${
                    urgencyLevel === 'critical' ? 'text-red-700' :
                    urgencyLevel === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    {remaining_days} day{remaining_days !== 1 ? 's' : ''} remaining
                  </p>
                  <p className={`text-xs mt-1 ${
                    urgencyLevel === 'critical' ? 'text-red-600' :
                    urgencyLevel === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`}>
                    Full access to weekly plan features
                  </p>
                  {urgencyLevel !== 'normal' && (
                    <p className="text-xs mt-1 font-medium text-red-600">
                      {urgencyLevel === 'critical' ? 'Trial expires today!' : 'Trial ending soon!'}
                    </p>
                  )}
                </div>
                <Button
                  className={`text-white text-xs px-4 py-2 w-full sm:w-auto ${
                    urgencyLevel === 'critical' ? 'bg-red-600 hover:bg-red-700' :
                    urgencyLevel === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                      'bg-blue-600 hover:bg-blue-700'
                  }`}
                  onClick={onUpgrade}
                >
                  {urgencyLevel === 'critical' ? 'Upgrade Now!' : 'Upgrade Trial'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'active':
        const planNames = {
          weekly: 'Weekly Plan',
          monthly: 'Monthly Plan',
          yearly: 'Yearly Plan'
        };

        const planPrices = {
          weekly: '₦1,400/week',
          monthly: '₦4,500/month',
          yearly: '₦50,000/year'
        };

        return (
          <Card className="bg-gradient-to-r from-green-100 to-green-200 border-green-300 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-green-800 flex items-center justify-between">
                <div className="flex items-center">
                  <Crown className="h-4 w-4 mr-2 text-yellow-600" />
                  {planNames[subscription_plan] || 'Active Plan'}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-green-600 hover:text-green-700"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p className="text-xs text-green-700">
                    Plan: {planPrices[subscription_plan] || 'Active'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {remaining_days > 0 ? `${remaining_days} days remaining` : 'Active subscription'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Your current plan meets your usage needs
                  </p>
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

      case 'free':
      default:
        return (
          <Card className="bg-gradient-to-r from-orange-100 to-red-100 border-orange-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-orange-800 flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Free Plan
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                <div className="flex-1">
                  <p className="text-xs text-orange-700">
                    Limited features available
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
  };

  return renderStatusCard();
};

export default UnifiedSubscriptionStatus;