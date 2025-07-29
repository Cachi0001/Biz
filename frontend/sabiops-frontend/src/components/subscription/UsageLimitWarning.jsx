import React from 'react';
import { AlertTriangle, Crown, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

const UsageLimitWarning = ({ 
  feature, 
  current, 
  limit, 
  percentage, 
  onUpgrade, 
  onDismiss,
  type = 'warning' // 'warning' or 'limit_reached'
}) => {
  const isLimitReached = type === 'limit_reached' || percentage >= 100;
  
  const getWarningStyle = () => {
    if (isLimitReached) {
      return {
        cardClass: 'border-red-200 bg-red-50',
        iconClass: 'text-red-600',
        textClass: 'text-red-800',
        buttonClass: 'bg-red-600 hover:bg-red-700'
      };
    }
    return {
      cardClass: 'border-orange-200 bg-orange-50',
      iconClass: 'text-orange-600',
      textClass: 'text-orange-800',
      buttonClass: 'bg-orange-600 hover:bg-orange-700'
    };
  };

  const styles = getWarningStyle();

  const getMessage = () => {
    if (isLimitReached) {
      return `You've reached your ${feature} limit (${current}/${limit}). Upgrade to continue creating ${feature}.`;
    }
    return `You've used ${percentage.toFixed(0)}% of your ${feature} limit (${current}/${limit}). Consider upgrading soon.`;
  };

  return (
    <Card className={`${styles.cardClass} border-l-4 shadow-sm`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertTriangle className={`h-5 w-5 ${styles.iconClass} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <h4 className={`font-medium ${styles.textClass} capitalize`}>
                {isLimitReached ? `${feature} Limit Reached` : `${feature} Usage Warning`}
              </h4>
              <p className={`text-sm ${styles.textClass} mt-1`}>
                {getMessage()}
              </p>
              
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{current} used</span>
                  <span>{limit} limit</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isLimitReached ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {onUpgrade && (
              <Button
                size="sm"
                className={`${styles.buttonClass} text-white text-xs px-3 py-1`}
                onClick={onUpgrade}
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade
              </Button>
            )}
            {onDismiss && !isLimitReached && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700 p-1"
                onClick={onDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageLimitWarning;