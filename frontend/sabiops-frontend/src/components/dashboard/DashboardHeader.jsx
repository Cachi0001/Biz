import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationCenter } from '../notifications/NotificationCenter';
import FirebaseService from '../../services/FirebaseService';

const DashboardHeader = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Initialize Firebase and load notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Initialize Firebase messaging
        await FirebaseService.initialize();
        
        // Load notifications
        await loadNotifications();
        
        // Set up message handler for real-time notifications
        FirebaseService.addMessageHandler(handleNewNotification);
        
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
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
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm sm:text-lg">
              {user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-lg font-semibold truncate">
              {getGreeting()}, {user?.full_name?.split(' ')[0] || user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-green-100 text-xs sm:text-sm truncate">
              {user?.business_name || 'SabiOps Dashboard'} • {user?.role || 'User'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Search className="h-5 w-5" />
          </Button>
          
          {/* Notification Bell with Center */}
          <div className="relative">
            <NotificationBell
              unreadCount={unreadCount}
              onClick={handleNotificationClick}
              className="text-white hover:bg-white hover:bg-opacity-20"
            />
            
            {/* Notification Center */}
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

      {/* Quick Stats Bar */}
      <div className="bg-white bg-opacity-10 rounded-lg p-3">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-green-100 text-xs">Today's Sales</p>
            <p className="text-white font-semibold">₦0</p>
          </div>
          <div>
            <p className="text-green-100 text-xs">This Month</p>
            <p className="text-white font-semibold">₦0</p>
          </div>
          <div>
            <p className="text-green-100 text-xs">Total Revenue</p>
            <p className="text-white font-semibold">₦0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { DashboardHeader };
export default DashboardHeader;