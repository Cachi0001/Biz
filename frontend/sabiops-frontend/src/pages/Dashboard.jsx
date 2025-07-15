import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ModernOverviewCards from '../components/dashboard/ModernOverviewCards';
import ModernChartsSection from '../components/dashboard/ModernChartsSection';
import ModernQuickActions from '../components/dashboard/ModernQuickActions';
import ModernRecentActivities from '../components/dashboard/ModernRecentActivities';
import TeamManagement from '../components/team/TeamManagement';
import ReferralWidget from '../components/referrals/ReferralWidget';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Plus, FileText, Users, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDateTime } from '../lib/utils/index.js';

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

        {/* Charts Section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
          <ModernChartsSection data={dashboardData} loading={loading} />
        </div>

        {/* Quick Actions */}
        <ModernQuickActions />

        {/* Recent Activities */}
        <ModernRecentActivities 
          activities={dashboardData?.recent_activities} 
          loading={loading} 
        />

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

        {/* Owner-only Team Management */}
        {isOwner && canAccessFeature('team_management') && (
          <TeamManagement data={dashboardData?.team} loading={loading} />
        )}

        {/* Owner-only Referral System */}
        {isOwner && canAccessFeature('referrals') && (
          <ReferralWidget 
            referralData={dashboardData?.referrals} 
            loading={loading}
            onWithdraw={() => alert('Withdrawal feature coming soon!')}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;