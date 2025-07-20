/**
 * Notification Content Management System
 * Handles notification content formatting, truncation, categorization, and cleanup
 */

class NotificationContentManager {
  constructor() {
    this.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    this.maxMessageLength = 120;
    this.maxTitleLength = 50;
  }

  /**
   * Format timestamp to relative time
   * @param {string|Date} timestamp - The timestamp to format
   * @returns {string} Formatted relative time
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffMs / (7 * 86400000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    return date.toLocaleDateString();
  }

  /**
   * Truncate text with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = this.maxMessageLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Truncate title with ellipsis
   * @param {string} title - Title to truncate
   * @returns {string} Truncated title
   */
  truncateTitle(title) {
    return this.truncateText(title, this.maxTitleLength);
  }

  /**
   * Get notification category configuration
   * @param {string} type - Notification type
   * @returns {Object} Category configuration with icon, color, and priority
   */
  getCategoryConfig(type) {
    const categories = {
      low_stock: {
        icon: '📦',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        priority: 'medium',
        category: 'Inventory'
      },
      out_of_stock: {
        icon: '🚫',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        priority: 'urgent',
        category: 'Inventory'
      },
      overdue_invoice: {
        icon: '💸',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        priority: 'high',
        category: 'Finance'
      },
      nearing_limit: {
        icon: '⚠️',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        priority: 'medium',
        category: 'System'
      },
      payment_received: {
        icon: '💳',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        priority: 'low',
        category: 'Finance'
      },
      sale_completed: {
        icon: '💰',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        priority: 'low',
        category: 'Sales'
      },
      trial_reminder: {
        icon: '⏰',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        priority: 'medium',
        category: 'Account'
      },
      error: {
        icon: '❌',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        priority: 'high',
        category: 'System'
      },
      warning: {
        icon: '⚠️',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        priority: 'medium',
        category: 'System'
      },
      success: {
        icon: '✅',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        priority: 'low',
        category: 'System'
      },
      info: {
        icon: 'ℹ️',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        priority: 'low',
        category: 'System'
      }
    };

    return categories[type] || categories.info;
  }

  /**
   * Process notification content
   * @param {Object} notification - Raw notification object
   * @returns {Object} Processed notification with formatted content
   */
  processNotification(notification) {
    const categoryConfig = this.getCategoryConfig(notification.type);
    
    return {
      ...notification,
      title: this.truncateTitle(notification.title),
      message: this.truncateText(notification.message),
      formattedTimestamp: this.formatTimestamp(notification.timestamp),
      ...categoryConfig,
      isOld: this.isNotificationOld(notification.timestamp),
      urgencyLevel: this.getUrgencyLevel(notification)
    };
  }

  /**
   * Check if notification is old
   * @param {string|Date} timestamp - Notification timestamp
   * @returns {boolean} True if notification is old
   */
  isNotificationOld(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    return (now - date) > this.maxAge;
  }

  /**
   * Get urgency level for notification
   * @param {Object} notification - Notification object
   * @returns {number} Urgency level (1-5, 5 being most urgent)
   */
  getUrgencyLevel(notification) {
    const priorityMap = {
      urgent: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1
    };

    let baseLevel = priorityMap[notification.priority] || 1;

    // Increase urgency for overdue items
    if (notification.type === 'overdue_invoice' && notification.data?.daysOverdue > 30) {
      baseLevel = Math.min(5, baseLevel + 1);
    }

    // Increase urgency for very low stock
    if (notification.type === 'low_stock' && notification.data?.quantity <= 1) {
      baseLevel = Math.min(5, baseLevel + 1);
    }

    return baseLevel;
  }

  /**
   * Sort notifications by urgency and timestamp
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Sorted notifications
   */
  sortNotifications(notifications) {
    return notifications.sort((a, b) => {
      // First sort by read status (unread first)
      if (a.read !== b.read) {
        return a.read ? 1 : -1;
      }

      // Then by urgency level (higher urgency first)
      const urgencyA = this.getUrgencyLevel(a);
      const urgencyB = this.getUrgencyLevel(b);
      if (urgencyA !== urgencyB) {
        return urgencyB - urgencyA;
      }

      // Finally by timestamp (newer first)
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /**
   * Filter notifications by category
   * @param {Array} notifications - Array of notifications
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered notifications
   */
  filterByCategory(notifications, category) {
    if (!category || category === 'all') return notifications;
    
    return notifications.filter(notification => {
      const config = this.getCategoryConfig(notification.type);
      return config.category.toLowerCase() === category.toLowerCase();
    });
  }

  /**
   * Get notification categories with counts
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Categories with counts
   */
  getCategories(notifications) {
    const categories = {};
    
    notifications.forEach(notification => {
      const config = this.getCategoryConfig(notification.type);
      const category = config.category;
      
      if (!categories[category]) {
        categories[category] = {
          name: category,
          count: 0,
          unreadCount: 0
        };
      }
      
      categories[category].count++;
      if (!notification.read) {
        categories[category].unreadCount++;
      }
    });

    return Object.values(categories).sort((a, b) => b.unreadCount - a.unreadCount);
  }

  /**
   * Clean up old notifications
   * @param {Array} notifications - Array of notifications
   * @returns {Array} Cleaned notifications
   */
  cleanupOldNotifications(notifications) {
    const now = new Date();
    return notifications.filter(notification => {
      const age = now - new Date(notification.timestamp);
      return age <= this.maxAge;
    });
  }

  /**
   * Create empty state configuration
   * @param {string} filter - Current filter applied
   * @returns {Object} Empty state configuration
   */
  getEmptyStateConfig(filter = null) {
    const configs = {
      all: {
        icon: '🔔',
        title: 'No notifications',
        message: 'You\'re all caught up! New notifications will appear here.',
        action: null
      },
      inventory: {
        icon: '📦',
        title: 'No inventory alerts',
        message: 'Your stock levels are looking good.',
        action: 'View Products'
      },
      finance: {
        icon: '💳',
        title: 'No financial alerts',
        message: 'All payments are up to date.',
        action: 'View Invoices'
      },
      system: {
        icon: '⚙️',
        title: 'No system alerts',
        message: 'Everything is running smoothly.',
        action: null
      },
      unread: {
        icon: '✅',
        title: 'All caught up!',
        message: 'You\'ve read all your notifications.',
        action: null
      }
    };

    return configs[filter] || configs.all;
  }

  /**
   * Generate notification summary
   * @param {Array} notifications - Array of notifications
   * @returns {Object} Notification summary
   */
  generateSummary(notifications) {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const categories = this.getCategories(notifications);
    const urgent = notifications.filter(n => this.getUrgencyLevel(n) >= 4).length;

    return {
      total,
      unread,
      urgent,
      categories,
      oldestUnread: unread > 0 ? 
        Math.min(...notifications.filter(n => !n.read).map(n => new Date(n.timestamp))) : 
        null
    };
  }
}

// Create singleton instance
const notificationContentManager = new NotificationContentManager();

export default notificationContentManager;