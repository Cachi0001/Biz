/**
 * Push Notification Service
 * Handles web push notifications for SabiOps
 */

import { apiClient } from './apiClient';

class PushNotificationService {
  constructor() {
    this.vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Initialize push notification service
   */
  async initialize() {
    if (!this.isSupported) {
      console.warn('Push notifications are not supported in this browser');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully');

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission() {
    if (!this.isSupported) {
      return 'unsupported';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribe() {
    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      if (!this.registration) {
        await this.initialize();
      }

      // Create subscription
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      console.log('Successfully subscribed to push notifications');
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        
        // Notify server
        await this.removeSubscriptionFromServer(this.subscription.endpoint);
        
        this.subscription = null;
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently subscribed
   */
  async isSubscribed() {
    if (!this.isSupported || !this.registration) {
      return false;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return !!this.subscription;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription() {
    if (!this.isSupported || !this.registration) {
      return null;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  /**
   * Send subscription data to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(subscription.getKey('auth'))
        }
      };

      await apiClient.post('/api/notifications/subscribe', subscriptionData);
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  async removeSubscriptionFromServer(endpoint) {
    try {
      await apiClient.post('/api/notifications/unsubscribe', { endpoint });
    } catch (error) {
      console.error('Failed to remove subscription from server:', error);
      throw error;
    }
  }

  /**
   * Show local notification (fallback)
   */
  showLocalNotification(title, options = {}) {
    if (!this.isSupported) {
      return;
    }

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      requireInteraction: true,
      ...options
    };

    if (Notification.permission === 'granted') {
      new Notification(title, defaultOptions);
    }
  }

  /**
   * Handle notification click events
   */
  setupNotificationHandlers() {
    if (!this.isSupported || !this.registration) {
      return;
    }

    // Listen for notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
        const { data } = event.data;
        
        // Handle different notification types
        switch (data.type) {
          case 'low_stock':
            window.location.href = '/products';
            break;
          case 'payment':
            window.location.href = data.url || '/invoices';
            break;
          case 'trial_expiry':
            window.location.href = '/pricing';
            break;
          case 'team_invitation':
            window.location.href = '/team';
            break;
          default:
            window.location.href = '/dashboard';
        }
      }
    });
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(limit = 20) {
    try {
      const response = await apiClient.get('/api/notifications/history', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      return { notifications: [] };
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId) {
    try {
      await apiClient.post(`/api/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Get notification preferences
   */
  async getNotificationPreferences() {
    try {
      const response = await apiClient.get('/api/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return {};
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(preferences) {
    try {
      const response = await apiClient.put('/api/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Test notification (for development)
   */
  async sendTestNotification() {
    try {
      await apiClient.post('/api/notifications/test');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  // Utility functions

  /**
   * Convert VAPID key to Uint8Array
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

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Check if notifications are supported
   */
  static isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Get current permission status
   */
  static getPermissionStatus() {
    if (!PushNotificationService.isSupported()) {
      return 'unsupported';
    }
    return Notification.permission;
  }
}

// Create and export singleton instance
export const pushNotificationService = new PushNotificationService();
export default PushNotificationService;

