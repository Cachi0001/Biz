/**
 * Real-time Notification Service for SabiOps
 * Handles toast notifications, real-time updates, and business alerts
 */

import { toast } from 'react-hot-toast';
import { post, get, put } from './api';

class NotificationService {
  constructor() {
    this.pushSubscription = null;
    this.vapidPublicKey = 'your-vapid-public-key'; // Will be configured
    this.notifications = [];
    this.unreadCount = 0;
    this.listeners = [];
    this.pollingInterval = null;
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

  // Business-specific toast notifications
  showSaleNotification(amount, customerName = '') {
    const message = customerName
      ? `New sale of ₦${amount.toLocaleString()} to ${customerName}!`
      : `New sale of ₦${amount.toLocaleString()} recorded!`;

    this.showToast(message, 'success', {
      duration: 6000,
      icon: '💰'
    });
  }

  showLowStockAlert(productName, quantity) {
    this.showToast(
      `Low stock alert: ${productName} (${quantity} items left)`,
      'warning',
      {
        duration: 8000,
        icon: '📦'
      }
    );
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
    if (!token) {
      return;
    }

    try {
      const data = await this.fetchNotifications();
      const newNotifications = data.notifications || [];
      const newUnreadCount = data.unread_count || 0;

      // Check for new notifications
      const previousIds = this.notifications.map(n => n.id);
      const actuallyNewNotifications = newNotifications.filter(n => !previousIds.includes(n.id));

      // Show toast for new notifications
      actuallyNewNotifications.forEach(notification => {
        this.showNotificationToast(notification);
      });

      // Update state
      this.notifications = newNotifications;
      this.unreadCount = newUnreadCount;

      // Notify listeners
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // If it's an auth error, stop polling to prevent infinite requests
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.stopPolling();
      }
    }
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
      const response = await get(`/notifications/?unread_only=${unreadOnly}`);
      return response.data || response;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Return mock data for development
      return this.getMockNotifications();
    }
  }

  getMockNotifications() {
    // Generate realistic mock notifications for development
    const mockNotifications = [
      {
        id: 1,
        type: 'low_stock',
        title: 'iPhone 13 Pro',
        message: '2 items left',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        read: false,
        action_url: '/products'
      },
      {
        id: 2,
        type: 'sale_completed',
        title: 'John Doe',
        message: '25000',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        read: false,
        action_url: '/sales'
      },
    ];

    const unreadCount = mockNotifications.filter(n => !n.read).length;

    return {
      notifications: mockNotifications,
      unread_count: unreadCount
    };
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

  // Navigation helper
  navigateToNotification(notification) {
    if (notification.action_url) {
      // Mark as read when navigating
      this.markAsRead(notification.id);

      // Navigate to the relevant page
      window.location.href = notification.action_url;
    }
  }

  // Authentication-aware polling control
  startPollingIfAuthenticated() {
    const token = localStorage.getItem('token');
    if (token && !this.pollingInterval) {
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

  // Cleanup
  destroy() {
    this.stopPolling();
    this.listeners = [];
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