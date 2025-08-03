/**
 * Real-time Notification Service for SabiOps
 * Handles toast notifications, real-time updates, and business alerts
 */

import { toast } from 'react-hot-toast';
import { post, get, put } from './api';
import navigationHandler from '../utils/navigationHandler';

class NotificationService {
  constructor() {
    this.pushSubscription = null;
    this.vapidPublicKey = 'your-vapid-public-key'; // Will be configured
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = [];
    this.pollingInterval = null;
    
    // Firebase conflict prevention
    this.lastNotificationCheck = 0;
    this.duplicateDetectionWindow = 5000; // 5 seconds
    this.recentNotifications = new Map();
    this.consecutiveErrors = 0;
    this.maxConsecutiveErrors = 5;
    this.isFirebaseDisabled = false;
    this.debounceTimeout = null;
    
    this.initializePushNotifications();
    // Don't start polling automatically - let components start it when user is authenticated
  }

  // Toast Notifications
  showToast(message, type = 'default', options = {}) {
    const defaultOptions = {
      duration: 4000,
      position: 'top-right',
      ...options
    };

    switch (type) {
      case 'success':
        return toast.success(message, {
          ...defaultOptions,
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#fff',
          },
        });

      case 'error':
        return toast.error(message, {
          ...defaultOptions,
          icon: '❌',
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        });

      case 'warning':
        return toast(message, {
          ...defaultOptions,
          icon: '⚠️',
          style: {
            background: '#F59E0B',
            color: '#fff',
          },
        });

      case 'info':
        return toast(message, {
          ...defaultOptions,
          icon: 'ℹ️',
          style: {
            background: '#3B82F6',
            color: '#fff',
          },
        });

      default:
        return toast(message, defaultOptions);
    }
  }

  // Business-critical notifications only
  showSaleSuccess(saleData) {
    // Only show toast, no bell notification for regular sales
    const message = `Sale of ₦${saleData.total_amount.toLocaleString()} recorded successfully!`;
    
    this.showToast(message, 'success', {
      duration: 4000,
      icon: '✅'
    });
  }

  // Enhanced business alert method
  showBusinessAlert(type, data) {
    const { title, message, urgent = false, action_url, action_params } = data;
    
    // Determine toast type and duration based on urgency and type
    let toastType = 'info';
    let duration = 6000;
    
    switch (type) {
      case 'low_stock':
        toastType = 'warning';
        duration = 8000;
        break;
      case 'out_of_stock':
        toastType = 'error';
        duration = 10000;
        break;
      case 'nearing_limit':
        toastType = 'warning';
        duration = 8000;
        break;
      case 'overdue_invoice':
        toastType = urgent ? 'error' : 'warning';
        duration = urgent ? 12000 : 8000;
        break;
      default:
        toastType = 'info';
        duration = 6000;
    }

    // Show toast with click-to-navigate functionality
    if (window.addToast) {
      window.addToast({
        type: toastType,
        title,
        message,
        duration,
        clickAction: action_url ? {
          url: action_url,
          params: action_params
        } : null,
        action: action_url ? 'Click to view' : null
      });
    } else {
      // Fallback to regular toast
      this.showToast(`${title}: ${message}`, toastType, { duration });
    }
  }

  showLowStockAlert(productName, quantity, threshold = 5, productId = null) {
    // Show enhanced toast notification
    this.showBusinessAlert('low_stock', {
      title: 'Low Stock Alert',
      message: `${productName} - Only ${quantity} items remaining`,
      productName,
      quantity,
      threshold,
      productId,
      action_url: '/products',
      action_params: { highlight: productId, filter: 'low_stock' }
    });

    // Add to notification bell
    this.addNotification({
      type: 'low_stock',
      title: 'Low Stock Alert',
      message: `${productName} - ${quantity} items remaining`,
      action_url: '/products',
      priority: quantity <= 2 ? 'urgent' : 'high',
      data: { productName, quantity, threshold, productId }
    });
  }

  showPaymentReceived(invoiceNumber, amount) {
    this.showToast(
      `Payment of ₦${amount.toLocaleString()} received for ${invoiceNumber}`,
      'success',
      {
        duration: 6000,
        icon: '💳'
      }
    );

    // Add to notification bell
    this.addNotification({
      type: 'payment',
      title: 'Payment Received',
      message: `₦${amount.toLocaleString()} for ${invoiceNumber}`,
      action_url: '/payments',
      data: { invoiceNumber, amount }
    });
  }

  showTrialReminder(daysLeft) {
    this.showToast(
      `Your trial expires in ${daysLeft} days. Upgrade now!`,
      'warning',
      {
        duration: 10000,
        icon: '⏰'
      }
    );

    // Add to notification bell for trial reminders
    this.addNotification({
      type: 'trial',
      title: 'Trial Expiring Soon',
      message: `Your trial expires in ${daysLeft} days. Upgrade to continue using all features.`,
      action_url: '/subscription',
      data: { daysLeft }
    });
  }

  showOutOfStockAlert(productName, productId = null) {
    // Show urgent toast notification
    this.showBusinessAlert('out_of_stock', {
      title: 'Out of Stock Alert',
      message: `${productName} is completely out of stock`,
      productName,
      productId,
      action_url: '/products',
      action_params: { highlight: productId, filter: 'out_of_stock' },
      urgent: true
    });

    // Add to notification bell
    this.addNotification({
      type: 'out_of_stock',
      title: 'Out of Stock',
      message: `${productName} is completely out of stock`,
      action_url: '/products',
      priority: 'urgent',
      data: { productName, productId }
    });
  }

  showDuePaymentAlert(invoiceNumber, amount, daysOverdue) {
    this.showToast(
      `Payment overdue: ${invoiceNumber} (${daysOverdue} days)`,
      'warning',
      {
        duration: 8000,
        icon: '💸'
      }
    );

    // Add to notification bell
    this.addNotification({
      type: 'due_payment',
      title: 'Payment Overdue',
      message: `${invoiceNumber} - ₦${amount.toLocaleString()} (${daysOverdue} days overdue)`,
      action_url: '/invoices',
      data: { invoiceNumber, amount, daysOverdue }
    });
  }

  showUsageLimitAlert(limitType, currentUsage, limit) {
    this.showToast(
      `Usage limit warning: ${currentUsage}/${limit} ${limitType} used`,
      'warning',
      {
        duration: 8000,
        icon: '⚠️'
      }
    );

    // Add to notification bell
    this.addNotification({
      type: 'usage_limit',
      title: 'Usage Limit Warning',
      message: `You've used ${currentUsage} of ${limit} ${limitType}. Consider upgrading.`,
      action_url: '/subscription',
      data: { limitType, currentUsage, limit }
    });
  }

  showNearingLimitAlert(limitType, currentUsage, limit, threshold = 0.8) {
    const percentage = Math.round((currentUsage / limit) * 100);
    
    // Show warning toast notification
    this.showBusinessAlert('nearing_limit', {
      title: 'Nearing Limit Warning',
      message: `You've used ${currentUsage} of ${limit} ${limitType} (${percentage}%)`,
      limitType,
      currentUsage,
      limit,
      percentage,
      action_url: '/subscription',
      action_params: { highlight: limitType }
    });

    // Add to notification bell
    this.addNotification({
      type: 'nearing_limit',
      title: 'Nearing Limit',
      message: `${percentage}% of ${limitType} limit used (${currentUsage}/${limit})`,
      action_url: '/subscription',
      priority: percentage >= 90 ? 'high' : 'medium',
      data: { limitType, currentUsage, limit, percentage, threshold }
    });
  }

  showOverdueInvoiceAlert(invoiceNumber, amount, daysOverdue, invoiceId = null) {
    // Show urgent toast notification for overdue invoices
    this.showBusinessAlert('overdue_invoice', {
      title: 'Invoice Overdue',
      message: `${invoiceNumber} - ₦${amount.toLocaleString()} (${daysOverdue} days overdue)`,
      invoiceNumber,
      amount,
      daysOverdue,
      invoiceId,
      action_url: '/invoices',
      action_params: { highlight: invoiceId, filter: 'overdue' },
      urgent: daysOverdue > 30
    });

    // Add to notification bell
    this.addNotification({
      type: 'overdue_invoice',
      title: 'Invoice Overdue',
      message: `${invoiceNumber} - ₦${amount.toLocaleString()} (${daysOverdue} days overdue)`,
      action_url: '/invoices',
      priority: daysOverdue > 30 ? 'urgent' : 'high',
      data: { invoiceNumber, amount, daysOverdue, invoiceId }
    });
  }

  showNetLossAlert(amount, period) {
    this.showToast(
      `Net loss alert: -₦${amount.toLocaleString()} this ${period}`,
      'error',
      {
        duration: 10000,
        icon: '📉'
      }
    );

    // Add to notification bell
    this.addNotification({
      type: 'net_loss',
      title: 'Net Loss Alert',
      message: `Your business has a net loss of ₦${amount.toLocaleString()} this ${period}`,
      action_url: '/dashboard',
      data: { amount, period }
    });
  }

  showOfflineMode() {
    this.showToast(
      'You are offline. Changes will sync when connection is restored.',
      'info',
      {
        duration: 5000,
        icon: '📡'
      }
    );
  }

  showSyncSuccess() {
    this.showToast(
      'Data synced successfully!',
      'success',
      {
        duration: 3000,
        icon: '🔄'
      }
    );
  }

  // Push Notifications
  async initializePushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      // const registration = await navigator.serviceWorker.register("/sw.js");
      // console.log("Service Worker registered:", registration);

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPushPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      this.showToast(
        'Push notifications are blocked. Please enable them in browser settings.',
        'warning'
      );
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      this.showToast('Push notifications enabled!', 'success');
      await this.subscribeToPush();
      return true;
    } else {
      this.showToast('Push notifications denied', 'warning');
      return false;
    }
  }

  async subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.pushSubscription = subscription;

      // Send subscription to backend
      await post('/notifications/push/subscribe', {
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

  async unsubscribeFromPush() {
    if (this.pushSubscription) {
      try {
        await this.pushSubscription.unsubscribe();
        await post('/notifications/push/unsubscribe');
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

  // Real-time notification management
  startPolling() {
    // Poll for new notifications every 30 seconds
    this.pollingInterval = setInterval(() => {
      this.checkForNewNotifications();
    }, 30000);

    // Initial check
    this.checkForNewNotifications();
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async checkForNewNotifications() {
    // Don't fetch notifications if user is not authenticated
    const token = localStorage.getItem('token');
    if (!token || this.isFirebaseDisabled) {
      return;
    }

    // Debounce rapid calls
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }

    this.debounceTimeout = setTimeout(async () => {
      try {
        // Prevent too frequent checks
        const now = Date.now();
        if (now - this.lastNotificationCheck < 1000) {
          return;
        }
        this.lastNotificationCheck = now;

        const data = await this.fetchNotifications();
        const newNotifications = data.notifications || [];
        const newUnreadCount = data.unread_count || 0;

        // Check for new notifications with duplicate detection
        const previousIds = this.notifications.map(n => n.id);
        const actuallyNewNotifications = newNotifications.filter(n => {
          if (previousIds.includes(n.id)) return false;
          
          // Check for duplicates in recent notifications
          const notificationKey = `${n.type}-${n.title}-${n.message}`;
          const recentTime = this.recentNotifications.get(notificationKey);
          if (recentTime && (now - recentTime) < this.duplicateDetectionWindow) {
            return false;
          }
          
          // Mark as recent
          this.recentNotifications.set(notificationKey, now);
          return true;
        });

        // Show toast for new notifications
        actuallyNewNotifications.forEach(notification => {
          this.showNotificationToast(notification);
        });

        // Update state
        this.notifications = newNotifications;
        this.unreadCount = newUnreadCount;

        // Reset error counter on success
        this.consecutiveErrors = 0;

        // Notify listeners
        this.notifyListeners();

        // Clean up old recent notifications
        this.cleanupRecentNotifications();

      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        this.consecutiveErrors++;

        // If too many consecutive errors, disable Firebase polling
        if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
          console.warn('Too many consecutive notification errors, disabling Firebase polling');
          this.isFirebaseDisabled = true;
          this.stopPolling();
          
          // Try to re-enable after 5 minutes
          setTimeout(() => {
            this.isFirebaseDisabled = false;
            this.consecutiveErrors = 0;
            this.startPollingIfAuthenticated();
          }, 300000);
        }

        // If it's an auth error, stop polling to prevent infinite requests
        if (error.response?.status === 401 || error.response?.status === 403) {
          this.stopPolling();
        }
      }
    }, 500); // 500ms debounce
  }

  showNotificationToast(notification) {
    const { type, title, message } = notification;

    switch (type) {
      case 'low_stock':
        this.showLowStockAlert(title, message);
        break;
      case 'payment_received':
        this.showPaymentReceived(title, message);
        break;
      case 'sale_completed':
        this.showSaleNotification(message, title);
        break;
      case 'trial_reminder':
        this.showTrialReminder(message);
        break;
      default:
        this.showToast(`${title}: ${message}`, type || 'info');
    }
  }

  // Add notification to the bell
  addNotification(notification) {
    const newNotification = {
      id: Date.now() + Math.random(),
      read: false,
      timestamp: new Date().toISOString(),
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.unreadCount++;

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.notifyListeners();
    return newNotification;
  }

  // Remove notification
  removeNotification(notificationId) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      this.unreadCount--;
    }
    
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.notifyListeners();
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();
  }

  // Listener management for components
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        notifications: this.notifications,
        unreadCount: this.unreadCount
      });
    });
  }

  // API Integration
  async fetchNotifications(unreadOnly = false) {
    try {
      const response = await get(`/notifications?unread_only=${unreadOnly}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Return empty data instead of mock data
      return {
        notifications: [],
        unread_count: 0
      };
    }
  }

  // Register FCM token with new backend
  async registerFCMToken(fcmToken, deviceType = 'web', deviceInfo = {}) {
    try {
      const response = await post('/notifications/push/register', {
        fcm_token: fcmToken,
        device_type: deviceType,
        device_info: deviceInfo
      });
      
      if (response.success) {
        this.showToast('Push notifications enabled!', 'success');
        return true;
      } else {
        throw new Error(response.message || 'Failed to register FCM token');
      }
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      this.showToast('Failed to enable push notifications', 'error');
      return false;
    }
  }

  async markAsRead(notificationId) {
    try {
      await put(`/notifications/${notificationId}/read`);

      // Update local state
      this.notifications = this.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);

      // Update local state even if API fails (for development)
      this.notifications = this.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      this.notifyListeners();

      return false;
    }
  }

  async markAllAsRead() {
    try {
      await put('/notifications/mark-all-read');

      // Update local state
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.unreadCount = 0;
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);

      // Update local state even if API fails
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
      this.unreadCount = 0;
      this.notifyListeners();

      return false;
    }
  }

  // Navigation helper with enhanced visual feedback
  navigateToNotification(notification) {
    if (notification.navigation_url || notification.action_url) {
      // Mark as read when navigating
      this.markAsRead(notification.id);

      // Use the navigation_url from new backend or fallback to action_url
      const targetUrl = notification.navigation_url || notification.action_url;

      // Enhanced navigation with visual effects
      const options = {
        highlight: notification.data?.productId || notification.data?.invoiceId || notification.data?.product_id || notification.data?.invoice_id,
        filter: this.getFilterForNotificationType(notification.type),
        params: notification.data,
        callback: () => {
          // Additional callback for specific notification types
          this.handlePostNavigationEffects(notification);
        }
      };

      navigationHandler.navigateWithFeedback(targetUrl, options);
    }
  }

  // Handle post-navigation effects for specific notification types
  handlePostNavigationEffects(notification) {
    // Store notification context for the target page
    sessionStorage.setItem('notificationContext', JSON.stringify({
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      timestamp: Date.now()
    }));

    // Show success toast
    setTimeout(() => {
      this.showToast('Navigated from notification', 'info', { duration: 2000 });
    }, 1000);
  }

  // Get appropriate filter for notification type
  getFilterForNotificationType(type) {
    switch (type) {
      case 'low_stock':
        return 'low_stock';
      case 'out_of_stock':
        return 'out_of_stock';
      case 'overdue_invoice':
        return 'overdue';
      case 'nearing_limit':
        return 'limits';
      default:
        return null;
    }
  }

  // Authentication-aware polling control
  startPollingIfAuthenticated() {
    const token = localStorage.getItem('token');
    if (token && !this.pollingInterval && !this.isFirebaseDisabled) {
      this.startPolling();
    }
  }

  stopPollingOnLogout() {
    this.stopPolling();
    // Clear notifications when user logs out
    this.notifications = [];
    this.unreadCount = 0;
    this.notifyListeners();
  }

  // Clean up old recent notifications to prevent memory leaks
  cleanupRecentNotifications() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentNotifications.entries()) {
      if (now - timestamp > this.duplicateDetectionWindow * 2) {
        this.recentNotifications.delete(key);
      }
    }
  }

  // Cleanup
  destroy() {
    this.stopPolling();
    this.listeners = [];
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.recentNotifications.clear();
  }

  async sendTestNotification(title, message, type = 'info') {
    try {
      await post('/notifications/send', { title, message, type });
      this.showToast('Test notification sent!', 'success');
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      this.showToast('Failed to send test notification', 'error');
      return false;
    }
  }

  // Utility functions
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
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;