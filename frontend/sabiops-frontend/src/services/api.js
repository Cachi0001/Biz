// SabiOps API Service - Refactored for Minification Safety
import axios from 'axios';

// Determine the correct base URL based on environment
const getBaseURL = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api'; // Use proxy in development
  }
  
  // Check for environment variable first
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Production fallback - use the Vercel backend URL
  return 'https://sabiops-backend.vercel.app/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
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
      // Only redirect if not already on /login and not during a toast
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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

export async function resendVerificationEmail(email) {
  try {
    const response = await api.post("/auth/resend-verification-email", { email });
    return response.data;
  } catch (error) {
    console.error("[ERROR] Resend verification email failed:", error);
    throw error;
  }
}

export async function registerConfirmed(userData) {
  try {
    const response = await api.post("/auth/register/confirmed", userData);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Register confirmed failed:", error);
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

export async function resetPassword(data) {
  // Only send { token, password } for the new JWT-based flow
  const response = await api.post('/auth/reset-password', {
    token: data.token,
    password: data.password
  });
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

// Usage Tracking and Plan Limits
export async function getCurrentUsage() {
  try {
    const response = await api.get('/usage/current');
    return response.data;
  } catch (error) {
    console.error('[ERROR] getCurrentUsage failed:', error);
    throw error;
  }
}

export async function updateUsage(actionType, amount = 1) {
  try {
    const response = await api.post('/usage/increment', {
      action_type: actionType,
      amount: amount
    });
    return response.data;
  } catch (error) {
    console.error('[ERROR] updateUsage failed:', error);
    throw error;
  }
}

export async function validateActionLimit(actionType) {
  try {
    const response = await api.post('/usage/validate', {
      action_type: actionType
    });
    return response.data;
  } catch (error) {
    console.error('[ERROR] validateActionLimit failed:', error);
    throw error;
  }
}

export async function getSubscriptionLimits() {
  try {
    const response = await api.get('/subscription/limits');
    return response.data;
  } catch (error) {
    console.error('[ERROR] getSubscriptionLimits failed:', error);
    throw error;
  }
}

export async function getUpgradeRecommendations() {
  try {
    const response = await api.get('/subscription/recommendations');
    return response.data;
  } catch (error) {
    console.error('[ERROR] getUpgradeRecommendations failed:', error);
    throw error;
  }
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
  try {
    console.log("[DEBUG] createCustomer: Starting request");
    console.log("[DEBUG] createCustomer: Customer data:", customerData);
    console.log("[DEBUG] createCustomer: Current token:", getAuthToken() ? 'Present' : 'Missing');
    
  const response = await api.post('/customers/', customerData);
    console.log("[DEBUG] createCustomer: Success response:", response.data);
  return response.data;
  } catch (error) {
    console.error("[ERROR] createCustomer failed:");
    console.error("- Error object:", error);
    console.error("- Error message:", error.message);
    console.error("- Error response:", error.response);
    if (error.response) {
      console.error("- Response status:", error.response.status);
      console.error("- Response data:", error.response.data);
      console.error("- Response headers:", error.response.headers);
    }
    console.error("- Request config:", error.config);
    throw error;
  }
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

export async function getProductsWithStock() {
  try {
    const response = await api.get('/products/with-stock');
    console.log("[DEBUG] getProductsWithStock response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getProductsWithStock failed:", error.response ? error.response.data : error.message);
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

// Sales Management
export async function getSales(params = {}) {
  try {
    let url = '/sales/';
    const queryParams = new URLSearchParams();
    
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    console.log("[DEBUG] getSales called with URL:", url, "params:", params);
    const response = await api.get(url);
    console.log("[DEBUG] getSales response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getSales failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function createSale(saleData) {
  try {
    console.log('[DEBUG] createSale request data:', JSON.stringify(saleData, null, 2));
    const response = await api.post('/sales/', saleData);
    console.log('[DEBUG] createSale response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[ERROR] createSale failed:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
      
      // If we have a 400 error with a message, throw that message
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response received from server. Please check your connection.');
    } else {
      console.error('Error message:', error.message);
      throw error;
    }
    throw error;
  }
}

// Payment Management
export async function getPayments() {
  try {
    const response = await api.get('/payments/');
    console.log("[DEBUG] getPayments response:", response.data);
    
    // Ensure we always return an array
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    } else if (response.data?.payments && Array.isArray(response.data.payments)) {
      return response.data.payments;
    } else {
      console.warn("[DEBUG] getPayments: Unexpected response format, returning empty array");
      return [];
    }
  } catch (error) {
    console.error("[ERROR] getPayments failed:", error.response ? error.response.data : error.message);
    // Return empty array instead of throwing to prevent UI crashes
    return [];
  }
}

export async function recordPayment(paymentData) {
  try {
  const response = await api.post('/payments/', paymentData);
    console.log("[DEBUG] recordPayment response:", response.data);
  return response.data;
  } catch (error) {
    console.error("[ERROR] recordPayment failed:", error.response ? error.response.data : error.message);
    throw error;
  }
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

// Referral System
export async function getReferralDashboard() {
  try {
    const response = await api.get('/referrals/dashboard');
    console.log("[DEBUG] getReferralDashboard response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getReferralDashboard failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function requestReferralWithdrawal() {
  try {
    const response = await api.post('/referrals/withdraw');
    console.log("[DEBUG] requestReferralWithdrawal response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] requestReferralWithdrawal failed:", error.response ? error.response.data : error.message);
    throw error;
  }
}

export async function validateReferralCode(code) {
  try {
    const response = await api.post('/referrals/validate', { referral_code: code });
    console.log("[DEBUG] validateReferralCode response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[ERROR] validateReferralCode failed:", error.response ? error.response.data : error.message);
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

// Get accurate dashboard metrics using data consistency service
export async function getAccurateDashboardMetrics() {
  try {
    console.log("[DEBUG] getAccurateDashboardMetrics: Starting request");
    const response = await api.get('/dashboard/metrics');
    console.log("[DEBUG] getAccurateDashboardMetrics response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getAccurateDashboardMetrics failed:", error);
    throw error;
  }
}

// Validate data consistency
export async function validateDataConsistency() {
  try {
    console.log("[DEBUG] validateDataConsistency: Starting request");
    const response = await api.get('/dashboard/validate');
    console.log("[DEBUG] validateDataConsistency response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] validateDataConsistency failed:", error);
    throw error;
  }
}

// Fix data inconsistencies
export async function fixDataInconsistencies() {
  try {
    console.log("[DEBUG] fixDataInconsistencies: Starting request");
    const response = await api.post('/dashboard/fix-inconsistencies');
    console.log("[DEBUG] fixDataInconsistencies response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] fixDataInconsistencies failed:", error);
    throw error;
  }
}

// Ensure complete data consistency across all business operations
export async function ensureDataConsistency() {
  try {
    console.log("[DEBUG] ensureDataConsistency: Starting request");
    const response = await api.post('/dashboard/ensure-consistency');
    console.log("[DEBUG] ensureDataConsistency response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] ensureDataConsistency failed:", error);
    throw error;
  }
}

// Synchronize all business data for comprehensive data integration
export async function syncAllBusinessData() {
  try {
    console.log("[DEBUG] syncAllBusinessData: Starting comprehensive data sync");
    const response = await api.post('/dashboard/sync-data');
    console.log("[DEBUG] syncAllBusinessData response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] syncAllBusinessData failed:", error);
    throw error;
  }
}

// Get profit calculations with date filtering for sales page and dashboard
export async function getProfitCalculations(params = {}) {
  try {
    console.log("[DEBUG] getProfitCalculations: Starting request with params:", params);
    
    let url = '/dashboard/profit-calculations';
    const queryParams = new URLSearchParams();
    
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    
    const response = await api.get(url);
    console.log("[DEBUG] getProfitCalculations response:", response.data);
    return response.data.data || response.data;
  } catch (error) {
    console.error("[ERROR] getProfitCalculations failed:", error);
    throw error;
  }
}

// Sales Report
export async function getSalesReport(params) {
  try {
    console.log("[DEBUG] getSalesReport called with params:", params);
    
    // Use the existing sales endpoint with date filtering
    let endpoint = '/sales';
    let apiParams = {};
    
    if (params.date) {
      // Single date - filter by date
      apiParams = { 
        start_date: params.date,
        end_date: params.date 
      };
    } else if (params.start_date && params.end_date) {
      // Date range
      apiParams = { 
        start_date: params.start_date,
        end_date: params.end_date 
      };
    } else {
      // Default to today
      const today = new Date().toISOString().split('T')[0];
      apiParams = { 
        start_date: today,
        end_date: today 
      };
    }
    
    console.log("[DEBUG] getSalesReport using endpoint:", endpoint, "with params:", apiParams);
    const response = await api.get(endpoint, { params: apiParams });
    console.log("[DEBUG] getSalesReport response:", response.data);
    
    // Transform the response to match expected format - handle different response structures
    let salesData = [];
    
    if (response.data?.success && response.data?.data?.sales) {
      salesData = response.data.data.sales;
    } else if (response.data?.sales && Array.isArray(response.data.sales)) {
      salesData = response.data.sales;
    } else if (Array.isArray(response.data)) {
      salesData = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      salesData = response.data.data;
    }
    
    console.log("[DEBUG] getSalesReport extracted sales data:", salesData);
    
    // Calculate summary from sales data
    const summary = {
      total_sales: salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0), 0),
      total_transactions: salesData.length,
      total_quantity: salesData.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0),
      average_sale: salesData.length > 0 ? 
        salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0), 0) / salesData.length : 0
    };
    
    // Calculate payment method breakdown
    const payment_breakdown = {};
    salesData.forEach(sale => {
      const method = sale.payment_method || 'cash';
      if (!payment_breakdown[method]) {
        payment_breakdown[method] = { amount: 0, count: 0 };
      }
      payment_breakdown[method].amount += parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0;
      payment_breakdown[method].count += 1;
    });
    
    // Transform transactions for display
    const transactions = salesData.map(sale => ({
      id: sale.id,
      created_at: sale.created_at || sale.date || sale.sale_date,
      customer_name: sale.customer_name || (sale.customer?.name) || 'Walk-in Customer',
      customer_email: sale.customer_email || (sale.customer?.email) || null,
      product_name: sale.product_name || (sale.product?.name) || 'Unknown Product',
      items: sale.sale_items || [{ 
        product_name: sale.product_name || 'Unknown Product', 
        quantity: sale.quantity || 1 
      }],
      total_quantity: parseInt(sale.quantity) || 0,
      payment_method: sale.payment_method || 'cash',
      total_amount: parseFloat(sale.total_amount) || parseFloat(sale.net_amount) || 0
    }));
    
    const transformed = {
      summary,
      payment_breakdown,
      transactions
    };
    
    console.log("[DEBUG] getSalesReport transformed data:", transformed);
    return transformed;
  } catch (error) {
    console.error("[ERROR] getSalesReport failed:", error.response ? error.response.data : error.message);
    
    // Return empty data structure instead of throwing error
    return {
      summary: {
        total_sales: 0,
        total_transactions: 0,
        total_quantity: 0,
        average_sale: 0
      },
      payment_breakdown: {},
      transactions: []
    };
  }
}

export async function downloadSalesReport(params, format) {
  try {
    console.log("[DEBUG] downloadSalesReport called with params:", params, "format:", format);
    
    // For now, we'll generate a simple report since the backend doesn't have download endpoints
    // In a real app, you'd implement PDF/CSV generation on the backend
    const reportData = await getSalesReport(params);
    
    // Create a simple CSV or return data for frontend processing
    if (format === 'csv') {
      let csvContent = "Date,Customer,Products,Quantity,Payment Method,Amount\n";
      
      if (reportData.transactions && reportData.transactions.length > 0) {
        reportData.transactions.forEach(transaction => {
          const date = new Date(transaction.created_at || transaction.date).toLocaleDateString();
          const customer = transaction.customer_name || 'Walk-in Customer';
          const products = transaction.sale_items?.map(item => `${item.product_name}(${item.quantity})`).join('; ') || 'N/A';
          const quantity = transaction.sale_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          const paymentMethod = transaction.payment_method || 'N/A';
          const amount = transaction.total_amount || transaction.net_amount || 0;
          
          csvContent += `"${date}","${customer}","${products}","${quantity}","${paymentMethod}","${amount}"\n`;
        });
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      return blob;
    } else {
      // For other formats, return a simple text representation
      const textContent = `Sales Report\n\nTotal Sales: ${reportData.summary.total_sales}\nTotal Transactions: ${reportData.summary.total_transactions}\nTotal Quantity: ${reportData.summary.total_quantity}\nAverage Sale: ${reportData.summary.average_sale}\n`;
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
      return blob;
    }
  } catch (error) {
    console.error("[ERROR] downloadSalesReport failed:", error.response ? error.response.data : error.message);
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

// Global search functionality
export async function searchGlobal(query, limit = 5) {
  try {
    const response = await api.get(`/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("[ERROR] Global search failed:", error);
    throw error;
  }
}

// Utility to extract user-friendly error messages from API errors
export function getErrorMessage(error, fallback = 'An unexpected error occurred') {
  if (!navigator.onLine || (error && error.message && error.message.toLowerCase().includes('network error'))) {
    return 'No internet connection. Please check your connection and try again.';
  }
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

// Dashboard API functions - using existing getDashboardOverview function above

// Export axios methods for backward compatibility
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const del = api.delete;


