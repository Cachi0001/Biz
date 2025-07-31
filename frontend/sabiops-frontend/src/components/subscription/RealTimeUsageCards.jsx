import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  FileText,
  Receipt,
  TrendingUp,
  Package,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Zap
} from 'lucide-react';

/**
 * Real-time usage cards showing all feature limits with live tracking
 */
const RealTimeUsageCards = ({ className = "" }) => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [usageData, setUsageData] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Feature icons mapping
  const featureIcons = {
    invoices: FileText,
    expenses: Receipt,
    sales: TrendingUp,
    products: Package
  };

  // Feature colors based on usage percentage
  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Fetch real-time usage data
  const fetchUsageData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch both usage status and subscription status
      const [usageResponse, subscriptionResponse] = await Promise.all([
        fetch('/api/subscription/usage-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/subscription/unified-status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (usageResponse.ok && subscriptionResponse.ok) {
        const usageData = await usageResponse.json();
        const subscriptionData = await subscriptionResponse.json();
        
        setUsageData(usageData.data || usageData);
        setSubscriptionStatus(subscriptionData.data || subscriptionData);
        setLastUpdated(new Date());
      } else {
        throw new Error('Failed to fetch usage data');
      }
    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and setup real-time updates
  useEffect(() => {
    fetchUsageData();

    // Update every 30 seconds for real-time tracking
    const interval = setInterval(fetchUsageData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle upgrade navigation
  const handleUpgrade = () => {
    navigate('/subscription-upgrade');
  };

  // Handle manual refresh
  const handleRefresh = () => {
    fetchUsageData();
  };

  if (loading && !usageData) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded"></div>
                <div className="h-2 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`border-red-200 bg-red-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Failed to load usage data</span>
          </div>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentUsage = usageData?.current_usage || {};
  const planConfig = subscriptionStatus?.plan_config || {};
  const features = planConfig.features || {};

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with plan info and refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Crown className="h-5 w-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Usage Limits - {planConfig.name || 'Current Plan'}
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-gray-600 hover:text-gray-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Usage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(features).map(([featureType, limit]) => {
          const usage = currentUsage[featureType] || { current: 0, limit: limit, percentage: 0 };
          const percentage = Math.min(100, usage.percentage || 0);
          const IconComponent = featureIcons[featureType] || Package;
          const remaining = Math.max(0, limit - usage.current);
          const isNearLimit = percentage >= 80;
          const isAtLimit = percentage >= 100;

          return (
            <Card 
              key={featureType} 
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-md ${
                isAtLimit ? 'border-red-300 bg-red-50' : 
                isNearLimit ? 'border-orange-300 bg-orange-50' : 
                'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-4 w-4" />
                    <span className="capitalize">{featureType}</span>
                  </div>
                  {isAtLimit && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Usage Numbers */}
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-bold ${
                    isAtLimit ? 'text-red-600' : 
                    isNearLimit ? 'text-orange-600' : 
                    'text-gray-900'
                  }`}>
                    {usage.current.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    of {limit.toLocaleString()}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <Progress 
                    value={percentage} 
                    className="h-2"
                    style={{
                      '--progress-background': getProgressColor(percentage)
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>{remaining.toLocaleString()} left</span>
                  </div>
                </div>

                {/* Status Message */}
                <div className={`text-xs px-2 py-1 rounded-full text-center ${getUsageColor(percentage)}`}>
                  {isAtLimit ? 'Limit Reached' :
                   isNearLimit ? 'Near Limit' :
                   percentage >= 50 ? 'Moderate Usage' :
                   'Good Standing'}
                </div>

                {/* Action for at-limit features */}
                {isAtLimit && isOwner && (
                  <Button
                    onClick={handleUpgrade}
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    Upgrade Now
                  </Button>
                )}
              </CardContent>

              {/* Real-time indicator */}
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Real-time tracking"></div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Upgrade CTA for owners */}
      {isOwner && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Crown className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Need More Capacity?</h4>
                  <p className="text-sm text-gray-600">
                    Upgrade your plan to get higher limits and unlock premium features
                  </p>
                </div>
              </div>
              <Button
                onClick={handleUpgrade}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                View Plans
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Details Summary */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500">Current Plan</div>
              <div className="font-semibold text-gray-900">{planConfig.name || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <div className={`font-semibold capitalize ${
                subscriptionStatus?.is_active ? 'text-green-600' : 'text-red-600'
              }`}>
                {subscriptionStatus?.unified_status || 'Unknown'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Days Remaining</div>
              <div className="font-semibold text-gray-900">
                {subscriptionStatus?.remaining_days >= 0 ? 
                  `${subscriptionStatus.remaining_days} days` : 
                  'Unlimited'
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Last Updated</div>
              <div className="font-semibold text-gray-900">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeUsageCards;