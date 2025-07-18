import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Crown, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  X,
  ArrowRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useUsageTracking } from '../../hooks/useUsageTracking';

const IntelligentUpgradePrompt = ({ 
  limitType, 
  onUpgrade, 
  onDismiss,
  className = '',
  variant = 'card' // 'card', 'alert', 'banner'
}) => {
  const { user, subscription } = useAuth();
  const { getUsageStatus, getUpgradeRecommendations } = useUsageTracking();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (user) {
      const recs = getUpgradeRecommendations();
      setRecommendations(recs);
    }
  }, [user, getUpgradeRecommendations]);

  if (!user || !subscription || dismissed) return null;

  const usageStatus = getUsageStatus(limitType);
  
  // Don't show for unlimited plans
  if (usageStatus.isUnlimited) return null;

  // Don't show if usage is normal and no specific recommendations
  if (usageStatus.status === 'normal' && recommendations.length === 0) return null;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/subscription-upgrade');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const getPlanBenefits = (suggestedPlan) => {
    const benefits = {
      silver_weekly: [
        '100 invoices & expenses per week',
        'Advanced analytics',
        'Priority support',
        'Team collaboration'
      ],
      silver_monthly: [
        '450 invoices & expenses per month',
        'Advanced analytics',
        'Priority support',
        'Team collaboration',
        'Custom reports'
      ],
      silver_yearly: [
        'Unlimited invoices & expenses',
        'Advanced analytics',
        'Priority support',
        'Team collaboration',
        'Custom reports',
        'API access'
      ]
    };

    return benefits[suggestedPlan] || benefits.silver_weekly;
  };

  const getPlanPrice = (plan) => {
    const prices = {
      silver_weekly: '₦2,500/week',
      silver_monthly: '₦8,500/month',
      silver_yearly: '₦85,000/year'
    };
    return prices[plan] || prices.silver_weekly;
  };

  const getUrgencyColor = (status) => {
    switch (status) {
      case 'exceeded': return 'red';
      case 'critical': return 'red';
      case 'warning': return 'orange';
      default: return 'blue';
    }
  };

  const getUrgencyIcon = (status) => {
    switch (status) {
      case 'exceeded': return AlertTriangle;
      case 'critical': return AlertTriangle;
      case 'warning': return TrendingUp;
      default: return Zap;
    }
  };

  const getUrgencyMessage = (status, limitType, current, limit) => {
    switch (status) {
      case 'exceeded':
        return `You've reached your ${limitType} limit (${current}/${limit}). Upgrade to continue.`;
      case 'critical':
        return `You're almost at your ${limitType} limit (${current}/${limit}). Upgrade now to avoid interruption.`;
      case 'warning':
        return `You've used ${Math.round((current/limit) * 100)}% of your ${limitType} limit. Consider upgrading.`;
      default:
        return `Unlock unlimited ${limitType} and advanced features.`;
    }
  };

  const suggestedPlan = recommendations.length > 0 
    ? recommendations[0].suggestedPlan 
    : 'silver_weekly';

  const urgencyColor = getUrgencyColor(usageStatus.status);
  const UrgencyIcon = getUrgencyIcon(usageStatus.status);
  const urgencyMessage = getUrgencyMessage(
    usageStatus.status, 
    limitType, 
    usageStatus.current, 
    usageStatus.limit
  );

  if (variant === 'alert') {
    return (
      <Alert className={`border-${urgencyColor}-300 bg-${urgencyColor}-50 ${className}`}>
        <UrgencyIcon className={`h-4 w-4 text-${urgencyColor}-600`} />
        <AlertDescription className={`text-${urgencyColor}-800`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium">{urgencyMessage}</p>
              <p className="text-sm mt-1">
                Upgrade to {suggestedPlan.replace('_', ' ')} for {getPlanPrice(suggestedPlan)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleUpgrade}
                className={`bg-${urgencyColor}-600 hover:bg-${urgencyColor}-700 text-white`}
                size="sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className={`text-${urgencyColor}-600 hover:bg-${urgencyColor}-100`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-${urgencyColor}-500 to-${urgencyColor}-600 text-white p-4 rounded-lg shadow-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <UrgencyIcon className="h-6 w-6" />
            <div>
              <p className="font-semibold">{urgencyMessage}</p>
              <p className="text-sm opacity-90">
                Upgrade to {suggestedPlan.replace('_', ' ')} starting at {getPlanPrice(suggestedPlan)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleUpgrade}
              className="bg-white text-gray-900 hover:bg-gray-100"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`border-${urgencyColor}-200 bg-gradient-to-br from-${urgencyColor}-50 to-white shadow-lg ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-${urgencyColor}-900 flex items-center space-x-2`}>
            <UrgencyIcon className={`h-5 w-5 text-${urgencyColor}-600`} />
            <span>Upgrade Recommended</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={`text-${urgencyColor}-600 hover:bg-${urgencyColor}-100`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Status */}
        <div className={`bg-${urgencyColor}-100 p-3 rounded-lg`}>
          <p className={`text-${urgencyColor}-900 font-medium mb-2`}>
            {urgencyMessage}
          </p>
          <div className={`w-full bg-${urgencyColor}-200 rounded-full h-2`}>
            <div 
              className={`bg-${urgencyColor}-600 h-2 rounded-full transition-all duration-300`}
              style={{ width: `${Math.min(usageStatus.percentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className={`text-${urgencyColor}-700`}>
              {usageStatus.current} used
            </span>
            <span className={`text-${urgencyColor}-700`}>
              {usageStatus.limit} limit
            </span>
          </div>
        </div>

        {/* Recommended Plan */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">
              Recommended: {suggestedPlan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h4>
            <span className="text-lg font-bold text-green-600">
              {getPlanPrice(suggestedPlan)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {getPlanBenefits(suggestedPlan).map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/pricing')}
              className="flex-1"
            >
              View All Plans
            </Button>
          </div>
        </div>

        {/* Urgency indicator for exceeded limits */}
        {usageStatus.status === 'exceeded' && (
          <div className="bg-red-100 border border-red-300 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">
                Action Required: You cannot create more {limitType} until you upgrade.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligentUpgradePrompt;