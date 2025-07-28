/**
 * Virtualized Notification List Component
 * Optimizes performance for large notification lists using virtual scrolling
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ITEM_HEIGHT = 80; // Approximate height of each notification item
const BUFFER_SIZE = 5; // Number of items to render outside visible area

const VirtualizedNotificationList = ({
  notifications,
  onNotificationClick,
  onMarkAsRead,
  containerHeight = 350
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const containerTop = scrollTop;
    const containerBottom = scrollTop + containerHeight;

    const startIndex = Math.max(0, Math.floor(containerTop / ITEM_HEIGHT) - BUFFER_SIZE);
    const endIndex = Math.min(
      notifications.length - 1,
      Math.ceil(containerBottom / ITEM_HEIGHT) + BUFFER_SIZE
    );

    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, notifications.length]);

  // Get visible notifications
  const visibleNotifications = useMemo(() => {
    return notifications.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [notifications, visibleRange]);

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event, notification) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onNotificationClick(notification);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const currentIndex = notifications.findIndex(n => n.id === notification.id);
      const nextIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;

      if (nextIndex >= 0 && nextIndex < notifications.length) {
        const nextElement = scrollElementRef.current?.querySelector(
          `[data-notification-index="${nextIndex}"]`
        );
        nextElement?.focus();
      }
    }
  }, [notifications, onNotificationClick]);

  const renderNotificationItem = useCallback((notification, index) => {
    const actualIndex = visibleRange.startIndex + index;

    return (
      <div
        key={notification.id}
        data-notification-index={actualIndex}
        role="listitem"
        tabIndex={0}
        className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset transition-all duration-200 ${!notification.read ? `${notification.bgColor} border-l-4 ${notification.borderColor?.replace('border-', 'border-l-')}` : ''
          }`}
        style={{
          position: 'absolute',
          top: actualIndex * ITEM_HEIGHT,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
        }}
        onClick={() => onNotificationClick(notification)}
        onKeyDown={(e) => handleKeyDown(e, notification)}
        aria-label={`${notification.read ? 'Read' : 'Unread'} notification: ${notification.title}. ${notification.message}. ${notification.formattedTimestamp}. ${notification.category} category.${notification.urgencyLevel >= 4 ? ' Urgent.' : ''}`}
      >
        <div className="flex items-start gap-3 h-full">
          <div className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">
            {notification.icon}
          </div>

          <div className="flex-1 min-w-0 h-full flex flex-col">
            <div className="flex items-start justify-between mb-1">
              <h4 className={`font-medium text-sm leading-tight ${notification.color} truncate`}>
                {notification.title}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0" aria-hidden="true">
                {notification.urgencyLevel >= 4 && (
                  <div
                    className="w-1 h-1 bg-red-500 rounded-full"
                    title="Urgent notification"
                  ></div>
                )}
                {!notification.read && (
                  <div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    title="Unread notification"
                  ></div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-2 leading-tight break-words line-clamp-2 flex-1">
              {notification.message}
            </p>

            <div className="flex items-center justify-between mt-auto">
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
                    onMarkAsRead(notification.id);
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
    );
  }, [visibleRange.startIndex, onNotificationClick, onMarkAsRead, handleKeyDown]);

  return (
    <div
      ref={scrollElementRef}
      className="relative overflow-y-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      role="list"
      aria-label="Notifications list"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {/* Total height container */}
      <div style={{ height: notifications.length * ITEM_HEIGHT, position: 'relative' }}>
        {/* Visible items */}
        {visibleNotifications.map((notification, index) =>
          renderNotificationItem(notification, index)
        )}
      </div>

      {/* Loading indicator for large lists */}
      {notifications.length > 100 && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded">
          {notifications.length} notifications
        </div>
      )}

      {/* CSS for line clamping */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default VirtualizedNotificationList;