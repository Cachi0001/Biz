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
    
    const response = await createSale(saleData);
    
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
  
  if (!data.product_id) errors.product_id = 'Product selection is required';
  if (!data.quantity || parseInt(data.quantity) <= 0) errors.quantity = 'Valid quantity is required';
  if (!data.unit_price || parseFloat(data.unit_price) <= 0) errors.unit_price = 'Valid unit price is required';
  
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