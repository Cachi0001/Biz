/**
 * NotificationContentManager Tests
 */

import notificationContentManager from '../notificationContentManager';

describe('NotificationContentManager', () => {
  describe('Timestamp Formatting', () => {
    test('formats recent timestamps correctly', () => {
      const now = new Date();
      
      // Just now
      expect(notificationContentManager.formatTimestamp(now)).toBe('Just now');
      
      // Minutes ago
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      expect(notificationContentManager.formatTimestamp(fiveMinutesAgo)).toBe('5m ago');
      
      // Hours ago
      const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
      expect(notificationContentManager.formatTimestamp(twoHoursAgo)).toBe('2h ago');
      
      // Days ago
      const threeDaysAgo = new Date(now - 3 * 24 * 60 * 60 * 1000);
      expect(notificationContentManager.formatTimestamp(threeDaysAgo)).toBe('3d ago');
      
      // Weeks ago
      const twoWeeksAgo = new Date(now - 2 * 7 * 24 * 60 * 60 * 1000);
      expect(notificationContentManager.formatTimestamp(twoWeeksAgo)).toBe('2w ago');
    });

    test('formats old timestamps as date', () => {
      const oldDate = new Date('2023-01-15');
      const result = notificationContentManager.formatTimestamp(oldDate);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
    });
  });

  describe('Text Truncation', () => {
    test('truncates long messages', () => {
      const longMessage = 'This is a very long message that should be truncated because it exceeds the maximum length allowed for notification messages in the system';
      const truncated = notificationContentManager.truncateText(longMessage, 50);
      
      expect(truncated).toHaveLength(50);
      expect(truncated).toEndWith('...');
    });

    test('does not truncate short messages', () => {
      const shortMessage = 'Short message';
      const result = notificationContentManager.truncateText(shortMessage, 50);
      
      expect(result).toBe(shortMessage);
    });

    test('truncates titles correctly', () => {
      const longTitle = 'This is a very long title that should be truncated';
      const truncated = notificationContentManager.truncateTitle(longTitle);
      
      expect(truncated.length).toBeLessThanOrEqual(50);
      expect(truncated).toEndWith('...');
    });
  });

  describe('Category Configuration', () => {
    test('returns correct config for low_stock', () => {
      const config = notificationContentManager.getCategoryConfig('low_stock');
      
      expect(config).toMatchObject({
        icon: '📦',
        color: 'text-yellow-600',
        priority: 'medium',
        category: 'Inventory'
      });
    });

    test('returns correct config for out_of_stock', () => {
      const config = notificationContentManager.getCategoryConfig('out_of_stock');
      
      expect(config).toMatchObject({
        icon: '🚫',
        color: 'text-red-600',
        priority: 'urgent',
        category: 'Inventory'
      });
    });

    test('returns correct config for overdue_invoice', () => {
      const config = notificationContentManager.getCategoryConfig('overdue_invoice');
      
      expect(config).toMatchObject({
        icon: '💸',
        color: 'text-red-600',
        priority: 'high',
        category: 'Finance'
      });
    });

    test('returns default config for unknown type', () => {
      const config = notificationContentManager.getCategoryConfig('unknown_type');
      
      expect(config).toMatchObject({
        icon: 'ℹ️',
        color: 'text-blue-600',
        priority: 'low',
        category: 'System'
      });
    });
  });

  describe('Notification Processing', () => {
    test('processes notification correctly', () => {
      const notification = {
        id: '1',
        type: 'low_stock',
        title: 'Low Stock Alert for Very Long Product Name That Should Be Truncated',
        message: 'This is a very long message that should be truncated because it exceeds the maximum length',
        timestamp: new Date().toISOString()
      };

      const processed = notificationContentManager.processNotification(notification);

      expect(processed).toMatchObject({
        id: '1',
        type: 'low_stock',
        icon: '📦',
        color: 'text-yellow-600',
        category: 'Inventory',
        priority: 'medium'
      });
      
      expect(processed.title.length).toBeLessThanOrEqual(50);
      expect(processed.message.length).toBeLessThanOrEqual(120);
      expect(processed.formattedTimestamp).toBeDefined();
      expect(processed.urgencyLevel).toBeDefined();
    });
  });

  describe('Urgency Level Calculation', () => {
    test('calculates urgency for different priorities', () => {
      const notifications = [
        { priority: 'urgent', type: 'out_of_stock' },
        { priority: 'high', type: 'overdue_invoice' },
        { priority: 'medium', type: 'low_stock' },
        { priority: 'low', type: 'payment_received' }
      ];

      const urgencyLevels = notifications.map(n => 
        notificationContentManager.getUrgencyLevel(n)
      );

      expect(urgencyLevels).toEqual([5, 4, 3, 2]);
    });

    test('increases urgency for very overdue invoices', () => {
      const notification = {
        type: 'overdue_invoice',
        priority: 'high',
        data: { daysOverdue: 35 }
      };

      const urgency = notificationContentManager.getUrgencyLevel(notification);
      expect(urgency).toBe(5); // Increased from 4 to 5
    });

    test('increases urgency for very low stock', () => {
      const notification = {
        type: 'low_stock',
        priority: 'medium',
        data: { quantity: 1 }
      };

      const urgency = notificationContentManager.getUrgencyLevel(notification);
      expect(urgency).toBe(4); // Increased from 3 to 4
    });
  });

  describe('Notification Sorting', () => {
    test('sorts notifications by read status, urgency, and timestamp', () => {
      const notifications = [
        {
          id: '1',
          read: true,
          priority: 'high',
          timestamp: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          read: false,
          priority: 'low',
          timestamp: '2024-01-01T12:00:00Z'
        },
        {
          id: '3',
          read: false,
          priority: 'urgent',
          timestamp: '2024-01-01T11:00:00Z'
        }
      ];

      const sorted = notificationContentManager.sortNotifications(notifications);

      // Unread notifications should come first
      expect(sorted[0].read).toBe(false);
      expect(sorted[1].read).toBe(false);
      expect(sorted[2].read).toBe(true);

      // Among unread, urgent should come before low priority
      expect(sorted[0].priority).toBe('urgent');
      expect(sorted[1].priority).toBe('low');
    });
  });

  describe('Category Filtering', () => {
    test('filters notifications by category', () => {
      const notifications = [
        { type: 'low_stock' }, // Inventory
        { type: 'overdue_invoice' }, // Finance
        { type: 'payment_received' }, // Finance
        { type: 'error' } // System
      ];

      const inventoryNotifications = notificationContentManager.filterByCategory(notifications, 'inventory');
      const financeNotifications = notificationContentManager.filterByCategory(notifications, 'finance');

      expect(inventoryNotifications).toHaveLength(1);
      expect(financeNotifications).toHaveLength(2);
    });

    test('returns all notifications for "all" category', () => {
      const notifications = [
        { type: 'low_stock' },
        { type: 'overdue_invoice' }
      ];

      const allNotifications = notificationContentManager.filterByCategory(notifications, 'all');
      expect(allNotifications).toHaveLength(2);
    });
  });

  describe('Category Statistics', () => {
    test('generates category statistics', () => {
      const notifications = [
        { type: 'low_stock', read: false },
        { type: 'low_stock', read: true },
        { type: 'overdue_invoice', read: false },
        { type: 'payment_received', read: true }
      ];

      const categories = notificationContentManager.getCategories(notifications);

      expect(categories).toHaveLength(2); // Inventory and Finance
      
      const inventoryCategory = categories.find(c => c.name === 'Inventory');
      expect(inventoryCategory).toMatchObject({
        name: 'Inventory',
        count: 2,
        unreadCount: 1
      });

      const financeCategory = categories.find(c => c.name === 'Finance');
      expect(financeCategory).toMatchObject({
        name: 'Finance',
        count: 2,
        unreadCount: 1
      });
    });
  });

  describe('Old Notification Cleanup', () => {
    test('removes old notifications', () => {
      const now = new Date();
      const oldDate = new Date(now - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const recentDate = new Date(now - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      const notifications = [
        { id: '1', timestamp: oldDate.toISOString() },
        { id: '2', timestamp: recentDate.toISOString() },
        { id: '3', timestamp: now.toISOString() }
      ];

      const cleaned = notificationContentManager.cleanupOldNotifications(notifications);

      expect(cleaned).toHaveLength(2);
      expect(cleaned.find(n => n.id === '1')).toBeUndefined();
    });
  });

  describe('Empty State Configuration', () => {
    test('returns correct empty state for different filters', () => {
      const allConfig = notificationContentManager.getEmptyStateConfig('all');
      expect(allConfig.title).toBe('No notifications');

      const inventoryConfig = notificationContentManager.getEmptyStateConfig('inventory');
      expect(inventoryConfig.title).toBe('No inventory alerts');

      const financeConfig = notificationContentManager.getEmptyStateConfig('finance');
      expect(financeConfig.title).toBe('No financial alerts');
    });
  });

  describe('Notification Summary', () => {
    test('generates correct summary', () => {
      const notifications = [
        { read: false, priority: 'urgent', timestamp: '2024-01-01T10:00:00Z' },
        { read: false, priority: 'high', timestamp: '2024-01-01T11:00:00Z' },
        { read: true, priority: 'medium', timestamp: '2024-01-01T12:00:00Z' },
        { read: true, priority: 'low', timestamp: '2024-01-01T13:00:00Z' }
      ];

      // Mock getUrgencyLevel to return predictable values
      const originalGetUrgencyLevel = notificationContentManager.getUrgencyLevel;
      notificationContentManager.getUrgencyLevel = jest.fn()
        .mockReturnValueOnce(5) // urgent
        .mockReturnValueOnce(4) // high
        .mockReturnValueOnce(3) // medium
        .mockReturnValueOnce(2); // low

      const summary = notificationContentManager.generateSummary(notifications);

      expect(summary).toMatchObject({
        total: 4,
        unread: 2,
        urgent: 2 // urgent and high priority (urgency >= 4)
      });

      // Restore original method
      notificationContentManager.getUrgencyLevel = originalGetUrgencyLevel;
    });
  });

  describe('Age Detection', () => {
    test('correctly identifies old notifications', () => {
      const now = new Date();
      const oldDate = new Date(now - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const recentDate = new Date(now - 1 * 24 * 60 * 60 * 1000); // 1 day ago

      expect(notificationContentManager.isNotificationOld(oldDate)).toBe(true);
      expect(notificationContentManager.isNotificationOld(recentDate)).toBe(false);
      expect(notificationContentManager.isNotificationOld(now)).toBe(false);
    });
  });
});