import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ModernOverviewCards } from '../components/dashboard/ModernOverviewCards';
import ModernQuickActions from '../components/dashboard/ModernQuickActions';
import { ModernRecentActivities } from '../components/dashboard/ModernRecentActivities';

import UnifiedSubscriptionStatus from '../components/subscription/UnifiedSubscriptionStatus';
import AccurateUsageCards from '../components/dashboard/AccurateUsageCards';
import { UpgradeModal } from '../components/subscription/UpgradeModal';
import { ReferralSystem } from '../components/referrals/ReferralSystem';
import UsageLimitPrompt from '../components/subscription/UsageLimitPrompt';
import RealTimeUsageMonitor from '../components/subscription/RealTimeUsageMonitor';
import IntelligentUpgradePrompt from '../components/subscription/IntelligentUpgradePrompt';
// import { TeamMemberAccessStatus } from '../components/subscription/PlanLimitEnforcement';
import SafeRealTimePlanMonitor from '../components/subscription/SafeRealTimePlanMonitor';
import SafeSmartUpgradeSystem from '../components/subscription/SafeSmartUpgradeSystem';
import { useUsageTracking } from '../hooks/useUsageTracking';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertTriangle, Clock, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GradientCardWrapper } from '../components/ui/gradient-card-wrapper';
import ErrorBoundary from '../components/ErrorBoundary';
import dataFlowDebugger from '../utils/dataFlowDebugger';
import SearchDropdown from '../components/SearchDropdown';

const Dashboard = () => {
  const { dashboardData, loading, error, refreshData, lastRefresh } = useDashboard();
  const { user, subscription, trialDaysLeft, role, getUpgradeRecommendations } = useAuth();
  const { usage, invoiceStatus, expenseStatus, upgradePrompts, clearUpgradePrompts } = useUsageTracking();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showIntelligentPrompt, setShowIntelligentPrompt] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = React.useRef(null);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshData]);

  // Initialize data flow debugger in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      dataFlowDebugger.startListening();
      return () => dataFlowDebugger.stopListening();
    }
  }, []);

  // Listen for sales updates from other pages
  useEffect(() => {
    const handleSalesUpdate = (event) => {
      console.log('[Dashboard] Sales updated, refreshing dashboard data...', event.detail);
      refreshData(true); // Force cache invalidation
    };

    const handleDataUpdate = (event) => {
      console.log('[Dashboard] Data updated, refreshing dashboard...', event.detail);
      refreshData(true); // Force cache invalidation
    };

    // Listen for various data update events
    window.addEventListener('salesUpdated', handleSalesUpdate);
    window.addEventListener('expenseUpdated', handleDataUpdate);
    window.addEventListener('invoiceUpdated', handleDataUpdate);
    window.addEventListener('customerUpdated', handleDataUpdate);
    window.addEventListener('productUpdated', handleDataUpdate);
    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('salesUpdated', handleSalesUpdate);
      window.removeEventListener('expenseUpdated', handleDataUpdate);
      window.removeEventListener('invoiceUpdated', handleDataUpdate);
      window.removeEventListener('customerUpdated', handleDataUpdate);
      window.removeEventListener('productUpdated', handleDataUpdate);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [refreshData]);

  // Show intelligent upgrade prompt based on usage patterns
  useEffect(() => {
    if (user && subscription?.plan === 'free') {
      const recommendations = getUpgradeRecommendations();
      const hasHighPriorityRecs = recommendations.some(r => r.priority === 'high');
      
      if (hasHighPriorityRecs && !showIntelligentPrompt) {
        // Show intelligent prompt after a short delay
        const timer = setTimeout(() => {
          setShowIntelligentPrompt(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, subscription, getUpgradeRecommendations, showIntelligentPrompt]);

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  // Handler for search input
  const handleSearchInput = (e) => {
    setSearchQuery(e.target.value);
    setSearchOpen(!!e.target.value);
  };

  // Handler to close dropdown
  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    if (searchInputRef.current) searchInputRef.current.blur();
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

  // Helper: Should show upgrade prompt if subscription is about to expire (<= 3 days left)
  const shouldShowUpgradePrompt = subscription && subscription.plan !== 'free' && subscription.trial_days_left !== undefined && subscription.trial_days_left <= 3 && subscription.trial_days_left > 0;

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
      {/* Main Dashboard Content with Enhanced Mobile Responsiveness */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl">
        {/* Remove duplicate Global Search Bar here */}
        <div className="space-y-4 sm:space-y-6">
          {/* Real-time Plan Monitoring System */}
          <section className="w-full">
            <SafeRealTimePlanMonitor 
              compact={true}
              showUpgradePrompts={true}
              showTeamStatus={true}
              onUpgrade={handleUpgrade}
            />
          </section>

          {/* Smart Upgrade System */}
          <section className="w-full">
            <SafeSmartUpgradeSystem 
              showProactivePrompts={subscription?.plan === 'free'}
              showBehaviorInsights={true}
            />
          </section>

          {/* Unified Subscription Status Section */}
          <section className="w-full">
            <UnifiedSubscriptionStatus onUpgrade={handleUpgrade} />
          </section>



          {/* Overview Cards Section */}
          <section className="w-full">
            <ModernOverviewCards data={dashboardData} loading={loading} />
          </section>

          {/* Accurate Usage Cards Section */}
          <section className="w-full">
            <AccurateUsageCards />
          </section>

          {/* Quick Actions Section - Prominent and Balanced */}
          <section className="w-full">
            <ModernQuickActions />
          </section>

          {/* Main Content Grid - Mobile: 1 column, Desktop: 2 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Recent Activities */}              <section>
                <ModernRecentActivities 
                  activities={dashboardData?.recent_activities} 
                  loading={loading}
                />
              </section>

              {/* Analytics Preview Card - Link to full Analytics page */}
              <section>
                <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      onClick={() => window.location.href = 
'/analytics'}>
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <div className="p-3 bg-blue-500 rounded-full">
                        <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
                    </div>
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">View Detailed Analytics</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Get comprehensive insights into your business performance, top products, and financial trends.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      Open Analytics →
                    </Button>
                  </CardContent>
                </Card>
              </section>
      </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Owner-only sections */}
              {role === 'Owner' && subscription?.plan !== 'free' && (
                <section>
                  <GradientCardWrapper
                    gradientFrom="from-green-200"
                    gradientTo="to-teal-200"
                  >
                    <ErrorBoundary fallbackMessage="Referral system temporarily unavailable">
                      <ReferralSystem />
                    </ErrorBoundary>
                  </GradientCardWrapper>
                </section>
              )}
            </div>
          </div>

          {/* Bottom Upgrade Section for Free Plan or Expiring Subscription */}
         {(subscription?.plan === 'free' || shouldShowUpgradePrompt) && (
           <section className="w-full mt-6">
             <div className="bg-gradient-to-r from-green-500 via-orange-500 to-red-500 p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl text-white overflow-hidden relative border-2 border-green-300">
               <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-white bg-opacity-20 rounded-full -mr-12 sm:-mr-16 -mt-12 sm:-mt-16" />
               <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-white bg-opacity-20 rounded-full -ml-8 sm:-ml-12 -mb-8 sm:-mb-12" />
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-40 sm:h-40 bg-white bg-opacity-10 rounded-full" />
               <div className="relative">
                 <div className="text-center">
                   <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 text-shadow">
                     🚀 {subscription?.plan === 'free' ? 'Unlock Full Features' : 'Your Subscription is About to Expire!'}
                   </h3>
                   <p className="text-green-100 mb-4 font-medium text-sm sm:text-base">
                     {subscription?.plan === 'free'
                       ? `You've used ${currentUsage?.invoices || 3} of 5 invoices this month`
                       : `You have only ${subscription?.trial_days_left} day(s) left. Renew now to avoid interruption!`}
                   </p>
             <button
                     className="bg-white text-green-600 hover:bg-green-50 active:bg-green-100 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-2 border-green-600 text-sm sm:text-base touch-manipulation"
                     onClick={handleUpgrade}
             >
                     {subscription?.plan === 'free' ? 'Upgrade Now 🎯' : 'Renew Subscription'}
             </button>
           </div>
         </div>
       </div>
           </section>
         )}

          {/* Refresh Status */}
          <footer className="text-center py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Auto-refreshes every 30 seconds</span>
              </div>
              {lastRefresh && (
                <div className="flex items-center space-x-1">
                  <span className="hidden sm:inline">•</span>
                  <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
      </div>
              )}
            </div>
          </footer>
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