import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Crown, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  CheckCircle, 
  X,
  ArrowRight,
  Clock,
  Target,
  Lightbulb,
  Star,
  Users,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePlanLimitEnforcement } from '../../hooks/usePlanLimitEnforcement';
import { toast } from 'react-hot-toast';

/**
 * Smart upgrade system that shows contextual upgrade prompts based on user behavior
 */
const SmartUpgradeSystem = ({ 
  className = '',
  showProactivePrompts = true,
  showBehaviorInsights = true
}) => {
  const { user, subscription } = useAuth();
  const { getSmartRecommendations, getEnforcementSummary } = usePlanLimitEnforcement();
  const navigate = useNavigate();
  
  const [recommendations, setRecommendations] = useState([]);
  const [enforcementSummary, setEnforcementSummary] = useState(null);
  const [dismissedPrompts, setDismissedPrompts] = useState(new Set());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Update recommendations and enforcement status
  useEffect(() => {
    if (user) {
      const updateData = () => {
        const recs = getSmartRecommendations();
        const summary = getEnforcementSummary();
        
        setRecommendations(recs);
        setEnforcementSummary(summary);
      };

      updateData();
      
      const interval = setInterval(updateData, 30000);
      return () => clearInterval(interval);
    }
  }, [user, getSmartRecommendations, getEnforcementSummary]);

  // Listen for upgrade prompt events
  useEffect(() => {
    const handleUpgradePrompt = (event) => {
      const { actionType, reason, usage } = event.detail;
      
      toast.error(`${actionType} limit reached!`, {
        duration: 5000,
        position: 'top-center',
        action: {
          label: 'Upgrade Now',
          onClick: () => setShowUpgradeModal(true)
        }
      });
    };

    window.addEventListener('show-upgrade-prompt', handleUpgradePrompt);
    return () => window.removeEventListener('show-upgrade-prompt', handleUpgradePrompt);
  }, []);

  if (!user || !subscription) return null;

  const handleUpgrade = (suggestedPlan = 'silver_weekly') => {
    navigate('/subscription-upgrade', { 
      state: { 
        suggestedPlan,
        source: 'smart_upgrade_system'
      }
    });
  };

  const handleDismissPrompt = (promptId) => {
    setDismissedPrompts(prev => new Set([...prev, promptId]));
  };

  const getPlanPrice = (plan) => {
    const prices = {
      silver_weekly: '₦2,500/week',
      silver_monthly: '₦8,500/month',
      silver_yearly: '₦85,000/year'
    };
    return prices[plan] || prices.silver_weekly;
  };

  const getPlanBenefits = (plan) => {
    const benefits = {
      silver_weekly: [
        '100 invoices & expenses per week',
        'Advanced analytics',
        'Email support',
        'Team collaboration'
      ],
      silver_monthly: [
        '450 invoices & expenses per month',
        'Advanced analytics',
        'Team collaboration',
        'Custom reports'
      ],
      silver_yearly: [
        'Unlimited invoices & expenses',
        'Advanced analytics',
        'Team collaboration',
        'Custom reports',
        'API access'
      ]
    };
    return benefits[plan] || benefits.silver_weekly;
  };

  const getRecommendationIcon = (type) => {
    switch (type) {
      case 'blocked_actions': return AlertTriangle;
      case 'high_usage': return TrendingUp;
      case 'efficiency': return Target;
      case 'savings': return Star;
      case 'behavior': return Lightbulb;
      default: return Zap;
    }
  };

  const getRecommendationColor = (priority) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'gray';
    }
  };

  // Filter out dismissed prompts
  const activeRecommendations = recommendations.filter(
    rec => !dismissedPrompts.has(`${rec.type}_${rec.priority}`)
  );

  // Show critical enforcement alerts
  const criticalAlerts = activeRecommendations.filter(rec => rec.priority === 'high');
  
  // Show proactive recommendations
  const proactiveRecs = activeRecommendations.filter(rec => rec.priority !== 'high');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Critical Enforcement Alerts */}
      {criticalAlerts.map((rec, index) => {
        const Icon = getRecommendationIcon(rec.type);
        const promptId = `${rec.type}_${rec.priority}`;
        
        return (
          <Alert key={promptId} className="border-red-300 bg-red-50">
            <Icon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium mb-1">{rec.reason}</p>
                  {rec.blockedActions && (
                    <p className="text-sm">
                      Blocked actions: {rec.blockedActions.join(', ')}
                    </p>
                  )}
                  <p className="text-sm mt-1">
                    Upgrade to {rec.suggestedPlan.replace('_', ' ')} for {getPlanPrice(rec.suggestedPlan)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => handleUpgrade(rec.suggestedPlan)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                    size="sm"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Now
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismissPrompt(promptId)}
                    className="text-red-600 hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
      })}

      {/* Proactive Upgrade Recommendations */}
      {showProactivePrompts && proactiveRecs.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-900 flex items-center space-x-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <span>Smart Recommendations</span>
              <Badge variant="outline" className="text-xs">
                AI-Powered
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {proactiveRecs.slice(0, 2).map((rec, index) => {
              const Icon = getRecommendationIcon(rec.type);
              const color = getRecommendationColor(rec.priority);
              const promptId = `${rec.type}_${rec.priority}`;
              
              return (
                <div key={promptId} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-5 w-5 text-${color}-600 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-${color}-600 border-${color}-300`}>
                          {rec.priority} priority
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDismissPrompt(promptId)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">{rec.reason}</p>
                      
                      {rec.benefits && (
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          {rec.benefits.slice(0, 4).map((benefit, i) => (
                            <div key={i} className="flex items-center space-x-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-gray-700">{benefit}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {rec.savings && (
                        <p className="text-xs text-green-600 font-medium mb-2">
                          💰 {rec.savings}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleUpgrade(rec.suggestedPlan)}
                          size="sm"
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Upgrade to {rec.suggestedPlan.replace('_', ' ')}
                        </Button>
                        <span className="text-xs text-gray-500">
                          {getPlanPrice(rec.suggestedPlan)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Behavior Insights */}
      {showBehaviorInsights && enforcementSummary && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-teal-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-900 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <span>Usage Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {enforcementSummary.invoices?.usage?.current || 0}
                </div>
                <div className="text-xs text-green-600">Invoices Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {enforcementSummary.expenses?.usage?.current || 0}
                </div>
                <div className="text-xs text-green-600">Expenses Used</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {enforcementSummary.totalBlocked}
                </div>
                <div className="text-xs text-green-600">Blocked Actions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">
                  {recommendations.length}
                </div>
                <div className="text-xs text-green-600">Recommendations</div>
              </div>
            </div>
            
            {enforcementSummary.hasWarnings && (
              <div className="mt-3 p-2 bg-orange-100 rounded-lg">
                <p className="text-xs text-orange-800">
                  ⚠️ You're approaching your plan limits. Consider upgrading to avoid interruptions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Recommendations State */}
      {activeRecommendations.length === 0 && subscription.plan !== 'free' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-green-800 font-medium">You're all set!</p>
            <p className="text-sm text-green-700">
              Your current plan meets your usage needs perfectly.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmartUpgradeSystem;