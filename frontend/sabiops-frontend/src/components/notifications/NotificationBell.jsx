import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '../../lib/utils/index.js';
import notificationService from '../../services/notificationService';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ className, showText = false, asIcon = false, unreadCount: externalUnreadCount }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedNotification, setHighlightedNotification] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.addListener(({ notifications, unreadCount }) => {
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    });

    // Initial load
    loadNotifications();

    return unsubscribe;
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.fetchNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    notificationService.navigateToNotification(notification);
    setIsOpen(false);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    await notificationService.markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'low_stock_alert': return '📦';
      case 'overdue_invoice': return '💸';
      case 'usage_limit_warning': return '⚠️';
      case 'subscription_expiry': return '⏰';
      case 'profit_alert': return '📉';
      case 'payment_received': return '💳';
      case 'system_update': return '🔔';
      case 'invoice_created': return '📄';
      case 'sale_completed': return '💰';
      case 'team_activity': return '👥';
      // Legacy support
      case 'low_stock': return '📦';
      case 'trial_reminder': return '⏰';
      default: return 'ℹ️';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'low_stock_alert': return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      case 'overdue_invoice': return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'usage_limit_warning': return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      case 'subscription_expiry': return 'border-purple-200 bg-purple-50 hover:bg-purple-100';
      case 'profit_alert': return 'border-red-200 bg-red-50 hover:bg-red-100';
      case 'payment_received': return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'system_update': return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'invoice_created': return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
      case 'sale_completed': return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'team_activity': return 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100';
      // Legacy support
      case 'low_stock': return 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100';
      case 'trial_reminder': return 'border-orange-200 bg-orange-50 hover:bg-orange-100';
      default: return 'border-gray-200 bg-gray-50 hover:bg-gray-100';
    }
  };

  const getPriorityIndicator = (notification) => {
    const priority = notification.priority || notification.data?.priority || 'medium';
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="h-3 w-3 text-red-500 animate-pulse" />;
      case 'high':
        return <AlertCircle className="h-3 w-3 text-orange-500" />;
      default:
        return null;
    }
  };

  // Use external unread count if provided (for mobile menu), otherwise use internal state
  const displayUnreadCount = externalUnreadCount !== undefined ? externalUnreadCount : unreadCount;

  // If used as icon only (for mobile menu), return just the icon
  if (asIcon) {
    return (
      <div className="relative">
        <Bell className={cn("h-4 w-4", className)} />
        {displayUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium animate-pulse">
            {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size={showText ? "default" : "icon"}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative hover:bg-green-600 text-white",
          showText ? "justify-start" : "h-8 w-8",
          className
        )}
      >
        <Bell className="h-4 w-4" />
        {showText && <span className="ml-2">Notifications</span>}
        {displayUnreadCount > 0 && (
          <span className={cn(
            "absolute rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium animate-pulse",
            showText ? "-top-1 -right-1 h-5 w-5" : "-top-1 -right-1 h-5 w-5"
          )}>
            {displayUnreadCount > 9 ? '9+' : displayUnreadCount}
          </span>
        )}
        <span className="sr-only">
          {displayUnreadCount > 0 ? `${displayUnreadCount} unread notifications` : 'Notifications'}
        </span>
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 notification-backdrop"
            onClick={() => setIsOpen(false)}
          />

          {/* Notification Panel */}
          <Card className="absolute top-full mt-2 max-h-96 overflow-hidden z-50 shadow-lg border notification-dropdown w-72 sm:w-80 right-0 sm:right-0 transform -translate-x-1/2 sm:translate-x-0 left-1/2 sm:left-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs h-6 px-2"
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-3 cursor-pointer transition-all duration-200 relative border-l-4",
                          !notification.read && "bg-blue-50/50 border-l-blue-400",
                          notification.read && "border-l-transparent",
                          getNotificationColor(notification.type),
                          highlightedNotification === notification.id && "ring-2 ring-blue-300 bg-blue-100"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1">
                            <span className="text-lg flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </span>
                            {getPriorityIndicator(notification)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  {notification.navigation_url && (
                                    <ExternalLink className="h-3 w-3 text-gray-400" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-0.5">
                                  {notification.message}
                                </p>
                                {notification.action_required && (
                                  <p className="text-xs text-orange-600 mt-1 font-medium">
                                    Action required
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-gray-200"
                                    title="Mark as read"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimeAgo(notification.created_at)}
                              </span>

                              <div className="flex items-center gap-2">
                                {!notification.read && (
                                  <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                    New
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export { NotificationBell };
export default NotificationBell;