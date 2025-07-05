// SabiOps API Service
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'https://sabiops-backend.vercel.app/api',
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

// API Service Methods
const apiService = {
  // Auth token management
  getAuthToken: () => localStorage.getItem('token'),
  setAuthToken: (token) => localStorage.setItem('token', token),
  removeAuthToken: () => localStorage.removeItem('token'),

  // Authentication endpoints
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.access_token) {
      apiService.setAuthToken(response.data.access_token);
    }
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.access_token) {
      apiService.setAuthToken(response.data.access_token);
    }
    return response.data;
  },

  logout: async () => {
    apiService.removeAuthToken();
    return Promise.resolve();
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  },

  // Health check
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  testDatabase: async () => {
    const response = await api.get('/test-db');
    return response.data;
  },

  // Customers
  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  updateCustomer: async (customerId, customerData) => {
    const response = await api.put(`/customers/${customerId}`, customerData);
    return response.data;
  },

  deleteCustomer: async (customerId) => {
    const response = await api.delete(`/customers/${customerId}`);
    return response.data;
  },

  // Products
  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await api.put(`/products/${productId}`, productData);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/products/${productId}`);
    return response.data;
  },

  // Sales
  getSales: async () => {
    const response = await api.get('/sales');
    return response.data;
  },

  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  // Expenses
  getExpenses: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },

  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Team Management
  getTeamMembers: async () => {
    const response = await api.get('/team');
    return response.data;
  },

  createTeamMember: async (memberData) => {
    const response = await api.post('/team', memberData);
    return response.data;
  },

  updateTeamMember: async (memberId, memberData) => {
    const response = await api.put(`/team/${memberId}`, memberData);
    return response.data;
  },

  deleteTeamMember: async (memberId) => {
    const response = await api.delete(`/team/${memberId}`);
    return response.data;
  },

  resetTeamMemberPassword: async (memberId) => {
    const response = await api.post(`/team/${memberId}/reset-password`);
    return response.data;
  },

  // Dashboard
  getDashboardOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getRevenueChart: async (period = '12months') => {
    const response = await api.get(`/dashboard/revenue-chart?period=${period}`);
    return response.data;
  },

  getTopCustomers: async (limit = 5) => {
    const response = await api.get(`/dashboard/top-customers?limit=${limit}`);
    return response.data;
  },

  getTopProducts: async (limit = 5) => {
    const response = await api.get(`/dashboard/top-products?limit=${limit}`);
    return response.data;
  },

  getRecentActivities: async (limit = 10) => {
    const response = await api.get(`/dashboard/recent-activities?limit=${limit}`);
    return response.data;
  },

  // Subscription Management
  getSubscriptionPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  getCurrentSubscription: async () => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  updateSubscription: async (subscriptionData) => {
    const response = await api.put('/subscriptions/update', subscriptionData);
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },

  // Payment Integration (Paystack)
  initializePayment: async (paymentData) => {
    const response = await api.post('/payments/initialize', paymentData);
    return response.data;
  },

  verifyPayment: async (reference) => {
    const response = await api.post('/payments/verify', { reference });
    return response.data;
  },

  getPaymentHistory: async () => {
    const response = await api.get('/payments/history');
    return response.data;
  },

  // Subscription Upgrade
  upgradeSubscription: async (plan, paymentMethod = 'paystack') => {
    const response = await api.post('/subscription-upgrade/upgrade', {
      plan,
      payment_method: paymentMethod
    });
    return response.data;
  },

  downgradeSubscription: async (plan) => {
    const response = await api.post('/subscription-upgrade/downgrade', { plan });
    return response.data;
  },

  // Referrals
  getReferrals: async () => {
    const response = await api.get('/referrals');
    return response.data;
  },

  createReferral: async (referralData) => {
    const response = await api.post('/referrals', referralData);
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Withdrawals
  getWithdrawals: async () => {
    const response = await api.get('/withdrawals');
    return response.data;
  },

  requestWithdrawal: async (withdrawalData) => {
    const response = await api.post('/withdrawals', withdrawalData);
    return response.data;
  },
};

export default apiService;



