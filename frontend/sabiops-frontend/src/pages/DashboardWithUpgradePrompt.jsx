import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ModernOverviewCards from '../components/dashboard/ModernOverviewCards';
import ModernChartsSection from '../components/dashboard/ModernChartsSection';
import ModernQuickActions from '../components/dashboard/ModernQuickActions';
import ModernRecentActivities from '../components/dashboard/ModernRecentActivities';
import UpgradePromptCard from '../components/subscription/UpgradePromptCard';
import UnifiedSubscriptionStatus from '../components/subscription/UnifiedSubscriptionStatus';
import { Card, CardContent } from '../components/ui/card';
import { Crown, RefreshCw } from 'lucide-react';

const DashboardWithUpgradePrompt = () => {
  const { user, isOwner } = useAuth();
  const navigate = useNavigate();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/subscription/unified-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionStatus(data.data || data);
        
        // Show upgrade prompt if user has 3 days or less and is owner
        const remainingDays = data.data?.remaining_days || 0;
        if (isOwner && remainingDays <= 3 && remainingDays > 0) {
          setShowUpgradePrompt(true);
        }
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
    
    // Refresh subscription status every 5 minutes
    const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user, isOwner]);

  const handleUpgrade = () => {
    navigate('/subscription-upgrade');
  };

  const remainingDays = subscriptionStatus?.remaining_days || 0;
  const isTrialUser = subscriptionStatus?.unified_status === 'trial';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Upgrade Prompt Card - Shows when user has 3 days or less */}
        {showUpgradePrompt && isOwner && remainingDays <= 3 && remainingDays > 0 && (
          <UpgradePromptCard
            daysLeft={remainingDays}
            subscriptionPlan={subscriptionStatus?.subscription_plan}
            isTrialUser={isTrialUser}
            onDismiss={() => setShowUpgradePrompt(false)}
            className="mb-6"
          />
        )}

        {/* Subscription Status Card */}
        <div className="mb-6">
          <UnifiedSubscriptionStatus onUpgrade={handleUpgrade} />
        </div>

        {/* Overview Cards */}
        <ModernOverviewCards />

        {/* Charts Section */}
        <ModernChartsSection />

        {/* Quick Actions */}
        <ModernQuickActions />

        {/* Recent Activities */}
        <ModernRecentActivities />

        {/* Subscription Debug Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && subscriptionStatus && (
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Crown className="h-4 w-4 mr-2" />
                Subscription Debug Info
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Plan: {subscriptionStatus.subscription_plan}</div>
                <div>Status: {subscriptionStatus.unified_status}</div>
                <div>Remaining Days: {subscriptionStatus.remaining_days}</div>
                <div>Trial Days Left: {subscriptionStatus.trial_days_left}</div>
                <div>Is Trial: {subscriptionStatus.is_trial ? 'Yes' : 'No'}</div>
                <div>Is Active: {subscriptionStatus.is_active ? 'Yes' : 'No'}</div>
                <div>Is Owner: {isOwner ? 'Yes' : 'No'}</div>
                <div>Show Prompt: {showUpgradePrompt ? 'Yes' : 'No'}</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardWithUpgradePrompt;