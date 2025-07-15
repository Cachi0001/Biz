import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ModernOverviewCards from '../components/dashboard/ModernOverviewCards';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileText, Users, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '../lib/utils';

const Dashboard = () => {
  const { user, isAuthenticated, role, subscription, businessName, isOwner, isFreeTrial, trialDaysLeft, canAccessFeature } = useAuth();
  const { dashboardData, loading, error, refreshData } = useDashboard();

  useEffect(() => {
    if (error) {
      console.error('Dashboard Error:', error);
    }
  }, [error]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

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
          <p className="text-gray-600">Access your SabiOps dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <DashboardHeader />

      {/* Main Dashboard Content */}
      <div className="p-4 space-y-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 min-h-screen">
        
        {/* Overview Cards */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <ModernOverviewCards data={dashboardData} loading={loading} />
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="h-16 flex-col bg-green-600 hover:bg-green-700">
              <Link to="/invoices">
                <FileText className="h-6 w-6 mb-1" />
                <span className="text-sm">New Invoice</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/products">
                <Package className="h-6 w-6 mb-1" />
                <span className="text-sm">Add Product</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/customers">
                <Users className="h-6 w-6 mb-1" />
                <span className="text-sm">New Customer</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-16 flex-col">
              <Link to="/sales">
                <TrendingUp className="h-6 w-6 mb-1" />
                <span className="text-sm">Record Sale</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
          <Card>
            <CardContent className="p-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardData?.recent_activities?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recent_activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No recent activities</p>
                  <p className="text-sm text-gray-400 mt-1">Start by creating an invoice or recording a sale</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Status for Trial Users */}
        {isFreeTrial && (
          <Card className="bg-gradient-to-r from-green-500 via-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Unlock Full Features</h3>
              <p className="text-green-100 mb-4">
                You have {trialDaysLeft} days left in your free trial
              </p>
              <p className="text-green-100 text-sm mb-4">
                Business: {businessName || 'Your Business'} | Role: {role}
              </p>
              <Button 
                className="bg-white text-green-600 hover:bg-green-50"
                onClick={() => window.location.href = '/subscription-upgrade'}
              >
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Owner-only features */}
        {isOwner && canAccessFeature('team_management') && (
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Team Management</h3>
              <p className="text-sm text-gray-600 mb-3">Manage your team members and their roles</p>
              <Button asChild variant="outline" size="sm">
                <Link to="/team">Manage Team</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;