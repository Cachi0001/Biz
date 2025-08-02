import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, CheckCircle, Info, Crown } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const StatusCard = ({ status, plan, days_remaining, is_trial, trial_days_left }) => {
  const isActive = status === 'active';
  const cardClass = isActive ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
  const icon = isActive ? <CheckCircle className="h-5 w-5 text-green-600 mr-2" /> : <Info className="h-5 w-5 text-yellow-600 mr-2" />;
  const title = is_trial ? `${plan} (Trial)` : plan;
  
  // Use trial_days_left if available, otherwise fall back to days_remaining
  const daysLeft = trial_days_left !== undefined ? trial_days_left : days_remaining;

  return (
    <Card className={cardClass}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {icon}
            <h3 className={`font-semibold ${isActive ? 'text-green-800' : 'text-yellow-800'}`}>
              {isActive ? 'Subscription Active' : 'Subscription Inactive'}
            </h3>
          </div>
          {(is_trial || daysLeft > 0) && (
            <div className="flex items-center gap-1">
              <Crown className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-yellow-700">
                {daysLeft} days left
              </span>
            </div>
          )}
        </div>
        <p className={`text-sm mt-1 ${isActive ? 'text-green-700' : 'text-yellow-700'}`}>
          You are currently on the <strong>{title}</strong> plan.
          {isActive && daysLeft !== null && daysLeft > 0 && ` You have ${daysLeft} days remaining.`}
        </p>
      </CardContent>
    </Card>
  );
};

const UnifiedSubscriptionStatus = () => {
  const { user, subscription, trialDaysLeft, isAuthenticated } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubscriptionStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await subscriptionService.getSubscriptionStatus();
      const data = response.data || response;

      if (!data || !data.subscription) {
        throw new Error('Invalid subscription data structure received from API.');
      }
      setStatusData(data);
    } catch (err) {
      console.error('Error fetching unified subscription status:', err);
      setError(err.message || 'Failed to load subscription status. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Use AuthContext data as primary source
  const getSubscriptionData = () => {
    if (user && subscription) {
      return {
        status: subscription.status || user.subscription_status || 'inactive',
        plan: subscription.plan || user.subscription_plan || 'free',
        days_remaining: subscription.days_remaining || user.remaining_days || 0,
        is_trial: subscription.is_trial || user.is_trial || false,
        trial_days_left: trialDaysLeft || user.trial_days_left || 0,
        is_active: subscription.is_active || user.is_active || false
      };
    }
    
    // Fallback to API data if AuthContext data is not available
    if (statusData && statusData.subscription) {
      return statusData.subscription;
    }
    
    return null;
  };

  const subscriptionData = getSubscriptionData();

  // Only fetch from API if we don't have AuthContext data
  useEffect(() => {
    if (!subscriptionData && isAuthenticated) {
      fetchSubscriptionStatus();
    }
  }, [fetchSubscriptionStatus, subscriptionData, isAuthenticated]);

  // Listen for dashboard refresh events to update subscription status
  useEffect(() => {
    const handleDataUpdate = (event) => {
      console.log('[UnifiedSubscriptionStatus] Data updated, refreshing subscription status...', event.detail);
      fetchSubscriptionStatus();
    };

    // Listen for various data update events that should trigger subscription refresh
    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('salesUpdated', handleDataUpdate);
    window.addEventListener('expenseUpdated', handleDataUpdate);
    window.addEventListener('invoiceUpdated', handleDataUpdate);
    window.addEventListener('subscriptionUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('salesUpdated', handleDataUpdate);
      window.removeEventListener('expenseUpdated', handleDataUpdate);
      window.removeEventListener('invoiceUpdated', handleDataUpdate);
      window.removeEventListener('subscriptionUpdated', handleDataUpdate);
    };
  }, [fetchSubscriptionStatus]);

  if (loading && !subscriptionData) {
    return (
      <Card>
        <CardContent className="p-4">
          <p>Loading subscription status...</p>
        </CardContent>
      </Card>
    );
  }

  if (error && !subscriptionData) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-red-800 font-semibold">Error loading subscription status</h3>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button 
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={fetchSubscriptionStatus}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!subscriptionData) {
    return null;
  }

  return <StatusCard {...subscriptionData} />;
};

export default UnifiedSubscriptionStatus;
