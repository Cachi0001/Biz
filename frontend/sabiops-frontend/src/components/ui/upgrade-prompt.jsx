import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Star, Zap, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const UpgradePrompt = ({ 
  variant = 'card', 
  showFeatures = true, 
  className = '' 
}) => {
  const { user } = useAuth();

  const isFreeTrial = user?.subscription_status?.toLowerCase() === 'free_trial';
  const isBasic = user?.subscription_status?.toLowerCase() === 'basic';

  if (!isFreeTrial && !isBasic) {
    return null;
  }

  const handleUpgrade = () => {
    // Navigate to subscription upgrade page
    window.location.href = '/subscription/upgrade';
  };

  const features = {
    basic: [
      'Unlimited customers',
      'Advanced reporting',
      'Email support',
      'Data export'
    ],
    premium: [
      'Everything in Basic',
      'Team collaboration',
      'API access',
      'Custom branding'
    ]
  };

  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5" />
            <div>
              <p className="font-semibold">
                {isFreeTrial ? 'Upgrade from Free Trial' : 'Upgrade to Premium'}
              </p>
              <p className="text-sm opacity-90">
                Unlock all features and grow your business
              </p>
            </div>
          </div>
          <Button 
            onClick={handleUpgrade}
            variant="secondary"
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Upgrade Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-2 border-dashed border-primary/20 ${className}`}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          {isFreeTrial ? (
            <Crown className="h-8 w-8 text-yellow-500" />
          ) : (
            <Star className="h-8 w-8 text-purple-500" />
          )}
        </div>
        <CardTitle className="text-xl">
          {isFreeTrial ? 'Upgrade Your Account' : 'Go Premium'}
        </CardTitle>
        <CardDescription>
          {isFreeTrial 
            ? 'Your free trial is active. Upgrade to continue using all features.'
            : 'Unlock advanced features with our Premium plan.'
          }
        </CardDescription>
      </CardHeader>
      
      {showFeatures && (
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Basic Plan */}
            {isFreeTrial && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-green-500" />
                  <h4 className="font-semibold">Basic Plan</h4>
                  <Badge variant="secondary">₦5,000/month</Badge>
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {features.basic.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Premium Plan */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <h4 className="font-semibold">Premium Plan</h4>
                <Badge variant="default">₦15,000/month</Badge>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {features.premium.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-purple-500 rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpgrade} className="flex-1">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Now
            </Button>
            <Button variant="outline" className="flex-1">
              Learn More
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default UpgradePrompt;

