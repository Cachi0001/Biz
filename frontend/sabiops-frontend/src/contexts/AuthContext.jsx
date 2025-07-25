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
        console.log('Token from localStorage before verifyToken:', token); // Added log
        const response = await verifyToken();
        if (response.success) {
          const userData = response.data.user;
          // Calculate trial_days_left based on trial_ends_at
          if (userData.trial_ends_at) {
            const trialEndDate = new Date(userData.trial_ends_at);
            const today = new Date();
            const diffTime = trialEndDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            userData.trial_days_left = Math.max(0, diffDays);
          } else {
            userData.trial_days_left = 0;
          }

          // Add subscription and role information for dashboard
          const plan = userData.subscription_plan || 'free';
          const getPlanLimits = (planType) => {
            switch (planType) {
              case 'free':
              case 'basic':
                return { invoices: 5, expenses: 5 };
              case 'silver_weekly':
              case 'weekly':
                return { invoices: 100, expenses: 100 };
              case 'silver_monthly':
              case 'monthly':
                return { invoices: 450, expenses: 450 };
              case 'silver_yearly':
              case 'yearly':
                return { invoices: 6000, expenses: 6000 };
              default:
                return { invoices: 5, expenses: 5 };
            }
          };

          userData.subscription = {
            plan: plan,
            status: userData.subscription_status || 'trial',
            is_trial: userData.subscription_status === 'trial',
            trial_days_left: userData.trial_days_left,
            current_usage: {
              invoices: userData.current_month_invoices || 0,
              expenses: userData.current_month_expenses || 0
            },
            usage_limits: getPlanLimits(plan)
          };
          setUser(userData);
          setIsAuthenticated(true);
          // Start notification polling when user is authenticated
          notificationService.startPollingIfAuthenticated();
          // Start real-time usage tracking
          usageTrackingService.startTracking(userData);
          console.log('checkAuth: isAuthenticated set to TRUE'); // Added log
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          // Stop usage tracking when token is invalid
          usageTrackingService.stopTracking();
          console.log('checkAuth: isAuthenticated set to FALSE (token invalid)'); // Added log
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        // Stop usage tracking when no token
        usageTrackingService.stopTracking();
        console.log('checkAuth: isAuthenticated set to FALSE (no token)'); // Added log
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      // Stop usage tracking on error
      usageTrackingService.stopTracking();
      console.log('checkAuth: isAuthenticated set to FALSE (error)'); // Added log
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


