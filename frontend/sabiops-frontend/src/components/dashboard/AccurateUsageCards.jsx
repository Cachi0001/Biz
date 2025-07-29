import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw, FileText, Receipt, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AccurateUsageCards = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAccurateUsage = async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/subscription/accurate-usage', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch accurate usage');
      }
      
      const data = await response.json();
      setUsageData(data.data || data);
      
    } catch (err) {
      console.error('Error fetching accurate usage:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAccurateUsage();
  };

  const syncUsageCounts = async () => {
    try {
      setRefreshing(true);
      
      const response = await fetch('/api/subscription/sync-usage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to sync usage counts');
      }
      
      // Refresh data after sync
      await fetchAccurateUsage();
      
    } catch (err) {
      console.error('Error syncing usage counts:', err);
      setError(err.message);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAccurateUsage();
    }
  }, [user]);

  if (loading && !usageData) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-3 sm:p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-sm text-red-600">Error loading usage data</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="text-xs"
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!usageData) {
    return null;
  }

  const { usage_counts, actual_counts, has_discrepancies } = usageData;

  const usageCards = [
    {
      title: 'Invoices',
      icon: FileText,
      feature_type: 'invoices',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Expenses',
      icon: Receipt,
      feature_type: 'expenses',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Sales',
      icon: ShoppingCart,
      feature_type: 'sales',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Products',
      icon: Package,
      feature_type: 'products',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Usage Overview</h3>
        <div className="flex items-center space-x-2">
          {has_discrepancies && (
            <Button
              size="sm"
              variant="outline"
              onClick={syncUsageCounts}
              disabled={refreshing}
              className="text-xs text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Fix Counts
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Usage cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {usageCards.map((card) => {
          const usage = usage_counts[card.feature_type] || { current_count: 0, limit_count: 0 };
          const actualCount = actual_counts[card.feature_type] || 0;
          const hasDiscrepancy = usage.current_count !== actualCount;
          
          return (
            <Card 
              key={card.feature_type} 
              className={`${hasDiscrepancy ? 'border-orange-200 bg-orange-50' : 'border-gray-200'} shadow-sm hover:shadow-md transition-shadow`}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                  {hasDiscrepancy && (
                    <AlertTriangle className="h-3 w-3 text-orange-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1 truncate">{card.title}</p>
                  <p className="text-sm sm:text-lg font-bold text-gray-900">
                    {actualCount}
                    {usage.limit_count > 0 && (
                      <span className="text-xs text-gray-500 font-normal">
                        /{usage.limit_count}
                      </span>
                    )}
                  </p>
                  {hasDiscrepancy ? (
                    <p className="text-xs text-orange-600">
                      Tracked: {usage.current_count} (needs sync)
                    </p>
                  ) : (
                    <p className="text-xs text-green-600">
                      {usage.limit_count > 0 ? 
                        `${usage.remaining} remaining` : 
                        'Unlimited'
                      }
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Discrepancy warning */}
      {has_discrepancies && (
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-800">Usage Count Discrepancies Detected</h4>
                <p className="text-xs text-orange-700 mt-1">
                  Some usage counts don't match the actual database records. Click "Fix Counts" to synchronize them.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AccurateUsageCards;