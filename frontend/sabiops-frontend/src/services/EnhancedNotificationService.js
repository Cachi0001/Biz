/**
 * Enhanced Real-time Notification Service for SabiOps
 * Fixes pulling issues and aligns with best practices
 * Combines toast notifications, push notifications, and real-time updates
 */

import { toast } from 'react-hot-toast';
import { apiClient } from './apiClient';
import { messaging, getToken, onMessage } from '../firebase';

class EnhancedNotificationService {
  constructor() {
    this.pushSubscription = null;
    this.vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BP2VpcX0H9VuYD8t-QWwFAyup3ikw1CqNdtlIkKhu4vxAabiqCjEcDCfj0K9-eXvr6NLmzrKUjQoTL2eSxxvOyI';
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = new Set(); // Use Set for better performance
    
    // Polling configuration
    this.pollingInterval = null;
    this.pollingIntervalMs = 30000; // 30 seconds
    this.isPollingActive = false;
    this.lastFetchTime = 0;
    this.minFetchInterval = 5000; // Minimum 5 seconds between fetches
    
    // Error handling and retry logic
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 3;
    this.retryDelay = 5000; // 5 seconds
    this.maxRetryDelay = 60000; // 1 minute
    
    // Duplicate prevention
    this.recentNotifications = new Map();
    this.duplicateWindow = 10000; // 10 seconds
    
    // Debouncing
    this.debounceTimeout = null;
    this.debounceDelay = 1000; // 1 second
    
    // Connection state
    this.isOnline = navigator.onLine;
    this.isAuthenticated = false;
    
    // Initialize
    this.initializeService();
  }

  /**
   * Initialize the notification service
   */
  async initializeService() {
    try {
      // Set up online/offline listeners
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      
      // Initialize push notifications if supported
      if (this.isPushSupported()) {
        await this.initializePushNotifications();
      }
      
      // Set up Firebase messaging if available
      if (messaging) {
        this.setupFirebaseMessaging();
      }
      
      console.log('Enhanced Notification Service initialized');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  /**
   * Check if push notifications are supported
   */
  isPushSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Initialize push notifications
   */
  async initializePushNotifications() {
    try {
      if (!this.isPushSupported()) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Setup Firebase messaging for foreground notifications
   */
  setupFirebaseMessaging() {
    try {
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        const { notification, data } = payload;
        if (notification) {
          this.showToast(notification.body, 'info', {
            title: notification.title,
            icon: notification.icon,
            duration: 6000
          });
          
          // Add to notification list
          this.addNotification({
            type: data?.type || 'firebase',
            title: notification.title,
            message: notification.body,
            data: data || {},
            source: 'firebase'
          });
        }
      });
    } catch (error) {
      console.error('Failed to setup Firebase messaging:', error);
    }
  }

  /**
   * Start notification polling with improved logic
   */
  startPolling(force = false) {
    // Don't start if already polling or not authenticated
    if ((this.isPollingActive && !force) || !this.isAuthenticated || !this.isOnline) {
      return;
    }

    this.stopPolling(); // Stop any existing polling
    this.isPollingActive = true;
    this.consecutiveErrors = 0;

    console.log('Starting notification polling');

    // Initial fetch
    this.fetchNotifications();

    // Set up interval
    this.pollingInterval = setInterval(() => {
      if (this.isAuthenticated && this.isOnline) {
        this.fetchNotifications();
      } else {
        this.stopPolling();
      }
    }, this.pollingIntervalMs);
  }

  /**
   * Stop notification polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPollingActive = false;
    console.log('Stopped notification polling');
  }

  /**
   * Fetch notifications with improved error handling and debouncing
   */
  async fetchNotifications() {
    // Debounce rapid calls
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      await this.performFetch();
    }, this.debounceDelay);
  }

  /**
   * Perform the actual fetch with rate limiting and error handling
   */
  async performFetch() {
    try {
      // Rate limiting
      const now = Date.now();
      if (now - this.lastFetchTime < this.minFetchInterval) {
        return;
      }
      this.lastFetchTime = now;

      // Check authentication
      const token = localStorage.getItem('token');
      if (!token) {
        this.setAuthenticated(false);
        return;
      }

      const response = await apiClient.get('/api/notifications');
      const data = response.data;

      if (data) {
        this.processNotificationData(data);
        this.consecutiveErrors = 0; // Reset error count on success
      }

    } catch (error) {
      this.handleFetchError(error);
    }
  }

  /**
   * Process notification data and detect new notifications
   */
  processNotificationData(data) {
    const newNotifications = data.notifications || [];
    const newUnreadCount = data.unread_count || 0;

    // Find truly new notifications
    const existingIds = new Set(this.notifications.map(n => n.id));
    const actuallyNewNotifications = newNotifications.filter(n => {
      if (existingIds.has(n.id)) return false;
      
      // Check for duplicates using content hash
      const contentHash = this.generateNotificationHash(n);
      const recentTime = this.recentNotifications.get(contentHash);
      const now = Date.now();
      
      if (recentTime && (now - recentTime) < this.duplicateWindow) {
        return false;
      }
      
      this.recentNotifications.set(contentHash, now);
      return true;
    });

    // Show toasts for new notifications
    actuallyNewNotifications.forEach(notification => {
      this.showNotificationToast(notification);
    });

    // Update state
    this.notifications = newNotifications;
    this.unreadCount = newUnreadCount;

    // Notify listeners
    this.notifyListeners();

    // Clean up old duplicate tracking
    this.cleanupDuplicateTracking();
  }

  /**
   * Handle fetch errors with exponential backoff
   */
  handleFetchError(error) {
    this.consecutiveErrors++;
    console.error(`Notification fetch error (${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`, error);

    // If authentication error, stop polling
    if (error.response?.status === 401 || error.response?.status === 403) {
      this.setAuthenticated(false);
      return;
    }

    // If too many consecutive errors, implement exponential backoff
    if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
      this.stopPolling();
      
      const backoffDelay = Math.min(
        this.retryDelay * Math.pow(2, this.consecutiveErrors - this.maxConsecutiveErrors),
        this.maxRetryDelay
      );

      console.warn(`Too many errors, backing off for ${backoffDelay}ms`);
      
      setTimeout(() => {
        if (this.isAuthenticated && this.isOnline) {
          this.startPolling(true);
        }
      }, backoffDelay);
    }
  }

  /**
   * Generate hash for notification content to detect duplicates
   */
  generateNotificationHash(notification) {
    return `${notification.type}-${notification.title}-${notification.message}`;
  }

  /**
   * Clean up old duplicate tracking entries
   */
  cleanupDuplicateTracking() {
    const now = Date.now();
    for (const [hash, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > this.duplicateWindow * 2) {
        this.recentNotifications.delete(hash);
      }
    }
  }

  /**
   * Set authentication status and manage polling
   */
  setAuthenticated(isAuthenticated) {
    const wasAuthenticated = this.isAuthenticated;
    this.isAuthenticated = isAuthenticated;

    if (isAuthenticated && !wasAuthenticated) {
      // User logged in, start polling
      this.startPolling();
    } else if (!isAuthenticated && wasAuthenticated) {
      // User logged out, stop polling and clear data
      this.stopPolling();
      this.clearNotifications();
    }
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    console.log('Connection restored');
    
    if (this.isAuthenticated) {
      this.startPolling();
      this.showToast('Connection restored', 'success', { duration: 3000 });
    }
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    console.log('Connection lost');
    
    this.stopPolling();
    this.showToast('You are offline. Changes will sync when connection is restored.', 'warning', {
      duration: 5000
    });
  }

  /**
   * Show toast notification with enhanced styling
   */
  showToast(message, type = 'default', options = {}) {
    const defaultOptions = {
      duration: 4000,
      position: 'top-right',
      ...options
    };

    const toastConfig = {
      success: {
        icon: '✅',
        style: { background: '#10B981', color: '#fff' }
      },
      error: {
        icon: '❌',
        style: { background: '#EF4444', color: '#fff' }
      },
      warning: {
        icon: '⚠️',
        style: { background: '#F59E0B', color: '#fff' }
      },
      info: {
        icon: 'ℹ️',
        style: { background: '#3B82F6', color: '#fff' }
      }
    };

    const config = toastConfig[type];
    
    if (config) {
      return toast[type === 'error' ? 'error' : type === 'success' ? 'success' : 'default'](message, {
        ...defaultOptions,
        ...config
      });
    }

    return toast(message, defaultOptions);
  }

  /**
   * Show notification-specific toast
   */
  showNotificationToast(notification) {
    const { type, title, message } = notification;

    switch (type) {
      case 'low_stock':
        this.showToast(`${title}: ${message}`, 'warning', {
          duration: 8000,
          icon: '📦'
        });
        break;
      
      case 'payment':
        this.showToast(`${title}: ${message}`, 'success', {
          duration: 6000,
          icon: '💳'
        });
        break;
      
      case 'trial':
        this.showToast(`${title}: ${message}`, 'warning', {
          duration: 10000,
          icon: '⏰'
        });
        break;
      
      case 'overdue_invoice':
        this.showToast(`${title}: ${message}`, 'error', {
          duration: 8000,
          icon: '💸'
        });
        break;
      
      default:
        this.showToast(`${title}: ${message}`, 'info', {
          duration: 5000
        });
    }
  }

  /**
   * Add notification to local state
   */
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      read: false,
      created_at: new Date().toISOString(),
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.unreadCount++;

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.notifyListeners();
    return newNotification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      await apiClient.put(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      this.notifications = this.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      
      // Update local state anyway for better UX
      this.notifications = this.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyListeners();
      
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      await apiClient.put('/api/notifications/mark-all-read');
      
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.unreadCount = 0;
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      
      // Update local state anyway
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.unreadCount = 0;
      this.notifyListeners();
      
      return false;
    }
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();
  }

  /**
   * Request push notification permission
   */
  async requestPushPermission() {
    if (!this.isPushSupported()) {
      this.showToast('Push notifications not supported', 'warning');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      this.showToast('Push notifications are blocked. Please enable them in browser settings.', 'warning');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        this.showToast('Push notifications enabled!', 'success');
        await this.subscribeToPush();
        return true;
      } else {
        this.showToast('Push notifications denied', 'warning');
        return false;
      }
    } catch (error) {
      console.error('Failed to request push permission:', error);
      this.showToast('Failed to enable push notifications', 'error');
      return false;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.pushSubscription = subscription;

      // Send subscription to backend
      await apiClient.post('/api/notifications/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      });

      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      this.showToast('Failed to enable push notifications', 'error');
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush() {
    if (this.pushSubscription) {
      try {
        await this.pushSubscription.unsubscribe();
        await apiClient.post('/api/notifications/push/unsubscribe');
        this.pushSubscription = null;
        this.showToast('Push notifications disabled', 'info');
        return true;
      } catch (error) {
        console.error('Push unsubscribe failed:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Add listener for notification updates
   */
  addListener(callback) {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state changes
   */
  notifyListeners() {
    const data = {
      notifications: this.notifications,
      unreadCount: this.unreadCount,
      isOnline: this.isOnline,
      isPollingActive: this.isPollingActive
    };

    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  /**
   * Get current notification state
   */
  getState() {
    return {
      notifications: this.notifications,
      unreadCount: this.unreadCount,
      isOnline: this.isOnline,
      isPollingActive: this.isPollingActive,
      isAuthenticated: this.isAuthenticated
    };
  }

  /**
   * Business-specific notification methods
   */
  showLowStockAlert(productName, quantity, threshold = 5) {
    this.showToast(`Low Stock: ${productName} - Only ${quantity} items remaining`, 'warning', {
      duration: 8000,
      icon: '📦'
    });

    this.addNotification({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productName} - ${quantity} items remaining`,
      data: { productName, quantity, threshold },
      priority: quantity <= 2 ? 'urgent' : 'high'
    });
  }

  showPaymentReceived(invoiceNumber, amount) {
    this.showToast(`Payment of ₦${amount.toLocaleString()} received for ${invoiceNumber}`, 'success', {
      duration: 6000,
      icon: '💳'
    });

    this.addNotification({
      type: 'payment',
      title: 'Payment Received',
      message: `₦${amount.toLocaleString()} for ${invoiceNumber}`,
      data: { invoiceNumber, amount }
    });
  }

  showTrialReminder(daysLeft) {
    this.showToast(`Your trial expires in ${daysLeft} days. Upgrade now!`, 'warning', {
      duration: 10000,
      icon: '⏰'
    });

    this.addNotification({
      type: 'trial',
      title: 'Trial Expiring Soon',
      message: `Your trial expires in ${daysLeft} days`,
      data: { daysLeft },
      priority: daysLeft <= 1 ? 'urgent' : 'high'
    });
  }

  /**
   * Utility functions
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopPolling();
    this.listeners.clear();
    
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.recentNotifications.clear();
    
    // Remove event listeners
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    
    console.log('Enhanced Notification Service destroyed');
  }
}

// Create and export singleton instance
export const enhancedNotificationService = new EnhancedNotificationService();
export default enhancedNotificationService;

