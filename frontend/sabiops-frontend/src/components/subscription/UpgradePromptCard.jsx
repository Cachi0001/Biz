import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Crown, Clock, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * UpgradePromptCard - Shows when user has 3 days or less remaining
 * Only displays for business owners, not team members
 */
const UpgradePromptCard = ({ 
  daysLeft, 
  subscriptionPlan, 
  isTrialUser = false,
  onDismiss,
  className = ""
}) => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for owners with 3 days or less
  const shouldShow = isOwner && daysLeft <= 3 && daysLeft > 0 && !isDismissed;

  const handleUpgrade = () => {
    navigate('/subscription-upgrade');
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!shouldShow) {
    return null;
  }

  const urgencyLevel = daysLeft === 1 ? 'critical' : daysLeft <= 2 ? 'high' : 'medium';
  
  const cardStyles = {
    critical: 'bg-gradient-to-r from-red-100 to-red-200 border-red-400 shadow-lg',
    high: 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-400 shadow-lg',
    medium: 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-400 shadow-lg'
  };

  const textStyles = {
    critical: 'text-red-800',
    high: 'text-orange-800', 
    medium: 'text-yellow-800'
  };

  const buttonStyles = {
    critical: 'bg-red-600 hover:bg-red-700',
    high: 'bg-orange-600 hover:bg-orange-700',
    medium: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <Card className={`${cardStyles[urgencyLevel]} ${className} animate-pulse`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm font-bold ${textStyles[urgencyLevel]} flex items-center justify-between`}>
          <div className="flex items-center">
            <Crown className="h-4 w-4 mr-2 text-yellow-600" />
            {isTrialUser ? 'Trial Ending Soon!' : 'Subscription Expiring!'}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className={`h-6 w-6 p-0 ${textStyles[urgencyLevel]} hover:opacity-70`}
          >
            <X className="h-3 w-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Clock className={`h-4 w-4 ${textStyles[urgencyLevel]}`} />
            <span className={`text-sm font-semibold ${textStyles[urgencyLevel]}`}>
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </span>
          </div>
          
          <p className={`text-xs ${textStyles[urgencyLevel]} leading-relaxed`}>
            {isTrialUser 
              ? `Your free trial expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Upgrade now to continue using all premium features without interruption.`
              : `Your ${subscriptionPlan} plan expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}. Renew now to avoid service interruption.`
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={handleUpgrade}
              className={`${buttonStyles[urgencyLevel]} text-white text-xs px-4 py-2 flex items-center justify-center space-x-1 flex-1`}
            >
              <span>{isTrialUser ? 'Upgrade Now' : 'Renew Plan'}</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className={`text-xs px-3 py-2 border-current ${textStyles[urgencyLevel]} hover:bg-white/20`}
            >
              Remind Later
            </Button>
          </div>
          
          {urgencyLevel === 'critical' && (
            <div className={`text-xs ${textStyles[urgencyLevel]} font-bold text-center p-2 bg-white/30 rounded`}>
              ⚠️ Service will be limited after expiry!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradePromptCard;