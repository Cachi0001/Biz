import React, { useEffect, useState } from 'react';

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
};

export default function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Debug: confirm rendering
  console.log('OnlineStatusIndicator rendered, isOnline:', isOnline);
  debugger;

  return (
    <div
      className={`fixed z-50 top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2 px-3 py-1 rounded-full shadow-lg text-white text-xs sm:text-sm font-medium transition-all duration-300 border-4 border-red-500
        ${isOnline ? 'bg-green-500' : 'bg-red-500'}
        ${isOnline ? 'opacity-80' : 'opacity-100'}
        min-w-[80px] max-w-[90vw]'
      `}
      style={{ pointerEvents: 'none' }}
      aria-live="polite"
    >
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isOnline ? 'bg-white' : 'bg-white animate-pulse'}`}></span>
      {isOnline ? 'Online' : 'Offline'}
    </div>
  );
} 