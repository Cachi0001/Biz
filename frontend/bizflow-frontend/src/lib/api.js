import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Handle unauthorized errors, e.g., redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const apiService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    // Optionally, invalidate token on backend if needed
  },

  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/user/profile', userData);
    return response.data;
  },

  getCustomers: async () => {
    const response = await api.get('/customers');
    return response.data;
  },

  createCustomer: async (customerData) => {
    const response = await api.post('/customers', customerData);
    return response.data;
  },

  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/customers/${id}`, customerData);
    return response.data;
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/customers/${id}`);
    return response.data;
  },

  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  getInvoices: async () => {
    const response = await api.get('/invoices');
    return response.data;
  },

  createInvoice: async (invoiceData) => {
    const response = await api.post('/invoices', invoiceData);
    return response.data;
  },

  updateInvoice: async (id, invoiceData) => {
    const response = await api.put(`/invoices/${id}`, invoiceData);
    return response.data;
  },

  deleteInvoice: async (id) => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  getPayments: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  createPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  updatePayment: async (id, paymentData) => {
    const response = await api.put(`/payments/${id}`, paymentData);
    return response.data;
  },

  deletePayment: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  getDashboardOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getDashboardSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getDashboardSalesChart: async () => {
    const response = await api.get('/dashboard/sales-chart');
    return response.data;
  },

  getDashboardProductSales: async () => {
    const response = await api.get('/dashboard/product-sales');
    return response.data;
  },

  getDashboardRecentActivities: async () => {
    const response = await api.get('/dashboard/recent-activities');
    return response.data;
  },

  getExpenses: async () => {
    const response = await api.get('/expenses');
    return response.data;
  },

  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  updateExpense: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  uploadFile: async (file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getSales: async () => {
    const response = await api.get('/sales');
    return response.data;
  },

  createSale: async (saleData) => {
    const response = await api.post('/sales', saleData);
    return response.data;
  },

  updateSale: async (id, saleData) => {
    const response = await api.put(`/sales/${id}`, saleData);
    return response.data;
  },

  deleteSale: async (id) => {
    const response = await api.delete(`/sales/${id}`);
    return response.data;
  },

  getTeamMembers: async () => {
    const response = await api.get('/team');
    return response.data;
  },

  createTeamMember: async (memberData) => {
    const response = await api.post('/team', memberData);
    return response.data;
  },

  updateTeamMember: async (id, memberData) => {
    const response = await api.put(`/team/${id}`, memberData);
    return response.data;
  },

  deleteTeamMember: async (id) => {
    const response = await api.delete(`/team/${id}`);
    return response.data;
  },

  getReferrals: async () => {
    const response = await api.get('/referrals');
    return response.data;
  },

  createReferral: async (referralData) => {
    const response = await api.post('/referrals', referralData);
    return response.data;
  },

  getSubscriptionPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  upgradeSubscription: async (planData) => {
    const response = await api.post('/subscription/upgrade', planData);
    return response.data;
  },

  getSubscriptionStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },

  // Authentication token management
  getAuthToken: () => {
    return localStorage.getItem('token');
  },

  removeAuthToken: () => {
    localStorage.removeItem('token');
  },

  setAuthToken: (token) => {
    localStorage.setItem('token', token);
  },

  // Add other API calls as needed
};

export default apiService;


