// SabiOps API Service - Minification-Safe Version
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

// Auth token management functions
const getAuthToken = () => localStorage.getItem('token');
const setAuthToken = (token) => localStorage.setItem('token', token);
const removeAuthToken = () => localStorage.removeItem('token');

// Authentication endpoints
const register = async (userData) => {
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

const registerConfirmed = async (userData) => {
  try {
    const response = await api.post("/auth/register/confirmed", userData);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Register confirmed failed:", error);
    throw error;
  }
};

const login = async (credentials) => {
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

const logout = async () => {
  removeAuthToken();
  return Promise.resolve();
};

const getProfile = async () => {
  try {
    const response = await api.get('/auth/profile');
    console.log("[DEBUG] getProfile response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getProfile failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const updateProfile = async (userData) => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
};

const requestPasswordReset = async (data) => {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
};

const verifyResetCode = async (data) => {
  const response = await api.post('/auth/verify-reset-code', data);
  return response.data;
};

const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', {
    token: data.token,
    password: data.password
  });
  return response.data;
};

const verifyToken = async () => {
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
    
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log("[DEBUG] Removing invalid token due to 401/403 error");
      removeAuthToken();
    }
    
    throw error;
  }
};

const updatePassword = async (data) => {
  const response = await api.post('/auth/update-password', data);
  return response.data;
};

// Team Management
const createTeamMember = async (memberData) => {
  const response = await api.post('/team/', memberData);
  return response.data;
};

const getTeamMembers = async () => {
  try {
    const response = await api.get('/team/');
    console.log("[DEBUG] getTeamMembers response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getTeamMembers failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const updateTeamMember = async (memberId, memberData) => {
  const response = await api.put(`/team/${memberId}`, memberData);
  return response.data;
};

const deleteTeamMember = async (memberId) => {
  const response = await api.delete(`/team/${memberId}`);
  return response.data;
};

const activateTeamMember = async (memberId) => {
  const response = await api.post(`/team/${memberId}/activate`);
  return response.data;
};

const resetTeamMemberPassword = async (memberId) => {
  const response = await api.post(`/team/${memberId}/reset-password`);
  return response.data;
};

// Health and testing
const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

const testDatabase = async () => {
  const response = await api.get('/test');
  return response.data;
};

// Customer Management
const getCustomers = async () => {
  try {
    const response = await api.get('/customers/');
    console.log("[DEBUG] getCustomers response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getCustomers failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const createCustomer = async (customerData) => {
  const response = await api.post('/customers/', customerData);
  return response.data;
};

const updateCustomer = async (customerId, customerData) => {
  const response = await api.put(`/customers/${customerId}`, customerData);
  return response.data;
};

const deleteCustomer = async (customerId) => {
  const response = await api.delete(`/customers/${customerId}`);
  return response.data;
};

// Product Management
const getProducts = async () => {
  try {
    const response = await api.get('/products/');
    console.log("[DEBUG] getProducts response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getProducts failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const createProduct = async (productData) => {
  const response = await api.post('/products/', productData);
  return response.data;
};

const updateProduct = async (productId, productData) => {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
};

const deleteProduct = async (productId) => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

const getCategories = async () => {
  try {
    const response = await api.get('/products/categories');
    console.log("[DEBUG] getCategories response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getCategories failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// Invoice Management
const getInvoices = async () => {
  try {
    const response = await api.get('/invoices/');
    console.log("[DEBUG] getInvoices response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getInvoices failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const getInvoice = async (invoiceId) => {
  try {
    const response = await api.get(`/invoices/${invoiceId}`);
    console.log("[DEBUG] getInvoice response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getInvoice failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const createInvoice = async (invoiceData) => {
  const response = await api.post('/invoices/', invoiceData);
  return response.data;
};

const updateInvoice = async (invoiceId, invoiceData) => {
  const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
  return response.data;
};

const deleteInvoice = async (invoiceId) => {
  const response = await api.delete(`/invoices/${invoiceId}`);
  return response.data;
};

const updateInvoiceStatus = async (invoiceId, statusData) => {
  const response = await api.put(`/invoices/${invoiceId}/status`, statusData);
  return response.data;
};

const sendInvoice = async (invoiceId) => {
  const response = await api.post(`/invoices/${invoiceId}/send`);
  return response.data;
};

const downloadInvoicePdf = async (invoiceId) => {
  const response = await api.get(`/invoices/${invoiceId}/send`, { responseType: 'blob' });
  return response.data;
};

// Expense Management
const getExpenses = async () => {
  try {
    const response = await api.get('/expenses/');
    console.log("[DEBUG] getExpenses response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getExpenses failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const createExpense = async (expenseData) => {
  const response = await api.post('/expenses/', expenseData);
  return response.data;
};

const updateExpense = async (expenseId, expenseData) => {
  const response = await api.put(`/expenses/${expenseId}`, expenseData);
  return response.data;
};

const deleteExpense = async (expenseId) => {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
};

// Sales Management
const getSales = async () => {
  try {
    const response = await api.get('/sales/');
    console.log("[DEBUG] getSales response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSales failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const createSale = async (saleData) => {
  const response = await api.post('/sales/', saleData);
  return response.data;
};

// Payment Management
const getPayments = async () => {
  try {
    const response = await api.get('/payments/');
    console.log("[DEBUG] getPayments response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getPayments failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const recordPayment = async (paymentData) => {
  const response = await api.post('/payments/', paymentData);
  return response.data;
};

const initializePayment = async (paymentData) => {
  const response = await api.post('/payments/initialize', paymentData);
  return response.data;
};

const verifyPayment = async (reference) => {
  const response = await api.get(`/payments/verify/${reference}`);
  return response.data;
};

// Subscription Management
const getSubscriptionPlans = async () => {
  try {
    const response = await api.get('/subscription-upgrade/plans');
    console.log("[DEBUG] getSubscriptionPlans response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSubscriptionPlans failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const upgradeSubscription = async (upgradeData) => {
  const response = await api.post('/subscription-upgrade/upgrade', upgradeData);
  return response.data;
};

const updateSubscription = async (subscriptionData) => {
  const response = await api.put('/subscription-upgrade/update', subscriptionData);
  return response.data;
};

// Dashboard
const getDashboardOverview = async () => {
  try {
    console.log("[DEBUG] getDashboardOverview: Starting request to /dashboard/overview");
    const response = await api.get('/dashboard/overview');
    console.log("[DEBUG] getDashboardOverview: Full response object:", response);
    console.log("[DEBUG] getDashboardOverview: Response status:", response.status);
    console.log("[DEBUG] getDashboardOverview: Response headers:", response.headers);
    console.log("[DEBUG] getDashboardOverview: Response data:", response.data);
    
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

const getRevenueChart = async () => {
  try {
    const response = await api.get('/dashboard/revenue-chart');
    console.log("[DEBUG] getRevenueChart response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getRevenueChart failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const getFinancials = async () => {
  const response = await api.get('/dashboard/financials');
  return response.data.data;
};

// Sales Report
const getSalesReport = async (params) => {
  try {
    const response = await api.get('/reports/sales', { params });
    console.log("[DEBUG] getSalesReport response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSalesReport failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const downloadSalesReport = async (params, format) => {
  const response = await api.get(`/reports/sales/download/${format}`, { params, responseType: 'blob' });
  return response.data;
};

// Expense Categories
const getExpenseCategories = async () => {
  try {
    const response = await api.get('/expenses/categories');
    console.log("[DEBUG] getExpenseCategories response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getExpenseCategories failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

// Referrals
const getReferralStats = async () => {
  try {
    const response = await api.get('/referrals/stats');
    console.log("[DEBUG] getReferralStats response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getReferralStats failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const getWithdrawals = async () => {
  try {
    const response = await api.get('/referrals/withdrawals');
    console.log("[DEBUG] getWithdrawals response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getWithdrawals failed:", error.response ? error.response.data : error.message);
    throw error;
  }
};

const requestWithdrawal = async (data) => {
  const response = await api.post('/referrals/withdrawals', data);
  return response.data;
};

// IndexedDB utility for offline queue
const DB_NAME = 'sabiops-offline-db';
const STORE_NAME = 'offline-queue';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const addOfflineItem = async (item) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add(item);
  return tx.complete;
};

const getOfflineItems = async () => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return new Promise((resolve, reject) => {
    const items = [];
    const req = store.openCursor();
    req.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        items.push({ ...cursor.value, id: cursor.key });
        cursor.continue();
      } else {
        resolve(items);
      }
    };
    req.onerror = () => reject(req.error);
  });
};

const removeOfflineItem = async (id) => {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return tx.complete;
};

// Save device token to backend for push notifications
const saveDeviceToken = async (token) => {
  return api.post('/push-subscriptions', { token });
};

// Utility to extract user-friendly error messages from API errors
const getErrorMessage = (error, fallback = 'An unexpected error occurred') => {
  if (error?.response?.data) {
    return (
      error.response.data.message ||
      error.response.data.error ||
      error.message ||
      fallback
    );
  }
  return error?.message || fallback;
};

// Create the main API service object - MINIFIER-FRIENDLY DEFAULT EXPORT
const apiService = {
  // Auth methods
  register,
  registerConfirmed,
  login,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  verifyToken,
  updatePassword,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  
  // Team methods
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  activateTeamMember,
  resetTeamMemberPassword,
  
  // Health methods
  healthCheck,
  testDatabase,
  
  // Customer methods
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  
  // Product methods
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  
  // Invoice methods
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  sendInvoice,
  downloadInvoicePdf,
  
  // Expense methods
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  
  // Sales methods
  getSales,
  createSale,
  getSalesReport,
  downloadSalesReport,
  
  // Payment methods
  getPayments,
  recordPayment,
  initializePayment,
  verifyPayment,
  
  // Subscription methods
  getSubscriptionPlans,
  upgradeSubscription,
  updateSubscription,
  
  // Dashboard methods
  getDashboardOverview,
  getRevenueChart,
  getFinancials,
  
  // Referral methods
  getReferralStats,
  getWithdrawals,
  requestWithdrawal,
  
  // Offline methods
  addOfflineItem,
  getOfflineItems,
  removeOfflineItem,
  
  // Device methods
  saveDeviceToken,
  
  // Utility methods
  getErrorMessage,
  
  // Axios methods for direct access
  get: api.get.bind(api),
  post: api.post.bind(api),
  put: api.put.bind(api),
  delete: api.delete.bind(api),
  del: api.delete.bind(api)
};

// Export the main API service as default - MINIFIER-FRIENDLY
export default apiService;

// Also export individual functions for backward compatibility
export {
  register,
  registerConfirmed,
  login,
  logout,
  getProfile,
  updateProfile,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  verifyToken,
  updatePassword,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  createTeamMember,
  getTeamMembers,
  updateTeamMember,
  deleteTeamMember,
  activateTeamMember,
  resetTeamMemberPassword,
  healthCheck,
  testDatabase,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  sendInvoice,
  downloadInvoicePdf,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  getSales,
  createSale,
  getSalesReport,
  downloadSalesReport,
  getPayments,
  recordPayment,
  initializePayment,
  verifyPayment,
  getSubscriptionPlans,
  upgradeSubscription,
  updateSubscription,
  getDashboardOverview,
  getRevenueChart,
  getFinancials,
  getReferralStats,
  getWithdrawals,
  requestWithdrawal,
  addOfflineItem,
  getOfflineItems,
  removeOfflineItem,
  saveDeviceToken,
  getErrorMessage
};

// Export axios methods for backward compatibility
export const get = api.get.bind(api);
export const post = api.post.bind(api);
export const put = api.put.bind(api);
export const del = api.delete.bind(api);


