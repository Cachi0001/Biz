import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Activity, 
  FileText, 
  Receipt, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Crown,
  RefreshCw,
  Zap,
  Target,
  Clock,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import IntelligentUpgradePrompt from './IntelligentUpgradePrompt';
import TeamMemberAccessStatus from './TeamMemberAccessStatus';
import { toast } from 'react-hot-toast';

/**
 * Comprehensive real-time plan monitoring component
 * Handles usage tracking, limit enforcement, and intelligent upgrade prompts
 */
const RealTimePlanMonitor = ({ 
  showUpgradePrompts = true,
  showTeamStatus = true,
  compact = false,
  onUpgrade,
  className = ''
}) => {
  const { user, subscription, role, isOwner } = useAuth();
  const { 
    usage, 
    loading, 
    getUsageStatus, 
    getUpgradeRecommendations,
    validateAction,
    upgradePrompts,
    clearUpgradePrompts
  } = useUsageTracking();
  
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [recommendations, setRecommendations] = useState([]);
  const [showIntelligentPrompts, setShowIntelligentPrompts] = useState(false);
  const [behaviorInsights, setBehaviorInsights] = useState(null);

  // Update recommendations periodically
  useEffect(() => {
    if (user) {
      const updateRecommendations = () => {
        const recs = getUpgradeRecommendations();
        setRecommendations(recs);
        
        // Show intelligent prompts for high priority recommendations
        const highPriorityRecs = recs.filter(r => r.priority === 'high');
        if (highPriorityRecs.length > 0 && !showIntelligentPrompts) {
          setShowIntelligentPrompts(true);
        }
      };

      updateRecommendations();
      
      const interval = setInterval(() => {
        updateRecommendations();
        setLastUpdate(new Date());
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, getUpgradeRecommendations, showIntelligentPrompts]);

  // Listen for real-time usage events
  useEffect(() => {
    const handleUsageEvent = (event) => {
      if (event.type === 'limit_enforced') {
        toast.error(`${event.data.actionType} limit reached! Upgrade to continue.`, {
          duration: 5000,
          position: 'top-center'
        });
      } else if (event.type === 'behavior_recommendations') {
        setBehaviorInsights(event.data);
      } else if (event.type === 'proactive_upgrade_prompt') {
        toast(`💡 ${event.data.message}`, {
          duration: 4000,
          position: 'top-right'
        });
      }
    };

    // This would typically be connected to a real-time service
    window.addEventListener('usage-tracking-event', handleUsageEvent);
    
    return () => {
      window.removeEventListener('usage-tracking-event', handleUsageEvent);
    };
  }, []);

  if (!user || !subscription) return null;

  const invoiceStatus = getUsageStatus('invoices');
  const expenseStatus = getUsageStatus('expenses');

  const getStatusColor = (status) => {
    switch (status) {
      case 'exceeded': return 'destructive';
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'exceeded': return AlertCircle;
      case 'critical': return AlertCircle;
      case 'warning': return TrendingUp;
      default: return CheckCircle;
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
  };

  const handleActionAttempt = (actionType) => {
    const validation = validateAction(actionType);
    
    if (!validation.allowed) {
      toast.error(`Cannot create ${actionType}. You've reached your limit.`, {
        duration: 3000
      });
      setShowIntelligentPrompts(true);
      return false;
    }
    
    return true;
  };

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Team Member Status */}
        {showTeamStatus && !isOwner && (
          <TeamMemberAccessStatus />
        )}

        {/* Compact Usage Display */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">
                {invoiceStatus.current}/{invoiceStatus.isUnlimited ? '∞' : invoiceStatus.limit}
              </span>
              <Badge variant={getStatusColor(invoiceStatus.status)} className="text-xs">
                {invoiceStatus.status}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {expenseStatus.current}/{expenseStatus.isUnlimited ? '∞' : expenseStatus.limit}
              </span>
              <Badge variant={getStatusColor(expenseStatus.status)} className="text-xs">
                {expenseStatus.status}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(lastUpdate)}
            </span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Real-time monitoring active" />
          </div>
        </div>

        {/* Critical Alerts */}
        {(invoiceStatus.status === 'exceeded' || expenseStatus.status === 'exceeded') && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Limit reached! Upgrade to continue.
                </span>
                <Button
                  onClick={handleUpgrade}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Upgrade
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Intelligent Upgrade Prompts */}
        {showUpgradePrompts && showIntelligentPrompts && recommendations.length > 0 && (
          <IntelligentUpgradePrompt
            limitType={recommendations[0].type}
            variant="alert"
            onUpgrade={handleUpgrade}
            onDismiss={() => setShowIntelligentPrompts(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Team Member Status */}
      {showTeamStatus && !isOwner && (
        <TeamMemberAccessStatus />
      )}

      {/* Main Usage Monitor Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Real-time Usage Monitor</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Updated {formatTimeAgo(lastUpdate)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLastUpdate(new Date())}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Plan Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {subscription.plan.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Plan
                </h4>
                <p className="text-sm text-gray-600">
                  {subscription.status === 'trial' ? 'Trial Active' : 'Active'}
                  {subscription.trial_days_left > 0 && (
                    <span className="ml-2 text-orange-600">
                      ({subscription.trial_days_left} days left)
                    </span>
                  )}
                </p>
              </div>
              {subscription.plan === 'free' && (
                <Button
                  onClick={handleUpgrade}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Usage Metrics with Real-time Enforcement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoices Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Invoices</span>
                </div>
                <Badge variant={getStatusColor(invoiceStatus.status)}>
                  {invoiceStatus.status}
                </Badge>
              </div>
              
              {!invoiceStatus.isUnlimited ? (
                <>
                  <Progress 
                    value={invoiceStatus.percentage} 
                    className="h-2"
                    indicatorClassName={
                      invoiceStatus.status === 'exceeded' || invoiceStatus.status === 'critical' 
                        ? 'bg-red-500' 
                        : invoiceStatus.status === 'warning' 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{invoiceStatus.current} used</span>
                    <span>{invoiceStatus.remaining} remaining</span>
                  </div>
                  
                  {/* Action Test Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionAttempt('invoices')}
                    disabled={invoiceStatus.status === 'exceeded'}
                    className="w-full mt-2"
                  >
                    {invoiceStatus.status === 'exceeded' ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Limit Reached
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Invoice Creation
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Unlimited invoices
                </div>
              )}
            </div>

            {/* Expenses Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Expenses</span>
                </div>
                <Badge variant={getStatusColor(expenseStatus.status)}>
                  {expenseStatus.status}
                </Badge>
              </div>
              
              {!expenseStatus.isUnlimited ? (
                <>
                  <Progress 
                    value={expenseStatus.percentage} 
                    className="h-2"
                    indicatorClassName={
                      expenseStatus.status === 'exceeded' || expenseStatus.status === 'critical' 
                        ? 'bg-red-500' 
                        : expenseStatus.status === 'warning' 
                        ? 'bg-orange-500' 
                        : 'bg-green-500'
                    }
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{expenseStatus.current} used</span>
                    <span>{expenseStatus.remaining} remaining</span>
                  </div>
                  
                  {/* Action Test Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleActionAttempt('expenses')}
                    disabled={expenseStatus.status === 'exceeded'}
                    className="w-full mt-2"
                  >
                    {expenseStatus.status === 'exceeded' ? (
                      <>
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Limit Reached
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Test Expense Creation
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-sm text-green-600 font-medium">
                  ✅ Unlimited expenses
                </div>
              )}
            </div>
          </div>

          {/* Behavior Insights */}
          {behaviorInsights && behaviorInsights.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">Smart Insights</span>
              </div>
              {behaviorInsights.slice(0, 2).map((insight, index) => (
                <p key={index} className="text-sm text-blue-800 mb-1">
                  💡 {insight.message}
                </p>
              ))}
            </div>
          )}

          {/* Real-time Status */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Real-time monitoring active</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Next update in 30s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Intelligent Upgrade Prompts */}
      {showUpgradePrompts && (
        <>
          {/* High Priority Recommendations */}
          {recommendations.filter(r => r.priority === 'high').map((rec, index) => (
            <IntelligentUpgradePrompt
              key={`high-${index}`}
              limitType={rec.type}
              variant="card"
              onUpgrade={handleUpgrade}
            />
          ))}
          
          {/* Show intelligent prompts when triggered */}
          {showIntelligentPrompts && recommendations.length > 0 && (
            <IntelligentUpgradePrompt
              limitType={recommendations[0].type}
              variant="card"
              onUpgrade={handleUpgrade}
              onDismiss={() => setShowIntelligentPrompts(false)}
            />
          )}
        </>
      )}

      {/* Active Upgrade Prompts from Service */}
      {upgradePrompts.length > 0 && (
        <div className="space-y-2">
          {upgradePrompts.slice(-2).map((prompt, index) => (
            <Alert key={index} className="border-blue-300 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{prompt.message}</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={handleUpgrade}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Crown className="h-4 w-4 mr-1" />
                      Upgrade
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearUpgradePrompts}
                      className="text-blue-600"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealTimePlanMonitor;