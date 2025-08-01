import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  Crown,
  Check,
  Star,
  Zap,
  Shield,
  Calendar,
  CreditCard,
  ArrowRight,
  CheckCircle,
  FileText,
  Receipt,
  TrendingUp,
  Package
} from 'lucide-react';

/**
 * Comprehensive Subscription Cards showing all feature limits
 * Used in both Settings page and Subscription Upgrade page
 */
const ComprehensiveSubscriptionCards = ({ 
  currentPlan = 'free', 
  showUpgradeButtons = true,
  layout = 'grid', // 'grid' or 'horizontal'
  className = ""
}) => {
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: 0,
      period: 'forever',
      duration: 'Forever',
      popular: false,
      isFree: true,
      description: 'Perfect for getting started',
      features: [
        { icon: FileText, text: '5 invoices per month', highlight: true },
        { icon: Receipt, text: '20 expenses per month', highlight: true },
        { icon: TrendingUp, text: '50 sales per month', highlight: true },
        { icon: Package, text: '20 products per month', highlight: true },
        { icon: Shield, text: 'Basic reporting' },
        { icon: Check, text: 'Community support' },
        { icon: Check, text: 'Email notifications' },
        { icon: Check, text: 'Mobile access' }
      ],
      color: 'from-gray-400 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-300'
    },
    {
      id: 'weekly',
      name: 'Silver Weekly',
      price: 1400,
      period: 'week',
      duration: '7 days',
      popular: true,
      trial: true,
      description: 'Great for small businesses',
      features: [
        { icon: FileText, text: '100 invoices per week', highlight: true },
        { icon: Receipt, text: '100 expenses per week', highlight: true },
        { icon: TrendingUp, text: '250 sales per week', highlight: true },
        { icon: Package, text: '100 products per week', highlight: true },
        { icon: Shield, text: 'Advanced reporting' },
        { icon: Check, text: 'Email support' },
        { icon: Check, text: 'Real-time sync' },
        { icon: Check, text: 'Priority notifications' },
        { icon: Zap, text: '7-day free trial', special: true }
      ],
      color: 'from-blue-500 to-purple-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-400'
    },
    {
      id: 'monthly',
      name: 'Silver Monthly',
      price: 4500,
      period: 'month',
      duration: '30 days',
      popular: false,
      mostChosen: true,
      description: 'Most popular choice',
      features: [
        { icon: FileText, text: '450 invoices per month', highlight: true },
        { icon: Receipt, text: '500 expenses per month', highlight: true },
        { icon: TrendingUp, text: '1,500 sales per month', highlight: true },
        { icon: Package, text: '500 products per month', highlight: true },
        { icon: Shield, text: 'Advanced analytics' },
        { icon: Check, text: 'Team collaboration' },
        { icon: Check, text: 'Export capabilities' },
        { icon: Crown, text: '₦500 referral rewards', special: true }
      ],
      color: 'from-green-500 to-teal-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-400'
    },
    {
      id: 'yearly',
      name: 'Silver Yearly',
      price: 50000,
      period: 'year',
      duration: '365 days',
      popular: false,
      bestValue: true,
      description: 'Best value for growing businesses',
      features: [
        { icon: FileText, text: '6,000 invoices per year', highlight: true },
        { icon: Receipt, text: '2,000 expenses per year', highlight: true },
        { icon: TrendingUp, text: '18,000 sales per year', highlight: true },
        { icon: Package, text: '2,000 products per year', highlight: true },
        { icon: Shield, text: 'Premium analytics' },
        { icon: Check, text: 'Custom integrations' },
        { icon: Check, text: 'API access' },
        { icon: Check, text: 'White-label options' },
        { icon: Crown, text: '₦5,000 referral rewards', special: true }
      ],
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-400'
    }
  ];

  const handleUpgrade = (planId) => {
    if (planId === 'free') return;
    navigate('/subscription-upgrade');
  };

  const isCurrentPlan = (planId) => currentPlan === planId;

  const getBadgeText = (plan) => {
    if (plan.popular) return { text: 'Most Popular', color: 'bg-blue-500' };
    if (plan.bestValue) return { text: 'Best Value', color: 'bg-purple-500' };
    if (plan.mostChosen) return { text: 'Most Chosen', color: 'bg-green-500' };
    if (plan.trial) return { text: 'Free Trial', color: 'bg-orange-500' };
    return null;
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Free';
    return `₦${price.toLocaleString()}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Choose Your Plan</h3>
        <p className="text-gray-600">
          All plans include core business management features with different usage limits
        </p>
      </div>

      {/* Plans Grid */}
      <div className={`grid gap-6 ${
        layout === 'horizontal' 
          ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      }`}>
        {plans.map((plan) => {
          const badge = getBadgeText(plan);
          const isCurrent = isCurrentPlan(plan.id);
          
          return (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
                plan.popular || plan.bestValue ? 'ring-2 ring-offset-2' : ''
              } ${plan.popular ? 'ring-blue-500' : ''} ${
                plan.bestValue ? 'ring-purple-500' : ''
              } ${plan.isFree ? plan.borderColor : ''} ${
                isCurrent ? 'opacity-75' : ''
              } ${plan.bgColor || 'bg-white'}`}
            >
              {/* Badge */}
              {badge && (
                <div className={`absolute top-0 left-0 right-0 ${badge.color} text-white text-center py-2 text-sm font-medium`}>
                  <Star className="inline h-4 w-4 mr-1" />
                  {badge.text}
                </div>
              )}
              
              <CardHeader className={`${badge ? 'pt-12' : 'pt-6'} pb-4`}>
                <div className="text-center space-y-3">
                  <CardTitle className={`text-xl font-bold ${
                    plan.isFree ? 'text-gray-700' : 'text-gray-900'
                  }`}>
                    {plan.name}
                  </CardTitle>
                  
                  <div className="space-y-1">
                    <div className={`text-3xl font-bold ${
                      plan.isFree ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {formatPrice(plan.price)}
                      {!plan.isFree && (
                        <span className="text-sm font-normal text-gray-500">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span>{plan.duration} access</span>
                    </div>
                    
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features List */}
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => {
                    const IconComponent = feature.icon;
                    return (
                      <li key={index} className="flex items-center space-x-3 text-sm">
                        <IconComponent className={`h-4 w-4 flex-shrink-0 ${
                          feature.highlight ? 'text-blue-600' : 
                          feature.special ? 'text-yellow-600' : 
                          'text-green-500'
                        }`} />
                        <span className={`${
                          feature.highlight ? 'font-medium text-gray-900' : 
                          feature.special ? 'font-medium text-yellow-700' :
                          'text-gray-700'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                {/* Action Button */}
                {showUpgradeButtons && (
                  <div className="pt-4">
                    {isCurrent ? (
                      <Button
                        disabled
                        className="w-full"
                        variant="outline"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : plan.isFree ? (
                      <Button
                        disabled
                        className="w-full"
                        variant="outline"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Free Forever
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpgrade(plan.id)}
                        className={`w-full ${
                          plan.popular 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700' 
                            : plan.bestValue
                            ? 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700'
                            : ''
                        }`}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Upgrade Now
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feature Comparison Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-center mb-4">Feature Limits Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Feature</th>
                <th className="text-center py-2">Free</th>
                <th className="text-center py-2">Weekly</th>
                <th className="text-center py-2">Monthly</th>
                <th className="text-center py-2">Yearly</th>
              </tr>
            </thead>
            <tbody className="space-y-2">
              <tr className="border-b">
                <td className="py-2 font-medium">Invoices</td>
                <td className="text-center py-2">5/month</td>
                <td className="text-center py-2">100/week</td>
                <td className="text-center py-2">450/month</td>
                <td className="text-center py-2">6,000/year</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Expenses</td>
                <td className="text-center py-2">20/month</td>
                <td className="text-center py-2">100/week</td>
                <td className="text-center py-2">500/month</td>
                <td className="text-center py-2">2,000/year</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Sales</td>
                <td className="text-center py-2">50/month</td>
                <td className="text-center py-2">250/week</td>
                <td className="text-center py-2">1,500/month</td>
                <td className="text-center py-2">18,000/year</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium">Products</td>
                <td className="text-center py-2">20/month</td>
                <td className="text-center py-2">100/week</td>
                <td className="text-center py-2">500/month</td>
                <td className="text-center py-2">2,000/year</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Benefits */}
      <div className="text-center text-sm text-gray-500 space-y-2">
        <p>
          All paid plans include: Advanced reporting, Team collaboration, Real-time sync, Email support
        </p>
        <p>
          Need help choosing? <a href="mailto:support@sabiops.com" className="text-blue-500 hover:underline">Contact our team</a>
        </p>
      </div>
    </div>
  );
};

export default ComprehensiveSubscriptionCards;