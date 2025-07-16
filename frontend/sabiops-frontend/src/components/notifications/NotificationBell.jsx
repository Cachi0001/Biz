import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/index.js';

const NotificationBell = ({ onClick, unreadCount = 0, className, showText = false }) => {
  return (
    <Button
      variant="ghost"
      size={showText ? "default" : "icon"}
      onClick={onClick}
      className={cn(
        "relative hover:bg-green-600 text-white",
        showText ? "justify-start" : "h-8 w-8",
        className
      )}
    >
      <Bell className="h-4 w-4" />
      {showText && <span className="ml-2">Notifications</span>}
      {unreadCount > 0 && (
        <span className={cn(
          "absolute rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium",
          showText ? "-top-1 -right-1 h-5 w-5" : "-top-1 -right-1 h-5 w-5"
        )}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      <span className="sr-only">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      </span>
    </Button>
  );
};

export { NotificationBell };
export default NotificationBell;