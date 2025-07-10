// SabiOps API Service - Refactored for Minification Safety
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
export function getAuthToken() {
  return localStorage.getItem('token');
}

export function setAuthToken(token) {
  localStorage.setItem('token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('token');
}

// Authentication endpoints
export async function register(userData) {
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
}

// DEPRECATED: Do not use this register function for user registration. Use Supabase Auth signUp directly in the frontend.
export async function login(credentials) {
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
}

export async function logout() {
  removeAuthToken();
  return Promise.resolve();
}

export async function getProfile() {
  try {
  const response = await api.get('/auth/profile');
    console.log("[DEBUG] getProfile response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getProfile failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function updateProfile(userData) {
  const response = await api.put('/auth/profile', userData);
  return response.data;
}

export async function requestPasswordReset(data) {
  const response = await api.post('/auth/forgot-password', data);
  return response.data;
}

export async function verifyResetCode(data) {
  const response = await api.post('/auth/verify-reset-code', data);
  return response.data;
}

export async function resetPassword(data) {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
}

export async function verifyToken() {
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
}

export async function updatePassword(data) {
  const response = await api.post('/auth/update-password', data);
  return response.data;
}

// Team Management
export async function createTeamMember(memberData) {
  const response = await api.post('/team/', memberData);
  return response.data;
}

export async function getTeamMembers() {
  try {
    const response = await api.get('/team/');
    console.log("[DEBUG] getTeamMembers response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getTeamMembers failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function updateTeamMember(memberId, memberData) {
  const response = await api.put(`/team/${memberId}`, memberData);
  return response.data;
}

export async function deleteTeamMember(memberId) {
  const response = await api.delete(`/team/${memberId}`);
  return response.data;
}

export async function activateTeamMember(memberId) {
  const response = await api.post(`/team/${memberId}/activate`);
  return response.data;
}

export async function resetTeamMemberPassword(memberId) {
  const response = await api.post(`/team/${memberId}/reset-password`);
  return response.data;
}

// Health and testing
export async function healthCheck() {
  const response = await api.get('/health');
  return response.data;
}

export async function testDatabase() {
  const response = await api.get('/test');
  return response.data;
}

// Customer Management
export async function getCustomers() {
  try {
    const response = await api.get('/customers/');
    console.log("[DEBUG] getCustomers response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getCustomers failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function createCustomer(customerData) {
  const response = await api.post('/customers/', customerData);
  return response.data;
}

export async function updateCustomer(customerId, customerData) {
  const response = await api.put(`/customers/${customerId}`, customerData);
  return response.data;
}

export async function deleteCustomer(customerId) {
  const response = await api.delete(`/customers/${customerId}`);
  return response.data;
}

// Product Management
export async function getProducts() {
  try {
    const response = await api.get('/products/');
    console.log("[DEBUG] getProducts response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getProducts failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function createProduct(productData) {
  const response = await api.post('/products/', productData);
  return response.data;
}

export async function updateProduct(productId, productData) {
  const response = await api.put(`/products/${productId}`, productData);
  return response.data;
}

export async function deleteProduct(productId) {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
}

export async function getCategories() {
  try {
  const response = await api.get('/products/categories');
    console.log("[DEBUG] getCategories response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getCategories failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

// Invoice Management
export async function getInvoices() {
  try {
    const response = await api.get('/invoices/');
    console.log("[DEBUG] getInvoices response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getInvoices failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function getInvoice(invoiceId) {
  try {
  const response = await api.get(`/invoices/${invoiceId}`);
    console.log("[DEBUG] getInvoice response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getInvoice failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function createInvoice(invoiceData) {
  const response = await api.post('/invoices/', invoiceData);
  return response.data;
}

export async function updateInvoice(invoiceId, invoiceData) {
  const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
  return response.data;
}

export async function deleteInvoice(invoiceId) {
  const response = await api.delete(`/invoices/${invoiceId}`);
  return response.data;
}

export async function updateInvoiceStatus(invoiceId, statusData) {
  const response = await api.put(`/invoices/${invoiceId}/status`, statusData);
  return response.data;
}

export async function sendInvoice(invoiceId) {
  const response = await api.post(`/invoices/${invoiceId}/send`);
  return response.data;
}

export async function downloadInvoicePdf(invoiceId) {
  const response = await api.get(`/invoices/${invoiceId}/send`, { responseType: 'blob' });
  return response.data;
}

// Expense Management
export async function getExpenses() {
  try {
    const response = await api.get('/expenses/');
    console.log("[DEBUG] getExpenses response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getExpenses failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function createExpense(expenseData) {
  const response = await api.post('/expenses/', expenseData);
  return response.data;
}

export async function updateExpense(expenseId, expenseData) {
  const response = await api.put(`/expenses/${expenseId}`, expenseData);
  return response.data;
}

export async function deleteExpense(expenseId) {
  const response = await api.delete(`/expenses/${expenseId}`);
  return response.data;
}

// Sales Management
export async function getSales() {
  try {
    const response = await api.get('/sales/');
    console.log("[DEBUG] getSales response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSales failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function createSale(saleData) {
  const response = await api.post('/sales/', saleData);
  return response.data;
}

// Payment Management
export async function getPayments() {
  try {
    const response = await api.get('/payments/');
    console.log("[DEBUG] getPayments response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getPayments failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function recordPayment(paymentData) {
  const response = await api.post('/payments/', paymentData);
  return response.data;
}

export async function initializePayment(paymentData) {
  const response = await api.post('/payments/initialize', paymentData);
  return response.data;
}

export async function verifyPayment(reference) {
  const response = await api.get(`/payments/verify/${reference}`);
  return response.data;
}

// Subscription Management
export async function getSubscriptionPlans() {
  try {
    const response = await api.get('/subscription-upgrade/plans');
    console.log("[DEBUG] getSubscriptionPlans response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSubscriptionPlans failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function upgradeSubscription(upgradeData) {
  const response = await api.post('/subscription-upgrade/upgrade', upgradeData);
  return response.data;
}

export async function updateSubscription(subscriptionData) {
  const response = await api.put('/subscription-upgrade/update', subscriptionData);
  return response.data;
}

// Dashboard - CRITICAL FIX
export async function getDashboardOverview() {
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
}

export async function getRevenueChart() {
  try {
  const response = await api.get('/dashboard/revenue-chart');
    console.log("[DEBUG] getRevenueChart response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getRevenueChart failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

// Get financials for dashboard (P&L, cash flow, etc.)
export async function getFinancials() {
  const response = await api.get('/dashboard/financials');
  return response.data.data;
}

// Sales Report
export async function getSalesReport(params) {
  try {
  const response = await api.get('/reports/sales', { params });
    console.log("[DEBUG] getSalesReport response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSalesReport failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function downloadSalesReport(params, format) {
  const response = await api.get(`/reports/sales/download/${format}`, { params, responseType: 'blob' });
  return response.data;
}

// Expense Categories
export async function getExpenseCategories() {
  try {
    const response = await api.get('/expenses/categories');
    console.log("[DEBUG] getExpenseCategories response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getExpenseCategories failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

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

export async function addOfflineItem(item) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add(item);
  return tx.complete;
}

export async function getOfflineItems() {
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
}

export async function removeOfflineItem(id) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  return tx.complete;
}

// Wrap POST/PUT requests to queue offline
async function queueOrFetch(url, data, method = 'POST') {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch (err) {
    // If offline, queue the request
    if (!navigator.onLine) {
      await addOfflineItem({ url, data, method, timestamp: Date.now() });
      return { success: false, offline: true };
    }
    throw err;
  }
}

// Save device token to backend for push notifications
export async function saveDeviceToken(token) {
  return api.post('/push-subscriptions', { token });
}

// Utility to extract user-friendly error messages from API errors
export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (error?.response?.data) {
    // Prefer user-friendly message, then error code, then generic
    return (
      error.response.data.message ||
      error.response.data.error ||
      error.message ||
      fallback
    );
  }
  return error?.message || fallback;
}

// Export axios methods for backward compatibility
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;


