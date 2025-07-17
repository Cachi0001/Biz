import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ModernChartsSection from '../components/dashboard/ModernChartsSection';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart3, TrendingUp, Crown, Lock } from 'lucide-react';
import { formatCurrency } from '../lib/utils/index.js';

const Analytics = () => {
  const { user, isAuthenticated, isFreeTrial, canAccessFeature } = useAuth();
  const { dashboardData, loading, error } = useDashboard();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Please Login
          </h1>
          <p className="text-gray-600">Access your SabiOps analytics</p>
        </div>
      </div>
    );
  }

  // Trial users get FULL access (they're experiencing the weekly plan)
  // Only show limitations for expired or non-trial users
  if (!canAccessFeature('analytics')) {
    return (
      <DashboardLayout>
        <div className="p-4 space-y-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 min-h-screen">
          {/* Upgrade Notice for Non-Trial Users */}
          <Card className="bg-gradient-to-r from-orange-100 via-yellow-100 to-red-100 border-orange-300 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-orange-500 rounded-full">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-orange-900 mb-2">Advanced Analytics</h2>
              <p className="text-orange-800 mb-4">
                Subscribe to access detailed business insights and advanced reporting.
              </p>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => window.location.href = '/subscription-upgrade'}
              >
                <Crown className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 space-y-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 min-h-screen">

        {/* Analytics Header */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Business Analytics</h1>
                <p className="text-blue-100">Comprehensive insights into your business performance</p>
              </div>
              <BarChart3 className="h-12 w-12 text-white opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-900">
                {formatCurrency(dashboardData?.revenue?.total || 0)}
              </p>
              <p className="text-sm text-green-700 font-medium">Total Revenue</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-900">
                {dashboardData?.customers?.total || 0}
              </p>
              <p className="text-sm text-blue-700 font-medium">Total Customers</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Detailed Analytics</h2>
          <ModernChartsSection data={dashboardData} loading={loading} />
        </div>

        {/* Performance Summary */}
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Monthly Growth</span>
                <span className="text-sm font-bold text-green-600">+12.5%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Customer Retention</span>
                <span className="text-sm font-bold text-blue-600">87%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-700">Average Order Value</span>
                <span className="text-sm font-bold text-purple-600">₦15,750</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;