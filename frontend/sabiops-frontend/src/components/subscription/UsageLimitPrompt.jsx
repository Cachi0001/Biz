import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Crown, AlertTriangle, TrendingUp, X, Zap, Target } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import usageTrackingService from '../../services/usageTrackingService';

const UsageLimitPrompt = ({ limitType, currentUsage, onUpgrade, showIntelligent = true }) => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  // Get real-time usage status
  const usageStatus = usageTrackingService.getUsageStatus(limitType, user);

  // Get upgrade recommendations
  useEffect(() => {
    if (user && showIntelligent) {
      const recs = usageTrackingService.getUpgradeRecommendations(user);
      setRecommendations(recs);
    }
  }, [user, showIntelligent]);

  // Don't show for unlimited plans
  if (!subscription || usageStatus.isUnlimited) {
    return null;
  }

  // Don't show if dismissed or not near limit
  if (dismissed || (usageStatus.status === 'normal' && usageStatus.percentage < 70)) {
    return null;
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/subscription-upgrade');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const getSuggestedPlan = () => {
    const upgradePath = {
      'free': 'Silver Weekly',
      'basic': 'Silver Weekly',
      'silver_weekly': 'Silver Monthly',
      'silver_monthly': 'Silver Yearly'
    };
    return upgradePath[subscription.plan] || 'Silver Weekly';
  };

  const getUpgradeMessage = () => {
    const suggestedPlan = getSuggestedPlan();
    const relevantRec = recommendations.find(r => r.type === limitType);
    
    if (relevantRec) {
      return `${relevantRec.reason}. Upgrade to ${suggestedPlan} for unlimited access.`;
    }
    
    return `You're using ${usageStatus.percentage}% of your ${limitType} limit. Upgrade to ${suggestedPlan} for unlimited access.`;
  };

  // Critical/Exceeded state
  if (usageStatus.status === 'exceeded') {
    return (
      <Alert className="border-red-300 bg-red-50 relative">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 text-red-400 hover:text-red-600"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
        <AlertDescription className="text-red-800 pr-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {limitType === 'invoices' ? 'Invoice' : 'Expense'} limit reached!
              </p>
              <p className="text-sm">
                You've used {usageStatus.current} of {usageStatus.limit} {limitType} this month. 
                Upgrade to {getSuggestedPlan()} to continue.
              </p>
              {showIntelligent && (
                <p className="text-xs mt-1 text-red-600">
                  💡 Based on your usage pattern, {getSuggestedPlan()} would give you unlimited {limitType}.
                </p>
              )}
            </div>
            <Button 
              onClick={handleUpgrade}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Warning/Critical state
  if (usageStatus.status === 'warning' || usageStatus.status === 'critical') {
    const isUrgent = usageStatus.status === 'critical';
    const borderColor = isUrgent ? 'border-red-300' : 'border-orange-300';
    const bgColor = isUrgent ? 'bg-red-50' : 'bg-orange-50';
    const textColor = isUrgent ? 'text-red-800' : 'text-orange-800';
    const iconColor = isUrgent ? 'text-red-600' : 'text-orange-600';
    const progressColor = isUrgent ? 'bg-red-600' : 'bg-orange-600';
    const progressBgColor = isUrgent ? 'bg-red-200' : 'bg-orange-200';

    return (
      <Card className={`${borderColor} ${bgColor} relative`}>
        <CardContent className="p-4">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
            <div className="flex items-start space-x-3">
              <div className="flex items-center gap-1">
                {isUrgent ? (
                  <AlertTriangle className={`h-5 w-5 ${iconColor} mt-0.5`} />
                ) : (
                  <TrendingUp className={`h-5 w-5 ${iconColor} mt-0.5`} />
                )}
                {showIntelligent && (
                  <Target className={`h-4 w-4 ${iconColor} mt-0.5`} />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${textColor}`}>
                  {isUrgent ? 'Critical:' : 'Warning:'} {limitType} limit {isUrgent ? 'almost reached' : 'approaching'}
                </p>
                <p className={`text-sm ${textColor}`}>
                  {usageStatus.current} of {usageStatus.limit} {limitType} used ({usageStatus.percentage}%)
                </p>
                {showIntelligent && (
                  <p className={`text-xs mt-1 ${textColor}`}>
                    💡 {getUpgradeMessage()}
                  </p>
                )}
                <div className={`w-full ${progressBgColor} rounded-full h-2 mt-2`}>
                  <div 
                    className={`${progressColor} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min(usageStatus.percentage, 100)}%` }}
                  />
                </div>
                {usageStatus.remaining <= 2 && (
                  <p className={`text-xs mt-1 font-medium ${textColor}`}>
                    ⚠️ Only {usageStatus.remaining} {limitType} remaining this month!
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleUpgrade}
                variant="outline"
                className={`${isUrgent ? 'border-red-600 text-red-600 hover:bg-red-600' : 'border-orange-600 text-orange-600 hover:bg-orange-600'} hover:text-white`}
                size="sm"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to {getSuggestedPlan()}
              </Button>
              {showIntelligent && recommendations.length > 0 && (
                <p className="text-xs text-center text-gray-600">
                  Smart recommendation
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default UsageLimitPrompt;