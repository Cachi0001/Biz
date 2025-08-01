import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ModernChartsSection from '../components/dashboard/ModernChartsSection';
import TimePeriodFilter from '../components/analytics/TimePeriodFilter';
import CustomerAnalyticsCard from '../components/analytics/CustomerAnalyticsCard';
import ProductAnalyticsCard from '../components/analytics/ProductAnalyticsCard';
import FinancialAnalyticsCard from '../components/analytics/FinancialAnalyticsCard';
import ExportControls from '../components/analytics/ExportControls';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart3, TrendingUp, Crown, Lock, Package, AlertTriangle, ShoppingCart, DollarSign, RefreshCw } from 'lucide-react';
import { formatCurrency } from '../lib/utils/index.js';
import api from '../services/api';
import frontendAnalyticsCache from '../services/analyticsCacheService';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis } from 'recharts';

const Analytics = () => {
  const { user, isAuthenticated, canAccessFeature, subscription } = useAuth();
  const { dashboardData, loading, error } = useDashboard();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [timePeriod, setTimePeriod] = useState('monthly');
  const [accessCheck, setAccessCheck] = useState(null);

  // Fetch analytics access check and data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setAnalyticsLoading(true);
        setAnalyticsError(null);

        // First check if user has access to analytics
        const accessResponse = await api.get('/dashboard/analytics/access-check');
        setAccessCheck(accessResponse.data.data);

        if (!accessResponse.data.data.has_access) {
          setAnalyticsLoading(false);
          return;
        }

        // Check cache first
        const cacheKey = frontendAnalyticsCache.getCacheKey(user?.id, 'business_analytics', timePeriod);
        const cachedData = frontendAnalyticsCache.getCachedData(cacheKey);

        if (cachedData) {
          setAnalyticsData(cachedData);
          setAnalyticsLoading(false);
          
          // Preload other time periods in background
          frontendAnalyticsCache.preloadAnalyticsData(user?.id, timePeriod, async (period) => {
            const response = await api.get(`/dashboard/analytics?period=${period}`);
            return response.data.data;
          });
          
          return;
        }

        // If not cached, fetch from API
        const analyticsResponse = await api.get(`/dashboard/analytics?period=${timePeriod}`);
        const analyticsData = analyticsResponse.data.data;
        
        // Cache the data
        frontendAnalyticsCache.setCachedData(cacheKey, analyticsData, timePeriod);
        
        setAnalyticsData(analyticsData);

        // Preload other time periods in background
        frontendAnalyticsCache.preloadAnalyticsData(user?.id, timePeriod, async (period) => {
          const response = await api.get(`/dashboard/analytics?period=${period}`);
          return response.data.data;
        });

      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
        setAnalyticsError(error.response?.data?.message || 'Failed to load analytics data');
      } finally {
        setAnalyticsLoading(false);
      }
    };

    if (isAuthenticated && user?.id) {
      fetchAnalyticsData();
    }
  }, [isAuthenticated, timePeriod, user?.id]);

  const handleTimePeriodChange = (newPeriod) => {
    setTimePeriod(newPeriod);
  };

  const handleRefreshAnalytics = () => {
    if (isAuthenticated) {
      setAnalyticsLoading(true);
      // Trigger re-fetch by updating a dependency
      setTimePeriod(prev => prev);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-purple-50">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Please Login
          </h1>
          <p className="text-gray-600">Access your SabiOps analytics</p>
        </div>
      </div>
    );
  }

  // Check if user can access analytics based on backend response
  if (accessCheck && !accessCheck.has_access) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 space-y-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 min-h-screen">
          {/* Upgrade Notice for Non-Subscribed Users */}
          <Card className="bg-gradient-to-r from-orange-100 via-yellow-100 to-red-100 border-orange-300 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-orange-500 rounded-full">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-orange-900 mb-2">Advanced Analytics</h2>
              <p className="text-orange-800 mb-4">
                {accessCheck.reason || 'Subscribe to access detailed business insights and advanced reporting.'}
              </p>
              {accessCheck.upgrade_info?.trial_available && (
                <div className="mb-4">
                  <p className="text-sm text-orange-700 mb-2">Start with a 7-day free trial!</p>
                </div>
              )}
              <div className="space-y-2">
                <Button
                  className="bg-orange-600 hover:bg-orange-700 text-white w-full"
                  onClick={() => window.location.href = '/subscription-upgrade'}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {accessCheck.upgrade_info?.trial_available ? 'Start Free Trial' : 'Subscribe Now'}
                </Button>
                {accessCheck.upgrade_info?.upgrade_options?.length > 0 && (
                  <div className="text-xs text-orange-600 mt-2">
                    Plans starting from {accessCheck.upgrade_info.upgrade_options[0]?.price}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Show loading state while checking access or loading data
  if (analyticsLoading && !analyticsData) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Business Analytics</h1>
                  <p className="text-blue-100 text-sm sm:text-base">Loading your business insights...</p>
                </div>
                <RefreshCw className="h-8 w-8 sm:h-12 sm:w-12 text-white opacity-80 animate-spin" />
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-3 sm:p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (analyticsError) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 space-y-6">
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Analytics</h2>
              <p className="text-red-800 mb-4">{analyticsError}</p>
              <Button
                onClick={handleRefreshAnalytics}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Get analytics data or use fallback values
  const revenueData = analyticsData?.revenue || {};
  const customerData = analyticsData?.customers || {};
  const productData = analyticsData?.products || {};
  const financialData = analyticsData?.financial || {};

  // Get low stock products from analytics data
  const lowStockProducts = productData.low_stock_products || [];

  // Get top products data from analytics
  const topProductsData = (productData.top_products_by_revenue || []).slice(0, 5).map((product, index) => ({
    name: product.name || `Product ${index + 1}`,
    value: product.revenue || 0,
    color: ['#16a34a', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'][index] || '#6b7280'
  }));

  // Get cash flow data from analytics for expenses chart
  const cashFlowData = financialData.cash_flow_trends || [];
  const monthlyExpensesData = cashFlowData.map(item => ({
    month: item.period,
    expenses: item.money_out || 0,
    revenue: item.money_in || 0
  }));

  return (
    <DashboardLayout>
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 max-w-7xl">
        <div className="space-y-4 sm:space-y-6">
          {/* Analytics Header */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">Business Analytics</h1>
                  <p className="text-blue-100 text-sm sm:text-base">Comprehensive insights into your business performance</p>
                </div>
                <BarChart3 className="h-8 w-8 sm:h-12 sm:w-12 text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          {/* Time Period Filter */}
          <TimePeriodFilter 
            currentPeriod={timePeriod}
            onPeriodChange={handleTimePeriodChange}
            loading={analyticsLoading}
          />

          {/* Export Controls */}
          <ExportControls 
            analyticsData={analyticsData}
            timePeriod={timePeriod}
            onExportStart={(type) => console.log(`Starting export: ${type}`)}
            onExportComplete={(type, result) => console.log(`Export completed: ${type}`, result)}
          />

          {/* Key Metrics Grid - Mobile Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-3 sm:p-4 text-center">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-green-900">
                  {formatCurrency(dashboardData?.revenue?.total || 0)}
                </p>
                <p className="text-xs sm:text-sm text-green-700 font-medium">Total Revenue</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-3 sm:p-4 text-center">
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-blue-900">
                  {dashboardData?.customers?.total || 0}
                </p>
                <p className="text-xs sm:text-sm text-blue-700 font-medium">Total Customers</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-3 sm:p-4 text-center">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-purple-900">
                  {productData.total_products || 0}
                </p>
                <p className="text-xs sm:text-sm text-purple-700 font-medium">Total Products</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardContent className="p-3 sm:p-4 text-center">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mx-auto mb-2" />
                <p className="text-lg sm:text-2xl font-bold text-red-900">
                  {lowStockProducts.length}
                </p>
                <p className="text-xs sm:text-sm text-red-700 font-medium">Low Stock</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Grid - Mobile Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Left Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Charts Section - Revenue vs Expenses Combined */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Revenue & Performance</h2>
                <ModernChartsSection data={dashboardData} loading={loading} analyticsData={analyticsData} />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">

              {/* Low Stock Products Card - NEW */}
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-red-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Low Stock Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="animate-pulse space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : lowStockProducts.length === 0 ? (
                    <div className="text-center py-4">
                      <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">All products are well stocked!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {lowStockProducts.map((product, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-red-400">
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-600">Category: {product.category || 'N/A'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-red-600">{product.stock} left</p>
                            <p className="text-xs text-gray-500">Min: {product.low_stock_threshold || 10}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-purple-900">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Revenue Growth</span>
                      <span className={`text-sm font-bold ${revenueData.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {revenueData.revenue_growth >= 0 ? '+' : ''}{revenueData.revenue_growth?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Profit Margin</span>
                      <span className="text-sm font-bold text-blue-600">
                        {revenueData.profit_margin?.toFixed(1) || '0.0'}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Average Order Value</span>
                      <span className="text-sm font-bold text-purple-600">
                        {formatCurrency(customerData.avg_order_value || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Inventory Turnover</span>
                      <span className="text-sm font-bold text-orange-600">
                        {productData.inventory_turnover?.toFixed(1) || '0.0'}x
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Analytics;