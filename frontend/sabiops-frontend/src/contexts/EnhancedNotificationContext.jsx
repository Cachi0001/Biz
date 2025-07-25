import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { enhancedNotificationService } from '../services/EnhancedNotificationService';
import { messaging, getToken, onMessage } from '../firebase';

const EnhancedNotificationContext = createContext();

export const useEnhancedNotification = () => {
  const context = useContext(EnhancedNotificationContext);
  if (!context) {
    throw new Error('useEnhancedNotification must be used within an EnhancedNotificationProvider');
  }
  return context;
};

export const EnhancedNotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isPollingActive, setIsPollingActive] = useState(false);
  
  // Permission and device token state
  const [permission, setPermission] = useState(Notification.permission);
  const [deviceToken, setDeviceToken] = useState(null);
  const [pushSupported, setPushSupported] = useState(false);
  const [firebaseSupported, setFirebaseSupported] = useState(false);
  
  // Error and loading states
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Initialize notification service when user authentication changes
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      enhancedNotificationService.setAuthenticated(true);
      initializeFirebaseToken();
    } else {
      enhancedNotificationService.setAuthenticated(false);
      setDeviceToken(null);
    }
  }, [isAuthenticated, user]);

  /**
   * Set up notification service listener
   */
  useEffect(() => {
    const unsubscribe = enhancedNotificationService.addListener((data) => {
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
      setIsOnline(data.isOnline);
      setIsPollingActive(data.isPollingActive);
    });

    // Initialize state
    const currentState = enhancedNotificationService.getState();
    setNotifications(currentState.notifications);
    setUnreadCount(currentState.unreadCount);
    setIsOnline(currentState.isOnline);
    setIsPollingActive(currentState.isPollingActive);

    return unsubscribe;
  }, []);

  /**
   * Check support for push notifications and Firebase
   */
  useEffect(() => {
    setPushSupported(enhancedNotificationService.isPushSupported());
    setFirebaseSupported(!!messaging);
  }, []);

  /**
   * Initialize Firebase token if supported and user is authenticated
   */
  const initializeFirebaseToken = useCallback(async () => {
    if (!messaging || !user || !firebaseSupported) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (permission === 'granted') {
        const currentToken = await getToken(messaging, { 
          vapidKey: process.env.REACT_APP_VAPID_PUBLIC_KEY 
        });
        
        if (currentToken) {
          setDeviceToken(currentToken);
          
          // Save token to backend
          try {
            await saveDeviceTokenToBackend(currentToken);
          } catch (saveError) {
            console.error('Failed to save device token to backend:', saveError);
            setError('Failed to save device token');
          }
        } else {
          console.warn('No registration token available');
        }
      }
    } catch (tokenError) {
      console.error('Failed to get Firebase token:', tokenError);
      setError('Failed to initialize push notifications');
    } finally {
      setIsLoading(false);
    }
  }, [user, permission, firebaseSupported]);

  /**
   * Save device token to backend
   */
  const saveDeviceTokenToBackend = async (token) => {
    try {
      await enhancedNotificationService.apiClient.post('/api/notifications/firebase/token', {
        token,
        device_type: 'web',
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to save device token:', error);
      throw error;
    }
  };

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      // Request permission using enhanced service
      const granted = await enhancedNotificationService.requestPushPermission();
      
      if (granted) {
        setPermission('granted');
        
        // Initialize Firebase token after permission granted
        if (firebaseSupported) {
          await initializeFirebaseToken();
        }
        
        return true;
      } else {
        setPermission(Notification.permission);
        return false;
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
      setError(err.message || 'Failed to request notification permission');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [firebaseSupported, initializeFirebaseToken]);

  /**
   * Disable notifications
   */
  const disableNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Unsubscribe from push notifications
      await enhancedNotificationService.unsubscribeFromPush();
      
      // Clear device token
      setDeviceToken(null);
      
      // Notify backend
      try {
        await enhancedNotificationService.apiClient.delete('/api/notifications/firebase/token');
      } catch (error) {
        console.error('Failed to remove device token from backend:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      setError('Failed to disable notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    return await enhancedNotificationService.markAsRead(notificationId);
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    return await enhancedNotificationService.markAllAsRead();
  }, []);

  /**
   * Clear all notifications
   */
  const clearAllNotifications = useCallback(() => {
    enhancedNotificationService.clearNotifications();
  }, []);

  /**
   * Show toast notification
   */
  const showToast = useCallback((message, type = 'default', options = {}) => {
    return enhancedNotificationService.showToast(message, type, options);
  }, []);

  /**
   * Business-specific notification methods
   */
  const showLowStockAlert = useCallback((productName, quantity, threshold = 5) => {
    enhancedNotificationService.showLowStockAlert(productName, quantity, threshold);
  }, []);

  const showPaymentReceived = useCallback((invoiceNumber, amount) => {
    enhancedNotificationService.showPaymentReceived(invoiceNumber, amount);
  }, []);

  const showTrialReminder = useCallback((daysLeft) => {
    enhancedNotificationService.showTrialReminder(daysLeft);
  }, []);

  const showSaleSuccess = useCallback((saleData) => {
    enhancedNotificationService.showToast(
      `Sale of ₦${saleData.total_amount.toLocaleString()} recorded successfully!`,
      'success',
      { duration: 4000, icon: '✅' }
    );
  }, []);

  /**
   * Get notification statistics
   */
  const getNotificationStats = useCallback(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayNotifications = notifications.filter(n => 
      new Date(n.created_at) >= today
    );
    
    const urgentNotifications = notifications.filter(n => 
      n.priority === 'urgent' && !n.read
    );
    
    return {
      total: notifications.length,
      unread: unreadCount,
      today: todayNotifications.length,
      urgent: urgentNotifications.length,
      byType: notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {})
    };
  }, [notifications, unreadCount]);

  /**
   * Test notification functionality
   */
  const sendTestNotification = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Test toast
      showToast('This is a test notification!', 'info');
      
      // Test backend notification if authenticated
      if (isAuthenticated) {
        await enhancedNotificationService.apiClient.post('/api/notifications/test', {
          title: 'Test Notification',
          message: 'This is a test notification from SabiOps',
          type: 'info'
        });
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setError('Failed to send test notification');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  /**
   * Context value
   */
  const contextValue = {
    // State
    notifications,
    unreadCount,
    isOnline,
    isPollingActive,
    permission,
    deviceToken,
    pushSupported,
    firebaseSupported,
    error,
    isLoading,
    
    // Actions
    requestPermission,
    disableNotifications,
    markAsRead,
    markAllAsRead,
    clearAllNotifications,
    
    // Toast methods
    showToast,
    
    // Business methods
    showLowStockAlert,
    showPaymentReceived,
    showTrialReminder,
    showSaleSuccess,
    
    // Utility methods
    getNotificationStats,
    sendTestNotification,
    
    // Service access (for advanced usage)
    service: enhancedNotificationService
  };

  return (
    <EnhancedNotificationContext.Provider value={contextValue}>
      {children}
    </EnhancedNotificationContext.Provider>
  );
};

