import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlanLimitContext } from '../contexts/PlanLimitContext';
import { useEnhancedNotification } from '../contexts/EnhancedNotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Crown, 
  Zap, 
  Check, 
  X, 
  AlertTriangle, 
  CreditCard, 
  Calendar,
  Users,
  TrendingUp,
  Shield,
  Star
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

const SubscriptionManager = () => {
  const { user } = useAuth();
  const { 
    subscription, 
    usage, 
    planLimits, 
    getPlanInfo, 
    getFeatureStatusSummary,
    refreshUsage 
  } = usePlanLimitContext();
  const { showToast } = useEnhancedNotification();
  
  const [isLoading, setIsLoading] = useState(false);
  const [proRataCalculation, setProRataCalculation] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const planInfo = getPlanInfo();
  const featureStatus = getFeatureStatusSummary();

  // Plan configurations
  const plans = {
    free: {
      name: 'Free Plan',
      price: 0,
      period: 'forever',
      color: 'gray',
      features: [
        '5 invoices per month',
        '5 expenses per month',
        'Basic customer management',
        'Basic reporting'
      ],
      limits: {
        invoices: 5,
        expenses: 5,
        sales: 50,
        products: 20
      }
    },
    weekly: {
      name: 'Weekly Plan',
      price: 1400,
      period: 'week',
      color: 'blue',
      popular: false,
      features: [
        '100 invoices per week',
        '100 expenses per week',
        '250 sales per week',
        '100 products per week',
        'Team management',
        'Advanced reporting',
        'Priority support'
      ],
      limits: {
        invoices: 100,
        expenses: 100,
        sales: 250,
        products: 100
      }
    },
    monthly: {
      name: 'Monthly Plan',
      price: 4500,
      period: 'month',
      color: 'green',
      popular: true,
      features: [
        '450 invoices per month',
        '500 expenses per month',
        '1,500 sales per month',
        '500 products per month',
        'Advanced analytics',
        'API access',
        'Custom branding',
        'Priority support'
      ],
      limits: {
        invoices: 450,
        expenses: 500,
        sales: 1500,
        products: 500
      }
    },
    yearly: {
      name: 'Yearly Plan',
      price: 50000,
      period: 'year',
      color: 'purple',
      features: [
        '6,000 invoices per year',
        '2,000 expenses per year',
        '18,000 sales per year',
        '2,000 products per year',
        'Unlimited team members',
        'Advanced integrations',
        'Dedicated account manager',
        '24/7 priority support'
      ],
      limits: {
        invoices: 6000,
        expenses: 2000,
        sales: 18000,
        products: 2000
      }
    }
  };

  /**
   * Calculate pro-rata upgrade cost
   */
  const calculateProRata = async (newPlan) => {
    if (newPlan === planInfo.plan) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiClient.post('/api/subscription/calculate-prorata', {
        new_plan: newPlan
      });

      if (response.data) {
        setProRataCalculation(response.data);
        setSelectedPlan(newPlan);
      }
    } catch (error) {
      console.error('Failed to calculate pro-rata:', error);
      showToast('Failed to calculate upgrade cost', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initialize payment for upgrade
   */
  const initiateUpgrade = async () => {
    if (!proRataCalculation || !selectedPlan) {
      return;
    }

    try {
      setPaymentLoading(true);
      
      const response = await apiClient.post('/api/subscription/initialize-payment', {
        plan_details: proRataCalculation
      });

      if (response.data?.authorization_url) {
        // Redirect to Paystack payment page
        window.location.href = response.data.authorization_url;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Failed to initialize payment:', error);
      showToast('Failed to initialize payment', 'error');
    } finally {
      setPaymentLoading(false);
    }
  };

  /**
   * Get plan color classes
   */
  const getPlanColorClasses = (color, isSelected = false) => {
    const colors = {
      gray: isSelected ? 'border-gray-500 bg-gray-50' : 'border-gray-200',
      blue: isSelected ? 'border-blue-500 bg-blue-50' : 'border-blue-200',
      green: isSelected ? 'border-green-500 bg-green-50' : 'border-green-200',
      purple: isSelected ? 'border-purple-500 bg-purple-50' : 'border-purple-200'
    };
    return colors[color] || colors.gray;
  };

  /**
   * Get usage status color
   */
  const getUsageStatusColor = (percentage) => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Current Plan Status */}
      <Card className="border-green-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-green-900">
              {planInfo.isTrialUser && <Crown className="w-5 h-5 mr-2 text-yellow-600" />}
              Current Plan: {plans[planInfo.plan]?.name || 'Unknown Plan'}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`${getPlanColorClasses(plans[planInfo.plan]?.color)} border`}
              >
                {planInfo.status}
              </Badge>
              {planInfo.isTrialUser && (
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Trial: {planInfo.trialDaysLeft} days left
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Usage Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Object.entries(usage).map(([feature, currentUsage]) => {
              const limit = planLimits[feature];
              const percentage = limit ? (currentUsage / limit) * 100 : 0;
              
              return (
                <div key={feature} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">{feature}</span>
                    <span className={`text-sm ${getUsageStatusColor(percentage)}`}>
                      {currentUsage}/{limit || '∞'}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  <span className="text-xs text-gray-500">
                    {percentage.toFixed(0)}% used
                  </span>
                </div>
              );
            })}
          </div>

          {/* Feature Status Alerts */}
          {featureStatus.exceededCount > 0 && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                You've exceeded limits for {featureStatus.exceededCount} feature(s): {featureStatus.exceededFeatures.join(', ')}. 
                Upgrade your plan to continue.
              </AlertDescription>
            </Alert>
          )}

          {featureStatus.approachingCount > 0 && (
            <Alert className="mb-4 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                You're approaching limits for {featureStatus.approachingCount} feature(s): {featureStatus.warningFeatures.join(', ')}.
              </AlertDescription>
            </Alert>
          )}

          {/* Trial Warning */}
          {planInfo.isTrialUser && planInfo.trialDaysLeft <= 3 && (
            <Alert className="mb-4 border-yellow-200 bg-yellow-50">
              <Crown className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Your trial expires in {planInfo.trialDaysLeft} days. Upgrade now to continue using all features.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(plans).map(([planKey, plan]) => {
          const isCurrentPlan = planKey === planInfo.plan;
          const isSelected = planKey === selectedPlan;
          
          return (
            <Card 
              key={planKey}
              className={`relative ${getPlanColorClasses(plan.color, isSelected)} border-2 transition-all duration-200 hover:shadow-lg`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white">
                    <Star className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center">
                  {planKey === 'yearly' && <Crown className="w-5 h-5 mr-2 text-purple-600" />}
                  {planKey === 'monthly' && <Zap className="w-5 h-5 mr-2 text-green-600" />}
                  {planKey === 'weekly' && <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />}
                  {planKey === 'free' && <Shield className="w-5 h-5 mr-2 text-gray-600" />}
                  {plan.name}
                </CardTitle>
                <div className="text-3xl font-bold">
                  ₦{plan.price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action Button */}
                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button disabled className="w-full" variant="outline">
                      Current Plan
                    </Button>
                  ) : planKey === 'free' ? (
                    <Button 
                      disabled 
                      className="w-full" 
                      variant="outline"
                    >
                      Downgrade Not Available
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => calculateProRata(planKey)}
                      disabled={isLoading}
                      variant={isSelected ? "default" : "outline"}
                    >
                      {isLoading && selectedPlan === planKey ? 'Calculating...' : 'Select Plan'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pro-rata Calculation */}
      {proRataCalculation && selectedPlan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-900">
              <CreditCard className="w-5 h-5 mr-2" />
              Upgrade Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-900">Current Plan</h4>
                <p className="text-sm text-blue-700">
                  {plans[proRataCalculation.current_plan]?.name} - ₦{proRataCalculation.current_amount.toLocaleString()}
                </p>
                <p className="text-xs text-blue-600">
                  {proRataCalculation.days_remaining} days remaining
                </p>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-900">New Plan</h4>
                <p className="text-sm text-blue-700">
                  {plans[proRataCalculation.new_plan]?.name} - ₦{proRataCalculation.new_amount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border-t border-blue-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-blue-700">Unused amount from current plan:</span>
                <span className="text-sm font-medium text-blue-900">
                  -₦{proRataCalculation.unused_amount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-lg font-bold text-blue-900">
                <span>Amount to pay now:</span>
                <span>₦{proRataCalculation.prorata_amount.toLocaleString()}</span>
              </div>
              
              {proRataCalculation.savings > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  You save ₦{proRataCalculation.savings.toLocaleString()} from your current plan!
                </p>
              )}
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={initiateUpgrade}
                disabled={paymentLoading}
                className="flex-1"
              >
                {paymentLoading ? 'Processing...' : `Pay ₦${proRataCalculation.prorata_amount.toLocaleString()}`}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setProRataCalculation(null);
                  setSelectedPlan(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Billing History */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-900">
            <Calendar className="w-5 h-5 mr-2" />
            Subscription Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Plan Status</h4>
              <p className="text-sm text-gray-600">{planInfo.status}</p>
            </div>
            
            {planInfo.subscriptionEnd && (
              <div>
                <h4 className="font-medium text-gray-900">Next Billing</h4>
                <p className="text-sm text-gray-600">
                  {new Date(planInfo.subscriptionEnd).toLocaleDateString()}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">Features</h4>
              <p className="text-sm text-gray-600">
                {planInfo.features?.length || plans[planInfo.plan]?.features.length || 0} features included
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Information */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium text-gray-900">Need Help?</h3>
            <p className="text-sm text-gray-600">
              Contact our support team for assistance with your subscription.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://wa.me/2348158025887', '_blank')}
              >
                WhatsApp Support
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('mailto:support@sabiops.com', '_blank')}
              >
                Email Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;

