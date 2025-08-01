import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Crown, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import PaystackService from '../../services/PaystackService';

const UpgradeModal = ({ isOpen, onClose }) => {
  const { user, subscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'weekly',
      name: 'Silver Weekly',
      price: 140000, // ₦1,400 in kobo for Paystack
      displayPrice: '₦1,400',
      period: '/week',
      features: [
        'Advanced analytics',
        'Team collaboration',
        'API access',
        'Custom branding'
      ],
      popular: true,
    },
    {
      id: 'monthly',
      name: 'Silver Monthly',
      price: 450000, // ₦4,500 in kobo
      displayPrice: '₦4,500',
      period: '/month',
      features: [
        'Advanced analytics',
        'Team collaboration',
        'API access',
        'Custom branding'
      ],
    },
    {
      id: 'yearly',
      name: 'Silver Yearly',
      price: 5000000, // ₦50,000 in kobo
      displayPrice: '₦50,000',
      period: '/year',
      savings: 'Save ₦4,000 annually',
      features: [
        'Advanced analytics',
        'Team collaboration',
        'API access',
        'Custom branding'
      ],
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
          
          // Close modal and refresh to update subscription status
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 1000);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto border-green-200 bg-white rounded-lg sm:rounded-xl">
        <CardHeader className="text-center border-b border-green-100 bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-bold text-green-900 flex items-center">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              <span className="hidden sm:inline">Choose Your Plan</span>
              <span className="sm:hidden">Plans</span>
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              disabled={loading}
              className="hover:bg-green-100 p-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-green-600 mt-2 text-sm sm:text-base">
            Unlock all features and grow your business with SabiOps
          </p>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border-2 transition-all duration-200 ${
                  plan.popular 
                    ? 'border-green-500 shadow-lg scale-105' 
                    : 'border-green-200 hover:border-green-400'
                } ${selectedPlan === plan.id ? 'opacity-75' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <CardHeader className="text-center pb-3 sm:pb-4 p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg font-bold text-green-900">
                    {plan.name}
                  </CardTitle>
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {plan.displayPrice}
                    <span className="text-xs sm:text-sm font-normal text-green-500">
                      {plan.period}
                    </span>
                  </div>
                  {plan.trial && (
                    <div className="flex items-center justify-center text-blue-600 mt-2">
                      <Crown className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">{plan.trial}</span>
                    </div>
                  )}
                  {plan.savings && !plan.trial && (
                    <div className="text-green-600 text-sm font-medium mt-2">
                      {plan.savings}
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-green-800">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button
                    className={`w-full text-white font-medium ${
                      plan.popular 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Current Usage Display */}
          {subscription?.plan === 'free' && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-2">Current Usage</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-orange-700">Invoices: </span>
                  <span className="font-medium text-orange-800">
                    {subscription.current_usage?.invoices || 0}/5 this month
                  </span>
                </div>
                <div>
                  <span className="text-orange-700">Expenses: </span>
                  <span className="font-medium text-orange-800">
                    {subscription.current_usage?.expenses || 0}/5 this month
                  </span>
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-2">
                Upgrade to remove these limits and unlock unlimited features
              </p>
            </div>
          )}

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-700 text-center">
              🔒 Secure payment powered by Paystack. Your payment information is encrypted and secure.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { UpgradeModal };
export default UpgradeModal;