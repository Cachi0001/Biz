/**
 * Upgrade Notifications Hook
 * Manages upgrade prompts and subscription notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export function useUpgradeNotifications(options = {}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadCount: 0,
    upgradeSuggestions: 0
  });

  const { 
    autoRefresh = true,
    refreshInterval = 60000 // 1 minute
  } = options;
  
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await api.get('/subscription/upgrade-notifications');
      const data = response.data.data || response.data;

      setNotifications(data.notifications || []);
      setStats({
        totalNotifications: data.total || 0,
        unreadCount: data.unread || 0,
        upgradeSuggestions: data.suggestions || 0
      });
    } catch (error) {
      console.error('[UPGRADE] Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await api.put(`/subscription/notifications/${notificationId}/read`);
          setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('[UPGRADE] Failed to mark notification as read:', error);
    }
  }, []);

  const dismissNotification = useCallback(async (notificationId) => {
    try {
      await api.delete(`/subscription/notifications/${notificationId}`);
      setNotifications(prev => 
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (error) {
      console.error('[UPGRADE] Failed to dismiss notification:', error);
    }
  }, []);

  const getUpgradeSuggestion = useCallback(() => {
    const unreadNotifications = notifications.filter(n => !n.read);
    return unreadNotifications.find(n => n.type === 'upgrade_suggestion');
  }, [notifications]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchNotifications]);

  return {
    notifications,
    loading,
    stats,
    fetchNotifications,
    markAsRead,
    dismissNotification,
    getUpgradeSuggestion,
    hasUnreadNotifications: stats.unreadCount > 0,
    hasUpgradeSuggestions: stats.upgradeSuggestions > 0
  };
}

export default useUpgradeNotifications; 