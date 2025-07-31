/**
 * Upgrade Notification Service
 * Manages subscription upgrade prompts and notifications
 */

import { api } from './api';

class UpgradeNotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = new Set();
  }

  /**
   * Fetch upgrade notifications for the current user
   */
  async fetchNotifications() {
    try {
      const response = await api.get('/subscription/upgrade-notifications');
      const data = response.data.data || response.data;
      
      this.notifications = data.notifications || [];
      this.notifyListeners();
      
      return this.notifications;
    } catch (error) {
      console.error('[UPGRADE] Failed to fetch notifications:', error);
      return [];
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      await api.put(`/subscription/notifications/${notificationId}/read`);
      
      this.notifications = this.notifications.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      );
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('[UPGRADE] Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(notificationId) {
    try {
      await api.delete(`/subscription/notifications/${notificationId}`);
      
      this.notifications = this.notifications.filter(notif => 
        notif.id !== notificationId
      );
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('[UPGRADE] Failed to dismiss notification:', error);
      return false;
    }
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications() {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get upgrade suggestions
   */
  getUpgradeSuggestions() {
    return this.notifications.filter(n => n.type === 'upgrade_suggestion');
  }

  /**
   * Check if user has unread notifications
   */
  hasUnreadNotifications() {
    return this.getUnreadNotifications().length > 0;
  }

  /**
   * Check if user has upgrade suggestions
   */
  hasUpgradeSuggestions() {
    return this.getUpgradeSuggestions().length > 0;
  }

  /**
   * Get notification statistics
   */
  getStats() {
    const unread = this.getUnreadNotifications().length;
    const suggestions = this.getUpgradeSuggestions().length;
    
    return {
      total: this.notifications.length,
      unread,
      suggestions,
      hasUnread: unread > 0,
      hasSuggestions: suggestions > 0
    };
  }

  /**
   * Add event listener for notification changes
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          notifications: this.notifications,
          stats: this.getStats()
        });
      } catch (error) {
        console.error('[UPGRADE] Listener error:', error);
      }
    });
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    this.notifications = [];
    this.notifyListeners();
  }
}

// Create singleton instance
const upgradeNotificationService = new UpgradeNotificationService();

export default upgradeNotificationService; 