/**
 * Navigation Handler with Visual Feedback
 * Handles navigation from notifications with smooth transitions and element highlighting
 */

class NavigationHandler {
  constructor() {
    this.highlightTimeout = null;
    this.transitionTimeout = null;
  }

  /**
   * Navigate to a page with visual feedback and optional element highlighting
   * @param {string} url - The URL to navigate to
   * @param {Object} options - Navigation options
   * @param {string} options.highlight - Element ID to highlight
   * @param {string} options.filter - Filter to apply on the target page
   * @param {Object} options.params - Additional parameters
   * @param {Function} options.callback - Callback after navigation
   */
  navigateWithFeedback(url, options = {}) {
    return new Promise((resolve) => {
      // Add visual feedback before navigation
      this.showNavigationFeedback();

      // Store navigation data for the target page
      if (options.highlight || options.filter || options.params) {
        sessionStorage.setItem('navigationData', JSON.stringify({
          highlight: options.highlight,
          filter: options.filter,
          params: options.params,
          timestamp: Date.now()
        }));
      }

      // Navigate after brief delay for visual feedback
      setTimeout(() => {
        if (url.startsWith('/')) {
          // Internal navigation
          window.location.href = url;
        } else {
          // External navigation
          window.open(url, '_blank');
        }
        
        if (options.callback) {
          options.callback();
        }
        
        resolve();
      }, 200);
    });
  }

  /**
   * Show visual feedback during navigation
   */
  showNavigationFeedback() {
    // Create a subtle overlay effect
    const overlay = document.createElement('div');
    overlay.className = 'navigation-feedback-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(59, 130, 246, 0.1);
      z-index: 9998;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    `;
    
    document.body.appendChild(overlay);
    
    // Fade in
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
    
    // Remove after navigation
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 200);
      }
    }, 300);
  }

  /**
   * Handle navigation data on page load
   * Should be called when a page loads to check for navigation data
   */
  handlePageLoad() {
    const navigationData = sessionStorage.getItem('navigationData');
    if (!navigationData) return;

    try {
      const data = JSON.parse(navigationData);
      
      // Check if data is recent (within 10 seconds)
      if (Date.now() - data.timestamp > 10000) {
        sessionStorage.removeItem('navigationData');
        return;
      }

      // Apply highlighting if specified
      if (data.highlight) {
        this.highlightElement(data.highlight);
      }

      // Apply filters if specified
      if (data.filter) {
        this.applyFilter(data.filter);
      }

      // Trigger custom event with navigation data
      window.dispatchEvent(new CustomEvent('navigationDataReceived', {
        detail: data
      }));

      // Clean up
      sessionStorage.removeItem('navigationData');
    } catch (error) {
      console.error('Error handling navigation data:', error);
      sessionStorage.removeItem('navigationData');
    }
  }

  /**
   * Highlight a specific element on the page
   * @param {string} elementId - ID of element to highlight
   */
  highlightElement(elementId) {
    // Wait for page to be ready
    const attemptHighlight = () => {
      const element = document.getElementById(elementId) || 
                     document.querySelector(`[data-id="${elementId}"]`) ||
                     document.querySelector(`[data-product-id="${elementId}"]`) ||
                     document.querySelector(`[data-invoice-id="${elementId}"]`);

      if (element) {
        this.performHighlight(element);
      } else {
        // Try again after a short delay
        setTimeout(attemptHighlight, 500);
      }
    };

    // Start highlighting after a brief delay
    setTimeout(attemptHighlight, 100);
  }

  /**
   * Perform the actual highlighting animation
   * @param {HTMLElement} element - Element to highlight
   */
  performHighlight(element) {
    // Scroll element into view
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });

    // Add highlight class
    const originalClasses = element.className;
    element.classList.add('notification-highlight');

    // Add highlight styles if not already defined
    if (!document.querySelector('#notification-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-highlight-styles';
      style.textContent = `
        .notification-highlight {
          animation: notification-pulse 2s ease-in-out 3;
          position: relative;
          z-index: 10;
        }
        
        .notification-highlight::before {
          content: '';
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: rgba(59, 130, 246, 0.2);
          border: 2px solid rgba(59, 130, 246, 0.5);
          border-radius: 8px;
          z-index: -1;
          animation: notification-glow 2s ease-in-out 3;
        }
        
        @keyframes notification-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        
        @keyframes notification-glow {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove highlight after animation
    this.highlightTimeout = setTimeout(() => {
      element.classList.remove('notification-highlight');
    }, 6000);
  }

  /**
   * Apply filter to the current page
   * @param {string} filterType - Type of filter to apply
   */
  applyFilter(filterType) {
    // Dispatch event for components to handle filtering
    window.dispatchEvent(new CustomEvent('applyNotificationFilter', {
      detail: { filter: filterType }
    }));

    // Try common filter implementations
    setTimeout(() => {
      // Try to find and click filter buttons
      const filterSelectors = [
        `[data-filter="${filterType}"]`,
        `[data-filter-type="${filterType}"]`,
        `.filter-${filterType}`,
        `#filter-${filterType}`
      ];

      for (const selector of filterSelectors) {
        const filterElement = document.querySelector(selector);
        if (filterElement) {
          filterElement.click();
          break;
        }
      }
    }, 500);
  }

  /**
   * Navigate to Products page with specific highlighting
   * @param {string} productId - Product ID to highlight
   * @param {string} filter - Filter to apply (low_stock, out_of_stock)
   */
  navigateToProducts(productId = null, filter = null) {
    return this.navigateWithFeedback('/products', {
      highlight: productId,
      filter: filter
    });
  }

  /**
   * Navigate to Invoices page with specific highlighting
   * @param {string} invoiceId - Invoice ID to highlight
   * @param {string} filter - Filter to apply (overdue, pending)
   */
  navigateToInvoices(invoiceId = null, filter = null) {
    return this.navigateWithFeedback('/invoices', {
      highlight: invoiceId,
      filter: filter
    });
  }

  /**
   * Navigate to subscription/settings page
   * @param {string} highlight - Section to highlight
   */
  navigateToSubscription(highlight = null) {
    return this.navigateWithFeedback('/subscription-upgrade', {
      highlight: highlight
    });
  }

  /**
   * Clean up any active timeouts
   */
  cleanup() {
    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }
    if (this.transitionTimeout) {
      clearTimeout(this.transitionTimeout);
      this.transitionTimeout = null;
    }
  }
}

// Create singleton instance
const navigationHandler = new NavigationHandler();

// Auto-handle page load
if (typeof window !== 'undefined') {
  // Handle page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      navigationHandler.handlePageLoad();
    });
  } else {
    navigationHandler.handlePageLoad();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    navigationHandler.cleanup();
  });
}

export default navigationHandler;