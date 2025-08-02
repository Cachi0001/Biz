import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { AlertTriangle, Crown, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import subscriptionService from '../../services/subscriptionService';

const LimitExceededModal = ({ 
  isOpen, 
  onClose, 
  featureType, 
  currentUsage, 
  limit, 
  currentPlan,
  suggestedPlans = []
}) => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await subscriptionService.getPlans();
      const planData = response.plans || response;
      
      // Filter out current plan and free plan, show upgrade options
      const upgradeOptions = Object.values(planData).filter(plan => 
        plan.id !== currentPlan && 
        plan.id !== 'free' &&
        plan.features[featureType] > limit
      );
      
      setPlans(upgradeOptions);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planId) => {
    onClose();
    navigate(`/subscription-upgrade?plan=${planId}&feature=${featureType}`);
  };

  const getFeatureDisplayName = (feature) => {
    const names = {
      'invoices': 'Invoices',
      'expenses': 'Expenses', 
      'sales': 'Sales',
      'products': 'Products'
    };
    return names[feature] || feature;
  };

  const formatPrice = (price) => {
    return `₦${(price / 100).toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {(getFeatureDisplayName(featureType) || 'Feature')} Limit Reached
              </DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                You've reached your {(getFeatureDisplayName(featureType) || 'feature').toLowerCase()} limit for your current plan
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Usage Display */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-red-800">Current Usage</h3>
                  <p className="text-sm text-red-600 mt-1">
                    You've used all {limit} {(getFeatureDisplayName(featureType) || 'feature').toLowerCase()} 
                    allowed on your {currentPlan} plan
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-red-700">
                    {currentUsage}/{limit}
                  </div>
                  <div className="text-xs text-red-600">100% used</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Options */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Upgrade to Continue
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading upgrade options...</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className="border-2 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                              <p className="text-sm text-gray-600">
                                {formatPrice(plan.price)} per {plan.period}
                              </p>
                            </div>
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {plan.features[featureType]} {(getFeatureDisplayName(featureType) || 'feature').toLowerCase()}
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-600">
                            Get {plan.features[featureType] - limit} more {(getFeatureDisplayName(featureType) || 'feature').toLowerCase()}
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={() => navigate('/subscription-upgrade')}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              View All Plans
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LimitExceededModal;