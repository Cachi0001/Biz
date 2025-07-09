// SabiOps API Service
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
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
    console.log("[DEBUG] Register request data:", userData);
    const response = await api.post("/auth/register", userData);
    console.log("[DEBUG] Register response:", response);
    console.log("[DEBUG] Register response data:", response.data);
    
    if (response.data.data && response.data.data.access_token) {
      setAuthToken(response.data.data.access_token);
      console.log("[DEBUG] Token set from response.data.data.access_token");
    } else if (response.data.access_token) {
      setAuthToken(response.data.access_token);
      console.log("[DEBUG] Token set from response.data.access_token");
    }
    
    console.log("[DEBUG] Register success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Register failed:", error);
    console.error("[ERROR] Register error response:", error.response ? error.response.data : error.message);
    console.error("[ERROR] Register error status:", error.response ? error.response.status : 'No status');
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    console.log("[DEBUG] Login request data:", credentials);
    const response = await api.post("/auth/login", credentials);
    console.log("[DEBUG] Login response:", response);
    console.log("[DEBUG] Login response data:", response.data);
    
    if (response.data.data && response.data.data.access_token) {
      setAuthToken(response.data.data.access_token);
      console.log("[DEBUG] Token set from response.data.data.access_token");
    } else if (response.data.access_token) {
      setAuthToken(response.data.access_token);
      console.log("[DEBUG] Token set from response.data.access_token");
    }
    
    console.log("[DEBUG] Login success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Login failed:", error);
    console.error("[ERROR] Login error response:", error.response ? error.response.data : error.message);
    console.error("[ERROR] Login error status:", error.response ? error.response.status : 'No status');
    throw error;
  }
};

export const logout = async () => {
  removeAuthToken();
  return Promise.resolve();
};

export const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    console.log("[DEBUG] getProfile response:", response.data);
    // Backend returns {success: true, data: {user: {...}}, message: "..."}
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getProfile failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
};

export const requestPasswordReset = async (data) => {
  // Now uses /auth/forgot-password
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

export const verifyResetCode = async (data) => {
  // New endpoint for verifying code
  const response = await api.post('/auth/verify-reset-code', data);
  return response.data;
};

export const resetPassword = async (data) => {
  // Now uses /auth/reset-password
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

export const createTeamMember = async (memberData) => {
  const response = await api.post('/team/', memberData);
  return response.data;
};

// Team Management
export const getTeamMembers = async () => {
  try {
    const response = await api.get('/team/');
    console.log("[DEBUG] getTeamMembers response:", response.data);
    // Backend returns {success: true, data: {...}, message: "..."}
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getTeamMembers failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const updateTeamMember = async (memberId, memberData) => {
  const response = await api.put(`/team/${memberId}`, memberData);
  return response.data;
};

export const deleteTeamMember = async (memberId) => {
  const response = await api.delete(`/team/${memberId}`);
  return response.data;
};

export const activateTeamMember = async (memberId) => {
  const response = await api.post(`/team/${memberId}/activate`);
  return response.data;
};

export const resetTeamMemberPassword = async (memberId) => {
  const response = await api.post(`/team/${memberId}/reset-password`);
  return response.data;
};

// New verifyToken method
export const verifyToken = async () => {
  try {
    console.log("[DEBUG] verifyToken called");
    console.log("[DEBUG] Current token:", getAuthToken());
    
    const response = await api.post("/auth/verify-token");
    console.log("[DEBUG] verifyToken response:", response);
    console.log("[DEBUG] verifyToken response data:", response.data);
    console.log("[DEBUG] verifyToken success:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] verifyToken failed:", error);
    console.error("[ERROR] verifyToken error response:", error.response ? error.response.data : error.message);
    console.error("[ERROR] verifyToken error status:", error.response ? error.response.status : 'No status');
    
    // If token verification fails, remove the invalid token
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log("[DEBUG] Removing invalid token due to 401/403 error");
      removeAuthToken();
    }
    
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
  try {
    const response = await api.get('/customers/');
    console.log("[DEBUG] getCustomers response:", response.data);
    // Backend returns {success: true, data: {customers: [...]}, message: "..."}
    return response.data.data?.customers || response.data.data || response.data; // Handle nested data structure
  } catch (error) {
    console.error("[ERROR] getCustomers failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  const response = await api.post('/customers/', customerData);
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
  try {
    const response = await api.get('/products/');
    console.log("[DEBUG] getProducts response:", response.data);
    // Backend returns {success: true, data: {products: [...]}, message: "..."}
    return response.data.data?.products || response.data.data || response.data; // Handle nested data structure
  } catch (error) {
    console.error("[ERROR] getProducts failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createProduct = async (productData) => {
  const response = await api.post('/products/', productData);
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
  try {
    const response = await api.get('/products/categories');
    console.log("[DEBUG] getCategories response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getCategories failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// Invoices
export const getInvoices = async () => {
  try {
    const response = await api.get('/invoices/');
    console.log("[DEBUG] getInvoices response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getInvoices failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const getInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    console.log("[DEBUG] getInvoice response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getInvoice failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices/', invoiceData);
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
  try {
    const response = await api.get('/expenses/');
    console.log("[DEBUG] getExpenses response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getExpenses failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createExpense = async (expenseData) => {
  const response = await api.post('/expenses/', expenseData);
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
  try {
    const response = await api.get('/sales/');
    console.log("[DEBUG] getSales response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getSales failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const createSale = async (saleData) => {
  const response = await api.post('/sales/', saleData);
  return response.data;
};

// Payments (if separate from invoices/sales)
export const getPayments = async () => {
  try {
    const response = await api.get('/payments/');
    console.log("[DEBUG] getPayments response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getPayments failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const recordPayment = async (paymentData) => {
  const response = await api.post('/payments/', paymentData);
  return response.data;
};

// Dashboard
export const getDashboardOverview = async () => {
  try {
    console.log("[DEBUG] getDashboardOverview: Starting request to /dashboard/overview");
    const response = await api.get('/dashboard/overview');
    console.log("[DEBUG] getDashboardOverview: Full response object:", response);
    console.log("[DEBUG] getDashboardOverview: Response status:", response.status);
    console.log("[DEBUG] getDashboardOverview: Response headers:", response.headers);
    console.log("[DEBUG] getDashboardOverview: Response data:", response.data);
    
    // Check if response has the expected structure
    if (response.data && typeof response.data === 'object') {
      if (response.data.success && response.data.data) {
        console.log("[DEBUG] getDashboardOverview: Using response.data.data format");
        console.log("[DEBUG] getDashboardOverview: Extracted data:", response.data.data);
        return response.data.data;
      } else if (response.data.revenue || response.data.customers || response.data.products) {
        console.log("[DEBUG] getDashboardOverview: Using direct response.data format");
        return response.data;
      } else {
        console.warn("[DEBUG] getDashboardOverview: Unexpected response structure, returning as-is");
        return response.data;
      }
    } else {
      console.warn("[DEBUG] getDashboardOverview: Response data is not an object:", typeof response.data);
      return response.data;
    }
  } catch (error) {
    console.error("[ERROR] getDashboardOverview failed:");
    console.error("- Error object:", error);
    console.error("- Error message:", error.message);
    console.error("- Error response:", error.response);
    if (error.response) {
      console.error("- Response status:", error.response.status);
      console.error("- Response data:", error.response.data);
      console.error("- Response headers:", error.response.headers);
    }
    throw error;
  }
};

export const getRevenueChart = async () => {
  try {
    const response = await api.get('/dashboard/revenue-chart');
    console.log("[DEBUG] getRevenueChart response:", response.data);
    // Backend returns {success: true, data: {...}, message: "..."}
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getRevenueChart failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// Sales Report
export const getSalesReport = async (params) => {
  try {
    const response = await api.get('/reports/sales', { params });
    console.log("[DEBUG] getSalesReport response:", response.data);
    // Backend returns {success: true, data: {...}, message: "..."}
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getSalesReport failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const downloadSalesReport = async (params, format) => {
  const response = await api.get(`/reports/sales/download/${format}`, { params, responseType: 'blob' });
  return response.data;
};

// Expense Categories
export const getExpenseCategories = async () => {
  try {
    const response = await api.get('/expenses/categories');
    console.log("[DEBUG] getExpenseCategories response:", response.data);
    return response.data.data || response.data; // Handle both formats for compatibility
  } catch (error) {
    console.error("[ERROR] getExpenseCategories failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;


