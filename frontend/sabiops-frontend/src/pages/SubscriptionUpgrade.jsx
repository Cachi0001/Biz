import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionBadge from '@/components/ui/subscription-badge';
import PaymentModal from '@/components/ui/payment-modal';
import { 
  Crown, 
  Star, 
  Check, 
  Zap, 
  Users, 
  BarChart3, 
  Shield, 
  Headphones,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const SubscriptionUpgrade = () => {
  const { user, isFreeTrial, isPremium, trialDaysLeft, updateSubscription } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, plan: null, amount: 0 });
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);

  useEffect(() => {
    const fetchSubscriptionPlans = async () => {
      try {
        const response = await apiService.getSubscriptionPlans();
        setSubscriptionPlans(response.plans || []);
      } catch (error) {
        console.error('Failed to fetch subscription plans:', error);
        // Fallback to default plans
        setSubscriptionPlans([
          {
            id: 'basic',
            name: 'Basic',
            price: 5000,
            features: [
              'Unlimited customers',
              'Advanced reporting',
              'Email support',
              'Data export',
              'Mobile access'
            ]
          },
          {
            id: 'premium',
            name: 'Premium',
            price: 15000,
            features: [
              'Everything in Basic',
              'Team collaboration',
              'API access',
              'Priority support',
              'Custom integrations',
              'Advanced analytics'
            ]
          }
        ]);
      }
    };

    fetchSubscriptionPlans();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleUpgrade = (plan, amount) => {
    setPaymentModal({
      isOpen: true,
      plan: plan,
      amount: amount
    });
  };

  const handlePaymentSuccess = async (paymentResponse) => {
    try {
      setLoading(true);
      // Refresh user data to reflect new subscription
      await updateSubscription({
        plan: paymentModal.plan,
        status: 'active',
        payment_reference: paymentResponse.reference
      });
      
      // Navigate back to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
  };

  const closePaymentModal = () => {
    setPaymentModal({ isOpen: false, plan: null, amount: 0 });
  };

  const currentPlan = user?.subscription_status?.toLowerCase() || 'free_trial';

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-4">
            Unlock the full potential of your business with our premium features
          </p>
          
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm text-muted-foreground">Current Plan:</span>
            <SubscriptionBadge 
              subscriptionStatus={user?.subscription_status} 
              trialDaysLeft={trialDaysLeft}
            />
          </div>
          
          {isFreeTrial && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg inline-block">
              <p className="text-blue-800 font-medium">
                🎉 Special Offer: Get 20% off your first month when you upgrade today!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Current Plan Status */}
      {isFreeTrial && (
        <Card className="mb-8 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800">Free Trial Active</h3>
                  <p className="text-sm text-yellow-700">
                    {trialDaysLeft > 0 
                      ? `${trialDaysLeft} days remaining in your trial`
                      : 'Your trial has expired'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-yellow-700">Upgrade now to continue using all features</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Free Trial Plan */}
        <Card className={`relative ${currentPlan === 'free_trial' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-gray-500" />
                Free Trial
              </CardTitle>
              {currentPlan === 'free_trial' && (
                <Badge variant="default">Current</Badge>
              )}
            </div>
            <CardDescription>Perfect for getting started</CardDescription>
            <div className="text-3xl font-bold">₦0<span className="text-lg font-normal">/month</span></div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Up to 10 customers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Up to 5 products</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Basic reporting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">14-day trial</span>
              </li>
            </ul>
            <Button 
              variant="outline" 
              className="w-full" 
              disabled={currentPlan === 'free_trial'}
            >
              {currentPlan === 'free_trial' ? 'Current Plan' : 'Start Free Trial'}
            </Button>
          </CardContent>
        </Card>

        {/* Basic Plan */}
        <Card className={`relative ${currentPlan === 'basic' ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-green-500" />
                Basic
              </CardTitle>
              {currentPlan === 'basic' && (
                <Badge variant="default">Current</Badge>
              )}
            </div>
            <CardDescription>Great for small businesses</CardDescription>
            <div className="text-3xl font-bold">
              {formatCurrency(5000)}
              <span className="text-lg font-normal">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Unlimited customers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Unlimited products</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced reporting</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Email support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Data export</span>
              </li>
            </ul>
            <Button 
              className="w-full" 
              onClick={() => handleUpgrade('basic', 5000)}
              disabled={currentPlan === 'basic' || loading}
            >
              {currentPlan === 'basic' ? 'Current Plan' : 'Upgrade to Basic'}
            </Button>
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card className={`relative ${currentPlan === 'premium' ? 'ring-2 ring-primary' : 'ring-2 ring-purple-500'}`}>
          {currentPlan !== 'premium' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-500 text-white">Most Popular</Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                Premium
              </CardTitle>
              {currentPlan === 'premium' && (
                <Badge variant="default">Current</Badge>
              )}
            </div>
            <CardDescription>Perfect for growing businesses</CardDescription>
            <div className="text-3xl font-bold">
              {formatCurrency(15000)}
              <span className="text-lg font-normal">/month</span>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Everything in Basic</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Team collaboration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">API access</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Priority support</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Custom integrations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm">Advanced analytics</span>
              </li>
            </ul>
            <Button 
              className="w-full bg-purple-500 hover:bg-purple-600" 
              onClick={() => handleUpgrade('premium', 15000)}
              disabled={currentPlan === 'premium' || loading}
            >
              {currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Feature Comparison */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>
            See what's included in each plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">Free Trial</th>
                  <th className="text-center py-3 px-4">Basic</th>
                  <th className="text-center py-3 px-4">Premium</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3 px-4">Customers</td>
                  <td className="text-center py-3 px-4">Up to 10</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Products</td>
                  <td className="text-center py-3 px-4">Up to 5</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                  <td className="text-center py-3 px-4">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Advanced Reports</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Team Collaboration</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">API Access</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Priority Support</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">❌</td>
                  <td className="text-center py-3 px-4">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trust Indicators */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Secure Payments</h3>
                <p className="text-sm text-muted-foreground">
                  Protected by Paystack with bank-level security
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Headphones className="h-8 w-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">
                  Get help whenever you need it from our expert team
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <h3 className="font-semibold">Instant Activation</h3>
                <p className="text-sm text-muted-foreground">
                  Your plan activates immediately after payment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={closePaymentModal}
        plan={paymentModal.plan}
        amount={paymentModal.amount}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
};

export default SubscriptionUpgrade;

