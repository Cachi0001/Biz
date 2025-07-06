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

  createTeamMember: async (memberData) => {
    const response = await api.post('/auth/team-member', memberData);
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

  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },

  // Dashboard
  getDashboardOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  getRevenueChart: async () => {
    const response = await api.get('/dashboard/revenue-chart');
    return response.data;
  },
};

export default apiService;


