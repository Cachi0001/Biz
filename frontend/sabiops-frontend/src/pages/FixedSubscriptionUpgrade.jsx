import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';
import PaystackService from '../services/PaystackService';
import {
  Crown,
  Check,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Users,
  Calendar,
  CreditCard,
  ArrowRight,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

const FixedSubscriptionUpgrade = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch current subscription status
  const fetchSubscriptionStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await fetch('/api/subscription/unified-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data || data);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const plans = [
    {
      id: 'weekly',
      name: 'Silver Weekly',
      price: 1400,
      period: 'week',
      duration: '7 days',
      popular: true,
      features: [
        '100 invoices per week',
        '100 expenses per week',
        '250 sales per week',
        '100 products per week',
        'Advanced reporting',
        'Email support',
        'Real-time sync'
      ],
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'monthly',
      name: 'Silver Monthly',
      price: 4500,
      period: 'month',
      duration: '30 days',
      popular: false,
      features: [
        '450 invoices per month',
        '500 expenses per month',
        '1,500 sales per month',
        '500 products per month',
        '₦500 referral rewards',
        'Priority support',
        'Advanced analytics'
      ],
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'yearly',
      name: 'Silver Yearly',
      price: 50000,
      period: 'year',
      duration: '365 days',
      popular: false,
      features: [
        '6,000 invoices per year',
        '2,000 expenses per year',
        '18,000 sales per year',
        '2,000 products per year',
        '₦5,000 referral rewards',
        'Premium support',
        'Custom integrations'
      ],
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const handleUpgrade = async (plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan.id);

      // Initialize Paystack payment
      const paymentResult = await PaystackService.initializePayment({
        email: user.email,
        amount: plan.price * 100, // Convert to kobo
        plan: plan.id,
        metadata: {
          plan_id: plan.id,
          plan_name: plan.name,
          user_id: user.id,
          upgrade_type: subscriptionStatus?.is_trial ? 'trial_upgrade' : 'plan_upgrade'
        }
      });

      if (paymentResult.success) {
        // Payment successful, verify and update subscription
        const verificationResult = await PaystackService.verifyPayment(
          paymentResult.reference,
          plan.id
        );

        if (verificationResult.success) {
          // Show success message
          toast({
            title: "Upgrade Successful! 🎉",
            description: `Welcome to ${plan.name}! Your account has been upgraded with ${verificationResult.data?.extended_duration_days || 0} bonus days.`,
            variant: "success",
            duration: 5000
          });

          // Refresh user data to get updated subscription
          await refreshUser();
          
          // Wait a moment for data to propagate
          setTimeout(() => {
            // Navigate to dashboard with success state
            navigate('/dashboard', { 
              state: { 
                upgradeSuccess: true, 
                newPlan: plan.name,
                bonusDays: verificationResult.data?.extended_duration_days || 0
              } 
            });
          }, 1000);

        } else {
          throw new Error(verificationResult.message || 'Payment verification failed');
        }
      } else {
        throw new Error(paymentResult.message || 'Payment initialization failed');
      }

    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getCurrentPlanBenefit = (plan) => {
    if (!subscriptionStatus) return null;
    
    const remainingDays = subscriptionStatus.remaining_days || 0;
    const isTrialUser = subscriptionStatus.is_trial;
    
    if (isTrialUser && remainingDays > 0) {
      return {
        type: 'trial_bonus',
        days: remainingDays,
        message: `+${remainingDays} bonus days from your remaining trial`
      };
    }
    
    return null;
  };

  if (statusLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-gray-600">Loading subscription plans...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">Upgrade Your Plan</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your business needs. All plans include advanced features 
            and priority support to help your business grow.
          </p>
          
          {/* Current Status */}
          {subscriptionStatus && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Current: {subscriptionStatus.plan_config?.name || 'Free Plan'}
                </span>
                {subscriptionStatus.remaining_days > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {subscriptionStatus.remaining_days} days left
                  </Badge>
                )}
              </div>
              {subscriptionStatus.is_trial && (
                <p className="text-xs text-blue-600 mt-1">
                  Upgrade now to keep your remaining trial days as bonus!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const currentBenefit = getCurrentPlanBenefit(plan);
            const isCurrentPlan = subscriptionStatus?.subscription_plan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                  plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
                } ${isCurrentPlan ? 'opacity-60' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 text-sm font-medium">
                    <Star className="inline h-4 w-4 mr-1" />
                    Most Popular
                  </div>
                )}
                
                <CardHeader className={`${plan.popular ? 'pt-12' : 'pt-6'} pb-4`}>
                  <div className="text-center space-y-2">
                    <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                    <div className="space-y-1">
                      <div className="text-3xl font-bold text-gray-900">
                        ₦{plan.price.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500">/{plan.period}</span>
                      </div>
                      <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        <span>{plan.duration} access</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Features List */}
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Current Plan Benefit */}
                  {currentBenefit && !isCurrentPlan && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Bonus Included!
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        {currentBenefit.message}
                      </p>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading || isCurrentPlan}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                        : ''
                    }`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Current Plan
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Upgrade Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-center mb-4">Why Upgrade?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium">Scale Your Business</h4>
              <p className="text-sm text-gray-600">Handle more transactions and grow without limits</p>
            </div>
            <div className="text-center">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium">Team Collaboration</h4>
              <p className="text-sm text-gray-600">Add team members and work together efficiently</p>
            </div>
            <div className="text-center">
              <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h4 className="font-medium">Priority Support</h4>
              <p className="text-sm text-gray-600">Get help when you need it with dedicated support</p>
            </div>
          </div>
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center text-sm text-gray-500 max-w-2xl mx-auto">
          <p>
            All plans include a 30-day money-back guarantee. You can cancel or change your plan at any time.
            Need help choosing? <a href="mailto:support@sabiops.com" className="text-blue-500 hover:underline">Contact our team</a>.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FixedSubscriptionUpgrade;