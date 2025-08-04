// Offline indicator component
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, Sync } from 'lucide-react';
import offlineService from '../../services/offlineService';

const OfflineIndicator = ({ className = "" }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      updateSyncStatus();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      updateSyncStatus();
    };

    const updateSyncStatus = () => {
      setSyncStatus(offlineService.getSyncStatus());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial status
    updateSyncStatus();
    
    // Update sync status every 30 seconds
    const interval = setInterval(updateSyncStatus, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    if (isOffline) return;
    
    setIsSyncing(true);
    try {
      await offlineService.syncOfflineData();
      setSyncStatus(offlineService.getSyncStatus());
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOffline) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm ${className}`}>
        <WifiOff className="w-4 h-4" />
        <span>Offline Mode</span>
        {syncStatus && syncStatus.unsyncedItems > 0 && (
          <span className="bg-orange-200 px-2 py-0.5 rounded-full text-xs">
            {syncStatus.unsyncedItems} pending
          </span>
        )}
      </div>
    );
  }

  if (syncStatus && syncStatus.unsyncedItems > 0) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm ${className}`}>
        <Cloud className="w-4 h-4" />
        <span>Online</span>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="bg-blue-200 hover:bg-blue-300 px-2 py-0.5 rounded-full text-xs transition-colors flex items-center space-x-1"
        >
          <Sync className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : `Sync ${syncStatus.unsyncedItems}`}</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm ${className}`}>
      <Wifi className="w-4 h-4" />
      <span>Online</span>
    </div>
  );
};

export default OfflineIndicator;