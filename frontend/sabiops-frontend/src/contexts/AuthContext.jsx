import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from "../services/authService";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate trial days remaining
  const getTrialDaysLeft = (trialEndDate) => {
    if (!trialEndDate) return 0;
    const endDate = new Date(trialEndDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Enhanced user object with role and subscription data
  const enhanceUserData = (userData) => {
    if (!userData) return null;

    return {
      ...userData,
      role: userData.role || 'standard_user',
      subscription_status: userData.subscription_status || 'free_trial',
      trial_end_date: userData.trial_end_date,
      trial_days_left: userData.trial_end_date ? getTrialDaysLeft(userData.trial_end_date) : 14,
      is_trial_expired: userData.trial_end_date ? new Date(userData.trial_end_date) < new Date() : false,
      subscription_features: {
        max_customers: userData.subscription_status === 'premium' ? -1 : userData.subscription_status === 'basic' ? 100 : 10,
        max_products: userData.subscription_status === 'premium' ? -1 : userData.subscription_status === 'basic' ? 50 : 5,
        advanced_reports: userData.subscription_status !== 'free_trial',
        team_collaboration: userData.subscription_status === 'premium',
        api_access: userData.subscription_status === 'premium',
      }
    };
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getToken();
        if (token) {
          const response = await authService.getProfile();
          // Handle different response structures
          let userData = null;
          if (response.user) {
            userData = response.user;
          } else if (response.data && response.data.user) {
            userData = response.data.user;
          } else {
            userData = response;
          }
          
          setUser(enhanceUserData(userData));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout(); // Use authService.logout to clear token and user
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login(credentials.login, credentials.password);
      
      // After successful login, get user profile
      if (response.access_token) {
        try {
          const profileResponse = await authService.getProfile();
          const userData = profileResponse.user || profileResponse;
          setUser(enhanceUserData(userData));
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError);
          // Set a basic user object if profile fetch fails
          setUser(enhanceUserData({ 
            id: 'unknown', 
            email: credentials.login,
            role: 'standard_user',
            subscription_status: 'free_trial'
          }));
        }
      } else {
        // If no token, set user from response or create basic user object
        const userData = response.user || { 
          id: 'unknown', 
          email: credentials.login,
          role: 'standard_user',
          subscription_status: 'free_trial'
        };
        setUser(enhanceUserData(userData));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.register(userData);
      
      // After successful registration, get user profile if token is provided
      if (response.access_token) {
        try {
          const profileResponse = await authService.getProfile();
          const userProfileData = profileResponse.user || profileResponse;
          setUser(enhanceUserData(userProfileData));
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError);
          // Set a basic user object if profile fetch fails
          setUser(enhanceUserData({ 
            id: 'unknown', 
            email: userData.email,
            role: 'standard_user',
            subscription_status: 'free_trial'
          }));
        }
      } else {
        // If no token, set user from response or create basic user object
        const userProfileData = response.user || { 
          id: 'unknown', 
          email: userData.email,
          role: 'standard_user',
          subscription_status: 'free_trial'
        };
        setUser(enhanceUserData(userProfileData));
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
      setError(errorMessage);
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      // Handle different response structures
      let updatedUserData = null;
      if (response.user) {
        updatedUserData = response.user;
      } else if (response.data && response.data.user) {
        updatedUserData = response.data.user;
      } else {
        updatedUserData = response;
      }
      
      setUser(enhanceUserData(updatedUserData));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setError(errorMessage);
      throw error;
    }
  };

  const updateSubscription = async (subscriptionData) => {
    try {
      const response = await authService.updateSubscription(subscriptionData);
      // Refresh user data after subscription update
      const profileResponse = await authService.getProfile();
      const userData = profileResponse.user || profileResponse;
      setUser(enhanceUserData(userData));
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
      setError(errorMessage);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Helper functions for role and subscription checks
  const hasRole = (requiredRole) => {
    if (!user) return false;
    return user.role?.toLowerCase() === requiredRole.toLowerCase();
  };

  const hasSubscription = (requiredSubscription) => {
    if (!user) return false;
    return user.subscription_status?.toLowerCase() === requiredSubscription.toLowerCase();
  };

  const canAccessFeature = (feature) => {
    if (!user || !user.subscription_features) return false;
    return user.subscription_features[feature] === true || user.subscription_features[feature] === -1;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    updateSubscription,
    clearError,
    hasRole,
    hasSubscription,
    canAccessFeature,
    isAuthenticated: !!user,
    isAdmin: hasRole('admin'),
    isPremium: hasSubscription('premium'),
    isFreeTrial: hasSubscription('free_trial'),
    trialDaysLeft: user?.trial_days_left || 0,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

