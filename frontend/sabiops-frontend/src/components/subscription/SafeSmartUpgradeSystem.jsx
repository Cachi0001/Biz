import React from 'react';
import { Card, CardContent } from '../ui/card';
import { CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const SafeSmartUpgradeSystem = () => {
  const { user } = useAuth();
  
  // Only show upgrade prompts for free users or trial users with 3 days or less
  const shouldShowUpgradePrompt = user?.subscription_plan === 'free' || 
    (user?.subscription_status === 'trial' && (user?.trial_days_left || 0) <= 3 && (user?.trial_days_left || 0) > 0);
  
  if (!shouldShowUpgradePrompt) {
    // Show success message for paid users
    const isPaidUser = user?.subscription_plan && user?.subscription_plan !== 'free' && user?.subscription_status === 'active';
    
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 text-center">
          {isPaidUser ? (
            <>
              <Crown className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">Premium Active!</p>
              <p className="text-sm text-green-700">
                Enjoying your {user.subscription_plan === 'monthly' ? 'Monthly' : 
                             user.subscription_plan === 'yearly' ? 'Yearly' : 
                             user.subscription_plan === 'silver_weekly' ? 'Weekly' : 'Premium'} plan benefits.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-green-800 font-medium">You're all set!</p>
              <p className="text-sm text-green-700">
                Your current plan meets your usage needs.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Return null if upgrade prompts should be shown (handled by other components)
  return null;
};

export default SafeSmartUpgradeSystem;