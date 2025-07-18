import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, FileText, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ErrorBoundary from '../ErrorBoundary';

/**
 * Safe wrapper for RealTimePlanMonitor that handles errors gracefully
 */
const SafeRealTimePlanMonitor = ({ className = '', compact = false }) => {
  const { user, subscription } = useAuth();

  if (!user || !subscription) {
    return null;
  }

  // Simple fallback display
  const renderSimpleMonitor = () => (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <span>Usage Monitor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">
                {subscription.plan?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Basic'} Plan
              </h4>
              <p className="text-sm text-gray-600">
                {subscription.status === 'trial' ? 'Trial Active' : 'Active'}
              </p>
            </div>
            <Badge variant="default">
              {subscription.status || 'Active'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Invoices</span>
            </div>
            <div className="text-sm text-gray-600">
              Usage tracking available
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <span className="font-medium">Expenses</span>
            </div>
            <div className="text-sm text-gray-600">
              Usage tracking available
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Invoices</span>
            </div>
            <div className="flex items-center space-x-2">
              <Receipt className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Expenses</span>
            </div>
          </div>
          <Badge variant="default">
            {subscription.plan || 'Basic'}
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackMessage="Plan monitor temporarily unavailable">
      {renderSimpleMonitor()}
    </ErrorBoundary>
  );
};

export default SafeRealTimePlanMonitor;