import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Shield, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { initializePayment, verifyPayment, upgradeSubscription } from '../../services/api';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  plan, 
  amount, 
  onSuccess, 
  onError 
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, processing, success, error
  const [paymentReference, setPaymentReference] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Load Paystack script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.PaystackPop) return; // Already loaded
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      // Script loaded
    };
    script.onerror = () => {
      setErrorMessage('Failed to load Paystack payment script. Please check your connection and try again.');
    };
    document.body.appendChild(script);
    return () => {
      const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  const initializePaymentFlow = async () => {
    try {
      setLoading(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      // Ensure PaystackPop is loaded
      if (typeof window === 'undefined' || !window.PaystackPop) {
        setErrorMessage('Payment system is not ready. Please wait for the payment script to load and try again.');
        setPaymentStatus('error');
        setLoading(false);
        return;
      }

      // Initialize payment with backend
      const response = await initializePayment({
        amount: amount * 100, // Convert to kobo
        email: user.email,
        description: `Subscription upgrade to ${plan} plan`,
        callback_url: window.location.origin + '/payment/callback',
        metadata: {
          owner_id: user.id,
          plan: plan,
          upgrade_type: 'subscription'
        }
      });

      if (response.success && response.data.authorization_url) {
        setPaymentReference(response.data.reference);
        // Initialize Paystack popup
        const handler = window.PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
          email: user.email,
          amount: amount * 100,
          currency: 'NGN',
          ref: response.data.reference,
          metadata: {
            owner_id: user.id,
            plan: plan,
            upgrade_type: 'subscription'
          },
          callback: function(response) {
            handlePaymentSuccess(response);
          },
          onClose: function() {
            setLoading(false);
            setPaymentStatus('idle');
          }
        });
        handler.openIframe();
      } else {
        throw new Error(response.message || 'Failed to initialize payment');
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      setErrorMessage(error.message || 'Failed to initialize payment');
      setPaymentStatus('error');
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      setLoading(true);
      setPaymentStatus('processing');

      // Verify payment with backend
      const verificationResponse = await verifyPayment(response.reference);

      if (verificationResponse.success) {
        // Upgrade subscription
        const upgradeResponse = await upgradeSubscription({
          plan: plan,
          payment_reference: response.reference
        });

        if (upgradeResponse.success) {
          setPaymentStatus('success');

        setTimeout(() => {
            if (onSuccess) onSuccess(upgradeResponse);
          onClose();
        }, 2000);
        } else {
          throw new Error(upgradeResponse.message || 'Failed to upgrade subscription');
        }
      } else {
        throw new Error(verificationResponse.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setErrorMessage(error.message || 'Payment verification failed');
      setPaymentStatus('error');
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setPaymentStatus('idle');
    setPaymentReference(null);
    setErrorMessage('');
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getPlanFeatures = (planType) => {
    const features = {
      weekly: [
        '100 invoices per week',
        '100 expenses per week',
        '250 sales per week',
        '100 products per week',
        'Advanced reporting',
        'Team management',
        'Email support'
      ],
      monthly: [
        '450 invoices per month',
        '500 expenses per month',
        '1,500 sales per month',
        '500 products per month',
        'Advanced reporting',
        'Team management',
        'Team collaboration'
      ],
      yearly: [
        '6,000 invoices per year',
        '2,000 expenses per year',
        '18,000 sales per year',
        '2,000 products per year',
        'Advanced team management',
        'Custom integrations',
        'Advanced analytics',
        'API access'
      ]
    };
    return features[planType] || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {paymentStatus === 'success' ? 'Payment Successful!' : 
             paymentStatus === 'error' ? 'Payment Failed' : 
             `Upgrade to ${plan?.charAt(0).toUpperCase() + plan?.slice(1)} Plan`}
          </DialogTitle>
          <DialogDescription>
            {paymentStatus === 'success' ? 'Your subscription has been upgraded successfully.' :
             paymentStatus === 'error' ? 'There was an issue processing your payment.' :
             'Complete your subscription upgrade with secure payment.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {paymentStatus === 'idle' && (
            <>
              {/* Plan Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    {plan?.charAt(0).toUpperCase() + plan?.slice(1)} Plan
                    <Badge variant="default">{formatCurrency(amount)}/month</Badge>
                  </CardTitle>
                  <CardDescription>
                    Unlock all features and grow your business
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {getPlanFeatures(plan).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Payment Security */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Secured by Paystack. Your payment information is encrypted and secure.
              </div>

              {/* Payment Button */}
              <Button 
                onClick={initializePaymentFlow} 
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Initializing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay {formatCurrency(amount)}
                  </>
                )}
              </Button>
            </>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Processing Payment...</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your payment.
              </p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-700">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">
                Your subscription has been upgraded. You now have access to all {plan} features.
              </p>
              {paymentReference && (
                <p className="text-xs text-muted-foreground mt-2">
                  Reference: {paymentReference}
                </p>
              )}
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-8">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-red-700">Payment Failed</p>
              <p className="text-sm text-muted-foreground mb-4">
                {errorMessage || 'There was an issue processing your payment. Please try again.'}
              </p>
              <div className="space-y-2">
                <Button onClick={initializePaymentFlow} disabled={loading} className="w-full">
                  Try Again
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;

