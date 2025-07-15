import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ModernOverviewCards } from '../components/dashboard/ModernOverviewCards';
import { ModernQuickActions } from '../components/dashboard/ModernQuickActions';
import { ModernRecentActivities } from '../components/dashboard/ModernRecentActivities';
import { ModernChartsSection } from '../components/dashboard/ModernChartsSection';
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus';
import { UpgradeModal } from '../components/subscription/UpgradeModal';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { dashboardData, loading, error, refreshData } = useDashboard();
  const { user, isOwner, subscription, trialDaysLeft, isTrialActive, role } = useAuth();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  // Get current usage data from user
  const currentUsage = {
    invoices: user?.current_month_invoices || 0,
    expenses: user?.current_month_expenses || 0
  };

  // Create subscription object with trial days left
  const subscriptionData = subscription ? {
    ...subscription,
    trial_days_left: trialDaysLeft
  } : null;

  if (error && !dashboardData) {
    return (
      <DashboardLayout>
        <div className="p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                Unable to Load Dashboard
              </h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={refreshData} className="bg-red-600 hover:bg-red-700">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <DashboardHeader />

        <div className="p-4 space-y-6">
          {/* Subscription Status - Owner Only */}
          <SubscriptionStatus 
            subscription={subscriptionData}
            role={role}
            currentUsage={currentUsage}
            onUpgrade={handleUpgrade}
          />

          {/* Overview Cards */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Business Overview</h2>
            <ModernOverviewCards data={dashboardData} loading={loading} />
          </div>

          {/* Quick Actions */}
          <ModernQuickActions />

          {/* Charts Section */}
          <ModernChartsSection data={dashboardData} loading={loading} />

          {/* Recent Activities */}
          <ModernRecentActivities activities={dashboardData?.recent_activities} loading={loading} />

          {/* Refresh Status */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Auto-refreshes every 30 seconds</span>
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </DashboardLayout>
  );
};

export default Dashboard;