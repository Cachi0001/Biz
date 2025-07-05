import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Add a request interceptor to include the token
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

// Add a response interceptor to handle token expiration or invalid tokens
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid, clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export individual API functions for better modularity and clarity
export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  createTeamMember: (memberData) => api.post('/auth/create-team-member', memberData),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (userData) => api.put('/users/profile', userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },
};

export const customer = {
  getCustomers: () => api.get('/customers'),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

export const product = {
  getProducts: () => api.get('/products'),
  createProduct: (productData) => api.post('/products', productData),
  updateProduct: (id, productData) => api.put(`/products/${id}`, productData),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const sale = {
  getSales: () => api.get('/sales'),
  createSale: (saleData) => api.post('/sales', saleData),
  updateSale: (id, saleData) => api.put(`/sales/${id}`, saleData),
  deleteSale: (id) => api.delete(`/sales/${id}`),
};

export const expense = {
  getExpenses: () => api.get('/expenses'),
  createExpense: (expenseData) => api.post('/expenses', expenseData),
  updateExpense: (id, expenseData) => api.put(`/expenses/${id}`, expenseData),
  deleteExpense: (id) => api.delete(`/expenses/${id}`),
};

export const invoice = {
  getInvoices: () => api.get('/invoices'),
  createInvoice: (invoiceData) => api.post('/invoices', invoiceData),
  updateInvoice: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  deleteInvoice: (id) => api.delete(`/invoices/${id}`),
};

export const payment = {
  getPayments: () => api.get('/payments'),
  createPayment: (paymentData) => api.post('/payments', paymentData),
  updatePayment: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  deletePayment: (id) => api.delete(`/payments/${id}`),
};

export const dashboard = {
  getDashboardSummary: () => api.get('/dashboard/summary'),
  getSalesOverview: () => api.get('/dashboard/sales-overview'),
  getTopProducts: () => api.get('/dashboard/top-products'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
};

export const referral = {
  getReferrals: () => api.get('/referrals'),
  createReferral: (referralData) => api.post('/referrals', referralData),
};

export const notification = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export const subscription = {
  getSubscriptionPlans: () => api.get('/subscriptions/plans'),
  updateSubscription: (subscriptionData) => api.put('/subscriptions/update', subscriptionData),
};

export const withdrawal = {
  getWithdrawals: () => api.get('/withdrawals'),
  requestWithdrawal: (withdrawalData) => api.post('/withdrawals', withdrawalData),
};

export const user = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`),
};

export const subscriptionUpgrade = {
  getSubscriptionUpgradeOptions: () => api.get('/subscription-upgrade/options'),
  initiateUpgrade: (upgradeData) => api.post('/subscription-upgrade/initiate', upgradeData),
};

// Default export for backward compatibility if needed, but prefer named exports
export default api;


