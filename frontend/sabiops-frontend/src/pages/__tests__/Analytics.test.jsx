/**
 * Unit tests for Analytics Page
 * Tests the analytics page functionality and components
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import Analytics from '../Analytics';

// Mock dependencies
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

jest.mock('../../hooks/useDashboard', () => ({
  useDashboard: jest.fn()
}));

jest.mock('../../services/api', () => ({
  api: {
    get: jest.fn()
  }
}));

jest.mock('../../services/analyticsCacheService', () => ({
  getCacheKey: jest.fn(),
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
  preloadAnalyticsData: jest.fn()
}));

// Mock chart components to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />
}));

// Mock child components
jest.mock('../../components/dashboard/DashboardLayout', () => {
  return function MockDashboardLayout({ children }) {
    return <div data-testid="dashboard-layout">{children}</div>;
  };
});

jest.mock('../../components/dashboard/ModernChartsSection', () => {
  return function MockModernChartsSection({ data, loading, analyticsData }) {
    return (
      <div data-testid="modern-charts-section">
        {loading ? 'Loading charts...' : 'Charts loaded'}
        {analyticsData && <div data-testid="analytics-data-present">Analytics data present</div>}
      </div>
    );
  };
});

jest.mock('../../components/analytics/TimePeriodFilter', () => {
  return function MockTimePeriodFilter({ currentPeriod, onPeriodChange, loading }) {
    return (
      <div data-testid="time-period-filter">
        <span>Current period: {currentPeriod}</span>
        <button 
          onClick={() => onPeriodChange('weekly')} 
          disabled={loading}
          data-testid="change-period-btn"
        >
          Change to Weekly
        </button>
      </div>
    );
  };
});

jest.mock('../../components/analytics/ExportControls', () => {
  return function MockExportControls({ analyticsData, timePeriod }) {
    return (
      <div data-testid="export-controls">
        Export controls for {timePeriod}
        {analyticsData && <span data-testid="export-data-ready">Data ready for export</span>}
      </div>
    );
  };
});

describe('Analytics Page', () => {
  const mockUseAuth = require('../../contexts/AuthContext').useAuth;
  const mockUseDashboard = require('../../hooks/useDashboard').useDashboard;
  const mockApi = require('../../services/api').api;
  const mockCache = require('../../services/analyticsCacheService');

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-123' },
      isAuthenticated: true,
      subscription: { plan: 'monthly', is_trial: false }
    });

    mockUseDashboard.mockReturnValue({
      dashboardData: {
        revenue: { total: 10000 },
        customers: { total: 50 }
      },
      loading: false,
      error: null
    });

    mockCache.getCacheKey.mockReturnValue('test-cache-key');
    mockCache.getCachedData.mockReturnValue(null);
    mockCache.setCachedData.mockReturnValue(true);
    mockCache.preloadAnalyticsData.mockReturnValue(Promise.resolve());
  });

  test('renders loading state initially', async () => {
    // Mock API to simulate loading
    mockApi.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Analytics />);

    expect(screen.getByText('Loading your business insights...')).toBeInTheDocument();
    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
  });

  test('renders analytics data when loaded successfully', async () => {
    const mockAnalyticsData = {
      revenue: {
        total_revenue: 25000,
        revenue_growth: 15.5,
        profit_margin: 25.0
      },
      customers: {
        total_customers: 100,
        avg_order_value: 250
      },
      products: {
        total_products: 50,
        inventory_turnover: 4.2
      },
      financial: {
        total_expenses: 15000,
        net_profit: 10000
      }
    };

    // Mock successful API responses
    mockApi.get.mockImplementation((url) => {
      if (url.includes('access-check')) {
        return Promise.resolve({
          data: {
            data: {
              has_access: true,
              reason: 'Paid subscription active'
            }
          }
        });
      } else if (url.includes('analytics')) {
        return Promise.resolve({
          data: {
            data: mockAnalyticsData
          }
        });
      }
    });

    render(<Analytics />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Business Analytics')).toBeInTheDocument();
    });

    // Check that key metrics are displayed
    expect(screen.getByText('₦25,000')).toBeInTheDocument(); // Total revenue
    expect(screen.getByText('100')).toBeInTheDocument(); // Total customers
    expect(screen.getByText('50')).toBeInTheDocument(); // Total products

    // Check that components are rendered
    expect(screen.getByTestId('time-period-filter')).toBeInTheDocument();
    expect(screen.getByTestId('export-controls')).toBeInTheDocument();
    expect(screen.getByTestId('modern-charts-section')).toBeInTheDocument();
  });

  test('shows upgrade prompt for users without access', async () => {
    // Mock access denied response
    mockApi.get.mockResolvedValue({
      data: {
        data: {
          has_access: false,
          reason: 'Free plan does not include analytics',
          upgrade_info: {
            trial_available: true,
            upgrade_options: [
              { plan: 'weekly', price: '₦1,400' }
            ]
          }
        }
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    });

    // Should not show analytics content
    expect(screen.queryByTestId('time-period-filter')).not.toBeInTheDocument();
    expect(screen.queryByTestId('export-controls')).not.toBeInTheDocument();
  });

  test('handles API errors gracefully', async () => {
    // Mock API error
    mockApi.get.mockRejectedValue(new Error('Network error'));

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Analytics')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  test('handles time period changes', async () => {
    const mockAnalyticsData = {
      revenue: { total_revenue: 25000 },
      customers: { total_customers: 100 }
    };

    // Mock successful API responses
    mockApi.get.mockImplementation((url) => {
      if (url.includes('access-check')) {
        return Promise.resolve({
          data: { data: { has_access: true } }
        });
      } else if (url.includes('analytics')) {
        return Promise.resolve({
          data: { data: mockAnalyticsData }
        });
      }
    });

    render(<Analytics />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('time-period-filter')).toBeInTheDocument();
    });

    // Check initial period
    expect(screen.getByText('Current period: monthly')).toBeInTheDocument();

    // Change time period
    fireEvent.click(screen.getByTestId('change-period-btn'));

    // Should trigger new API call with different period
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/dashboard/analytics?period=weekly');
    });
  });

  test('uses cached data when available', async () => {
    const mockCachedData = {
      revenue: { total_revenue: 30000 },
      customers: { total_customers: 120 }
    };

    // Mock cached data
    mockCache.getCachedData.mockReturnValue(mockCachedData);

    // Mock access check
    mockApi.get.mockResolvedValue({
      data: { data: { has_access: true } }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Business Analytics')).toBeInTheDocument();
    });

    // Should use cached data
    expect(mockCache.getCachedData).toHaveBeenCalled();
    expect(mockCache.preloadAnalyticsData).toHaveBeenCalled();
    
    // Should not make analytics API call since data is cached
    expect(mockApi.get).toHaveBeenCalledTimes(1); // Only access-check call
  });

  test('renders unauthenticated state', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false
    });

    render(<Analytics />);

    expect(screen.getByText('Please Login')).toBeInTheDocument();
    expect(screen.getByText('Access your SabiOps analytics')).toBeInTheDocument();
  });

  test('displays performance summary with real data', async () => {
    const mockAnalyticsData = {
      revenue: {
        revenue_growth: 12.5,
        profit_margin: 28.3
      },
      customers: {
        avg_order_value: 1500
      },
      products: {
        inventory_turnover: 3.8
      }
    };

    mockApi.get.mockImplementation((url) => {
      if (url.includes('access-check')) {
        return Promise.resolve({
          data: { data: { has_access: true } }
        });
      } else if (url.includes('analytics')) {
        return Promise.resolve({
          data: { data: mockAnalyticsData }
        });
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Performance Summary')).toBeInTheDocument();
    });

    // Check that real data is displayed in performance summary
    expect(screen.getByText('+12.5%')).toBeInTheDocument(); // Revenue growth
    expect(screen.getByText('28.3%')).toBeInTheDocument(); // Profit margin
    expect(screen.getByText('₦1,500')).toBeInTheDocument(); // Avg order value
    expect(screen.getByText('3.8x')).toBeInTheDocument(); // Inventory turnover
  });

  test('handles refresh functionality', async () => {
    mockApi.get.mockImplementation((url) => {
      if (url.includes('access-check')) {
        return Promise.resolve({
          data: { data: { has_access: true } }
        });
      } else if (url.includes('analytics')) {
        return Promise.resolve({
          data: { data: { revenue: { total_revenue: 25000 } } }
        });
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText('Business Analytics')).toBeInTheDocument();
    });

    // Clear the mock call history
    mockApi.get.mockClear();

    // Trigger refresh by changing time period back to the same value
    fireEvent.click(screen.getByTestId('change-period-btn'));

    // Should make new API calls
    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalled();
    });
  });

  test('passes correct props to child components', async () => {
    const mockAnalyticsData = {
      revenue: { total_revenue: 25000 },
      customers: { total_customers: 100 }
    };

    mockApi.get.mockImplementation((url) => {
      if (url.includes('access-check')) {
        return Promise.resolve({
          data: { data: { has_access: true } }
        });
      } else if (url.includes('analytics')) {
        return Promise.resolve({
          data: { data: mockAnalyticsData }
        });
      }
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByTestId('analytics-data-present')).toBeInTheDocument();
      expect(screen.getByTestId('export-data-ready')).toBeInTheDocument();
    });

    // Check that time period filter shows correct period
    expect(screen.getByText('Current period: monthly')).toBeInTheDocument();
    
    // Check that export controls show correct period
    expect(screen.getByText('Export controls for monthly')).toBeInTheDocument();
  });
});