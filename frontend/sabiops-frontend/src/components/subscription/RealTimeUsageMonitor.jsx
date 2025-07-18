import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  FileText, 
  Receipt, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Crown,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useUsageTracking } from '../../hooks/useUsageTracking';
import IntelligentUpgradePrompt from './IntelligentUpgradePrompt';

const RealTimeUsageMonitor = ({ 
  showUpgradePrompts = true,
  compact = false,
  onUpgrade,
  className = ''
}) => {
  const { user, subscription } = useAuth();
  const { 
    usage, 
    loading, 
    getUsageStatus, 
    resetUsage,
    upgradePrompts,
    clearUpgradePrompts
  } = useUsageTracking();
  
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showDetails, setShowDetails] = useState(!compact);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000); // Update timestamp every 30 seconds

    return () => clearInterval(interval);
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

  const handleRefresh = () => {
    resetUsage();
    setLastUpdate(new Date());
  };

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>

        {/* Upgrade Prompts */}
        {showUpgradePrompts && (invoiceStatus.status !== 'normal' || expenseStatus.status !== 'normal') && (
          <IntelligentUpgradePrompt
            limitType={invoiceStatus.status !== 'normal' ? 'invoices' : 'expenses'}
            variant="alert"
            onUpgrade={onUpgrade}
          />
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <span>Usage Monitor</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Updated {formatTimeAgo(lastUpdate)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
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
                </p>
              </div>
              {subscription.plan === 'free' && (
                <Button
                  onClick={onUpgrade}
                  size="sm"
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Usage Metrics */}
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
                </>
              ) : (
                <div className="text-sm text-green-600 font-medium">
                  Unlimited invoices
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
                </>
              ) : (
                <div className="text-sm text-green-600 font-medium">
                  Unlimited expenses
                </div>
              )}
            </div>
          </div>

          {/* Real-time Status */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
            <span>Real-time monitoring active</span>
            <span>Next update in 30s</span>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Prompts */}
      {showUpgradePrompts && (
        <>
          {invoiceStatus.status !== 'normal' && (
            <IntelligentUpgradePrompt
              limitType="invoices"
              onUpgrade={onUpgrade}
            />
          )}
          {expenseStatus.status !== 'normal' && (
            <IntelligentUpgradePrompt
              limitType="expenses"
              onUpgrade={onUpgrade}
            />
          )}
        </>
      )}

      {/* Active Upgrade Prompts */}
      {upgradePrompts.length > 0 && (
        <div className="space-y-2">
          {upgradePrompts.map((prompt, index) => (
            <IntelligentUpgradePrompt
              key={index}
              limitType={prompt.actionType}
              variant="banner"
              onUpgrade={onUpgrade}
              onDismiss={() => clearUpgradePrompts()}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RealTimeUsageMonitor;