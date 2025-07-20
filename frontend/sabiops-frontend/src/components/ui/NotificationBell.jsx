import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Bell, X, Check, CheckCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import notificationContentManager from '../../utils/notificationContentManager';
import navigationHandler from '../../utils/navigationHandler';
import VirtualizedNotificationList from '../notifications/VirtualizedNotificationList';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = notificationService.addListener(({ notifications, unreadCount }) => {
      setNotifications(notifications);
      setUnreadCount(unreadCount);
    });

    // Initial load
    setNotifications(notificationService.notifications);
    setUnreadCount(notificationService.unreadCount);

    return unsubscribe;
  }, []);

  const handleMarkAsRead = useCallback((notificationId) => {
    notificationService.markAsRead(notificationId);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const handleClearAll = useCallback(() => {
    notificationService.clearAllNotifications();
  }, []);

  const handleNotificationClick = useCallback((notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate if action URL provided
    if (notification.action_url) {
      setIsOpen(false);

      // Use enhanced navigation handler
      const options = {
        highlight: notification.data?.productId || notification.data?.invoiceId,
        filter: notificationService.getFilterForNotificationType(notification.type),
        params: notification.data
      };

      navigationHandler.navigateWithFeedback(notification.action_url, options);
    }
  }, [handleMarkAsRead]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, notification) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNotificationClick(notification);
    }
  }, [handleNotificationClick]);

  // Memoized processed and sorted notifications for performance
  const sortedNotifications = useMemo(() => {
    const processed = notifications.map(notification =>
      notificationContentManager.processNotification(notification)
    );
    return notificationContentManager.sortNotifications(processed);
  }, [notifications]);

  // Memoized notification summary for accessibility
  const notificationSummary = useMemo(() => {
    return notificationContentManager.generateSummary(sortedNotifications);
  }, [sortedNotifications]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 rounded-full min-w-[44px] min-h-[44px] touch-manipulation"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center p-0 min-w-[20px]"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0 max-h-[500px]"
        align="end"
        sideOffset={5}
        role="dialog"
        aria-label="Notifications panel"
      >
        <Card className="border-0 shadow-lg max-h-[500px] flex flex-col">
          <CardHeader className="pb-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg" id="notifications-title">
                Notifications
                <span className="sr-only">
                  {notificationSummary.total} total, {notificationSummary.unread} unread
                  {notificationSummary.urgent > 0 && `, ${notificationSummary.urgent} urgent`}
                </span>
              </CardTitle>
              <div className="flex gap-1" role="group" aria-label="Notification actions">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs px-2 py-1 h-auto min-h-[44px]"
                    aria-label={`Mark all ${unreadCount} notifications as read`}
                  >
                    <CheckCheck className="h-3 w-3 mr-1" aria-hidden="true" />
                    All read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="text-xs text-red-600 hover:text-red-700 px-2 py-1 h-auto min-h-[44px]"
                    aria-label={`Clear all ${notifications.length} notifications`}
                  >
                    <X className="h-3 w-3 mr-1" aria-hidden="true" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 overflow-hidden">
            {sortedNotifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500" role="status" aria-live="polite">
                <div className="text-4xl mb-3" aria-hidden="true">🔔</div>
                <h3 className="font-medium text-gray-700 mb-1">No notifications</h3>
                <p className="text-sm text-gray-500">You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              sortedNotifications.length > 50 ? (
                <VirtualizedNotificationList
                  notifications={sortedNotifications}
                  onNotificationClick={handleNotificationClick}
                  onMarkAsRead={handleMarkAsRead}
                  containerHeight={350}
                />
              ) : (
                <div
                  className="max-h-[350px] overflow-y-auto"
                  role="list"
                  aria-labelledby="notifications-title"
                  aria-live="polite"
                  aria-relevant="additions removals"
                >
                  {sortedNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      role="listitem"
                      tabIndex={0}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 transform hover:scale-[1.01] ${!notification.read ? `${notification.bgColor} border-l-4 ${notification.borderColor.replace('border-', 'border-l-')}` : ''
                        }`}
                      onClick={() => handleNotificationClick(notification)}
                      onKeyDown={(e) => handleKeyDown(e, notification)}
                      aria-label={`${notification.read ? 'Read' : 'Unread'} notification: ${notification.title}. ${notification.message}. ${notification.formattedTimestamp}. ${notification.category} category.${notification.urgencyLevel >= 4 ? ' Urgent.' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">
                          {notification.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`font-medium text-sm leading-tight ${notification.color}`}>
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-1" aria-hidden="true">
                              {notification.urgencyLevel >= 4 && (
                                <div
                                  className="w-1 h-1 bg-red-500 rounded-full"
                                  title="Urgent notification"
                                ></div>
                              )}
                              {!notification.read && (
                                <div
                                  className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                                  title="Unread notification"
                                ></div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mb-2 leading-tight break-words">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {notification.formattedTimestamp}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                {notification.category}
                              </span>
                            </div>

                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-xs h-5 px-2 py-0 min-w-[44px] min-h-[44px] flex items-center justify-center"
                                aria-label={`Mark "${notification.title}" as read`}
                              >
                                <Check className="h-3 w-3" aria-hidden="true" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;