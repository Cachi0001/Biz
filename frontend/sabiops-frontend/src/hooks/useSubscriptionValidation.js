/**
 * Subscription Validation Hook
 * Provides real-time subscription validation and access control
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export function useSubscriptionValidation(actionType, options = {}) {
  const { user } = useAuth();
  const [validation, setValidation] = useState({
    loading: true,
    hasAccess: null,
    reason: null,
    currentUsage: 0,
    limit: 0,
    remaining: 0
  });

  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  const {
    autoValidate = true,
    refreshInterval = 30000 // 30 seconds
  } = options;

  const validateAccess = useCallback(async (showToast = true) => {
    if (!user) {
      setValidation({
        loading: false,
        hasAccess: false,
        reason: 'not_authenticated',
        currentUsage: 0,
        limit: 0,
        remaining: 0
      });
      return;
    }

    try {
      setValidation(prev => ({ ...prev, loading: true }));

      const response = await api.get('/subscription/unified-status');
      const status = response.data.data;

      if (!status) {
        throw new Error('No subscription status received');
      }

      // Check if user has access to the specific action
      const hasAccess = status.is_active || status.is_trial;
      const reason = hasAccess ? null : 'subscription_inactive';

      setValidation({
        loading: false,
        hasAccess,
        reason,
        currentUsage: status.current_usage?.[actionType] || 0,
        limit: status.plan_config?.features?.[actionType] || 0,
        remaining: Math.max(0, (status.plan_config?.features?.[actionType] || 0) - (status.current_usage?.[actionType] || 0))
      });

    } catch (error) {
      console.error('[SUBSCRIPTION] Validation error:', error);
      setValidation({
        loading: false,
        hasAccess: false,
        reason: 'validation_error',
        currentUsage: 0,
        limit: 0,
        remaining: 0
      });
    }
  }, [user, actionType]);

  // Initial validation
  useEffect(() => {
    if (autoValidate && user) {
      validateAccess(false); // Don't show toast on initial load
    }
  }, [autoValidate, user, validateAccess]);

  // Periodic revalidation
  useEffect(() => {
    if (refreshInterval > 0 && user && validation.hasAccess !== null) {
      intervalRef.current = setInterval(() => {
        validateAccess(false); // Silent revalidation
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, user, validation.hasAccess, validateAccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...validation,
    revalidate: validateAccess,
    isValidating: validation.loading,
    canProceed: validation.hasAccess === true,
    needsUpgrade: validation.hasAccess === false && validation.reason !== 'not_authenticated',
    isNearLimit: validation.remaining !== undefined && validation.remaining <= 5,
    usagePercentage: validation.limit > 0 ? Math.round((validation.currentUsage / validation.limit) * 100) : 0
  };
}

export default useSubscriptionValidation; 