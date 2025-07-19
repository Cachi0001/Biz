/**
 * Sales Data Display Integration Tests
 * Tests sales data fetching, display, and real-time updates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Sales from '../../pages/Sales';

// Mock API functions
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockEnhancedCreateSale = jest.fn();
const mockEnhancedGetProducts = jest.fn();
const mockEnhancedGetCustomers = jest.fn();

jest.mock('../../services/api', () => ({
  get: (...args) => mockGet(...args),
  post: (...args) => mockPost(...args),
  recordPayment: jest.fn()
}));

jest.mock('../../services/enhancedApi', () => ({
  enhancedCreateSale: (...args) => mockEnhancedCreateSale(...args),
  enhancedGetProducts: (...args) => mockEnhancedGetProducts(...args),
  enhancedGetCustomers: (...args) => mockEnhancedGetCustomers(...args),
  validateSaleData: jest.fn(() => ({}))
}));

// Mock utilities
jest.mock('../../utils/errorHandling', () => ({
  handleApiError: jest.fn((error, message) => message),
  showSuccessToast: jest.fn(),
  safeArray: jest.fn((data, fallback) => Array.isArray(data) ? data : fallback)
}));

jest.mock('../../utils/formatting', () => ({
  formatNaira: jest.fn((amount) => `₦${amount}`),
  formatDateTime: jest.fn((date) => new Date(date).toLocaleString()),
  formatDate: jest.fn((date) => new Date(date).toLocaleDateString()),
  formatPaymentMethod: jest.fn((method) => method?.replace('_', ' ') || 'Unknown')
}));

const renderSalesPage = () => {
  return render(
    <BrowserRouter>
      <Sales />
    </BrowserRouter>
  );
};

describe('Sales Data Display Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockGet.mockResolvedValue({
      data: {
        sales: [],
        summary: {
          total_sales: 0,
          total_transactions: 0,
          today_sales: 0,
          average_sale: 0
        }
      }
    });
    
    mockEnhancedGetProducts.mockResolvedValue({
      products: [
        { id: 1, name: 'Product 1', price: 100 },
        { id: 2, name: 'Product 2', price: 200 }
      ]
    });
    
    mockEnhancedGetCustomers.mockResolvedValue([
      { id: 1, name: 'Customer 1', email: 'customer1@test.com' },
      { id: 2, name: 'Customer 2', email: 'customer2@test.com' }
    ]);
  });

  test('should display sales data after loading', async () => {
    const mockSales = [
      {
        id: 1,
        customer_name: 'John Doe',
        product_name: 'Product 1',
        quantity: 2,
        unit_price: 100,
        total_amount: 200,
        payment_method: 'cash',
        date: '2024-01-01',
        created_at: '2024-01-01T10:00:00Z'
      },
      {
        id: 2,
        customer_name: 'Jane Smith',
        product_name: 'Product 2',
        quantity: 1,
        unit_price: 200,
        total_amount: 200,
        payment_method: 'bank_transfer',
        date: '2024-01-01',
        created_at: '2024-01-01T11:00:00Z'
      }
    ];

    mockGet.mockResolvedValue({
      data: {
        sales: mockSales,
        summary: {
          total_sales: 400,
          total_transactions: 2,
          today_sales: 400,
          average_sale: 200
        }
      }
    });

    renderSalesPage();

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading sales...')).not.toBeInTheDocument();
    });

    // Check if sales data is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();

    // Check statistics
    expect(screen.getByText('₦400')).toBeInTheDocument(); // Total revenue
    expect(screen.getByText('2')).toBeInTheDocument(); // Total transactions
  });

  test('should handle empty sales data gracefully', async () => {
    mockGet.mockResolvedValue({
      data: {
        sales: [],
        summary: {
          total_sales: 0,
          total_transactions: 0,
          today_sales: 0,
          average_sale: 0
        }
      }
    });

    renderSalesPage();

    await waitFor(() => {
      expect(screen.getByText('No sales found')).toBeInTheDocument();
      expect(screen.getByText('Record Your First Sale')).toBeInTheDocument();
    });
  });

  test('should handle API errors gracefully', async () => {
    mockGet.mockRejectedValue(new Error('API Error'));

    renderSalesPage();

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch sales')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  test('should record new sale and refresh data', async () => {
    const user = userEvent.setup();
    
    // Initial empty state
    mockGet.mockResolvedValueOnce({
      data: { sales: [], summary: { total_sales: 0, total_transactions: 0 } }
    });

    // After sale creation
    const newSale = {
      id: 1,
      customer_name: 'New Customer',
      product_name: 'New Product',
      quantity: 1,
      unit_price: 150,
      total_amount: 150,
      payment_method: 'cash',
      date: '2024-01-01'
    };

    mockEnhancedCreateSale.mockResolvedValue(newSale);
    
    // Mock refreshed data after sale creation
    mockGet.mockResolvedValue({
      data: {
        sales: [newSale],
        summary: { total_sales: 150, total_transactions: 1 }
      }
    });

    renderSalesPage();

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Record Sale')).toBeInTheDocument();
    });

    // Open sale dialog
    const recordSaleButton = screen.getByText('Record Sale');
    await user.click(recordSaleButton);

    // Wait for dialog to open and products to load
    await waitFor(() => {
      expect(screen.getByText('Record New Sale')).toBeInTheDocument();
    });

    // Fill form
    const productSelect = screen.getByDisplayValue('Select product');
    fireEvent.change(productSelect, { target: { value: '1' } });

    const quantityInput = screen.getByPlaceholderText('1');
    await user.clear(quantityInput);
    await user.type(quantityInput, '1');

    const unitPriceInput = screen.getByPlaceholderText('0.00');
    await user.clear(unitPriceInput);
    await user.type(unitPriceInput, '150');

    // Submit form
    const submitButton = screen.getByText('Record Sale');
    await user.click(submitButton);

    // Wait for sale to be created and data to refresh
    await waitFor(() => {
      expect(mockEnhancedCreateSale).toHaveBeenCalled();
    });

    // Verify data refresh was called
    expect(mockGet).toHaveBeenCalledTimes(2); // Initial load + refresh
  });

  test('should filter sales by search term', async () => {
    const user = userEvent.setup();
    
    const mockSales = [
      {
        id: 1,
        customer_name: 'John Doe',
        product_name: 'Laptop',
        total_amount: 1000
      },
      {
        id: 2,
        customer_name: 'Jane Smith',
        product_name: 'Mouse',
        total_amount: 50
      }
    ];

    mockGet.mockResolvedValue({
      data: { sales: mockSales, summary: {} }
    });

    renderSalesPage();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText(/Search by sale number or customer/);
    await user.type(searchInput, 'John');

    // Should show only John's sale
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  test('should handle different API response formats', async () => {
    const testCases = [
      // Format 1: data.sales
      {
        response: { data: { sales: [{ id: 1, customer_name: 'Test 1' }] } },
        expectedCount: 1
      },
      // Format 2: direct array
      {
        response: [{ id: 2, customer_name: 'Test 2' }],
        expectedCount: 1
      },
      // Format 3: root sales property
      {
        response: { sales: [{ id: 3, customer_name: 'Test 3' }] },
        expectedCount: 1
      },
      // Format 4: direct data array
      {
        response: { data: [{ id: 4, customer_name: 'Test 4' }] },
        expectedCount: 1
      }
    ];

    for (const testCase of testCases) {
      mockGet.mockResolvedValueOnce(testCase.response);
      
      const { unmount } = renderSalesPage();
      
      await waitFor(() => {
        expect(screen.getByText(`Test ${testCase.response.id || testCase.response.data?.[0]?.id || testCase.response.sales?.[0]?.id || testCase.response[0]?.id}`)).toBeInTheDocument();
      });
      
      unmount();
    }
  });

  test('should calculate statistics when not provided by API', async () => {
    const mockSales = [
      { id: 1, total_amount: 100 },
      { id: 2, total_amount: 200 },
      { id: 3, total_amount: 300 }
    ];

    // API response without summary
    mockGet.mockResolvedValue({
      data: { sales: mockSales }
    });

    renderSalesPage();

    await waitFor(() => {
      // Should calculate total sales (600)
      expect(screen.getByText('₦600')).toBeInTheDocument();
      // Should show transaction count (3)
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  test('should handle product dropdown loading states', async () => {
    const user = userEvent.setup();
    
    // Delay product loading
    mockEnhancedGetProducts.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ products: [] }), 100)
      )
    );

    renderSalesPage();

    // Open dialog
    const recordSaleButton = screen.getByText('Record Sale');
    await user.click(recordSaleButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Loading products...')).toBeInTheDocument();
    });

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('No products available')).toBeInTheDocument();
    });
  });

  test('should handle date filtering', async () => {
    const user = userEvent.setup();
    
    renderSalesPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue(new Date().toISOString().split('T')[0])).toBeInTheDocument();
    });

    // Change date
    const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
    await user.clear(dateInput);
    await user.type(dateInput, '2024-01-01');

    // Should trigger new API call with updated date
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('/sales/', {
        params: {
          start_date: '2024-01-01',
          end_date: '2024-01-01'
        }
      });
    });
  });
});

export default salesDataDisplayTests;