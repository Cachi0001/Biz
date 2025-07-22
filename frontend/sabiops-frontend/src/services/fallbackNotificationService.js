/**
 * Fallback Notification Service
 * Provides notification functionality when Firebase Cloud Messaging is not available
 */

class FallbackNotificationService {
  static handlers = [];
  static isInitialized = false;
  static pollingInterval = null;
  static lastNotificationTime = new Date().toISOString();
  
  /**
   * Initialize the fallback notification service
   */
  static initialize() {
    if (this.isInitialized) return;
    
    console.log('FallbackNotificationService: Initializing...');
    
    // Check if browser notifications are supported
    if ('Notification' in window) {
      // Request permission if not already granted
      if (Notification.permission === 'default') {
        this.requestPermission();
      }
    } else {
      console.warn('FallbackNotificationService: Browser notifications not supported');
    }
    
    this.isInitialized = true;
    console.log('FallbackNotificationService: Initialized');
  }
  
  /**
   * Request notification permission
   */
  static async requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      console.log('FallbackNotificationService: Permission', permission);
      return permission;
    } catch (error) {
      console.error('FallbackNotificationService: Failed to request permission', error);
      return 'denied';
    }
  }
  
  /**
   * Start polling for notifications
   * @param {Function} fetchNotificationsCallback - Function to fetch notifications from backend
   * @param {number} interval - Polling interval in milliseconds
   */
  static startPolling(fetchNotificationsCallback, interval = 30000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    const pollForNotifications = async () => {
      try {
        const notifications = await fetchNotificationsCallback();
        
        // Check for new notifications
        const newNotifications = notifications.filter(notification => 
          new Date(notification.created_at) > new Date(this.lastNotificationTime) && !notification.read
        );
        
        if (newNotifications.length > 0) {
          // Update last notification time
          this.lastNotificationTime = new Date().toISOString();
          
          // Process new notifications
          newNotifications.forEach(notification => {
            this.notifyHandlers({
              title: notification.title,
              body: notification.body,
              data: notification.data || {},
              timestamp: notification.created_at,
              id: notification.id
            });
            
            // Show browser notification if app is not in focus and permission is granted
            if (document.hidden && Notification.permission === 'granted') {
              this.showBrowserNotification({
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                id: notification.id
              });
            }
          });
        }
      } catch (error) {
        console.error('FallbackNotificationService: Polling failed', error);
      }
    };
    
    // Poll immediately
    pollForNotifications();
    
    // Set up interval
    this.pollingInterval = setInterval(pollForNotifications, interval);
    console.log(`FallbackNotificationService: Polling started (${interval}ms interval)`);
  }
  
  /**
   * Stop polling for notifications
   */
  static stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('FallbackNotificationService: Polling stopped');
    }
  }
  
  /**
   * Show browser notification
   * @param {Object} notification - Notification data
   */
  static showBrowserNotification(notification) {
    try {
      if (Notification.permission !== 'granted') return;
      
      const browserNotification = new Notification(notification.title, {
        body: notification.body,
        icon: '/sabiops.jpg',
        badge: '/sabiops.jpg',
        tag: `sabiops-notification-${notification.id || Date.now()}`,
        requireInteraction: false,
        silent: false
      });
      
      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        
        // Navigate to relevant section if action_url exists
        if (notification.data && notification.data.action_url) {
          window.location.href = notification.data.action_url;
        }
      };
      
      // Auto close after 5 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
      
    } catch (error) {
      console.error('FallbackNotificationService: Failed to show browser notification', error);
    }
  }
  
  /**
   * Add notification handler
   * @param {Function} handler - Function to handle notifications
   */
  static addHandler(handler) {
    if (typeof handler === 'function' && !this.handlers.includes(handler)) {
      this.handlers.push(handler);
      console.log('FallbackNotificationService: Handler added');
    }
  }
  
  /**
   * Remove notification handler
   * @param {Function} handler - Function to remove
   */
  static removeHandler(handler) {
    const index = this.handlers.indexOf(handler);
    if (index > -1) {
      this.handlers.splice(index, 1);
      console.log('FallbackNotificationService: Handler removed');
    }
  }
  
  /**
   * Notify all handlers
   * @param {Object} notification - Notification data
   */
  static notifyHandlers(notification) {
    this.handlers.forEach(handler => {
      try {
        handler(notification);
      } catch (error) {
        console.error('FallbackNotificationService: Handler error', error);
      }
    });
  }
  
  /**
   * Clean up resources
   */
  static cleanup() {
    this.stopPolling();
    this.handlers = [];
    this.isInitialized = false;
    console.log('FallbackNotificationService: Cleaned up');
  }
}

export default FallbackNotificationService;