import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Crown, CheckCircle, Lightbulb } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Safe wrapper for SmartUpgradeSystem that handles errors gracefully
 */
const SafeSmartUpgradeSystem = ({ className = '' }) => {
  const { user, subscription } = useAuth();
  const navigate = useNavigate();

  if (!user || !subscription) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/subscription-upgrade');
  };

  // Simple fallback display
  const renderSimpleUpgradeSystem = () => {
    // Don't show upgrade prompts for paid plans
    if (subscription.plan !== 'free') {
      return (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">You're all set!</p>
            <p className="text-sm text-green-700">
              Your current plan meets your usage needs.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-900 flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <span>Upgrade Available</span>
            <Badge variant="outline" className="text-xs">
              Recommended
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-900 mb-2">
              Unlock more features with a paid plan
            </p>
            
            <div className="grid grid-cols-2 gap-1 mb-2">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-700">Higher limits</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-700">Advanced analytics</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-700">Priority support</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-gray-700">Team collaboration</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleUpgrade}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                <Crown className="h-3 w-3 mr-1" />
                Upgrade to Silver Weekly
              </Button>
              <span className="text-xs text-gray-500">
                ₦2,500/week
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ErrorBoundary fallbackMessage="Upgrade system temporarily unavailable">
      <div className={className}>
        {renderSimpleUpgradeSystem()}
      </div>
    </ErrorBoundary>
  );
};

export default SafeSmartUpgradeSystem;