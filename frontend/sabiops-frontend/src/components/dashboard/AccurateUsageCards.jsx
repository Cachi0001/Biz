import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const UsageCard = ({ title, usage, limit, period_end }) => {
  const percentage = limit > 0 ? (usage / limit) * 100 : 0;
  const progressBarColor = percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{usage} / {limit}</div>
        <p className="text-xs text-muted-foreground">
          Resets on {format(new Date(period_end), 'MMM dd, yyyy')}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
          <div className={`${progressBarColor} h-2.5 rounded-full`} style={{ width: `${percentage}%` }}></div>
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

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('salesUpdated', handleDataUpdate);
      window.removeEventListener('expenseUpdated', handleDataUpdate);
      window.removeEventListener('invoiceUpdated', handleDataUpdate);
      window.removeEventListener('productUpdated', handleDataUpdate);
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

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {current_usage.invoices && <UsageCard title="Invoices" usage={current_usage.invoices.current} limit={current_usage.invoices.limit} period_end={current_usage.invoices.period_end} />}
      {current_usage.sales && <UsageCard title="Sales" usage={current_usage.sales.current} limit={current_usage.sales.limit} period_end={current_usage.sales.period_end} />}
      {current_usage.products && <UsageCard title="Products" usage={current_usage.products.current} limit={current_usage.products.limit} period_end={current_usage.products.period_end} />}
      {current_usage.expenses && <UsageCard title="Expenses" usage={current_usage.expenses.current} limit={current_usage.expenses.limit} period_end={current_usage.expenses.period_end} />}
    </div>
  );
};

export default AccurateUsageCards;
