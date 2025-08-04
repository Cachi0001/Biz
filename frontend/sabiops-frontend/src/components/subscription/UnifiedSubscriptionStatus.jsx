import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, RefreshCw, CheckCircle, Info, Crown, Clock, Zap } from 'lucide-react';
import subscriptionService from '../../services/subscriptionService';
import subscriptionMonitor from '../../services/subscriptionMonitor';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

const StatusCard = ({ status, plan, days_remaining, is_trial, trial_days_left, is_expired, warnings = [] }) => {
  const isActive = status === 'active' || status === 'trial';
  const isExpired = is_expired || status === 'expired';
  
  // Determine card styling based on status and days remaining
  let cardClass, textClass, icon, urgency;
  
  if (isExpired) {
    cardClass = 'bg-red-50 border-red-200';
    textClass = 'text-red-800';
    icon = <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />;
    urgency = 'expired';
  } else if (is_trial) {
    cardClass = 'bg-blue-50 border-blue-200';
    textClass = 'text-blue-800';
    icon = <Zap className="h-5 w-5 text-blue-600 mr-2" />;
    urgency = 'trial';
  } else if (isActive) {
    const daysLeft = trial_days_left !== undefined ? trial_days_left : days_remaining;
    if (daysLeft <= 3 && daysLeft > 0) {
      cardClass = 'bg-orange-50 border-orange-200';
      textClass = 'text-orange-800';
      icon = <Clock className="h-5 w-5 text-orange-600 mr-2" />;
      urgency = 'expiring';
    } else {
      cardClass = 'bg-green-50 border-green-200';
      textClass = 'text-green-800';
      icon = <CheckCircle className="h-5 w-5 text-green-600 mr-2" />;
      urgency = 'active';
    }
  } else {
    cardClass = 'bg-gray-50 border-gray-200';
    textClass = 'text-gray-800';
    icon = <Info className="h-5 w-5 text-gray-600 mr-2" />;
    urgency = 'inactive';
  }
  
  const title = is_trial ? `${plan} (Trial)` : plan;
  const daysLeft = trial_days_left !== undefined ? trial_days_left : days_remaining;
  
  // Get status message
  const getStatusMessage = () => {
    if (isExpired) return 'Subscription Expired';
    if (is_trial) return 'Free Trial Active';
    if (isActive) return 'Subscription Active';
    return 'Subscription Inactive';
  };
  
  // Get description message
  const getDescription = () => {
    if (isExpired) {
      return `Your ${title} subscription has expired. Reactivate to continue using premium features.`;
    }
    if (is_trial) {
      return `You're on a free trial of ${title}. ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.`;
    }
    if (isActive && daysLeft > 0) {
      const urgentText = daysLeft <= 3 ? ' Renew soon!' : '';
      return `You are on the ${title} plan. ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.${urgentText}`;
    }
    return `You are currently on the ${title} plan.`;
  };

  return (
    <Card className={cardClass}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {icon}
            <h3 className={`font-semibold ${textClass}`}>
              {getStatusMessage()}
            </h3>
          </div>
          {(is_trial || (daysLeft > 0 && !isExpired)) && (
            <div className="flex items-center gap-1">
              <Crown className={`h-5 w-5 ${urgency === 'expiring' ? 'text-orange-500' : 'text-yellow-500'}`} />
              <span className={`text-sm font-medium ${urgency === 'expiring' ? 'text-orange-700' : 'text-yellow-700'}`}>
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </span>
            </div>
          )}
        </div>
        
        <p className={`text-sm mt-1 ${textClass.replace('800', '700')}`}>
          {getDescription()}
        </p>
        
        {/* Show usage warnings if any */}
        {warnings && warnings.length > 0 && (
          <div className="mt-3 space-y-1">
            {warnings.slice(0, 2).map((warning, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="h-3 w-3 text-orange-500" />
                <span className="text-orange-700">{warning.message}</span>
              </div>
            ))}
            {warnings.length > 2 && (
              <p className="text-xs text-orange-600">
                +{warnings.length - 2} more warning{warnings.length - 2 !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const UnifiedSubscriptionStatus = () => {
  const { user, subscription, trialDaysLeft, isAuthenticated } = useAuth();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [realTimeStatus, setRealTimeStatus] = useState(null);

  // Start real-time monitoring when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[UnifiedSubscriptionStatus] Starting real-time subscription monitoring');
      
      // Initial fetch
      fetchSubscriptionStatus();
      
      // Set up automatic refresh every 30 seconds for real-time day countdown
      const refreshInterval = setInterval(() => {
        console.log('[UnifiedSubscriptionStatus] Auto-refreshing subscription status...');
        fetchSubscriptionStatus();
      }, 30000); // 30 seconds
      
      return () => {
        clearInterval(refreshInterval);
      };
    }
  }, [isAuthenticated, fetchSubscriptionStatus]);

  const fetchSubscriptionStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Use the new real-time status endpoint for accurate day calculation
      const response = await subscriptionService.getRealTimeStatus();
      const data = response.data || response;

      if (!data) {
        throw new Error('No subscription data received from API.');
      }
      
      console.log('[UnifiedSubscriptionStatus] Received real-time status:', data);
      setRealTimeStatus(data);
      setError(null);
      
    } catch (err) {
      console.error('Error fetching real-time subscription status:', err);
      
      // Fallback to regular subscription service
      try {
        const fallbackResponse = await subscriptionService.getSubscriptionStatus();
        const fallbackData = fallbackResponse.data || fallbackResponse;
        
        if (fallbackData) {
          setStatusData(fallbackData);
        } else {
          throw new Error('No fallback data available');
        }
      } catch (fallbackErr) {
        console.error('Fallback also failed:', fallbackErr);
        setError(err.message || 'Failed to load subscription status. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Get subscription data with priority: real-time > AuthContext > API fallback
  const getSubscriptionData = () => {
    // Priority 1: Real-time status from subscription monitor
    if (realTimeStatus) {
      return {
        status: realTimeStatus.subscription_status || 'inactive',
        plan: realTimeStatus.subscription_plan || 'free',
        days_remaining: realTimeStatus.remaining_days || 0,
        is_trial: realTimeStatus.subscription_status === 'trial',
        trial_days_left: realTimeStatus.trial_days_left || 0,
        is_active: realTimeStatus.is_active || false,
        is_expired: realTimeStatus.is_expired || false,
        warnings: realTimeStatus.warnings || []
      };
    }
    
    // Priority 2: AuthContext data
    if (user && subscription) {
      return {
        status: subscription.status || user.subscription_status || 'inactive',
        plan: subscription.plan || user.subscription_plan || 'free',
        days_remaining: subscription.days_remaining || user.remaining_days || 0,
        is_trial: subscription.is_trial || user.is_trial || false,
        trial_days_left: trialDaysLeft || user.trial_days_left || 0,
        is_active: subscription.is_active || user.is_active || false,
        is_expired: subscription.is_expired || user.is_expired || false,
        warnings: []
      };
    }
    
    // Priority 3: API fallback data
    if (statusData) {
      const data = statusData.subscription || statusData;
      return {
        status: data.status || data.subscription_status || 'inactive',
        plan: data.plan || data.subscription_plan || 'free',
        days_remaining: data.days_remaining || data.remaining_days || 0,
        is_trial: data.is_trial || false,
        trial_days_left: data.trial_days_left || 0,
        is_active: data.is_active || false,
        is_expired: data.is_expired || false,
        warnings: data.warnings || []
      };
    }
    
    return null;
  };

  const subscriptionData = getSubscriptionData();

  // Initial fetch if no data available
  useEffect(() => {
    if (!subscriptionData && isAuthenticated && !loading) {
      fetchSubscriptionStatus();
    }
  }, [fetchSubscriptionStatus, subscriptionData, isAuthenticated, loading]);

  // Listen for global subscription events
  useEffect(() => {
    const handleSubscriptionUpdate = (event) => {
      console.log('[UnifiedSubscriptionStatus] Global subscription update:', event.detail);
      fetchSubscriptionStatus();
    };

    const handleSubscriptionExpired = (event) => {
      console.log('[UnifiedSubscriptionStatus] Subscription expired:', event.detail);
      setError('Your subscription has expired. Please renew to continue using premium features.');
    };

    const handleSubscriptionExpiring = (event) => {
      console.log('[UnifiedSubscriptionStatus] Subscription expiring:', event.detail);
      // The real-time status will handle this automatically
    };

    // Listen for various events
    window.addEventListener('subscriptionStatusUpdated', handleSubscriptionUpdate);
    window.addEventListener('subscriptionExpired', handleSubscriptionExpired);
    window.addEventListener('subscriptionExpiring', handleSubscriptionExpiring);
    window.addEventListener('subscriptionUpdated', handleSubscriptionUpdate);

    return () => {
      window.removeEventListener('subscriptionStatusUpdated', handleSubscriptionUpdate);
      window.removeEventListener('subscriptionExpired', handleSubscriptionExpired);
      window.removeEventListener('subscriptionExpiring', handleSubscriptionExpiring);
      window.removeEventListener('subscriptionUpdated', handleSubscriptionUpdate);
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
