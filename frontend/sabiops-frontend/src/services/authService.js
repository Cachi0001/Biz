import apiService from './api';

export const authService = {
  // User login
  async login(email, password) {
    try {
      const credentials = {
        login: email,
        password: password
      };
      const response = await apiService.login(credentials);
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
      const response = await apiService.register(userData);
      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Registration failed' };
    }
  },

  // Request password reset code
  async requestPasswordReset(email) {
    try {
      const response = await apiService.requestPasswordReset({ email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to request password reset' };
    }
  },

  // Reset password with code
  async resetPassword(email, resetCode, newPassword) {
    try {
      const response = await apiService.resetPassword({ email, reset_code: resetCode, new_password: newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to reset password' };
    }
  },

  // Create team member (Owner/Admin only)
  async createTeamMember(memberData) {
    try {
      // Assuming apiService has a method for creating team members
      const response = await apiService.createTeamMember(memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to create team member' };
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await apiService.getProfile();
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await apiService.updateProfile(userData);
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
    apiService.logout(); // This handles clearing local storage and redirecting
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Ensure consistency with backend user object structure
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.first_name,
        last_name: user.last_name,
        business_name: user.business_name,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        // Add other fields if they are consistently returned by backend on login/register
        // referral_code: user.referral_code, // Only available from getProfile
        // trial_ends_at: user.trial_ends_at, // Only available from getProfile
      };
    }
    return null;
  },

  // Check user role
  hasRole(roles) {
    const user = this.getCurrentUser();
    return user && roles.includes(user.role);
  }
};


