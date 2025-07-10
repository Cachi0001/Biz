import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSubscriptionPlans } from '../services/api';
import PaymentModal from '../components/ui/payment-modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, Star, Crown, Zap } from 'lucide-react';

const SubscriptionUpgrade = () => {
  const { user, updateUser } = useAuth();
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
      try {
      setLoading(true);
      const response = await getSubscriptionPlans();
      setPlans(response.plans || {});
      } catch (error) {
      console.error('Error fetching plans:', error);
      setError('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (planKey) => {
    setSelectedPlan({ key: planKey, ...plans[planKey] });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (response) => {
    // Update user context with new subscription info
    if (updateUser) {
      updateUser({
        ...user,
        subscription_plan: selectedPlan.key,
        subscription_status: 'active'
      });
    }
    
    // Show success message
    alert('Subscription upgraded successfully! You now have access to all premium features.');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError('Payment failed. Please try again.');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getPlanIcon = (planKey) => {
    switch (planKey) {
      case 'free':
        return <CheckCircle className="h-6 w-6" />;
      case 'weekly':
        return <Zap className="h-6 w-6" />;
      case 'monthly':
        return <Star className="h-6 w-6" />;
      case 'yearly':
        return <Crown className="h-6 w-6" />;
      default:
        return <CheckCircle className="h-6 w-6" />;
    }
  };

  const getPlanColor = (planKey) => {
    switch (planKey) {
      case 'free':
        return 'bg-gray-100 text-gray-700';
      case 'weekly':
        return 'bg-blue-100 text-blue-700';
      case 'monthly':
        return 'bg-green-100 text-green-700';
      case 'yearly':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
  return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select the perfect plan for your business needs. All plans include our core features with additional benefits as you upgrade.
          </p>
      </div>

      {/* Current Plan Status */}
        {user && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
                <div>
                <h3 className="font-medium text-blue-900">Current Plan</h3>
                <p className="text-blue-700">
                  {user.subscription_plan ? 
                    `${user.subscription_plan.charAt(0).toUpperCase() + user.subscription_plan.slice(1)} Plan` : 
                    'Free Plan'
                    }
                  </p>
              </div>
              <Badge variant={user.subscription_status === 'active' ? 'default' : 'secondary'}>
                {user.subscription_status || 'Free'}
              </Badge>
            </div>
          </div>
      )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(plans).map(([planKey, plan]) => (
            <Card 
              key={planKey} 
              className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className={`inline-flex p-3 rounded-full ${getPlanColor(planKey)} mb-4`}>
                  {getPlanIcon(planKey)}
            </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">
                    {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-500">/{plan.duration}</span>
                  )}
            </div>
                {plan.savings && (
                  <p className="text-sm text-green-600 font-medium">{plan.savings}</p>
                )}
          </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
              </li>
                  ))}
            </ul>

                {plan.referral_earning > 0 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      Referral Bonus: {formatCurrency(plan.referral_earning)}
                    </p>
            </div>
          )}

                {plan.note && (
                  <p className="text-xs text-gray-500 italic">{plan.note}</p>
                )}

            <Button 
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handlePlanSelect(planKey)}
                  disabled={planKey === 'free' || (user && user.subscription_plan === planKey)}
            >
                  {planKey === 'free' ? 'Current Plan' : 
                   user && user.subscription_plan === planKey ? 'Current Plan' :
                   plan.price === 0 ? 'Start Free Trial' : 'Upgrade Now'}
            </Button>
          </CardContent>
        </Card>
          ))}
      </div>

        {/* Referral Information */}
        {plans.referral_info && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
              <CardTitle className="text-green-800">Referral Program</CardTitle>
              <CardDescription className="text-green-700">
                Earn money by referring other businesses to our platform
          </CardDescription>
        </CardHeader>
        <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium text-green-800">Minimum Withdrawal</p>
                  <p className="text-green-700">{formatCurrency(plans.referral_info.minimum_withdrawal)}</p>
          </div>
              <div>
                  <p className="font-medium text-green-800">Earning Plans</p>
                  <p className="text-green-700">{plans.referral_info.earning_plans.join(', ')}</p>
              </div>
              <div>
                  <p className="font-medium text-green-800">Note</p>
                  <p className="text-green-700">{plans.referral_info.note}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
              </div>
        )}
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
      <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          plan={selectedPlan.key}
          amount={selectedPlan.price}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
      )}
    </div>
  );
};

export default SubscriptionUpgrade;

