import React, { useState, useEffect } from 'react';
import { Crown, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import PaystackService from '../../services/PaystackService';

const SubscriptionStatusDisplay = ({ showDetails = false, className = "" }) => {
  const { user, subscription } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [usageStatus, setUsageStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(fetchSubscriptionData, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  const fetchSubscriptionData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both subscription status and usage data
      const [statusResponse, usageResponse] = await Promise.all([
        PaystackService.getSubscriptionStatus(),
        PaystackService.getUsageStatus()
      ]);
      
      if (statusResponse.success) {
        setSubscriptionStatus(statusResponse.data);
      }
      
      if (usageResponse.success) {
        setUsageStatus(usageResponse.data);
      }
      
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    if (!subscriptionStatus) return 'text-gray-500';
    
    if (subscriptionStatus.is_trial) return 'text-blue-600';
    if (subscriptionStatus.is_active) return 'text-green-600';
    return 'text-gray-500';
  };

  const getStatusText = () => {
    if (!subscriptionStatus) return 'Loading...';
    
    const { subscription_plan, is_trial, is_active, remaining_days } = subscriptionStatus;
    
    if (subscription_plan === 'free') {
      return 'Free Plan';
    }
    
    if (is_trial) {
      return `Trial - ${remaining_days} days left`;
    }
    
    if (is_active) {
      if (remaining_days === -1) {
        return 'Active';
      }
      return `Active - ${remaining_days} days left`;
    }
    
    return 'Inactive';
  };

  const getCrownIcon = () => {
    const baseClasses = "h-5 w-5"; // Maintain original crown icon size
    const colorClass = getStatusColor();
    
    return <Crown className={`${baseClasses} ${colorClass}`} />;
  };

  const getUsageWarnings = () => {
    if (!usageStatus?.current_usage) return [];
    
    const warnings = [];
    
    Object.entries(usageStatus.current_usage).forEach(([feature, data]) => {
      if (data.percentage >= 80 && data.percentage < 100) {
        warnings.push({
          feature,
          percentage: data.percentage,
          current: data.current,
          limit: data.limit,
          type: 'warning'
        });
      } else if (data.percentage >= 100) {
        warnings.push({
          feature,
          percentage: data.percentage,
          current: data.current,
          limit: data.limit,
          type: 'limit_reached'
        });
      }
    });
    
    return warnings;
  };

  if (loading && !subscriptionStatus) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Crown className="h-5 w-5 text-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error && !subscriptionStatus) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Crown className="h-5 w-5 text-gray-400" />
        <span className="text-sm text-red-500">Error loading status</span>
      </div>
    );
  }

  const warnings = getUsageWarnings();

  return (
    <div className={`${className}`}>
      {/* Main Status Display */}
      <div className="flex items-center space-x-2">
        {getCrownIcon()}
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {warnings.length > 0 && (
          <AlertTriangle className="h-4 w-4 text-orange-500" />
        )}
      </div>

      {/* Detailed Information */}
      {showDetails && subscriptionStatus && (
        <div className="mt-3 space-y-2">
          {/* Plan Information */}
          <div className="text-xs text-gray-600">
            <span className="font-medium">Plan:</span> {subscriptionStatus.plan_config?.name || 'Unknown'}
          </div>

          {/* Usage Information */}
          {usageStatus?.current_usage && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700">Current Usage:</div>
              {Object.entries(usageStatus.current_usage).map(([feature, data]) => (
                <div key={feature} className="flex justify-between items-center text-xs">
                  <span className="capitalize text-gray-600">{feature}:</span>
                  <div className="flex items-center space-x-1">
                    <span className={`font-medium ${
                      data.percentage >= 100 ? 'text-red-600' :
                      data.percentage >= 80 ? 'text-orange-600' :
                      'text-green-600'
                    }`}>
                      {data.current}/{data.limit}
                    </span>
                    <span className="text-gray-500">({data.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1">
              {warnings.map((warning, index) => (
                <div key={index} className={`text-xs p-2 rounded ${
                  warning.type === 'limit_reached' 
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  <div className="flex items-center space-x-1">
                    {warning.type === 'limit_reached' ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    <span className="font-medium capitalize">{warning.feature}:</span>
                    <span>
                      {warning.type === 'limit_reached' 
                        ? 'Limit reached!' 
                        : `${warning.percentage.toFixed(0)}% used`
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Expiration Warning */}
          {subscriptionStatus.remaining_days > 0 && subscriptionStatus.remaining_days <= 3 && (
            <div className="text-xs p-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  Your subscription expires in {subscriptionStatus.remaining_days} day{subscriptionStatus.remaining_days !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatusDisplay;