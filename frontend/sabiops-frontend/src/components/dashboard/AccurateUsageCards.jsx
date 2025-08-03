import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, Lock, TrendingUp } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import subscriptionMonitor from '../../services/subscriptionMonitor';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const UsageCard = ({ title, usage, limit, period_end, isLocked = false, subscriptionStatus = 'active', daysRemaining = null }) => {
  const percentage = limit > 0 ? (usage / limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 95;
  const isOverLimit = usage >= limit;
  const isExpired = subscriptionStatus === 'expired' || (daysRemaining !== null && daysRemaining <= 0);

  // Determine card styling based on usage and subscription status
  let progressBarColor, cardClass, textClass;

  if (isLocked || isExpired) {
    progressBarColor = 'bg-gray-400';
    cardClass = 'bg-gray-50 border-gray-200';
    textClass = 'text-gray-600';
  } else if (isOverLimit) {
    progressBarColor = 'bg-red-500';
    cardClass = 'bg-red-50 border-red-200';
    textClass = 'text-red-700';
  } else if (isAtLimit) {
    progressBarColor = 'bg-orange-500';
    cardClass = 'bg-orange-50 border-orange-200';
    textClass = 'text-orange-700';
  } else if (isNearLimit) {
    progressBarColor = 'bg-yellow-500';
    cardClass = 'bg-yellow-50 border-yellow-200';
    textClass = 'text-yellow-700';
  } else {
    progressBarColor = 'bg-green-500';
    cardClass = 'bg-white border-gray-200';
    textClass = 'text-gray-700';
  }

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${textClass}`}>
          <div className="flex items-center gap-2">
            {title}
            {isLocked && <Lock className="h-4 w-4 text-gray-500" />}
            {isOverLimit && !isLocked && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        </CardTitle>
        {isNearLimit && !isLocked && (
          <TrendingUp className={`h-4 w-4 ${isOverLimit ? 'text-red-500' : isAtLimit ? 'text-orange-500' : 'text-yellow-500'}`} />
        )}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${textClass}`}>
          {usage} / {limit}
          {isOverLimit && !isLocked && (
            <span className="text-sm font-normal text-red-600 ml-2">(Limit Exceeded)</span>
          )}
        </div>

        {period_end && (
          <p className="text-xs text-muted-foreground mt-1">
            Resets on {format(new Date(period_end), 'MMM dd, yyyy')}
          </p>
        )}

        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
          <div
            className={`${progressBarColor} h-2.5 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>

        {/* Usage status message */}
        <div className="mt-2">
          {isLocked ? (
            <p className="text-xs text-gray-500">Feature locked - upgrade to access</p>
          ) : isOverLimit ? (
            <p className="text-xs text-red-600">Limit exceeded - upgrade to continue</p>
          ) : isAtLimit ? (
            <p className="text-xs text-orange-600">Near limit - consider upgrading</p>
          ) : isNearLimit ? (
            <p className="text-xs text-yellow-600">{Math.round(100 - percentage)}% remaining</p>
          ) : (
            <p className="text-xs text-green-600">{limit - usage} remaining</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const AccurateUsageCards = () => {
  const { user, isAuthenticated } = useAuth();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // Monitor subscription status for usage enforcement
  useEffect(() => {
    if (isAuthenticated) {
      const unsubscribe = subscriptionMonitor.addListener((status) => {
        console.log('[AccurateUsageCards] Subscription status updated:', status);
        setSubscriptionStatus(status);
      });

      return unsubscribe;
    }
  }, [isAuthenticated]);

  const fetchAccurateUsage = useCallback(async (isRetry = false) => {
    if (isRetry) {
      setRetrying(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await subscriptionService.getUsageStatus();
      const data = response.data || response;

      if (!data || !data.current_usage) {
        throw new Error('Invalid usage data structure received from API.');
      }
      setUsageData(data);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching accurate usage data:', err);
      const errorMessage = err.message || 'Failed to load usage data. Please try again.';
      setError(errorMessage);

      // Implement exponential backoff for automatic retries
      if (retryCount < 3 && !isRetry) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchAccurateUsage(true);
        }, delay);
      }
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [retryCount]);

  const handleManualRetry = useCallback(() => {
    setRetryCount(0);
    fetchAccurateUsage(true);
  }, [fetchAccurateUsage]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccurateUsage();
    }
  }, [fetchAccurateUsage, isAuthenticated]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDataUpdate = (event) => {
      console.log('[AccurateUsageCards] Data updated, refreshing usage data...', event.detail);
      fetchAccurateUsage();
    };

    // Listen for various data update events that should trigger usage refresh
    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('salesUpdated', handleDataUpdate);
    window.addEventListener('expenseUpdated', handleDataUpdate);
    window.addEventListener('invoiceUpdated', handleDataUpdate);
    window.addEventListener('productUpdated', handleDataUpdate);
    window.addEventListener('subscriptionUpdated', handleDataUpdate);
    window.addEventListener('usageStatusUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('salesUpdated', handleDataUpdate);
      window.removeEventListener('expenseUpdated', handleDataUpdate);
      window.removeEventListener('invoiceUpdated', handleDataUpdate);
      window.removeEventListener('productUpdated', handleDataUpdate);
      window.removeEventListener('subscriptionUpdated', handleDataUpdate);
      window.removeEventListener('usageStatusUpdated', handleDataUpdate);
    };
  }, [fetchAccurateUsage]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <p>Loading usage data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-red-800 font-semibold">Error loading usage data</h3>
          </div>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={handleManualRetry}
            disabled={retrying}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!usageData || !usageData.current_usage) {
    return null;
  }

  const { current_usage } = usageData;

  // Get subscription status and days remaining
  const currentSubscriptionStatus = subscriptionStatus?.status || 'active';
  const daysRemaining = subscriptionStatus?.days_remaining;
  const isExpired = subscriptionStatus?.is_expired || false;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {current_usage.invoices && (
        <UsageCard
          title="Invoices"
          usage={current_usage.invoices.current}
          limit={current_usage.invoices.limit}
          period_end={current_usage.invoices.period_end}
          subscriptionStatus={currentSubscriptionStatus}
          daysRemaining={daysRemaining}
          isLocked={isExpired && current_usage.invoices.limit > 10} // Lock if expired and exceeds free plan
        />
      )}
      {current_usage.sales && (
        <UsageCard
          title="Sales"
          usage={current_usage.sales.current}
          limit={current_usage.sales.limit}
          period_end={current_usage.sales.period_end}
          subscriptionStatus={currentSubscriptionStatus}
          daysRemaining={daysRemaining}
          isLocked={isExpired && current_usage.sales.limit > 50} // Lock if expired and exceeds free plan
        />
      )}
      {current_usage.products && (
        <UsageCard
          title="Products"
          usage={current_usage.products.current}
          limit={current_usage.products.limit}
          period_end={current_usage.products.period_end}
          subscriptionStatus={currentSubscriptionStatus}
          daysRemaining={daysRemaining}
          isLocked={isExpired && current_usage.products.limit > 10} // Lock if expired and exceeds free plan
        />
      )}
      {current_usage.expenses && (
        <UsageCard
          title="Expenses"
          usage={current_usage.expenses.current}
          limit={current_usage.expenses.limit}
          period_end={current_usage.expenses.period_end}
          subscriptionStatus={currentSubscriptionStatus}
          daysRemaining={daysRemaining}
          isLocked={isExpired} // Expenses might not be available in free plan
        />
      )}
    </div>
  );
};

export default AccurateUsageCards;
