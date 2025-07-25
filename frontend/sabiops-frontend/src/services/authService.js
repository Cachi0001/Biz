import { login as apiLogin, register as apiRegister, requestPasswordReset, resetPassword, createTeamMember, getProfile, updateProfile, logout as apiLogout, getAuthToken, resendVerificationEmail } from './api';

export const authService = {
  // User login
  async login(email, password) {
    try {
      const credentials = {
        login: email,
        password: password
      };
      const response = await apiLogin(credentials);
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Login failed" };
    }
  },

  // User registration
  async register(userData) {
    try {
      const response = await apiRegister(userData);
      if (response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Registration failed" };
    }
  },

  // Confirm registration (email verification)
  async registerConfirmed(userData) {
    try {
      const response = await require('./api').registerConfirmed(userData);
      if (response.data && response.data.access_token) {
        localStorage.setItem("token", response.data.access_token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }
      return response;
    } catch (error) {
      throw error.response?.data || { error: "Registration confirmation failed" };
    }
  },

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const response = await resendVerificationEmail(email);
      return response;
    } catch (error) {
      throw error.response?.data || { error: "Failed to resend verification email" };
    }
  },

  // Request password reset code
  async requestPasswordReset(email) {
    try {
      const response = await requestPasswordReset({ email });
      return response; // No .data, API returns the response directly
    } catch (error) {
      throw error.response?.data || { error: "Failed to request password reset" };
    }
  },


  // Create team member (Owner/Admin only)
  async createTeamMember(memberData) {
    try {
      // Assuming apiService has a method for creating team members
      const response = await createTeamMember(memberData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to create team member" };
    }
  },

  // Get current user profile
  async getProfile() {
    try {
      const response = await getProfile();
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to fetch profile" };
    }
  },

  // Update user profile
  async updateProfile(userData) {
    try {
      const response = await updateProfile(userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { error: "Failed to update profile" };
    }
  },

  // Get auth token
  getToken() {
    return getAuthToken();
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Logout
  logout() {
    apiLogout(); // This handles clearing local storage and redirecting
  },

  // Get current user
  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      // Ensure consistency with backend user object structure
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.full_name, // Changed from first_name/last_name to full_name
        business_name: user.business_name,
        role: user.role,
        subscription_plan: user.subscription_plan,
        subscription_status: user.subscription_status,
        trial_ends_at: user.trial_ends_at,
        referral_code: user.referral_code,
        owner_id: user.owner_id
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

