/**
 * NavigationHandler Tests
 */

import navigationHandler from '../navigationHandler';

// Mock window.location
delete window.location;
window.location = { href: '' };

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Mock DOM methods
document.getElementById = jest.fn();
document.querySelector = jest.fn();
document.querySelectorAll = jest.fn(() => []);
document.createElement = jest.fn(() => ({
  style: {},
  className: '',
  textContent: '',
  appendChild: jest.fn(),
}));
document.head = { appendChild: jest.fn() };
document.body = { appendChild: jest.fn() };

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn();

describe('NavigationHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
    window.location.href = '';
  });

  afterEach(() => {
    navigationHandler.cleanup();
  });

  describe('Navigation with Feedback', () => {
    test('navigates to internal URL', async () => {
      const url = '/products';
      const options = {
        highlight: 'product-123',
        filter: 'low_stock'
      };

      await navigationHandler.navigateWithFeedback(url, options);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'navigationData',
        JSON.stringify({
          highlight: 'product-123',
          filter: 'low_stock',
          timestamp: expect.any(Number)
        })
      );

      // Should navigate after delay
      await new Promise(resolve => setTimeout(resolve, 250));
      expect(window.location.href).toBe('/products');
    });

    test('opens external URL in new tab', async () => {
      const originalOpen = window.open;
      window.open = jest.fn();

      const url = 'https://external-site.com';

      await navigationHandler.navigateWithFeedback(url);

      expect(window.open).toHaveBeenCalledWith(url, '_blank');

      window.open = originalOpen;
    });

    test('executes callback after navigation', async () => {
      const callback = jest.fn();
      const url = '/test';

      await navigationHandler.navigateWithFeedback(url, { callback });

      await new Promise(resolve => setTimeout(resolve, 250));
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Page Load Handling', () => {
    test('handles navigation data on page load', () => {
      const navigationData = {
        highlight: 'element-123',
        filter: 'test-filter',
        timestamp: Date.now()
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(navigationData));

      const mockElement = {
        scrollIntoView: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        className: ''
      };
      document.getElementById.mockReturnValue(mockElement);

      navigationHandler.handlePageLoad();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('navigationData');
      expect(mockElement.scrollIntoView).toHaveBeenCalled();
    });

    test('ignores old navigation data', () => {
      const oldNavigationData = {
        highlight: 'element-123',
        timestamp: Date.now() - 15000 // 15 seconds ago
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(oldNavigationData));

      navigationHandler.handlePageLoad();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('navigationData');
      expect(document.getElementById).not.toHaveBeenCalled();
    });

    test('handles malformed navigation data gracefully', () => {
      mockSessionStorage.getItem.mockReturnValue('invalid-json');

      expect(() => navigationHandler.handlePageLoad()).not.toThrow();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('navigationData');
    });
  });

  describe('Element Highlighting', () => {
    test('highlights element by ID', () => {
      const mockElement = {
        scrollIntoView: jest.fn(),
        classList: { add: jest.fn(), remove: jest.fn() },
        className: ''
      };
      document.getElementById.mockReturnValue(mockElement);

      navigationHandler.highlightElement('test-element');

      setTimeout(() => {
        expect(document.getElementById).toHaveBeenCalledWith('test-element');
        expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center'
        });
        expect(mockElement.classList.add).toHaveBeenCalledWith('notification-highlight');
      }, 150);
    });

    test('tries alternative selectors when ID not found', () => {
      document.getElementById.mockReturnValue(null);
      document.querySelector
        .mockReturnValueOnce(null) // [data-id]
        .mockReturnValueOnce(null) // [data-product-id]
        .mockReturnValueOnce({ // [data-invoice-id]
          scrollIntoView: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          className: ''
        });

      navigationHandler.highlightElement('test-element');

      setTimeout(() => {
        expect(document.querySelector).toHaveBeenCalledWith('[data-id="test-element"]');
        expect(document.querySelector).toHaveBeenCalledWith('[data-product-id="test-element"]');
        expect(document.querySelector).toHaveBeenCalledWith('[data-invoice-id="test-element"]');
      }, 150);
    });

    test('retries highlighting if element not found initially', () => {
      document.getElementById
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({
          scrollIntoView: jest.fn(),
          classList: { add: jest.fn(), remove: jest.fn() },
          className: ''
        });

      navigationHandler.highlightElement('test-element');

      // Should retry after 500ms
      setTimeout(() => {
        expect(document.getElementById).toHaveBeenCalledTimes(2);
      }, 600);
    });
  });

  describe('Filter Application', () => {
    test('dispatches filter event', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

      navigationHandler.applyFilter('low_stock');

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'applyNotificationFilter',
          detail: { filter: 'low_stock' }
        })
      );
    });

    test('tries to click filter elements', () => {
      const mockFilterElement = { click: jest.fn() };
      document.querySelector.mockReturnValue(mockFilterElement);

      navigationHandler.applyFilter('test-filter');

      setTimeout(() => {
        expect(document.querySelector).toHaveBeenCalledWith('[data-filter="test-filter"]');
        expect(mockFilterElement.click).toHaveBeenCalled();
      }, 600);
    });
  });

  describe('Convenience Methods', () => {
    test('navigateToProducts calls navigateWithFeedback correctly', async () => {
      const spy = jest.spyOn(navigationHandler, 'navigateWithFeedback');

      await navigationHandler.navigateToProducts('prod-123', 'low_stock');

      expect(spy).toHaveBeenCalledWith('/products', {
        highlight: 'prod-123',
        filter: 'low_stock'
      });
    });

    test('navigateToInvoices calls navigateWithFeedback correctly', async () => {
      const spy = jest.spyOn(navigationHandler, 'navigateWithFeedback');

      await navigationHandler.navigateToInvoices('inv-456', 'overdue');

      expect(spy).toHaveBeenCalledWith('/invoices', {
        highlight: 'inv-456',
        filter: 'overdue'
      });
    });

    test('navigateToSubscription calls navigateWithFeedback correctly', async () => {
      const spy = jest.spyOn(navigationHandler, 'navigateWithFeedback');

      await navigationHandler.navigateToSubscription('limits');

      expect(spy).toHaveBeenCalledWith('/subscription-upgrade', {
        highlight: 'limits'
      });
    });
  });

  describe('Cleanup', () => {
    test('clears timeouts on cleanup', () => {
      navigationHandler.highlightTimeout = setTimeout(() => {}, 1000);
      navigationHandler.transitionTimeout = setTimeout(() => {}, 1000);

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

      navigationHandler.cleanup();

      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2);
      expect(navigationHandler.highlightTimeout).toBeNull();
      expect(navigationHandler.transitionTimeout).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('handles navigation errors gracefully', async () => {
      // Mock navigation to throw error
      Object.defineProperty(window, 'location', {
        value: {
          get href() { throw new Error('Navigation error'); },
          set href(value) { throw new Error('Navigation error'); }
        },
        configurable: true
      });

      // Should not throw
      await expect(navigationHandler.navigateWithFeedback('/test')).resolves.toBeUndefined();
    });

    test('handles highlighting errors gracefully', () => {
      document.getElementById.mockImplementation(() => {
        throw new Error('DOM error');
      });

      // Should not throw
      expect(() => navigationHandler.highlightElement('test')).not.toThrow();
    });
  });
});