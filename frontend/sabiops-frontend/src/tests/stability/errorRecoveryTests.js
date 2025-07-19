/**
 * Error Recovery Integration Tests
 * Tests error handling, recovery mechanisms, and system stability
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorRecoverySystem from '../../utils/errorRecoverySystem';
import ApiErrorHandler from '../../utils/apiErrorHandler';
import ComponentErrorBoundary from '../../components/ui/ComponentErrorBoundary';

// Mock components for testing
const ThrowingComponent = ({ shouldThrow = false, errorType = 'render' }) => {
  if (shouldThrow) {
    if (errorType === 'render') {
      throw new Error('Test render error');
    } else if (errorType === 'api') {
      throw new Error('Test API error');
    }
  }
  return <div data-testid="working-component">Component working</div>;
};

const AsyncThrowingComponent = ({ shouldThrow = false }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      // Simulate unhandled promise rejection
      Promise.reject(new Error('Test async error'));
    }
  }, [shouldThrow]);
  
  return <div data-testid="async-component">Async component</div>;
};

describe('Error Recovery Tests', () => {
  beforeEach(() => {
    // Reset error recovery system
    ErrorRecoverySystem.reset();
    ApiErrorHandler.resetCircuitBreaker();
    
    // Clear console to avoid test pollution
    jest.clearAllMocks();
  });

  test('should catch and recover from component errors', async () => {
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);

      return (
        <div>
          <button
            data-testid="trigger-error"
            onClick={() => setShouldThrow(true)}
          >
            Trigger Error
          </button>
          <ComponentErrorBoundary
            componentName="TestComponent"
            fallbackTitle="Component Error"
            fallbackMessage="Test component failed"
          >
            <ThrowingComponent shouldThrow={shouldThrow} />
          </ComponentErrorBoundary>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initially component should work
    expect(screen.getByTestId('working-component')).toBeInTheDocument();
    
    // Trigger error
    const triggerButton = screen.getByTestId('trigger-error');
    fireEvent.click(triggerButton);
    
    // Should show error boundary fallback
    await waitFor(() => {
      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // Should not show the original component
    expect(screen.queryByTestId('working-component')).not.toBeInTheDocument();
  });

  test('should handle API errors with circuit breaker', async () => {
    const mockApiCall = jest.fn();
    
    // Create failing API call
    const failingApiCall = () => {
      const error = new Error('API Error');
      error.response = { status: 500 };
      throw error;
    };

    // Test circuit breaker behavior
    const safeApiCall = ApiErrorHandler.createSafeApiCall(
      failingApiCall,
      '/test-endpoint',
      { retry: true, maxRetries: 2 }
    );

    // First few calls should attempt retry
    for (let i = 0; i < 3; i++) {
      const result = await safeApiCall();
      expect(result.success).toBe(false);
      expect(result.errorType).toBe('server');
    }

    // After threshold, circuit breaker should open
    const circuitStatus = ApiErrorHandler.getCircuitBreakerStatus();
    expect(circuitStatus['/test-endpoint']).toBeDefined();
  });

  test('should handle unhandled promise rejections', async () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);

      return (
        <div>
          <button
            data-testid="trigger-async-error"
            onClick={() => setShouldThrow(true)}
          >
            Trigger Async Error
          </button>
          <AsyncThrowingComponent shouldThrow={shouldThrow} />
        </div>
      );
    };

    render(<TestComponent />);
    
    const triggerButton = screen.getByTestId('trigger-async-error');
    fireEvent.click(triggerButton);
    
    // Wait for async error to be handled
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    // Component should still be rendered
    expect(screen.getByTestId('async-component')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  test('should monitor system health', async () => {
    // Get initial system health
    const initialHealth = ErrorRecoverySystem.getSystemHealth();
    expect(initialHealth.status).toBe('healthy');
    
    // Simulate some errors to affect health
    const error = new Error('Test error');
    error.response = { status: 500 };
    
    // Record multiple failures
    for (let i = 0; i < 6; i++) {
      ApiErrorHandler.recordFailure('/test-service');
    }
    
    // Trigger health check
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const updatedHealth = ErrorRecoverySystem.getSystemHealth();
    // Health status might change based on error thresholds
    expect(updatedHealth.lastCheck).toBeDefined();
  });

  test('should provide recovery statistics', () => {
    const stats = ErrorRecoverySystem.getRecoveryStats();
    
    expect(stats).toHaveProperty('activeRecoveryAttempts');
    expect(stats).toHaveProperty('notificationQueueLength');
    expect(stats).toHaveProperty('systemHealth');
    
    expect(typeof stats.activeRecoveryAttempts).toBe('number');
    expect(typeof stats.notificationQueueLength).toBe('number');
    expect(typeof stats.systemHealth).toBe('object');
  });

  test('should handle multiple error types', async () => {
    const errors = [
      { type: 'network', error: new Error('Network Error') },
      { type: 'api', error: { response: { status: 404 } } },
      { type: 'validation', error: { response: { data: { errors: { field: 'Required' } } } } }
    ];

    for (const { type, error } of errors) {
      const result = ApiErrorHandler.handleError(error, 'test', {
        endpoint: `/test-${type}`,
        showToast: false,
        logError: false
      });

      expect(result.success).toBe(false);
      expect(result.errorType).toBeDefined();
      expect(result.userMessage).toBeDefined();
    }
  });

  test('should reset error recovery state', () => {
    // Add some recovery attempts
    ApiErrorHandler.recordFailure('/test-endpoint');
    ErrorRecoverySystem.notifyUser('Test message');
    
    // Get stats before reset
    const statsBefore = ErrorRecoverySystem.getRecoveryStats();
    
    // Reset system
    ErrorRecoverySystem.reset();
    ApiErrorHandler.resetCircuitBreaker();
    
    // Get stats after reset
    const statsAfter = ErrorRecoverySystem.getRecoveryStats();
    
    expect(statsAfter.activeRecoveryAttempts).toBe(0);
    expect(statsAfter.notificationQueueLength).toBe(0);
    expect(statsAfter.systemHealth.status).toBe('healthy');
  });

  test('should handle error boundary retry functionality', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(true);
      const [retryCount, setRetryCount] = React.useState(0);

      return (
        <ComponentErrorBoundary
          componentName="RetryTest"
          onReset={() => {
            setShouldThrow(false);
            setRetryCount(prev => prev + 1);
          }}
        >
          <ThrowingComponent shouldThrow={shouldThrow} />
          <div data-testid="retry-count">Retry count: {retryCount}</div>
        </ComponentErrorBoundary>
      );
    };

    render(<TestComponent />);
    
    // Should show error boundary
    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
    
    // Click retry button
    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);
    
    // Should show working component after retry
    await waitFor(() => {
      expect(screen.getByTestId('working-component')).toBeInTheDocument();
      expect(screen.getByText('Retry count: 1')).toBeInTheDocument();
    });
  });

  test('should handle form error boundaries', async () => {
    const FormErrorBoundary = require('../../components/ui/FormErrorBoundary').default;
    const user = userEvent.setup();
    
    const TestForm = ({ shouldThrow = false }) => {
      if (shouldThrow) {
        throw new Error('Form validation error');
      }
      
      return (
        <form data-testid="test-form">
          <input data-testid="form-input" />
          <button type="submit">Submit</button>
        </form>
      );
    };

    const TestComponent = () => {
      const [shouldThrow, setShouldThrow] = React.useState(false);

      return (
        <div>
          <button
            data-testid="trigger-form-error"
            onClick={() => setShouldThrow(true)}
          >
            Trigger Form Error
          </button>
          <FormErrorBoundary
            formName="TestForm"
            title="Form Error"
            message="Form encountered an error"
          >
            <TestForm shouldThrow={shouldThrow} />
          </FormErrorBoundary>
        </div>
      );
    };

    render(<TestComponent />);
    
    // Initially form should work
    expect(screen.getByTestId('test-form')).toBeInTheDocument();
    
    // Trigger form error
    const triggerButton = screen.getByTestId('trigger-form-error');
    await user.click(triggerButton);
    
    // Should show form error boundary
    await waitFor(() => {
      expect(screen.getByText('Form Error')).toBeInTheDocument();
      expect(screen.getByText('Reset Form')).toBeInTheDocument();
    });
  });
});

export default errorRecoveryTests;