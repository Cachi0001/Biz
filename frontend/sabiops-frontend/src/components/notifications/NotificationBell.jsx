import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';

const NotificationBell = ({ unreadCount = 0, onClick, className = '' }) => {
  const { user } = useAuth();
  const [animateCount, setAnimateCount] = useState(false);

  // Animate count when it changes
  useEffect(() => {
    if (unreadCount > 0) {
      setAnimateCount(true);
      const timer = setTimeout(() => setAnimateCount(false), 300);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={`relative text-white hover:bg-white hover:bg-opacity-20 transition-all duration-200 ${className}`}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span 
            className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg transition-all duration-300 ${
              animateCount ? 'scale-125' : 'scale-100'
            }`}
            style={{
              fontSize: unreadCount > 99 ? '8px' : '10px'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] animate-ping opacity-75"></span>
        )}
      </Button>

      {/* Notification dot for mobile */}
      {unreadCount > 0 && (
        <div className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white md:hidden"></div>
      )}
    </div>
  );
};

export { NotificationBell };
export default NotificationBell;