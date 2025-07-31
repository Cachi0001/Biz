/**
 * Analytics Hook
 * Provides subscription analytics and usage insights
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export function useAnalytics(options = {}) {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    usage: {},
    trends: {},
    recommendations: {},
    loading: false
  });

  const {
    autoRefresh = true,
    refreshInterval = 300000 // 5 minutes
  } = options;

  const fetchAnalytics = useCallback(async (showLoading = true) => {
    if (!user) return;

    try {
      if (showLoading) {
        setAnalytics(prev => ({ ...prev, loading: true }));
      }

      const response = await api.get('/subscription/analytics');
      const data = response.data.data || response.data;

      setAnalytics({
        usage: data.usage || {},
        trends: data.trends || {},
        recommendations: data.recommendations || {},
        loading: false
      });
    } catch (error) {
      console.error('[ANALYTICS] Failed to fetch analytics:', error);
      setAnalytics(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  const getUsageInsights = useCallback(() => {
    const { usage } = analytics;
    const insights = [];

    // Check for high usage features
    Object.entries(usage).forEach(([feature, data]) => {
      const percentage = data.percentage || 0;
      if (percentage > 80) {
        insights.push({
          type: 'high_usage',
          feature,
          percentage,
          message: `You're using ${percentage}% of your ${feature} limit`
        });
      }
    });

    return insights;
  }, [analytics]);

  const getUpgradeRecommendations = useCallback(() => {
    return analytics.recommendations.upgrade || [];
  }, [analytics]);

  const getUsageTrends = useCallback(() => {
    return analytics.trends || {};
  }, [analytics]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, fetchAnalytics]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      fetchAnalytics(false); // Don't show loading for auto-refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, fetchAnalytics]);

  return {
    ...analytics,
    fetchAnalytics,
    getUsageInsights,
    getUpgradeRecommendations,
    getUsageTrends,
    hasHighUsage: getUsageInsights().length > 0,
    hasRecommendations: getUpgradeRecommendations().length > 0
  };
}

export default useAnalytics; 