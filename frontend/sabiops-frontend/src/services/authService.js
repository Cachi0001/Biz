import { auth, user } from './api';

export const authService = {
  // User login
  async login(email, password) {
    try {
      const response = await auth.login(email, password);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Login failed' };
    }
  },

  // User registration
  async register(userData) {
    try {
      const response = await auth.register(userData);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Create team member (Owner/Admin only)
  async createTeamMember(memberData) {
    try {
      const response = await auth.createTeamMember(memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create team member' };
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await user.getProfile();
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await user.updateProfile(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to update profile' };
    }
  },

  // Get auth token
  getToken() {
    return localStorage.getItem('token');
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Logout
  logout() {
    auth.logout(); // This handles clearing local storage and redirecting
  },

  // Check user role
  hasRole(roles) {
    const user = this.getCurrentUser();
    return user && roles.includes(user.role);
  }
};

