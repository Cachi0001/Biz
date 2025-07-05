import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../lib/api';

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

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = apiService.getAuthToken();
        if (token) {
          const response = await apiService.getProfile();
          // Handle different response structures
          if (response.user) {
            setUser(response.user);
          } else if (response.data && response.data.user) {
            setUser(response.data.user);
          } else {
            // If response structure is different, use the response itself
            setUser(response);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        apiService.removeAuthToken();
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
      const response = await apiService.login(credentials);
      
      // After successful login, get user profile
      if (response.access_token) {
        try {
          const profileResponse = await apiService.getProfile();
          setUser(profileResponse.user || profileResponse);
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError);
          // Set a basic user object if profile fetch fails
          setUser({ id: 'unknown', email: credentials.username });
        }
      } else {
        // If no token, set user from response or create basic user object
        if (response.user) {
          setUser(response.user);
        } else {
          setUser({ id: 'unknown', email: credentials.username });
        }
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      // Don't set user to null or undefined - keep it as null
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
      const response = await apiService.register(userData);
      
      // After successful registration, get user profile if token is provided
      if (response.access_token) {
        try {
          const profileResponse = await apiService.getProfile();
          setUser(profileResponse.user || profileResponse);
        } catch (profileError) {
          console.error('Failed to get user profile:', profileError);
          // Set a basic user object if profile fetch fails
          setUser({ id: 'unknown', email: userData.email });
        }
      } else {
        // If no token, set user from response or create basic user object
        if (response.user) {
          setUser(response.user);
        } else {
          setUser({ id: 'unknown', email: userData.email });
        }
      }
      
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed';
      setError(errorMessage);
      // Don't set user to null or undefined - keep it as null
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await apiService.updateProfile(userData);
      // Handle different response structures
      if (response.user) {
        setUser(response.user);
      } else if (response.data && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(response);
      }
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

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    clearError,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

