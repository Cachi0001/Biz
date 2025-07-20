/**
 * ToastManager Component Tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ToastManager, { showToast, showSuccessToast, showWarningToast, showErrorToast } from '../ToastManager';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock createPortal
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (element) => element,
}));

const renderToastManager = () => {
  return render(
    <BrowserRouter>
      <ToastManager />
    </BrowserRouter>
  );
};

describe('ToastManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing toasts
    delete window.addToast;
  });

  afterEach(() => {
    // Clean up any remaining toasts
    const toastElements = document.querySelectorAll('[data-toast-id]');
    toastElements.forEach(el => el.remove());
  });

  test('renders without crashing', () => {
    renderToastManager();
    expect(document.body).toBeInTheDocument();
  });

  test('exposes addToast function globally', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
      expect(typeof window.addToast).toBe('function');
    });
  });

  test('displays toast notification', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    act(() => {
      window.addToast({
        type: 'info',
        message: 'Test notification',
        title: 'Test Title'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Test notification')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });

  test('displays different toast types with correct styling', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    const toastTypes = ['success', 'warning', 'error', 'info'];
    
    for (const type of toastTypes) {
      act(() => {
        window.addToast({
          type,
          message: `${type} notification`,
          title: `${type} title`
        });
      });
    }

    await waitFor(() => {
      toastTypes.forEach(type => {
        expect(screen.getByText(`${type} notification`)).toBeInTheDocument();
      });
    });
  });

  test('auto-dismisses toast after specified duration', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    act(() => {
      window.addToast({
        type: 'info',
        message: 'Auto dismiss test',
        duration: 1000
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Auto dismiss test')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByText('Auto dismiss test')).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test('handles toast click navigation', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    act(() => {
      window.addToast({
        type: 'info',
        message: 'Click to navigate',
        clickAction: {
          url: '/test-page',
          params: { test: 'param' }
        }
      });
    });

    const toastElement = await screen.findByText('Click to navigate');
    
    act(() => {
      fireEvent.click(toastElement.closest('[data-toast-id]'));
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/test-page', {
        state: { test: 'param' }
      });
    });
  });

  test('limits maximum concurrent toasts', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    // Add more toasts than the maximum allowed (5)
    for (let i = 0; i < 7; i++) {
      act(() => {
        window.addToast({
          type: 'info',
          message: `Toast ${i}`,
          duration: 0 // Don't auto-dismiss
        });
      });
    }

    await waitFor(() => {
      const toastElements = document.querySelectorAll('[data-toast-id]');
      expect(toastElements.length).toBeLessThanOrEqual(5);
    });
  });

  test('handles dismiss button click', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    act(() => {
      window.addToast({
        type: 'info',
        message: 'Dismissible toast',
        dismissible: true,
        duration: 0
      });
    });

    const dismissButton = await screen.findByLabelText('Dismiss notification');
    
    act(() => {
      fireEvent.click(dismissButton);
    });

    await waitFor(() => {
      expect(screen.queryByText('Dismissible toast')).not.toBeInTheDocument();
    });
  });

  test('handles offline/online events', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    await waitFor(() => {
      expect(screen.getByText(/offline/i)).toBeInTheDocument();
    });

    // Simulate coming back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    await waitFor(() => {
      expect(screen.getByText(/connection restored/i)).toBeInTheDocument();
    });
  });

  test('utility functions work correctly', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    // Test utility functions
    act(() => {
      showSuccessToast('Success message');
      showWarningToast('Warning message');
      showErrorToast('Error message');
      showToast({ message: 'Generic toast' });
    });

    await waitFor(() => {
      expect(screen.getByText('Success message')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.getByText('Generic toast')).toBeInTheDocument();
    });
  });

  test('handles errors gracefully', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    // Test with invalid toast data
    act(() => {
      window.addToast(null);
      window.addToast(undefined);
      window.addToast({});
    });

    // Should not crash the component
    expect(document.body).toBeInTheDocument();
  });

  test('cleans up old toasts', async () => {
    renderToastManager();
    
    await waitFor(() => {
      expect(window.addToast).toBeDefined();
    });

    // Add a toast with old timestamp
    act(() => {
      const oldToast = {
        type: 'info',
        message: 'Old toast',
        duration: 0
      };
      
      // Mock old timestamp
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() - 35000); // 35 seconds ago
      
      window.addToast(oldToast);
      
      // Restore Date.now
      Date.now = originalNow;
    });

    // Wait for cleanup interval
    await waitFor(() => {
      expect(screen.queryByText('Old toast')).not.toBeInTheDocument();
    }, { timeout: 6000 });
  });
});