/**
 * Business Event Monitor
 * Monitors business data and triggers notifications for critical events
 */

import notificationService from './notificationService';
import { get } from './api';

class BusinessEventMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastChecks = {
      stock: 0,
      invoices: 0,
      limits: 0
    };
    this.checkIntervals = {
      stock: 5 * 60 * 1000, // 5 minutes
      invoices: 10 * 60 * 1000, // 10 minutes
      limits: 15 * 60 * 1000 // 15 minutes
    };
    this.thresholds = {
      lowStock: 5,
      nearingLimit: 0.8 // 80%
    };
  }

  /**
   * Start monitoring business events
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('[BusinessEventMonitor] Starting business event monitoring');
    
    // Initial check
    this.performChecks();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performChecks();
    }, 60000); // Check every minute, but individual checks have their own intervals
  }

  /**
   * Stop monitoring business events
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    console.log('[BusinessEventMonitor] Stopping business event monitoring');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Perform all monitoring checks
   */
  async performChecks() {
    const now = Date.now();
    
    try {
      // Check stock levels
      if (now - this.lastChecks.stock >= this.checkIntervals.stock) {
        await this.checkStockLevels();
        this.lastChecks.stock = now;
      }

      // Check overdue invoices
      if (now - this.lastChecks.invoices >= this.checkIntervals.invoices) {
        await this.checkOverdueInvoices();
        this.lastChecks.invoices = now;
      }

      // Check usage limits
      if (now - this.lastChecks.limits >= this.checkIntervals.limits) {
        await this.checkUsageLimits();
        this.lastChecks.limits = now;
      }
    } catch (error) {
      console.error('[BusinessEventMonitor] Error performing checks:', error);
    }
  }

  /**
   * Check stock levels for low stock and out of stock items
   */
  async checkStockLevels() {
    try {
      const response = await get('/products/stock-status');
      const stockData = response.data || response;

      if (stockData.low_stock_items) {
        stockData.low_stock_items.forEach(item => {
          if (item.quantity <= 0) {
            // Out of stock
            notificationService.showOutOfStockAlert(item.name, item.id);
          } else if (item.quantity <= this.thresholds.lowStock) {
            // Low stock
            notificationService.showLowStockAlert(
              item.name, 
              item.quantity, 
              this.thresholds.lowStock,
              item.id
            );
          }
        });
      }

      console.log(`[BusinessEventMonitor] Stock check completed. Found ${stockData.low_stock_items?.length || 0} items with stock issues`);
    } catch (error) {
      console.error('[BusinessEventMonitor] Error checking stock levels:', error);
    }
  }

  /**
   * Check for overdue invoices
   */
  async checkOverdueInvoices() {
    try {
      const response = await get('/invoices/overdue');
      const overdueData = response.data || response;

      if (overdueData.overdue_invoices) {
        overdueData.overdue_invoices.forEach(invoice => {
          const daysOverdue = Math.floor(
            (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)
          );

          if (daysOverdue > 0) {
            notificationService.showOverdueInvoiceAlert(
              invoice.invoice_number,
              invoice.total_amount,
              daysOverdue,
              invoice.id
            );
          }
        });
      }

      console.log(`[BusinessEventMonitor] Invoice check completed. Found ${overdueData.overdue_invoices?.length || 0} overdue invoices`);
    } catch (error) {
      console.error('[BusinessEventMonitor] Error checking overdue invoices:', error);
    }
  }

  /**
   * Check usage limits for subscription plans
   */
  async checkUsageLimits() {
    try {
      const response = await get('/subscription/usage-status');
      const usageData = response.data || response;

      if (usageData.limits) {
        Object.entries(usageData.limits).forEach(([limitType, data]) => {
          const percentage = data.current / data.limit;
          
          if (percentage >= this.thresholds.nearingLimit) {
            notificationService.showNearingLimitAlert(
              limitType,
              data.current,
              data.limit,
              this.thresholds.nearingLimit
            );
          }
        });
      }

      console.log(`[BusinessEventMonitor] Usage limits check completed`);
    } catch (error) {
      console.error('[BusinessEventMonitor] Error checking usage limits:', error);
    }
  }

  /**
   * Manually trigger stock level check
   */
  async triggerStockCheck() {
    console.log('[BusinessEventMonitor] Manual stock check triggered');
    await this.checkStockLevels();
  }

  /**
   * Manually trigger invoice check
   */
  async triggerInvoiceCheck() {
    console.log('[BusinessEventMonitor] Manual invoice check triggered');
    await this.checkOverdueInvoices();
  }

  /**
   * Manually trigger limits check
   */
  async triggerLimitsCheck() {
    console.log('[BusinessEventMonitor] Manual limits check triggered');
    await this.checkUsageLimits();
  }

  /**
   * Update monitoring thresholds
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('[BusinessEventMonitor] Thresholds updated:', this.thresholds);
  }

  /**
   * Update check intervals
   */
  updateIntervals(newIntervals) {
    this.checkIntervals = { ...this.checkIntervals, ...newIntervals };
    console.log('[BusinessEventMonitor] Check intervals updated:', this.checkIntervals);
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastChecks: this.lastChecks,
      checkIntervals: this.checkIntervals,
      thresholds: this.thresholds
    };
  }

  /**
   * Handle real-time events from websockets or other sources
   */
  handleRealTimeEvent(event) {
    try {
      switch (event.type) {
        case 'stock_updated':
          this.handleStockUpdate(event.data);
          break;
        case 'invoice_created':
        case 'invoice_updated':
          this.handleInvoiceUpdate(event.data);
          break;
        case 'usage_updated':
          this.handleUsageUpdate(event.data);
          break;
        default:
          console.log('[BusinessEventMonitor] Unknown event type:', event.type);
      }
    } catch (error) {
      console.error('[BusinessEventMonitor] Error handling real-time event:', error);
    }
  }

  /**
   * Handle stock update events
   */
  handleStockUpdate(stockData) {
    if (stockData.quantity <= 0) {
      notificationService.showOutOfStockAlert(stockData.name, stockData.id);
    } else if (stockData.quantity <= this.thresholds.lowStock) {
      notificationService.showLowStockAlert(
        stockData.name,
        stockData.quantity,
        this.thresholds.lowStock,
        stockData.id
      );
    }
  }

  /**
   * Handle invoice update events
   */
  handleInvoiceUpdate(invoiceData) {
    if (invoiceData.status === 'overdue') {
      const daysOverdue = Math.floor(
        (new Date() - new Date(invoiceData.due_date)) / (1000 * 60 * 60 * 24)
      );

      if (daysOverdue > 0) {
        notificationService.showOverdueInvoiceAlert(
          invoiceData.invoice_number,
          invoiceData.total_amount,
          daysOverdue,
          invoiceData.id
        );
      }
    }
  }

  /**
   * Handle usage update events
   */
  handleUsageUpdate(usageData) {
    Object.entries(usageData.limits || {}).forEach(([limitType, data]) => {
      const percentage = data.current / data.limit;
      
      if (percentage >= this.thresholds.nearingLimit) {
        notificationService.showNearingLimitAlert(
          limitType,
          data.current,
          data.limit,
          this.thresholds.nearingLimit
        );
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this.stopMonitoring();
    console.log('[BusinessEventMonitor] Destroyed');
  }
}

// Create singleton instance
const businessEventMonitor = new BusinessEventMonitor();

// Auto-start monitoring when user is authenticated
if (typeof window !== 'undefined') {
  // Listen for authentication events
  window.addEventListener('userAuthenticated', () => {
    businessEventMonitor.startMonitoring();
  });

  window.addEventListener('userLoggedOut', () => {
    businessEventMonitor.stopMonitoring();
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    businessEventMonitor.destroy();
  });
}

export default businessEventMonitor;