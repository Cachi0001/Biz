import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import NotificationBell from '../notifications/NotificationBell';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import FirebaseService from '../../services/FirebaseService';
import UpgradePromptCard from '../subscription/UpgradePromptCard';
import {
  Menu,
  X,
  LogOut,
  Search,
  Twitter,
  MessageCircle,
  BarChart3,
  History,
  Crown,
  Bed,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import GlobalSearchBar from '../search/GlobalSearchBar';

const FixedModernHeader = () => {
  const { user, logout, subscription, role, isOwner } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Subscription status state
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Update time every minute for real-time subscription days calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Also refresh subscription status every minute
      if (!subscriptionLoading) {
        fetchSubscriptionStatus();
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [subscriptionLoading]);

  // Fetch subscription status from unified endpoint
  const fetchSubscriptionStatus = async () => {
    if (!user) return;
    
    try {
      setSubscriptionLoading(true);
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
      } else {
        console.error('Failed to fetch subscription status');
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  // Initialize subscription status
  useEffect(() => {
    if (user) {
      fetchSubscriptionStatus();
    }
  }, [user, isOwner]);

  // Initialize Firebase and load notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        await FirebaseService.initialize();
        await loadNotifications();
        FirebaseService.addMessageHandler(handleNewNotification);
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        await loadNotifications();
      }
    };

    if (user) {
      initializeNotifications();
    }

    return () => {
      FirebaseService.removeMessageHandler(handleNewNotification);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTwitterClick = () => {
    window.open('https://x.com/Caleb0533', '_blank');
  };

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/2348158025887', '_blank');
  };

  const handleAnalyticsClick = () => {
    if (user?.subscription_plan === 'free') {
      alert('Upgrade to access advanced analytics');
      return;
    }
    navigate('/analytics');
  };

  const handleTransactionsClick = () => {
    if (user?.subscription_plan === 'free') {
      alert('Upgrade to access transaction history');
      return;
    }
    navigate('/transactions');
  };

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const [notificationsData, unreadCountData] = await Promise.all([
        FirebaseService.getNotifications(20, 0),
        FirebaseService.getUnreadCount()
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Failed to load notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Handle new notification from Firebase
  const handleNewNotification = (notification) => {
    console.log('New notification received:', notification);
    
    setNotifications(prev => [
      {
        id: Date.now().toString(),
        title: notification.title,
        body: notification.body,
        type: notification.data?.type || 'info',
        read: false,
        action_url: notification.data?.action_url,
        created_at: notification.timestamp
      },
      ...prev
    ]);
    
    setUnreadCount(prev => prev + 1);
  };

  // Handle notification bell click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  // Handle mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await FirebaseService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await FirebaseService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Calculate accurate remaining days from subscription status
  const getRemainingDays = () => {
    if (!subscriptionStatus) return 0;
    
    const { unified_status, remaining_days, trial_days_left, subscription_plan } = subscriptionStatus;
    
    // For free plan, return -1 (no expiry)
    if (subscription_plan === 'free' || unified_status === 'free') {
      return -1;
    }
    
    // For trial users, use trial_days_left
    if (unified_status === 'trial' && trial_days_left !== undefined) {
      return Math.max(0, trial_days_left);
    }
    
    // For active subscriptions, use remaining_days
    if (unified_status === 'active' && remaining_days !== undefined) {
      return Math.max(0, remaining_days);
    }
    
    return 0;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const remainingDays = getRemainingDays();
  const shouldShowCrown = subscriptionStatus && 
    (subscriptionStatus.unified_status === 'trial' || 
     (subscriptionStatus.subscription_plan && subscriptionStatus.subscription_plan !== 'free'));

  return (
    <>
      {/* Upgrade Prompt Card - Shows at top when user has 3 days or less */}
      {showUpgradePrompt && remainingDays <= 3 && remainingDays > 0 && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <UpgradePromptCard
            daysLeft={remainingDays}
            subscriptionPlan={subscriptionStatus?.subscription_plan}
            isTrialUser={subscriptionStatus?.unified_status === 'trial'}
            onDismiss={() => setShowUpgradePrompt(false)}
            className="max-w-4xl mx-auto"
          />
        </div>
      )}

      <div className="bg-green-500 border-b border-green-400 sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo/Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-300 rounded-lg flex items-center justify-center">
                <span className="text-green-900 font-bold text-sm">S</span>
              </div>
              <div className="hidden md:block">
                <h1 className="text-lg font-bold text-white">SabiOps</h1>
                <p className="text-xs text-green-200">Business Dashboard</p>
              </div>
            </div>

            {/* Global Search Bar */}
            <div className="flex-1 mx-1 sm:mx-6 max-w-none sm:max-w-md">
              <GlobalSearchBar 
                className="w-full"
                placeholder="Search customers, products, invoices..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center flex-wrap justify-end gap-2">
              {/* Analytics & Transactions for Desktop */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyticsClick}
                  className={`text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1 ${
                    user?.subscription_plan === 'free' ? 'opacity-60' : ''
                  }`}
                  title={user?.subscription_plan === 'free' ? 'Upgrade to access Analytics' : 'Advanced Analytics'}
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Analytics</span>
                  {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-1" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTransactionsClick}
                  className={`text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1 ${
                    user?.subscription_plan === 'free' ? 'opacity-60' : ''
                  }`}
                  title={user?.subscription_plan === 'free' ? 'Upgrade to access Transactions' : 'Transaction History'}
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Transactions</span>
                  {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-1" />}
                </Button>
                
                {/* Team Management - Owner only */}
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/team')}
                    className="text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1"
                    title="Team Management"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="hidden sm:inline text-xs">Team</span>
                  </Button>
                )}
              </div>

              {/* Social Links */}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTwitterClick}
                  className="text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1"
                  title="Follow our CEO"
                >
                  <Bed className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Follow our CEO</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWhatsAppClick}
                  className="text-white hover:text-green-100 hover:bg-green-600"
                  title="Contact us for feedback"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>

              {/* Logout - Desktop */}
              <div className="hidden md:block">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-white hover:text-green-100 hover:bg-green-600 flex items-center gap-1"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Logout</span>
                </Button>
              </div>

              {/* Notifications */}
              <div className="relative">
                <NotificationBell />
              </div>

              {/* Fixed Subscription Crown Indicator */}
              {shouldShowCrown && (
                <div className="flex items-center space-x-1 bg-yellow-500 px-2 py-1 rounded-full relative group">
                  <Crown className="h-3 w-3 text-yellow-900" />
                  <span className="text-xs font-medium text-yellow-900">
                    {subscriptionLoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      `${remainingDays >= 0 ? remainingDays : 0} days`
                    )}
                  </span>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    {subscriptionStatus?.unified_status === 'trial' 
                      ? `Trial: ${remainingDays} days left`
                      : `${subscriptionStatus?.subscription_plan || 'Plan'}: ${remainingDays} days left`
                    }
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                  </div>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden text-white hover:bg-green-600">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-green-500 border-green-400">
                  <div className="flex items-center justify-between mb-6 px-4">
                    <h2 className="text-lg font-semibold text-white">Menu</h2>
                    <SheetClose asChild>
                      <Button variant="ghost" size="sm" className="text-white hover:bg-green-600">
                        <X className="h-4 w-4" />
                      </Button>
                    </SheetClose>
                  </div>
                  
                  <div className="space-y-4 px-4">
                    {/* Mobile menu content - same as original but with subscription status */}
                    {shouldShowCrown && (
                      <div className="bg-green-600 rounded-lg p-3 border border-green-400">
                        <div className="flex items-center space-x-2 text-white">
                          <Crown className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {subscriptionStatus?.unified_status === 'trial' ? 'Trial' : 'Subscription'}
                          </span>
                          <span className="text-xs bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full">
                            {remainingDays} days left
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Rest of mobile menu content... */}
                    <div className="pt-2 border-t border-green-400">
                      <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                    
                    {/* User Info */}
                    <div className="pt-2 border-t border-green-400 px-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{user?.full_name}</p>
                        <p className="text-xs text-green-200">{role}</p>
                        {subscriptionStatus && (
                          <p className="text-xs text-green-300 capitalize">
                            {subscriptionStatus.subscription_plan === 'free' 
                              ? 'Free Plan' 
                              : `${subscriptionStatus.subscription_plan} Plan`
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export { FixedModernHeader };
export default FixedModernHeader;