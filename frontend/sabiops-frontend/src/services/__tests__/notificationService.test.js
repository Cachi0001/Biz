/**
 * NotificationService Tests
 */

import notificationService from '../notificationService';
import { get, post, put } from '../api';

// Mock API calls
jest.mock('../api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
}));

// Mock navigation handler
jest.mock('../../utils/navigationHandler', () => ({
  navigateWithFeedback: jest.fn(),
}));

// Mock window.addToast
const mockAddToast = jest.fn();
Object.defineProperty(window, 'addToast', {
  value: mockAddToast,
  writable: true,
});

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    notificationService.notifications = [];
    notificationService.unreadCount = 0;
    notificationService.listeners = [];
    notificationService.consecutiveErrors = 0;
    notificationService.isFirebaseDisabled = false;
  });

  afterEach(() => {
    notificationService.stopPolling();
  });

  describe('Business Alert Methods', () => {
    test('showLowStockAlert creates correct notification', () => {
      const productName = 'Test Product';
      const quantity = 3;
      const productId = 'prod-123';

      notificationService.showLowStockAlert(productName, quantity, 5, productId);

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${productName} - Only ${quantity} items remaining`,
        })
      );

      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.notifications[0]).toMatchObject({
        type: 'low_stock',
        title: 'Low Stock Alert',
        priority: 'high',
        data: { productName, quantity, productId }
      });
    });

    test('showOutOfStockAlert creates urgent notification', () => {
      const productName = 'Out of Stock Product';
      const productId = 'prod-456';

      notificationService.showOutOfStockAlert(productName, productId);

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          title: 'Out of Stock Alert',
          message: `${productName} is completely out of stock`,
        })
      );

      expect(notificationService.notifications[0]).toMatchObject({
        type: 'out_of_stock',
        priority: 'urgent'
      });
    });

    test('showOverdueInvoiceAlert creates notification with correct urgency', () => {
      const invoiceNumber = 'INV-001';
      const amount = 15000;
      const daysOverdue = 35;
      const invoiceId = 'inv-123';

      notificationService.showOverdueInvoiceAlert(invoiceNumber, amount, daysOverdue, invoiceId);

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error', // Should be error for > 30 days overdue
          title: 'Invoice Overdue',
        })
      );

      expect(notificationService.notifications[0]).toMatchObject({
        type: 'overdue_invoice',
        priority: 'urgent' // Should be urgent for > 30 days
      });
    });

    test('showNearingLimitAlert creates warning notification', () => {
      const limitType = 'invoices';
      const currentUsage = 45;
      const limit = 50;

      notificationService.showNearingLimitAlert(limitType, currentUsage, limit);

      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'warning',
          title: 'Nearing Limit Warning',
        })
      );

      expect(notificationService.notifications[0]).toMatchObject({
        type: 'nearing_limit',
        priority: 'high' // Should be high for 90%+
      });
    });
  });

  describe('Firebase Conflict Prevention', () => {
    test('debounces rapid notification checks', async () => {
      get.mockResolvedValue({ data: { notifications: [], unread_count: 0 } });

      // Rapid calls
      notificationService.checkForNewNotifications();
      notificationService.checkForNewNotifications();
      notificationService.checkForNewNotifications();

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should only make one API call due to debouncing
      expect(get).toHaveBeenCalledTimes(1);
    });

    test('detects duplicate notifications', async () => {
      const notification = {
        id: '1',
        type: 'low_stock',
        title: 'Low Stock',
        message: 'Product A is low',
        timestamp: new Date().toISOString()
      };

      get.mockResolvedValue({
        data: {
          notifications: [notification],
          unread_count: 1
        }
      });

      // First check
      await notificationService.checkForNewNotifications();
      expect(notificationService.notifications).toHaveLength(1);

      // Second check with same notification (should be filtered out)
      await notificationService.checkForNewNotifications();
      expect(notificationService.notifications).toHaveLength(1);
    });

    test('implements circuit breaker for consecutive errors', async () => {
      get.mockRejectedValue(new Error('API Error'));

      // Trigger multiple consecutive errors
      for (let i = 0; i < 6; i++) {
        await notificationService.checkForNewNotifications();
      }

      expect(notificationService.isFirebaseDisabled).toBe(true);
      expect(notificationService.consecutiveErrors).toBeGreaterThanOrEqual(5);
    });

    test('resets error counter on successful request', async () => {
      // Set some errors first
      notificationService.consecutiveErrors = 3;

      get.mockResolvedValue({ data: { notifications: [], unread_count: 0 } });

      await notificationService.checkForNewNotifications();

      expect(notificationService.consecutiveErrors).toBe(0);
    });
  });

  describe('Notification Management', () => {
    test('adds notification correctly', () => {
      const notification = {
        type: 'info',
        title: 'Test',
        message: 'Test message'
      };

      const result = notificationService.addNotification(notification);

      expect(result).toHaveProperty('id');
      expect(result.read).toBe(false);
      expect(notificationService.notifications).toHaveLength(1);
      expect(notificationService.unreadCount).toBe(1);
    });

    test('marks notification as read', async () => {
      put.mockResolvedValue({});

      const notification = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      await notificationService.markAsRead(notification.id);

      const updatedNotification = notificationService.notifications.find(n => n.id === notification.id);
      expect(updatedNotification.read).toBe(true);
      expect(notificationService.unreadCount).toBe(0);
    });

    test('marks all notifications as read', async () => {
      put.mockResolvedValue({});

      // Add multiple notifications
      notificationService.addNotification({ type: 'info', title: 'Test 1', message: 'Message 1' });
      notificationService.addNotification({ type: 'info', title: 'Test 2', message: 'Message 2' });

      expect(notificationService.unreadCount).toBe(2);

      await notificationService.markAllAsRead();

      expect(notificationService.unreadCount).toBe(0);
      expect(notificationService.notifications.every(n => n.read)).toBe(true);
    });

    test('clears all notifications', () => {
      // Add some notifications
      notificationService.addNotification({ type: 'info', title: 'Test 1', message: 'Message 1' });
      notificationService.addNotification({ type: 'info', title: 'Test 2', message: 'Message 2' });

      notificationService.clearAllNotifications();

      expect(notificationService.notifications).toHaveLength(0);
      expect(notificationService.unreadCount).toBe(0);
    });

    test('limits notification count to 50', () => {
      // Add 55 notifications
      for (let i = 0; i < 55; i++) {
        notificationService.addNotification({
          type: 'info',
          title: `Test ${i}`,
          message: `Message ${i}`
        });
      }

      expect(notificationService.notifications).toHaveLength(50);
    });
  });

  describe('Listener Management', () => {
    test('adds and removes listeners correctly', () => {
      const listener = jest.fn();

      const unsubscribe = notificationService.addListener(listener);

      expect(notificationService.listeners).toHaveLength(1);

      unsubscribe();

      expect(notificationService.listeners).toHaveLength(0);
    });

    test('notifies listeners on state change', () => {
      const listener = jest.fn();
      notificationService.addListener(listener);

      notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      expect(listener).toHaveBeenCalledWith({
        notifications: expect.any(Array),
        unreadCount: 1
      });
    });
  });

  describe('Polling Control', () => {
    test('starts polling when authenticated', () => {
      localStorage.setItem('token', 'test-token');
      
      notificationService.startPollingIfAuthenticated();

      expect(notificationService.pollingInterval).toBeTruthy();
    });

    test('does not start polling when not authenticated', () => {
      localStorage.removeItem('token');
      
      notificationService.startPollingIfAuthenticated();

      expect(notificationService.pollingInterval).toBeFalsy();
    });

    test('stops polling on logout', () => {
      notificationService.startPolling();
      expect(notificationService.pollingInterval).toBeTruthy();

      notificationService.stopPollingOnLogout();

      expect(notificationService.pollingInterval).toBeFalsy();
      expect(notificationService.notifications).toHaveLength(0);
      expect(notificationService.unreadCount).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('handles API errors gracefully', async () => {
      get.mockRejectedValue(new Error('Network error'));

      // Should not throw
      await expect(notificationService.checkForNewNotifications()).resolves.toBeUndefined();
    });

    test('handles malformed API responses', async () => {
      get.mockResolvedValue(null);

      await notificationService.checkForNewNotifications();

      // Should handle gracefully without crashing
      expect(notificationService.notifications).toEqual([]);
    });

    test('falls back to local state when API fails', async () => {
      put.mockRejectedValue(new Error('API Error'));

      const notification = notificationService.addNotification({
        type: 'info',
        title: 'Test',
        message: 'Test message'
      });

      // Should still update local state even if API fails
      await notificationService.markAsRead(notification.id);

      const updatedNotification = notificationService.notifications.find(n => n.id === notification.id);
      expect(updatedNotification.read).toBe(true);
    });
  });
});