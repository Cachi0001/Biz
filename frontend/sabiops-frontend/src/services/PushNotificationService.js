/**
 * Push Notification Service
 * Handles device token registration and push notification management
 */

import api from './api';

class PushNotificationService {
  static isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  /**
   * Request notification permission from the user
   * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
   */
  static async requestPermission() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  /**
   * Register device token for push notifications
   * @param {string} token - FCM token or web push subscription
   * @param {string} deviceType - 'web', 'android', 'ios', 'desktop'
   * @param {Object} deviceInfo - Additional device information
   * @returns {Promise<Object>} Registration result
   */
  static async registerDeviceToken(token, deviceType = 'web', deviceInfo = {}) {
    try {
      const response = await api.post('/push-notifications/register-token', {
        token: token,
        device_type: deviceType,
        device_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          timestamp: new Date().toISOString(),
          ...deviceInfo
        }
      });

      console.log('Device token registered successfully:', response.data);
      return response.data;

    } catch (error) {
      console.error('Failed to register device token:', error);
      throw error;
    }
  }

  /**
   * Get all registered device tokens for the current user
   * @returns {Promise<Object>} List of device tokens
   */
  static async getUserTokens() {
    try {
      const response = await api.get('/push-notifications/tokens');
      return response.data;

    } catch (error) {
      console.error('Failed to get user tokens:', error);
      throw error;
    }
  }

  /**
   * Remove a specific device token
   * @param {string} tokenId - Token ID to remove
   * @returns {Promise<Object>} Removal result
   */
  static async removeDeviceToken(tokenId) {
    try {
      const response = await api.delete(`/push-notifications/tokens/${tokenId}`);
      return response.data;

    } catch (error) {
      console.error('Failed to remove device token:', error);
      throw error;
    }
  }

  /**
   * Send a test push notification
   * @returns {Promise<Object>} Test result
   */
  static async sendTestNotification() {
    try {
      const response = await api.post('/push-notifications/test');
      return response.data;

    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   * @returns {Promise<Object>} User preferences
   */
  static async getNotificationPreferences() {
    try {
      const response = await api.get('/push-notifications/preferences');
      return response.data;

    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   * @param {Array} preferences - Array of preference objects
   * @returns {Promise<Object>} Update result
   */
  static async updateNotificationPreferences(preferences) {
    try {
      const response = await api.put('/push-notifications/preferences', {
        preferences: preferences
      });
      return response.data;

    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 20)
   * @returns {Promise<Object>} Notification history
   */
  static async getNotificationHistory(page = 1, limit = 20) {
    try {
      const response = await api.get(`/push-notifications/history?page=${page}&limit=${limit}`);
      return response.data;

    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  /**
   * Initialize push notifications for web
   * This is a simplified example - you'll need to implement Firebase FCM properly
   * @returns {Promise<string>} FCM token
   */
  static async initializeWebPush() {
    try {
      // Check if Firebase is available (you'll need to add Firebase SDK)
      if (typeof firebase === 'undefined' || !firebase.messaging) {
        throw new Error('Firebase messaging not available');
      }

      const messaging = firebase.messaging();

      // Request permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Get FCM token
      const token = await messaging.getToken({
        vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY // You'll need to set this
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      // Register the token with your backend
      await this.registerDeviceToken(token, 'web', {
        fcm_token: true,
        browser: this.getBrowserInfo()
      });

      // Handle foreground messages
      messaging.onMessage((payload) => {
        console.log('Foreground message received:', payload);
        this.showNotification(payload.notification);
      });

      return token;

    } catch (error) {
      console.error('Failed to initialize web push:', error);
      throw error;
    }
  }

  /**
   * Show a local notification
   * @param {Object} notification - Notification data
   */
  static showNotification(notification) {
    if (!this.isSupported()) return;

    const { title, body, icon, badge, tag } = notification;

    new Notification(title, {
      body: body,
      icon: icon || '/favicon.ico',
      badge: badge || '/favicon.ico',
      tag: tag || 'sabiops-notification',
      requireInteraction: true
    });
  }

  /**
   * Get browser information
   * @returns {Object} Browser details
   */
  static getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return {
      name: browser,
      userAgent: ua,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  /**
   * Clean up expired tokens (admin function)
   * @returns {Promise<Object>} Cleanup result
   */
  static async cleanupExpiredTokens() {
    try {
      const response = await api.post('/push-notifications/cleanup');
      return response.data;

    } catch (error) {
      console.error('Failed to cleanup expired tokens:', error);
      throw error;
    }
  }
}

export default PushNotificationService;