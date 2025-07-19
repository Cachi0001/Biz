/**
 * Enhanced API Service - Wraps existing API calls with normalization and logging
 * Provides consistent data handling and comprehensive debugging
 */

import { 
  getExpenses, 
  createExpense, 
  updateExpense, 
  deleteExpense,
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  getCustomers,
  getSales,
  createSale
} from './api';

import {
  normalizeExpensesResponse,
  normalizeProductsResponse,
  normalizeCustomersResponse,
  normalizeSalesResponse
} from '../utils/apiResponseNormalizer';

import DebugLogger from '../utils/debugLogger';

/**
 * Enhanced expense API calls with normalization and logging
 */
export const enhancedGetExpenses = async () => {
  const timer = DebugLogger.startTimer('Get Expenses');
  
  try {
    DebugLogger.logApiCall('/expenses', 'Starting request', 'ExpensesAPI', 'GET');
    
    const response = await getExpenses();
    
    DebugLogger.logApiCall('/expenses', response, 'ExpensesAPI', 'GET');
    
    const normalizedData = normalizeExpensesResponse(response);
    
    DebugLogger.logApiCall('/expenses', normalizedData, 'ExpensesAPI-Normalized', 'GET');
    
    timer();
    return normalizedData;
  } catch (error) {
    DebugLogger.logApiError('/expenses', error, 'ExpensesAPI');
    timer();
    throw error;
  }
};

export const enhancedCreateExpense = async (expenseData) => {
  const timer = DebugLogger.startTimer('Create Expense');
  
  try {
    DebugLogger.logFormSubmit('ExpensesAPI', expenseData, 'create');
    
    const response = await createExpense(expenseData);
    
    DebugLogger.logApiCall('/expenses', response, 'ExpensesAPI', 'POST');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError('/expenses', error, 'ExpensesAPI');
    timer();
    throw error;
  }
};

export const enhancedUpdateExpense = async (expenseId, expenseData) => {
  const timer = DebugLogger.startTimer('Update Expense');
  
  try {
    DebugLogger.logFormSubmit('ExpensesAPI', { id: expenseId, ...expenseData }, 'update');
    
    const response = await updateExpense(expenseId, expenseData);
    
    DebugLogger.logApiCall(`/expenses/${expenseId}`, response, 'ExpensesAPI', 'PUT');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError(`/expenses/${expenseId}`, error, 'ExpensesAPI');
    timer();
    throw error;
  }
};

export const enhancedDeleteExpense = async (expenseId) => {
  const timer = DebugLogger.startTimer('Delete Expense');
  
  try {
    DebugLogger.logApiCall(`/expenses/${expenseId}`, 'Starting delete', 'ExpensesAPI', 'DELETE');
    
    const response = await deleteExpense(expenseId);
    
    DebugLogger.logApiCall(`/expenses/${expenseId}`, response, 'ExpensesAPI', 'DELETE');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError(`/expenses/${expenseId}`, error, 'ExpensesAPI');
    timer();
    throw error;
  }
};

/**
 * Enhanced product API calls with normalization and logging
 */
export const enhancedGetProducts = async () => {
  const timer = DebugLogger.startTimer('Get Products');
  
  try {
    DebugLogger.logApiCall('/products', 'Starting request', 'ProductsAPI', 'GET');
    
    const response = await getProducts();
    
    DebugLogger.logApiCall('/products', response, 'ProductsAPI', 'GET');
    
    const normalizedData = normalizeProductsResponse(response);
    
    DebugLogger.logApiCall('/products', normalizedData, 'ProductsAPI-Normalized', 'GET');
    
    // Log potential dropdown issues
    if (!normalizedData.products || normalizedData.products.length === 0) {
      DebugLogger.logDropdownIssue(
        'ProductsAPI', 
        normalizedData.products, 
        null, 
        'No products available for dropdown'
      );
    }
    
    timer();
    return normalizedData;
  } catch (error) {
    DebugLogger.logApiError('/products', error, 'ProductsAPI');
    timer();
    throw error;
  }
};

export const enhancedCreateProduct = async (productData) => {
  const timer = DebugLogger.startTimer('Create Product');
  
  try {
    DebugLogger.logFormSubmit('ProductsAPI', productData, 'create');
    
    const response = await createProduct(productData);
    
    DebugLogger.logApiCall('/products', response, 'ProductsAPI', 'POST');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError('/products', error, 'ProductsAPI');
    timer();
    throw error;
  }
};

export const enhancedUpdateProduct = async (productId, productData) => {
  const timer = DebugLogger.startTimer('Update Product');
  
  try {
    DebugLogger.logFormSubmit('ProductsAPI', { id: productId, ...productData }, 'update');
    
    const response = await updateProduct(productId, productData);
    
    DebugLogger.logApiCall(`/products/${productId}`, response, 'ProductsAPI', 'PUT');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError(`/products/${productId}`, error, 'ProductsAPI');
    timer();
    throw error;
  }
};

export const enhancedDeleteProduct = async (productId) => {
  const timer = DebugLogger.startTimer('Delete Product');
  
  try {
    DebugLogger.logApiCall(`/products/${productId}`, 'Starting delete', 'ProductsAPI', 'DELETE');
    
    const response = await deleteProduct(productId);
    
    DebugLogger.logApiCall(`/products/${productId}`, response, 'ProductsAPI', 'DELETE');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError(`/products/${productId}`, error, 'ProductsAPI');
    timer();
    throw error;
  }
};

/**
 * Enhanced customer API calls with normalization and logging
 */
export const enhancedGetCustomers = async () => {
  const timer = DebugLogger.startTimer('Get Customers');
  
  try {
    DebugLogger.logApiCall('/customers', 'Starting request', 'CustomersAPI', 'GET');
    
    const response = await getCustomers();
    
    DebugLogger.logApiCall('/customers', response, 'CustomersAPI', 'GET');
    
    const normalizedData = normalizeCustomersResponse(response);
    
    DebugLogger.logApiCall('/customers', normalizedData, 'CustomersAPI-Normalized', 'GET');
    
    timer();
    return normalizedData;
  } catch (error) {
    DebugLogger.logApiError('/customers', error, 'CustomersAPI');
    timer();
    throw error;
  }
};

/**
 * Enhanced sales API calls with normalization and logging
 */
export const enhancedGetSales = async (params = {}) => {
  const timer = DebugLogger.startTimer('Get Sales');
  
  try {
    DebugLogger.logApiCall('/sales', { params }, 'SalesAPI', 'GET');
    
    const response = await getSales();
    
    DebugLogger.logApiCall('/sales', response, 'SalesAPI', 'GET');
    
    const normalizedData = normalizeSalesResponse(response);
    
    DebugLogger.logApiCall('/sales', normalizedData, 'SalesAPI-Normalized', 'GET');
    
    timer();
    return normalizedData;
  } catch (error) {
    DebugLogger.logApiError('/sales', error, 'SalesAPI');
    timer();
    throw error;
  }
};

export const enhancedCreateSale = async (saleData) => {
  const timer = DebugLogger.startTimer('Create Sale');
  
  try {
    DebugLogger.logFormSubmit('SalesAPI', saleData, 'create');
    
    // Transform frontend data to match backend expectations
    const transformedData = {
      product_id: saleData.product_id,
      customer_id: saleData.customer_id || null,
      customer_name: saleData.customer_name || 'Walk-in Customer',
      customer_email: saleData.customer_email || null,
      quantity: parseInt(saleData.quantity) || 1,
      unit_price: parseFloat(saleData.unit_price) || 0,
      total_amount: parseFloat(saleData.total_amount) || 0,
      payment_method: saleData.payment_method || 'cash',
      payment_status: saleData.payment_method === 'pending' ? 'pending' : 'completed',
      currency: 'NGN',
      date: saleData.date || new Date().toISOString(),
      salesperson_id: saleData.salesperson_id || null,
      notes: saleData.notes || null,
      discount_amount: parseFloat(saleData.discount_amount) || 0,
      tax_amount: parseFloat(saleData.tax_amount) || 0
    };
    
    // Validate required fields
    if (!transformedData.product_id) {
      throw new Error('Product selection is required');
    }
    
    if (transformedData.quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    
    if (transformedData.unit_price < 0) {
      throw new Error('Unit price cannot be negative');
    }
    
    DebugLogger.logFormSubmit('SalesAPI', transformedData, 'transformed');
    
    const response = await createSale(transformedData);
    
    DebugLogger.logApiCall('/sales', response, 'SalesAPI', 'POST');
    
    timer();
    return response;
  } catch (error) {
    DebugLogger.logApiError('/sales', error, 'SalesAPI');
    timer();
    throw error;
  }
};

/**
 * Data validation helpers
 */
export const validateExpenseData = (data) => {
  const errors = {};
  
  if (!data.category) errors.category = 'Category is required';
  if (!data.amount || parseFloat(data.amount) <= 0) errors.amount = 'Valid amount is required';
  if (!data.date) errors.date = 'Date is required';
  
  DebugLogger.logFormSubmit('ExpenseValidation', { data, errors }, 'validate');
  
  return errors;
};

export const validateProductData = (data) => {
  const errors = {};
  
  if (!data.name?.trim()) errors.name = 'Product name is required';
  if (!data.price || parseFloat(data.price) <= 0) errors.price = 'Valid price is required';
  if (data.quantity === undefined || parseInt(data.quantity) < 0) errors.quantity = 'Valid quantity is required';
  
  DebugLogger.logFormSubmit('ProductValidation', { data, errors }, 'validate');
  
  return errors;
};

export const validateSaleData = (data) => {
  const errors = {};
  
  // Required field validation
  if (!data.product_id) {
    errors.product_id = 'Please select a product';
  }
  
  if (!data.quantity || parseInt(data.quantity) <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }
  
  if (data.unit_price === undefined || data.unit_price === null || parseFloat(data.unit_price) < 0) {
    errors.unit_price = 'Unit price must be non-negative';
  }
  
  if (data.total_amount === undefined || data.total_amount === null || parseFloat(data.total_amount) < 0) {
    errors.total_amount = 'Total amount must be non-negative';
  }
  
  // Business logic validation
  const quantity = parseInt(data.quantity) || 0;
  const unitPrice = parseFloat(data.unit_price) || 0;
  const expectedTotal = quantity * unitPrice;
  const actualTotal = parseFloat(data.total_amount) || 0;
  
  if (Math.abs(expectedTotal - actualTotal) > 0.01) {
    errors.total_amount = 'Total amount does not match quantity × unit price';
  }
  
  // Payment method validation
  if (data.payment_method && !['cash', 'card', 'bank_transfer', 'mobile_money', 'pos', 'cheque', 'online_payment', 'pending'].includes(data.payment_method)) {
    errors.payment_method = 'Invalid payment method';
  }
  
  DebugLogger.logFormSubmit('SaleValidation', { data, errors }, 'validate');
  
  return errors;
};

export default {
  // Expenses
  enhancedGetExpenses,
  enhancedCreateExpense,
  enhancedUpdateExpense,
  enhancedDeleteExpense,
  
  // Products
  enhancedGetProducts,
  enhancedCreateProduct,
  enhancedUpdateProduct,
  enhancedDeleteProduct,
  
  // Customers
  enhancedGetCustomers,
  
  // Sales
  enhancedGetSales,
  enhancedCreateSale,
  
  // Validation
  validateExpenseData,
  validateProductData,
  validateSaleData
};