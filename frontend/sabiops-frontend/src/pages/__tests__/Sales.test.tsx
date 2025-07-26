import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import Sales from '../Sales';

// Mock the API calls and hooks
jest.mock('@/services/api', () => ({
  getSales: jest.fn(),
  getProductsWithStock: jest.fn(),
  getCustomers: jest.fn(),
  createSale: jest.fn(),
}));

jest.mock('@/services/enhancedApi', () => ({
  enhancedCreateSale: jest.fn(),
}));

jest.mock('@/hooks/useUsageTracking', () => ({
  useUsageTracking: () => ({
    checkUsageLimit: jest.fn(),
    isLimitReached: jest.fn(),
  }),
}));

// Mock the toast service
jest.mock('@/services/ToastService', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock child components with TypeScript types
jest.mock('@/components/sales/SalesTable', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ sales }: { sales: Array<unknown> }) => (
      <div data-testid="sales-table">{sales?.length || 0} sales</div>
    ),
  };
});

jest.mock('@/components/sales/SalesForm', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
      <form onSubmit={onSubmit} data-testid="sales-form">
        <button type="submit">Submit</button>
      </form>
    ),
  };
});

describe('Sales Component', () => {
  const mockSalesData = [
    {
      id: 1,
      product_id: 'p1',
      product_name: 'Test Product',
      quantity: 2,
      unit_price: 100,
      total_amount: 200,
      date: '2025-07-26T10:00:00Z',
      created_at: '2025-07-26T10:00:00Z',
      profit_from_sales: 50,
    },
  ] as const;

  const mockProductsData = [
    { id: 'p1', name: 'Test Product', stock: 10, price: 100 },
  ] as const;

  const mockCustomersData = [
    { id: 'c1', name: 'Test Customer', email: 'test@example.com' },
  ] as const;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    const { getSales, getProductsWithStock, getCustomers } = require('@/services/api');
    const { enhancedCreateSale } = require('@/services/enhancedApi');
    
    getSales.mockResolvedValue({ data: mockSalesData });
    getProductsWithStock.mockResolvedValue(mockProductsData);
    getCustomers.mockResolvedValue(mockCustomersData);
    enhancedCreateSale.mockResolvedValue({
      ...mockSalesData[0],
      id: 'new-sale-123',
    });
  });

  const renderSalesComponent = () => {
    return render(
      <Router>
        <Sales />
      </Router>
    );
  };

  it('renders without crashing', async () => {
    renderSalesComponent();
    await waitFor(() => {
      expect(screen.getByText('Sales')).toBeInTheDocument();
    });
  });

  it('loads and displays sales data', async () => {
    renderSalesComponent();
    
    await waitFor(() => {
      const salesTable = screen.getByTestId('sales-table');
      expect(salesTable).toHaveTextContent('1 sales');
    });
  });

  it('handles API errors gracefully', async () => {
    const { getSales } = require('@/services/api');
    getSales.mockRejectedValueOnce(new Error('API Error'));
    
    renderSalesComponent();
    
    // Should not crash, and should show empty state
    await waitFor(() => {
      const salesTable = screen.getByTestId('sales-table');
      expect(salesTable).toHaveTextContent('0 sales');
    });
  });

  it('handles different sales data formats', async () => {
    const { getSales } = require('@/services/api');
    
    // Test with different response formats
    const testCases = [
      { response: mockSalesData, description: 'direct array' },
      { response: { data: mockSalesData }, description: 'nested in data' },
      { response: { sales: mockSalesData }, description: 'nested in sales' },
      { response: { data: { sales: mockSalesData } }, description: 'deeply nested' },
    ] as const;

    for (const { response, description } of testCases) {
      getSales.mockResolvedValueOnce(response);
      const { unmount } = renderSalesComponent();
      
      await waitFor(() => {
        const salesTable = screen.getByTestId('sales-table');
        expect(salesTable).toHaveTextContent('1 sales');
      });
      
      unmount();
    }
  });

  it('handles form submission', async () => {
    renderSalesComponent();
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByTestId('sales-form')).toBeInTheDocument();
    });
    
    // Submit the form
    fireEvent.submit(screen.getByTestId('sales-form'));
    
    // Wait for the form submission to complete
    await waitFor(() => {
      const { enhancedCreateSale } = require('@/services/enhancedApi');
      expect(enhancedCreateSale).toHaveBeenCalled();
    });
  });

  // Add a test for the calculateSalesStats function
  describe('calculateSalesStats', () => {
    it('handles empty or invalid data', () => {
      const { calculateSalesStats } = require('../Sales');
      
      // Test with null/undefined
      expect(calculateSalesStats(null)).toEqual({
        total_sales: 0,
        total_transactions: 0,
        today_sales: 0,
        average_sale: 0,
        total_quantity: 0,
        profit_from_sales_monthly: 0
      });

      // Test with empty array
      expect(calculateSalesStats([])).toEqual({
        total_sales: 0,
        total_transactions: 0,
        today_sales: 0,
        average_sale: 0,
        total_quantity: 0,
        profit_from_sales_monthly: 0
      });
    });
  });
});
