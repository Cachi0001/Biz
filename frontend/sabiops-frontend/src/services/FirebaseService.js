/**
 * FirebaseService - Handles Firebase push notifications for SabiOps
 * Integrates with existing Firebase configuration and backend notification system
 * Provides fallback for browsers that don't support Firebase messaging
 */

import { messaging, getToken, onMessage, VAPID_KEY } from '../firebase';
import FallbackNotificationService from './fallbackNotificationService';

class FirebaseService {
  static instance = null;
  static isInitialized = false;
  static currentToken = null;
  static messageHandlers = [];
  static usingFallback = false;

  /**
   * Get singleton instance
   */
  static getInstance() {
    if (!this.instance) {
      this.instance = new FirebaseService();
    }
    return this.instance;
  }

  /**
   * Initialize Firebase messaging with fallback support
   */
  static async initialize() {
    if (this.isInitialized) {
      return this.currentToken;
    }

    try {
      console.log('FirebaseService: Initializing...');

      // Check if messaging is supported
      if (!messaging) {
        console.warn('FirebaseService: Firebase messaging not supported in this browser, using fallback notification system');
        return await this.initializeFallbackNotifications();
      }

      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('FirebaseService: Notification permission not granted, using fallback notification system');
        return await this.initializeFallbackNotifications();
      }

      // Get FCM token
      const token = await this.getRegistrationToken();
      if (token) {
        this.currentToken = token;
        console.log('FirebaseService: FCM token obtained:', token);

        // Store token in backend
        await this.storeTokenInBackend(token);

        // Set up message listener
        this.setupMessageListener();

        this.isInitialized = true;
        return token;
      } else {
        console.warn('FirebaseService: Failed to get FCM registration token, using fallback notification system');
        return await this.initializeFallbackNotifications();
      }

    } catch (error) {
      console.error('FirebaseService: Initialization failed:', error);
      console.warn('FirebaseService: Using fallback notification system');
      return await this.initializeFallbackNotifications();
    }
  }
  
  /**
   * Initialize fallback notification system when Firebase messaging is not available
   */
  static async initializeFallbackNotifications() {
    try {
      console.log('FirebaseService: Initializing fallback notification system...');
      
      // Initialize the fallback notification service
      FallbackNotificationService.initialize();
      
      // Transfer any existing message handlers to the fallback service
      this.messageHandlers.forEach(handler => {
        FallbackNotificationService.addHandler(handler);
      });
      
      // Start polling for notifications
      FallbackNotificationService.startPolling(
        () => this.getNotifications(5, 0),
        30000 // Poll every 30 seconds
      );
      
      this.usingFallback = true;
      this.isInitialized = true;
      return null;
    } catch (error) {
      console.error('FirebaseService: Fallback initialization failed:', error);
      this.usingFallback = true;
      this.isInitialized = true;
      return null;
    }
  }

  /**
   * Request notification permission
   */
  static async requestPermission() {
    try {
      console.log('FirebaseService: Requesting notification permission...');

      if (!('Notification' in window)) {
        throw new Error('This browser does not support notifications');
      }

      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      console.log('FirebaseService: Notification permission:', permission);
      return permission;

    } catch (error) {
      console.error('FirebaseService: Permission request failed:', error);
      throw error;
    }
  }

  /**
   * Get FCM registration token
   */
  static async getRegistrationToken() {
    try {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('FirebaseService: Registration token generated');
        return token;
      } else {
        console.warn('FirebaseService: No registration token available');
        return null;
      }

    } catch (error) {
      console.error('FirebaseService: Failed to get registration token:', error);
      throw error;
    }
  }

  /**
   * Store FCM token in backend
   */
  static async storeTokenInBackend(token) {
    try {
      console.log('FirebaseService: Storing token in backend...');

      // Import API service to use correct backend URL
      const { post } = await import('./api.js');
      
      const response = await post('/notifications/register-token', {
        fcm_token: token,
        device_type: 'web',
        user_agent: navigator.userAgent
      });

      // API service handles errors automatically

      console.log('FirebaseService: Token stored successfully');

    } catch (error) {
      console.error('FirebaseService: Failed to store token:', error);
      // Don't throw error here as it's not critical for initialization
    }
  }

  /**
   * Set up foreground message listener
   */
  static setupMessageListener() {
    try {
      console.log('FirebaseService: Setting up message listener...');

      onMessage(messaging, (payload) => {
        console.log('FirebaseService: Foreground message received:', payload);

        // Extract notification data
        const notification = {
          title: payload.notification?.title || 'SabiOps Notification',
          body: payload.notification?.body || '',
          data: payload.data || {},
          timestamp: new Date().toISOString()
        };

        // Call all registered handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(notification);
          } catch (error) {
            console.error('FirebaseService: Message handler error:', error);
          }
        });

        // Show browser notification if app is not in focus
        if (document.hidden) {
          this.showBrowserNotification(notification);
        }
      });

      console.log('FirebaseService: Message listener set up successfully');

    } catch (error) {
      console.error('FirebaseService: Failed to set up message listener:', error);
    }
  }

  /**
   * Add message handler
   */
  static addMessageHandler(handler) {
    if (typeof handler === 'function') {
      this.messageHandlers.push(handler);
      console.log('FirebaseService: Message handler added');
      
      // If using fallback, also add handler to fallback service
      if (this.usingFallback) {
        FallbackNotificationService.addHandler(handler);
      }
    }
  }

  /**
   * Remove message handler
   */
  static removeMessageHandler(handler) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
      console.log('FirebaseService: Message handler removed');
      
      // If using fallback, also remove handler from fallback service
      if (this.usingFallback) {
        FallbackNotificationService.removeHandler(handler);
      }
    }
  }

  /**
   * Show browser notification
   */
  static showBrowserNotification(notification) {
    try {
      if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/sabiops.jpg', // Your app icon
          badge: '/sabiops.jpg',
          tag: 'sabiops-notification',
          requireInteraction: false,
          silent: false
        });

        // Handle notification click
        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
          
          // Navigate to relevant section if action_url exists
          if (notification.data.action_url) {
            window.location.href = notification.data.action_url;
          }
        };

        // Auto close after 5 seconds
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

    } catch (error) {
      console.error('FirebaseService: Failed to show browser notification:', error);
    }
  }

  /**
   * Send notification to specific user (backend call)
   */
  static async sendNotification(userId, title, body, data = {}) {
    try {
      console.log('FirebaseService: Sending notification to user:', userId);

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          user_id: userId,
          title: title,
          body: body,
          data: data,
          type: data.type || 'info'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('FirebaseService: Notification sent successfully:', result);
      return result;

    } catch (error) {
      console.error('FirebaseService: Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications from backend
   */
  static async getNotifications(limit = 20, offset = 0) {
    try {
      // Import API service to use correct backend URL
      const { get } = await import('./api.js');
      
      const response = await get(`/notifications?limit=${limit}&offset=${offset}`);
      const data = response.data || response;
      
      return data.data || [];

    } catch (error) {
      console.error('FirebaseService: Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      return true;

    } catch (error) {
      console.error('FirebaseService: Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead() {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return true;

    } catch (error) {
      console.error('FirebaseService: Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  static async getUnreadCount() {
    try {
      // Import API service to use correct backend URL
      const { get } = await import('./api.js');
      
      const response = await get('/notifications/unread-count');
      const result = response.data || response;
      return result.count || 0;

    } catch (error) {
      console.error('FirebaseService: Failed to get unread count:', error);
      return 0;
    }
  }

  /**
   * Create notification for business events
   */
  static async createBusinessNotification(type, title, body, actionUrl = null, data = {}) {
    try {
      const response = await fetch('/api/notifications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: type,
          title: title,
          body: body,
          action_url: actionUrl,
          data: data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const result = await response.json();
      console.log('FirebaseService: Business notification created:', result);
      return result;

    } catch (error) {
      console.error('FirebaseService: Failed to create business notification:', error);
      throw error;
    }
  }

  /**
   * Cleanup - remove token from backend
   */
  static async cleanup() {
    try {
      if (this.currentToken) {
        await fetch('/api/notifications/unregister-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            fcm_token: this.currentToken
          })
        });
      }

      // Clean up fallback service if it was being used
      if (this.usingFallback) {
        FallbackNotificationService.cleanup();
      }

      this.currentToken = null;
      this.isInitialized = false;
      this.messageHandlers = [];
      this.usingFallback = false;

    } catch (error) {
      console.error('FirebaseService: Cleanup failed:', error);
    }
  }
}

export default FirebaseService;