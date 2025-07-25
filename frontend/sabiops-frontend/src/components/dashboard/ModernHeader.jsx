import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationCenter } from '../notifications/NotificationCenter';
import NotificationBell from '../notifications/NotificationBell';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '../ui/sheet';
import FirebaseService from '../../services/FirebaseService';
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
  UserPlus
} from 'lucide-react';
import SearchDropdown from '../SearchDropdown';

const ModernHeader = () => {
  const { user, logout, subscription, role, isOwner } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification state
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Initialize Firebase and load notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Initialize Firebase messaging (with fallback support)
        await FirebaseService.initialize();
        
        // Load notifications
        await loadNotifications();
        
        // Set up message handler for real-time notifications
        FirebaseService.addMessageHandler(handleNewNotification);
        
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        // Even if initialization fails, try to load notifications from backend
        await loadNotifications();
      }
    };

    if (user) {
      initializeNotifications();
    }

    // Cleanup on unmount
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
      // Use mock data for development
      setNotifications([
        {
          id: '1',
          title: 'Low Stock Alert',
          body: 'Office Chair is running low (2 items left)',
          type: 'low_stock',
          read: false,
          action_url: '/products',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Payment Received',
          body: 'Invoice #INV-001 has been paid (₦15,000)',
          type: 'payment_received',
          read: false,
          action_url: '/invoices',
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
      setUnreadCount(2);
    } finally {
      setLoading(false);
    }
  };

  // Handle new notification from Firebase
  const handleNewNotification = (notification) => {
    console.log('New notification received:', notification);
    
    // Add to notifications list
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
    
    // Increment unread count
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  return (
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

          {/* Search Bar - Always visible in header */}
            <div className="flex-1 max-w-md mx-6 relative">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-200" />
                <input
                  type="search"
                  placeholder="Search customers, products, invoices..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(!!e.target.value);
                  }}
                  onFocus={() => setSearchOpen(!!searchQuery)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
                  className="w-full bg-green-600/50 text-white pl-10 pr-4 py-3 rounded-lg border border-green-400/30 placeholder:text-green-200 focus:outline-none focus:ring-2 focus:ring-green-300 text-base touch-manipulation"
                />
                <SearchDropdown
                  isOpen={searchOpen}
                  onClose={() => setSearchOpen(false)}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              </div>
            </div>

          {/* Actions */}
          <div className="flex items-center flex-wrap justify-end gap-2">
            {/* Analytics & Transactions for Desktop - Paid Plans */}
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

            {/* Social Links - Hidden on mobile */}
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

                  {/* Notifications - Mobile */}
                  <div className="w-full relative">
                    <NotificationBell />
                    {showNotifications && (
                      <NotificationCenter
                        notifications={notifications}
                        unreadCount={unreadCount}
                        loading={loading}
                        onMarkAsRead={handleMarkAsRead}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onClose={() => setShowNotifications(false)}
                      />
                    )}
                  </div>

            {/* Trial Indicator */}
            {user?.subscription_status === 'trial' && (
              <div className="flex items-center space-x-1 bg-yellow-500 px-2 py-1 rounded-full">
                <Crown className="h-3 w-3 text-yellow-900" />
                <span className="text-xs font-medium text-yellow-900">
                  {user?.trial_days_left || 0} days
                </span>
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
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-white">Menu</h2>
                  <SheetClose asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-green-600">
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetClose>
                </div>
                
                <div className="space-y-4">

                  
                  {/* Reports & Analytics for Mobile */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-green-100">Reports & Analytics</h3>
                    <Button
                      variant="ghost"
                      onClick={handleAnalyticsClick}
                      className={`w-full justify-start text-white hover:text-green-100 hover:bg-green-600 ${
                        user?.subscription_plan === 'free' ? 'opacity-60' : ''
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Advanced Analytics
                      {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-auto" />}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleTransactionsClick}
                      className={`w-full justify-start text-white hover:text-green-100 hover:bg-green-600 ${
                        user?.subscription_plan === 'free' ? 'opacity-60' : ''
                      }`}
                    >
                      <History className="h-4 w-4 mr-2" />
                      Transaction History
                      {user?.subscription_plan === 'free' && <Crown className="h-3 w-3 text-yellow-400 ml-auto" />}
                    </Button>
                    
                    {/* Team Management - Owner only */}
                    {isOwner && (
                      <Button
                        variant="ghost"
                        onClick={() => navigate('/team')}
                        className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Team Management
                      </Button>
                    )}
                  </div>
                  
                  {/* Social Links */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-green-100">Connect</h3>
                    <Button
                      variant="ghost"
                      onClick={handleTwitterClick}
                      className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                    >
                      <Bed className="h-4 w-4 mr-2" />
                      Follow our CEO
                    </Button>
                    
                    <Button
                      variant="ghost"
                      onClick={handleWhatsAppClick}
                      className="w-full justify-start text-white hover:text-green-100 hover:bg-green-600"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </div>
                  
                  {/* Logout */}
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
                  
                  {/* Notifications */}
                  <div className="pt-2 border-t border-green-400">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-green-100">Notifications</h3>
                      <div className="relative">
                        <NotificationBell
                          unreadCount={unreadCount}
                          onClick={handleNotificationClick}
                          className="text-white hover:bg-green-600 w-full justify-start"
                          showText={true}
                        />
                        
                        {/* Mobile Notification Center */}
                        <NotificationCenter
                          isOpen={showNotifications}
                          onClose={() => setShowNotifications(false)}
                          notifications={notifications}
                          onMarkAsRead={handleMarkAsRead}
                          onMarkAllAsRead={handleMarkAllAsRead}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="pt-2 border-t border-green-400">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-white">{user?.full_name}</p>
                      <p className="text-xs text-green-200">{role}</p>
                      {user?.subscription_plan && (
                        <p className="text-xs text-green-300 capitalize">
                          {user.subscription_plan === 'free' ? 'Free Plan' : `${user.subscription_plan} Plan`}
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
  );
};

export { ModernHeader };
export default ModernHeader;