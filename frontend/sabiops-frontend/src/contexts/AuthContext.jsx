import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { verifyToken, login as apiLogin, register as apiRegister } from '../services/api';
import toastService from '../services/ToastService';
import notificationService from '../services/notificationService';
import usageTrackingService from '../services/usageTrackingService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('[DEBUG] Verifying authentication token');
        const response = await verifyToken();
        
        if (response.success) {
          const userData = response.data.user;
          console.log('[DEBUG] User data from verifyToken:', userData);
          
          // Process subscription data from backend
          const subscriptionData = {
            plan: userData.subscription_plan || 'free',
            status: userData.subscription_status || 'inactive',
            is_trial: userData.is_trial || false,
            trial_days_left: userData.trial_days_left || 0,
            remaining_days: userData.remaining_days || 0,
            is_active: userData.is_active || false,
            is_expired: userData.is_expired || false,
            plan_config: userData.plan_config || {}
          };

          // Merge subscription data into user object
          const updatedUser = {
            ...userData,
            subscription: subscriptionData,
            // For backward compatibility
            subscription_plan: userData.subscription_plan,
            subscription_status: userData.subscription_status,
            trial_ends_at: userData.trial_ends_at,
            trial_days_left: userData.trial_days_left
          };

          console.log('[DEBUG] Updated user with subscription data:', updatedUser);
          setUser(updatedUser);
          setIsAuthenticated(true);
          
          // Start notification polling when user is authenticated
          notificationService.startPollingIfAuthenticated();
          
          // Start real-time usage tracking
          usageTrackingService.startTracking(updatedUser);
          
          return true;
        } else {
          console.log('[DEBUG] Token verification failed:', response.message);
          if (response.requiresReauth) {
            // If token is invalid, clear it and set as unauthenticated
            localStorage.removeItem('token');
            setUser(null);
            setIsAuthenticated(false);
            usageTrackingService.stopTracking();
            
            // Show toast if there's a specific message
            if (response.message) {
              toastService.error(response.message);
            }
          }
          return false;
        }
      } else {
        console.log('[DEBUG] No token found, user not authenticated');
        setUser(null);
        setIsAuthenticated(false);
        usageTrackingService.stopTracking();
        return false;
      }
    } catch (error) {
      console.error('[ERROR] Error during authentication check:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      usageTrackingService.stopTracking();
      
      // Only show error toast if it's not a network error (which might be temporary)
      if (!error.message.includes('Network Error')) {
        toastService.error('Failed to verify authentication. Please log in again.');
      }
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    try {
      console.log('[AUTH] Attempting login for:', email);
      const response = await apiLogin({ login: email, password });

      if (response.success) {
        console.log('[AUTH] Login successful:', response);
        if (response.data.access_token) {
          localStorage.setItem('token', response.data.access_token);
          setIsAuthenticated(true);
          await checkAuth(); // Re-check auth to get updated user data
          toastService.success('Login successful');
          return { success: true };
        } else {
          console.warn('[AUTH] Login successful but access_token is missing');
          toastService.error('Login failed: Invalid response from server');
          return { success: false, message: 'Invalid response from server' };
        }
      } else {
        const errorMessage = response.message || 'Login failed';
        toastService.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      let errorMessage = 'Login failed. Please try again.';

      // Handle different types of errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes('Request failed')) {
        errorMessage = error.message;
      }

      toastService.error(errorMessage, {
        duration: 5000,
        position: 'top-center'
      });
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      console.log('[AUTH] Attempting registration for:', userData.email);
      const response = await apiRegister(userData);

      if (response.success) {
        console.log('[AUTH] Registration successful:', response);
        return { success: true, message: 'Registration successful' };
      } else {
        const errorMessage = response.message || 'Registration failed';
        toastService.error(errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';

      // Handle different types of errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout. Please check your internet connection and try again.';
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Email already exists. Please use a different email or try logging in.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid data provided. Please check your information.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && !error.message.includes('Request failed')) {
        errorMessage = error.message;
      }

      toastService.error(errorMessage, {
        duration: 5000,
        position: 'top-center'
      });
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    // Stop notification polling when user logs out
    notificationService.stopPollingOnLogout();
    // Stop usage tracking when user logs out
    usageTrackingService.stopTracking();
    toastService.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
      register,
      logout, 
      checkAuth,
      // Derived values aligned with database schema
      role: user?.role || null,
      subscription: user?.subscription || null,
      businessName: user?.business_name || '',
      isOwner: user?.role === 'Owner',
      isAdmin: user?.role === 'Admin',
      isSalesperson: user?.role === 'Salesperson',
      isFreeTrial: user?.subscription_status === 'trial',
      isPaidPlan: user?.subscription_status === 'active',
      trialDaysLeft: user?.trial_days_left || 0,
      isTrialActive: user?.subscription_status === 'trial' && (user?.trial_days_left || 0) > 0,
      canAccessFeature: (feature) => {
        if (!user) return false;
        const role = user.role;
        const status = user.subscription_status;
        const plan = user.subscription_plan || 'free';

        // Trial users get FULL access (they're experiencing the paid plan)
        const hasAccess = status === 'active' || status === 'trial';
        const isBasicPlan = plan === 'free' || plan === 'basic';

        // Role-based access
        if (feature === 'team_management') return role === 'Owner' && hasAccess;
        if (feature === 'referrals') return role === 'Owner' && hasAccess;
        if (feature === 'analytics') {
          // Basic plan users need to upgrade for analytics
          if (isBasicPlan && status !== 'trial') return false;
          return hasAccess;
        }
        if (feature === 'advanced_analytics') {
          // Only paid plans get advanced analytics
          if (isBasicPlan && status !== 'trial') return false;
          return hasAccess;
        }

        return true; // Basic features available to all
      },
      hasReachedLimit: (limitType) => {
        return usageTrackingService.hasReachedLimit(limitType, user);
      },
      isNearLimit: (limitType, threshold = 0.8) => {
        return usageTrackingService.isNearLimit(limitType, user, threshold);
      },
      // Enhanced real-time methods
      validateAction: (actionType) => {
        return usageTrackingService.validateAction(actionType, user);
      },
      getUsageStatus: (limitType) => {
        return usageTrackingService.getUsageStatus(limitType, user);
      },
      getEffectiveSubscription: () => {
        return usageTrackingService.getEffectiveSubscription(user);
      },
      incrementUsage: (limitType, amount = 1) => {
        return usageTrackingService.incrementUsage(limitType, amount);
      },
      getUpgradeRecommendations: () => {
        return usageTrackingService.getUpgradeRecommendations(user);
      },
      showUpgradePrompt: (actionType) => {
        usageTrackingService.showIntelligentUpgradePrompt(user, actionType);
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
