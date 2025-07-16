import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
import { ModernOverviewCards } from '../components/dashboard/ModernOverviewCards';
import { ModernQuickActions } from '../components/dashboard/ModernQuickActions';
import { ModernRecentActivities } from '../components/dashboard/ModernRecentActivities';
import { ModernChartsSection } from '../components/dashboard/ModernChartsSection';
import { SubscriptionStatus } from '../components/subscription/SubscriptionStatus';
import { UpgradeModal } from '../components/subscription/UpgradeModal';
import { ReferralSystem } from '../components/referrals/ReferralSystem';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GradientCardWrapper, GradientCardVariants } from '../components/ui/gradient-card-wrapper';

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
      {/* Header */}
      <DashboardHeader />

      {/* Main Dashboard Content */}
      <div className="p-4 space-y-6">
        {/* Subscription Status with Gradient Wrapper */}
        <GradientCardWrapper
          gradientFrom="from-green-100"
          gradientTo="to-green-200"
        >
          <SubscriptionStatus 
            subscription={subscriptionData}
            role={role}
            currentUsage={currentUsage}
            onUpgrade={handleUpgrade}
          />
        </GradientCardWrapper>

        {/* Overview Cards */}
        <ModernOverviewCards data={dashboardData} loading={loading} />

        {/* Charts Section */}
        <ModernChartsSection data={dashboardData} loading={loading} />

        {/* Quick Actions */}
        <ModernQuickActions />

        {/* Owner-only sections */}
        {role === 'Owner' && subscription?.plan !== 'free' && (
          <>
            {/* Referral System with Gradient Wrapper */}
            <GradientCardWrapper
              gradientFrom="from-green-200"
              gradientTo="to-teal-200"
            >
              <ReferralSystem />
            </GradientCardWrapper>
          </>
        )}

        {/* Recent Activities */}
        <ModernRecentActivities 
          activities={dashboardData?.recent_activities} 
          loading={loading}
        />

        {/* Bottom Upgrade Section for Free Plan */}
        {subscription?.plan === 'free' && (
          <div className="bg-gradient-to-r from-green-500 via-orange-500 to-red-500 p-6 rounded-2xl shadow-xl text-white overflow-hidden relative border-2 border-green-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-20 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-20 rounded-full -ml-12 -mb-12" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white bg-opacity-10 rounded-full" />
            <div className="relative">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2 text-shadow">
                  🚀 Unlock Full Features
                </h3>
                <p className="text-green-100 mb-4 font-medium">
                  You've used {currentUsage?.invoices || 3} of 5 invoices this month
                </p>
                <button 
                  className="bg-white text-green-600 hover:bg-green-50 px-8 py-3 rounded-xl font-bold shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-green-600"
                  onClick={handleUpgrade}
                >
                  Upgrade Now 🎯
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Status */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-500 flex items-center justify-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Auto-refreshes every 30 seconds</span>
          </p>
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