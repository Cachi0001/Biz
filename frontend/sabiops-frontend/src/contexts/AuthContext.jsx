import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { verifyToken, login as apiLogin, register as apiRegister } from '../services/api';
import { toast } from 'react-hot-toast';

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
          userData.subscription = {
            plan: userData.subscription_plan || 'weekly',
            status: userData.subscription_status || 'trial',
            is_trial: userData.subscription_status === 'trial',
            trial_days_left: userData.trial_days_left,
            current_usage: {
              invoices: 0, // Will be populated by dashboard
              expenses: 0
            },
            usage_limits: userData.subscription_plan === 'free' ? {
              invoices: 5,
              expenses: 5
            } : {
              invoices: 'unlimited',
              expenses: 'unlimited'
            }
          };
          setUser(userData);
          setIsAuthenticated(true);
          console.log('checkAuth: isAuthenticated set to TRUE'); // Added log
        } else {
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
          console.log('checkAuth: isAuthenticated set to FALSE (token invalid)'); // Added log
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
        console.log('checkAuth: isAuthenticated set to FALSE (no token)'); // Added log
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
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
      // FIX: Send credentials as an object with correct keys
      const response = await apiLogin({ login: email, password });
      if (response.success) {
        console.log('Login successful. Full API Response:', response); // Log full response
        console.log('Login successful. Access Token from response.data:', response.data.access_token); // Added log
        if (response.data.access_token) { // Access access_token from response.data
          localStorage.setItem('token', response.data.access_token);
          setIsAuthenticated(true); // Set isAuthenticated to true immediately on successful login
        } else {
          console.warn('Login successful but access_token is missing from response.data.');
        }
        await checkAuth(); // Re-check auth to get updated user data including trial_days_left
        return { success: true };
      } else {
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'An unexpected error occurred during login.';
      window.toast && window.toast.error(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully!');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      loading, 
      login, 
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
        
        // Trial users get FULL access (they're experiencing the paid plan)
        const hasAccess = status === 'active' || status === 'trial';
        
        // Role-based access
        if (feature === 'team_management') return role === 'Owner' && hasAccess;
        if (feature === 'referrals') return role === 'Owner' && hasAccess;
        if (feature === 'analytics') return hasAccess;
        
        return true; // Basic features available to all
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


