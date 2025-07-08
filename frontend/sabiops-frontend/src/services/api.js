// SabiOps API Service
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://sabiops-backend.vercel.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth token management
export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

// Authentication endpoints
export const register = async (userData) => {
  try {
    const response = await api.post("/auth/register", userData);
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    console.log("[DEBUG] Register success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Register failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    const response = await api.post("/auth/login", credentials);
    if (response.data.access_token) {
      setAuthToken(response.data.access_token);
    }
    console.log("[DEBUG] Login success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Login failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const logout = async () => {
  removeAuthToken();
  return Promise.resolve();
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data.data; // Ensure consistent data access
};

export const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
};

export const requestPasswordReset = async (data) => {
  const response = await api.post('/auth/request-password-reset', data);
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const createTeamMember = async (memberData) => {
  const response = await api.post('/auth/team-member', memberData);
  return response.data;
};

// Team Management
export const getTeamMembers = async () => {
  const response = await api.get('/auth/team-members');
  return response.data.data; // Ensure consistent data access
};

export const updateTeamMember = async (memberId, memberData) => {
  const response = await api.put(`/auth/team-member/${memberId}`, memberData);
  return response.data;
};

export const deleteTeamMember = async (memberId) => {
  const response = await api.delete(`/auth/team-member/${memberId}`);
  return response.data;
};

export const activateTeamMember = async (memberId) => {
  const response = await api.post(`/auth/team-member/${memberId}/activate`);
  return response.data;
};

export const resetTeamMemberPassword = async (memberId) => {
  const response = await api.post(`/auth/team-member/${memberId}/reset-password`);
  return response.data;
};

// New verifyToken method
export const verifyToken = async () => {
  try {
    const response = await api.post("/auth/verify-token");
    console.log("[DEBUG] verifyToken success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] verifyToken failed:", error.response ? error.response.data : error.message);
    throw error; // Re-throw the error so it can be caught by the calling component
  }
};

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const testDatabase = async () => {
  const response = await api.get('/test-db');
  return response.data;
};

// Customers
export const getCustomers = async () => {
  const response = await api.get('/customers');
  return response.data.data; // Ensure consistent data access
};

export const createCustomer = async (customerData) => {
  const response = await api.post('/customers', customerData);
  return response.data;
};

export const updateCustomer = async (customerId, customerData) => {
  const response = await api.put(`/customers/${customerId}`, customerData);
  return response.data;
};

export const deleteCustomer = async (customerId) => {
  const response = await api.delete(`/customers/${customerId}`);
  return response.data;
};

// Products
export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data.data; // Ensure consistent data access
};

export const createProduct = async (productData) => {
  const response = await api.post('/products', productData);
  return response.data;
};

export const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

export const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

export const getCategories = async () => {
  const response = await api.get('/products/categories');
  return response.data.data; // Ensure consistent data access
};

// Invoices
export const getInvoices = async () => {
  const response = await api.get('/invoices');
  return response.data.data; // Ensure consistent data access
};

export const getInvoice = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}`);
  return response.data.data; // Ensure consistent data access
};

export const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices', invoiceData);
  return response.data;
};

export const updateInvoice = async (invoiceId, invoiceData) => {
  const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
  return response.data;
};

export const deleteInvoice = async (invoiceId) => {
  const response = await api.delete(`/invoices/${invoiceId}`);
  return response.data;
};

export const updateInvoiceStatus = async (invoiceId, statusData) => {
  const response = await api.put(`/invoices/${invoiceId}/status`, statusData);
  return response.data;
};

export const sendInvoice = async (invoiceId) => {
  const response = await api.post(`/invoices/${invoiceId}/send`);
  return response.data;
};

export const downloadInvoicePdf = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}/send`, { responseType: 'blob' });
  return response.data;
};

// Expenses
export const getExpenses = async () => {
  const response = await api.get('/expenses');
  return response.data.data; // Assuming data is nested under 'data' key
};

export const createExpense = async (expenseData) => {
  const response = await api.post('/expenses', expenseData);
  return response.data;
};

export const updateExpense = async (expenseId, expenseData) => {
  const response = await api.put(`/expenses/${expenseId}`, expenseData);
  return response.data;
};

export const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};

// Sales (assuming these are separate from invoices for now, if needed)
export const getSales = async () => {
  const response = await api.get('/sales');
  return response.data.data; // Assuming data is nested under 'data' key
};

export const createSale = async (saleData) => {
  const response = await api.post('/sales', saleData);
  return response.data;
};

// Payments (if separate from invoices/sales)
export const getPayments = async () => {
  const response = await api.get('/payments');
  return response.data.data; // Assuming data is nested under 'data' key
};

export const recordPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

// Dashboard
export const getDashboardOverview = async () => {
  const response = await api.get('/dashboard/overview');
  return response.data.data; // Ensure consistent data access
};

export const getRevenueChart = async () => {
  const response = await api.get('/dashboard/revenue-chart');
  return response.data.data; // Ensure consistent data access
};

// Sales Report
export const getSalesReport = async (params) => {
  const response = await api.get('/reports/sales', { params });
  return response.data.data; // Ensure consistent data access
};

export const downloadSalesReport = async (params, format) => {
  const response = await api.get(`/reports/sales/download/${format}`, { params, responseType: 'blob' });
  return response.data;
};

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;


