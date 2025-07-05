import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Crown, Clock, Star } from 'lucide-react';

const SubscriptionBadge = ({ subscriptionStatus, trialDaysLeft }) => {
  const getSubscriptionConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'free_trial':
        return {
          variant: 'secondary',
          icon: Clock,
          text: `Free Trial (${trialDaysLeft || 0} days left)`,
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'basic':
        return {
          variant: 'default',
          icon: Star,
          text: 'Basic Plan',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'premium':
        return {
          variant: 'default',
          icon: Crown,
          text: 'Premium Plan',
          className: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      default:
        return {
          variant: 'outline',
          icon: Clock,
          text: 'Free Trial',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getSubscriptionConfig(subscriptionStatus);
  const IconComponent = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className}`}>
      <IconComponent className="h-3 w-3" />
      {config.text}
    </Badge>
  );
};

export default SubscriptionBadge;

