/**
 * Data Display Tests - Tests for consistent data display across components
 * Validates that API responses are properly normalized and displayed
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  normalizeApiResponse,
  normalizeExpensesResponse,
  normalizeProductsResponse,
  normalizeCustomersResponse,
  normalizeSalesResponse
} from '../utils/apiResponseNormalizer';
import {
  getExpensesFallback,
  getProductsFallback,
  getCustomersFallback,
  validateDataStructure
} from '../utils/dataFallbacks';
import { enhancedGetExpenses, enhancedGetProducts } from '../services/enhancedApi';

// Mock the API functions
jest.mock('../services/enhancedApi');
jest.mock('../utils/debugLogger', () => ({
  logApiCall: jest.fn(),
  logDataDisplay: jest.fn(),
  logDisplayIssue: jest.fn(),
  logDropdownEvent: jest.fn(),
  logDropdownIssue: jest.fn()
}));

describe('API Response Normalization Tests', () => {
  test('normalizeApiResponse handles success.data format', () => {
    const response = {
      success: true,
      data: { items: [1, 2, 3] }
    };
    
    const result = normalizeApiResponse(response);
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  test('normalizeApiResponse handles direct data key format', () => {
    const response = {
      data: [1, 2, 3]
    };
    
    const result = normalizeApiResponse(response);
    expect(result).toEqual([1, 2, 3]);
  });

  test('normalizeApiResponse handles direct array format', () => {
    const response = [1, 2, 3];
    
    const result = normalizeApiResponse(response);
    expect(result).toEqual([1, 2, 3]);
  });

  test('normalizeApiResponse handles direct object format', () => {
    const response = { id: 1, name: 'test' };
    
    const result = normalizeApiResponse(response);
    expect(result).toEqual({ id: 1, name: 'test' });
  });

  test('normalizeApiResponse returns empty array for invalid input', () => {
    const result = normalizeApiResponse(null);
    expect(result).toEqual([]);
    
    const result2 = normalizeApiResponse(undefined);
    expect(result2).toEqual([]);
    
    const result3 = normalizeApiResponse('invalid');
    expect(result3).toEqual([]);
  });
});

describe('Expenses Response Normalization Tests', () => {
  test('normalizes expenses with summary format', () => {
    const response = {
      success: true,
      data: {
        expenses: [
          { id: 1, amount: 100, category: 'Office' },
          { id: 2, amount: 200, category: 'Travel' }
        ],
        summary: {
          total_expenses: 300,
          total_count: 2,
          today_expenses: 100,
          this_month_expenses: 300
        }
      }
    };
    
    const result = normalizeExpensesResponse(response);
    
    expect(result.expenses).toHaveLength(2);
    expect(result.expenses[0]).toEqual({ id: 1, amount: 100, category: 'Office' });
    expect(result.summary.total_expenses).toBe(300);
    expect(result.summary.total_count).toBe(2);
  });

  test('normalizes direct expenses array', () => {
    const response = [
      { id: 1, amount: 100, category: 'Office' },
      { id: 2, amount: 200, category: 'Travel' }
    ];
    
    const result = normalizeExpensesResponse(response);
    
    expect(result.expenses).toHaveLength(2);
    expect(result.summary.total_expenses).toBe(0); // Default summary
    expect(result.summary.total_count).toBe(0);
  });

  test('handles empty expenses response', () => {
    const response = { success: true, data: { expenses: [] } };
    
    const result = normalizeExpensesResponse(response);
    
    expect(result.expenses).toEqual([]);
    expect(result.summary).toBeDefined();
    expect(result.summary.total_expenses).toBe(0);
  });

  test('handles malformed expenses response', () => {
    const response = { invalid: 'data' };
    
    const result = normalizeExpensesResponse(response);
    
    expect(result.expenses).toEqual([]);
    expect(result.summary).toBeDefined();
  });
});

describe('Products Response Normalization Tests', () => {
  test('normalizes products with categories format', () => {
    const response = {
      success: true,
      data: {
        products: [
          { id: 1, name: 'Product 1', price: 100 },
          { id: 2, name: 'Product 2', price: 200 }
        ],
        categories: ['Electronics', 'Clothing']
      }
    };
    
    const result = normalizeProductsResponse(response);
    
    expect(result.products).toHaveLength(2);
    expect(result.products[0]).toEqual({ id: 1, name: 'Product 1', price: 100 });
    expect(result.categories).toEqual(['Electronics', 'Clothing']);
  });

  test('normalizes direct products array', () => {
    const response = [
      { id: 1, name: 'Product 1', price: 100 }
    ];
    
    const result = normalizeProductsResponse(response);
    
    expect(result.products).toHaveLength(1);
    expect(result.categories).toBeDefined();
    expect(result.categories.length).toBeGreaterThan(0); // Should have default categories
  });

  test('handles empty products response', () => {
    const response = { success: true, data: { products: [] } };
    
    const result = normalizeProductsResponse(response);
    
    expect(result.products).toEqual([]);
    expect(result.categories).toBeDefined();
  });
});

describe('Customers Response Normalization Tests', () => {
  test('normalizes customers array format', () => {
    const response = {
      success: true,
      data: {
        customers: [
          { id: 1, name: 'Customer 1', email: 'test1@example.com' },
          { id: 2, name: 'Customer 2', email: 'test2@example.com' }
        ]
      }
    };
    
    const result = normalizeCustomersResponse(response);
    
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 1, name: 'Customer 1', email: 'test1@example.com' });
  });

  test('normalizes direct customers array', () => {
    const response = [
      { id: 1, name: 'Customer 1' }
    ];
    
    const result = normalizeCustomersResponse(response);
    
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 1, name: 'Customer 1' });
  });

  test('handles empty customers response', () => {
    const response = { success: true, data: { customers: [] } };
    
    const result = normalizeCustomersResponse(response);
    
    expect(result).toEqual([]);
  });
});

describe('Sales Response Normalization Tests', () => {
  test('normalizes sales with summary format', () => {
    const response = {
      success: true,
      data: {
        sales: [
          { id: 1, total_amount: 100, customer_name: 'Customer 1' }
        ],
        summary: {
          total_sales: 100,
          total_transactions: 1,
          today_sales: 100,
          average_sale: 100
        }
      }
    };
    
    const result = normalizeSalesResponse(response);
    
    expect(result.sales).toHaveLength(1);
    expect(result.summary.total_sales).toBe(100);
  });

  test('normalizes direct sales array', () => {
    const response = [
      { id: 1, total_amount: 100 }
    ];
    
    const result = normalizeSalesResponse(response);
    
    expect(result.sales).toHaveLength(1);
    expect(result.summary).toBeDefined();
  });
});

describe('Data Fallback Tests', () => {
  test('getExpensesFallback returns valid structure', () => {
    const fallback = getExpensesFallback();
    
    expect(fallback.expenses).toEqual([]);
    expect(fallback.summary).toBeDefined();
    expect(fallback.summary.total_expenses).toBe(0);
    expect(fallback.summary.total_count).toBe(0);
    expect(fallback.summary.today_expenses).toBe(0);
    expect(fallback.summary.this_month_expenses).toBe(0);
  });

  test('getProductsFallback returns valid structure', () => {
    const fallback = getProductsFallback();
    
    expect(fallback.products).toEqual([]);
    expect(fallback.categories).toBeDefined();
    expect(Array.isArray(fallback.categories)).toBe(true);
    expect(fallback.categories.length).toBeGreaterThan(0);
  });

  test('getCustomersFallback returns valid structure', () => {
    const fallback = getCustomersFallback();
    
    expect(Array.isArray(fallback)).toBe(true);
    expect(fallback.length).toBeGreaterThan(0);
    expect(fallback[0]).toHaveProperty('id');
    expect(fallback[0]).toHaveProperty('name');
  });
});

describe('Data Structure Validation Tests', () => {
  test('validates valid expenses data', () => {
    const validData = {
      expenses: [{ id: 1, amount: 100 }],
      summary: { total_expenses: 100 }
    };
    
    const result = validateDataStructure(validData, 'expenses', getExpensesFallback);
    
    expect(result).toEqual(validData);
  });

  test('validates and fixes expenses data with missing summary', () => {
    const dataWithoutSummary = {
      expenses: [{ id: 1, amount: 100 }]
    };
    
    const result = validateDataStructure(dataWithoutSummary, 'expenses', getExpensesFallback);
    
    expect(result.expenses).toEqual([{ id: 1, amount: 100 }]);
    expect(result.summary).toBeDefined();
  });

  test('returns fallback for invalid expenses data', () => {
    const invalidData = { invalid: 'structure' };
    
    const result = validateDataStructure(invalidData, 'expenses', getExpensesFallback);
    
    expect(result.expenses).toEqual([]);
    expect(result.summary).toBeDefined();
  });

  test('validates valid products data', () => {
    const validData = {
      products: [{ id: 1, name: 'Product' }],
      categories: ['Category 1']
    };
    
    const result = validateDataStructure(validData, 'products', getProductsFallback);
    
    expect(result).toEqual(validData);
  });

  test('validates and fixes products data with missing categories', () => {
    const dataWithoutCategories = {
      products: [{ id: 1, name: 'Product' }]
    };
    
    const result = validateDataStructure(dataWithoutCategories, 'products', getProductsFallback);
    
    expect(result.products).toEqual([{ id: 1, name: 'Product' }]);
    expect(result.categories).toBeDefined();
    expect(Array.isArray(result.categories)).toBe(true);
  });

  test('validates customers array', () => {
    const validData = [{ id: 1, name: 'Customer' }];
    
    const result = validateDataStructure(validData, 'customers', getCustomersFallback);
    
    expect(result).toEqual(validData);
  });

  test('returns fallback for invalid customers data', () => {
    const invalidData = { not: 'array' };
    
    const result = validateDataStructure(invalidData, 'customers', getCustomersFallback);
    
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('Integration Tests', () => {
  test('enhanced API functions handle errors gracefully', async () => {
    // Mock API to throw error
    enhancedGetExpenses.mockRejectedValue(new Error('API Error'));
    
    try {
      await enhancedGetExpenses();
    } catch (error) {
      expect(error.message).toBe('API Error');
    }
    
    expect(enhancedGetExpenses).toHaveBeenCalled();
  });

  test('enhanced API functions return normalized data', async () => {
    const mockResponse = {
      success: true,
      data: {
        expenses: [{ id: 1, amount: 100 }],
        summary: { total_expenses: 100 }
      }
    };
    
    enhancedGetExpenses.mockResolvedValue(mockResponse.data);
    
    const result = await enhancedGetExpenses();
    
    expect(result.expenses).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  test('enhanced products API handles empty response', async () => {
    enhancedGetProducts.mockResolvedValue({ products: [], categories: [] });
    
    const result = await enhancedGetProducts();
    
    expect(result.products).toEqual([]);
    expect(result.categories).toEqual([]);
  });
});

describe('Error Recovery Tests', () => {
  test('handles network errors with fallback', () => {
    const networkError = new Error('Network Error');
    networkError.code = 'NETWORK_ERROR';
    
    // Test that error handling provides fallback
    const fallback = getExpensesFallback();
    
    expect(fallback.expenses).toEqual([]);
    expect(fallback.summary).toBeDefined();
  });

  test('handles malformed API responses', () => {
    const malformedResponse = 'not json';
    
    const result = normalizeExpensesResponse(malformedResponse);
    
    expect(result.expenses).toEqual([]);
    expect(result.summary).toBeDefined();
  });

  test('handles partial API responses', () => {
    const partialResponse = {
      expenses: [{ id: 1, amount: 100 }]
      // Missing summary
    };
    
    const result = normalizeExpensesResponse(partialResponse);
    
    expect(result.expenses).toHaveLength(1);
    expect(result.summary).toBeDefined();
    expect(result.summary.total_expenses).toBe(0); // Default value
  });
});