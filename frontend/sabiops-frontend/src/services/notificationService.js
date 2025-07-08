/**
 * Notification Service for Bizflow SME Nigeria
 * Handles both toast notifications and push notifications
 */

import { toast } from 'react-hot-toast';
import apiService from './api';

class NotificationService {
  constructor() {
    this.pushSubscription = null;
    this.vapidPublicKey = 'your-vapid-public-key'; // Will be configured
    this.initializePushNotifications();
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
      await apiService.post('/notifications/push/subscribe', {
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
        await apiService.post('/notifications/push/unsubscribe');
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

  // API Integration
  async fetchNotifications(unreadOnly = false) {
    try {
      const response = await apiService.get(`/notifications?unread_only=${unreadOnly}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return { notifications: [], unread_count: 0 };
    }
  }

  async markAsRead(notificationId) {
    try {
      await apiService.put(`/notifications/${notificationId}/read`);
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  async sendTestNotification(title, message, type = 'info') {
    try {
      await apiService.post('/notifications/send', { title, message, type });
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