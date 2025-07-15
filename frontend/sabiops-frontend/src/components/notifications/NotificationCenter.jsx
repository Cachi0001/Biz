import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  CreditCard,
  Users,
  Crown,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../lib/utils/index.js';
import { useNavigate } from 'react-router-dom';

const NotificationCenter = ({ isOpen, onClose, notifications = [], onMarkAsRead, onMarkAllAsRead }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    const iconMap = {
      low_stock: Package,
      payment_received: CreditCard,
      invoice_overdue: AlertTriangle,
      trial_expiring: Crown,
      referral_earned: TrendingUp,
      sale: TrendingUp,
      customer: Users,
      product: Package,
      expense: CreditCard,
      default: Bell
    };
    return iconMap[type] || iconMap.default;
  };

  // Get notification color based on type
  const getNotificationColor = (type) => {
    const colorMap = {
      low_stock: 'text-orange-600 bg-orange-50',
      payment_received: 'text-green-600 bg-green-50',
      invoice_overdue: 'text-red-600 bg-red-50',
      trial_expiring: 'text-yellow-600 bg-yellow-50',
      referral_earned: 'text-blue-600 bg-blue-50',
      sale: 'text-green-600 bg-green-50',
      customer: 'text-purple-600 bg-purple-50',
      product: 'text-indigo-600 bg-indigo-50',
      expense: 'text-red-600 bg-red-50',
      default: 'text-gray-600 bg-gray-50'
    };
    return colorMap[type] || colorMap.default;
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.read && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }

    // Navigate to relevant section if action_url exists
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }

    setSelectedNotification(notification);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto">
      {/* Mobile backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 md:hidden" onClick={onClose}></div>
      
      {/* Notification Panel */}
      <Card 
        ref={panelRef}
        className="fixed top-0 right-0 w-full h-full md:absolute md:top-12 md:right-0 md:w-96 md:h-auto md:max-h-[80vh] bg-white shadow-2xl border-0 md:border md:border-gray-200 z-50"
      >
        {/* Header */}
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-blue-50 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-green-600" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Notifications List */}
        <CardContent className="p-0 overflow-y-auto max-h-[calc(100vh-120px)] md:max-h-96">
          {notifications.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-sm text-gray-500">
                We'll notify you when something important happens with your business.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const colorClass = getNotificationColor(notification.type);
                
                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-full ${colorClass} flex-shrink-0`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {notification.body}
                            </p>
                          </div>
                          
                          {/* Unread indicator */}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDateTime(notification.created_at)}
                          </div>
                          
                          {/* Action button */}
                          {notification.action_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(notification.action_url);
                                onClose();
                              }}
                            >
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-100 p-3 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-600 hover:text-gray-700"
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
            >
              View all notifications
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export { NotificationCenter };
export default NotificationCenter;