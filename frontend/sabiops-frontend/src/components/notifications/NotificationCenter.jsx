import React, { useState, useEffect, useRef } from 'react';
import { X, Check, CheckCheck, Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils/index.js';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  // Sample notifications - in real app, this would come from API/Firebase
  useEffect(() => {
    const sampleNotifications = [
      {
        id: 1,
        title: 'New Sale Recorded',
        message: 'A new sale of ₦15,000 has been recorded',
        time: '2 minutes ago',
        type: 'success',
        read: false,
        action_url: '/sales/report'
      },
      {
        id: 2,
        title: 'Low Stock Alert',
        message: 'Product "Office Chair" is running low (2 items left)',
        time: '1 hour ago',
        type: 'warning',
        read: false,
        action_url: '/products'
      },
      {
        id: 3,
        title: 'Invoice Payment Received',
        message: 'Payment received for Invoice #INV-001',
        time: '3 hours ago',
        type: 'success',
        read: true,
        action_url: '/invoices'
      },
      {
        id: 4,
        title: 'Trial Reminder',
        message: 'Your trial expires in 3 days. Upgrade now!',
        time: '1 day ago',
        type: 'info',
        read: false,
        action_url: '/dashboard'
      }
    ];
    
    setNotifications(sampleNotifications);
    setUnreadCount(sampleNotifications.filter(n => !n.read).length);
  }, []);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to the relevant page
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    onClose();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:absolute md:inset-auto md:top-12 md:right-0 md:w-96">
      {/* Mobile backdrop */}
      <div className="md:hidden fixed inset-0 bg-black/20" onClick={onClose} />
      
      {/* Notification panel */}
      <Card 
        ref={panelRef}
        className="fixed top-0 right-0 w-full h-full md:absolute md:top-0 md:right-0 md:w-96 md:h-auto md:max-h-[80vh] bg-white shadow-lg border-0 md:border rounded-none md:rounded-lg"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-120px)] md:max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors hover:bg-gray-50",
                      !notification.read && "bg-green-50/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={cn(
                            "text-sm font-medium text-gray-900 truncate",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { NotificationCenter };
export default NotificationCenter;