import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils/index.js';

const NotificationBell = ({ onClick, unreadCount = 0, className }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn("relative h-8 w-8 hover:bg-green-600 text-white", className)}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
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