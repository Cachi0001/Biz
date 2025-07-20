import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Crown, Check, X, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import PaystackService from '../services/PaystackService';

const SubscriptionUpgrade = () => {
  const { user, subscription, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const plans = [
    {
      id: 'weekly',
      name: 'Silver Weekly',
      price: 140000, // ₦1,400 in kobo for Paystack
      displayPrice: '₦1,400',
      period: '/week',
      trial: '7-day free trial',
      features: [
        '100 invoices per week',
        '100 expenses per week',
        'Advanced reporting',
        'Team management',
        'Priority support',
        'All other features unlimited'
      ],
      popular: true,
      color: 'green'
    },
    {
      id: 'monthly',
      name: 'Silver Monthly',
      price: 450000, // ₦4,500 in kobo
      displayPrice: '₦4,500',
      period: '/month',
      features: [
        '450 invoices per month',
        '450 expenses per month',
        'Advanced reporting',
        'Team management',
        'Priority support',
        'Referral earnings (10% for 3 months)',
        'All other features unlimited'
      ],
      color: 'blue'
    },
    {
      id: 'yearly',
      name: 'Silver Yearly',
      price: 5000000, // ₦50,000 in kobo
      displayPrice: '₦50,000',
      period: '/year',
      savings: 'Save ₦4,000 annually',
      features: [
        '6000 invoices per year',
        '6000 expenses per year',
        'Advanced reporting',
        'Team management',
        'Priority support',
        'Referral earnings (10% for 3 payments)',
        'All other features unlimited'
      ],
      color: 'purple'
    },
  ];

  const handleUpgrade = async (plan) => {
    if (!user?.email) {
      toast.error('User email not found. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);
    
    try {
      await PaystackService.processPayment(
        plan,
        user,
        // Success callback
        (result) => {
          console.log('Payment and subscription update successful:', result);
          toast.success(`Successfully upgraded to ${plan.name}!`);
          
          // Navigate back to dashboard after successful upgrade
          setTimeout(() => {
            navigate('/dashboard');
            window.location.reload();
          }, 1500);
        },
        // Error callback
        (error) => {
          console.error('Payment processing error:', error);
          toast.error(error.message || 'Payment processing failed. Please try again.');
          setLoading(false);
          setSelectedPlan(null);
        },
        // Cancel callback
        () => {
          console.log('Payment cancelled by user');
          toast.error('Payment was cancelled');
          setLoading(false);
          setSelectedPlan(null);
        }
      );
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error(error.message || 'Failed to initialize payment');
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-green-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Subscription Plans</h1>
                <p className="text-sm text-gray-600">Choose the perfect plan for your business</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-sm font-medium text-gray-700">SabiOps</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-yellow-500 mr-2" />
            <h2 className="text-3xl font-bold text-gray-900">Upgrade Your Business</h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Unlock powerful features to streamline your operations, boost productivity, and grow your business with SabiOps.
          </p>
        </div>

        {/* Current Plan Status */}
        {subscription && (
          <div className="max-w-md mx-auto mb-8">
            <Card className="bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300">
              <CardContent className="p-4 text-center">
                <h3 className="font-medium text-orange-900 mb-2">Current Plan</h3>
                <p className="text-sm text-orange-800">
                  {subscription.plan === 'free' || subscription.plan === 'basic' 
                    ? 'Basic Plan - Active' 
                    : `${subscription.plan} Plan - ${subscription.status}`}
                </p>
                {subscription.plan === 'free' && (
                  <div className="mt-2 text-xs text-orange-700">
                    <p>Invoices: {subscription.current_usage?.invoices || 0}/5 this month</p>
                    <p>Expenses: {subscription.current_usage?.expenses || 0}/5 this month</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'border-green-500 shadow-lg transform scale-105' 
                  : 'border-gray-200 hover:border-green-400'
              } ${selectedPlan === plan.id ? 'opacity-75' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {plan.displayPrice}
                  <span className="text-sm font-normal text-gray-500">
                    {plan.period}
                  </span>
                </div>
                {plan.trial && (
                  <div className="flex items-center justify-center text-blue-600">
                    <Crown className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{plan.trial}</span>
                  </div>
                )}
                {plan.savings && (
                  <div className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">
                    {plan.savings}
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button
                  className={`w-full text-white font-medium py-3 ${
                    plan.popular 
                      ? 'bg-green-600 hover:bg-green-700 shadow-lg' 
                      : 'bg-gray-600 hover:bg-gray-700'
                  } transition-all duration-200`}
                  onClick={() => handleUpgrade(plan)}
                  disabled={loading}
                >
                  {loading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to {plan.name}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security & Support Section */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <Shield className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-blue-900 mb-2">Secure Payment</h3>
                <p className="text-sm text-blue-700">
                  Your payment information is encrypted and secure. Powered by Paystack, Nigeria's leading payment processor.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <Crown className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900 mb-2">Premium Support</h3>
                <p className="text-sm text-green-700">
                  Get priority customer support and dedicated assistance to help your business succeed.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-center text-gray-900 mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">Can I cancel anytime?</h4>
                <p className="text-sm text-gray-600">
                  Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">What happens to my data if I downgrade?</h4>
                <p className="text-sm text-gray-600">
                  Your data is always safe. If you downgrade, you'll just have limited access to certain features, but all your data remains intact.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h4 className="font-medium text-gray-900 mb-2">Do you offer refunds?</h4>
                <p className="text-sm text-gray-600">
                  We offer a 7-day free trial for the weekly plan. For other plans, please contact our support team for refund requests.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUpgrade;