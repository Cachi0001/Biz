import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import ModernChartsSection from '../components/dashboard/ModernChartsSection';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BarChart3, TrendingUp, Crown, Lock, Package, AlertTriangle, ShoppingCart, DollarSign } from 'lucide-react';
import { formatCurrency } from '../lib/utils/index.js';
import { getProducts } from '../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line } from 'recharts';
import { responsiveSpacing, responsiveText, mobileClasses } from '../utils/mobileOptimizations.jsx';

const Analytics = () => {
  const { user, isAuthenticated, canAccessFeature, subscription } = useAuth();
  const { dashboardData, loading, error } = useDashboard();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Fetch products for low stock analysis
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setProductsLoading(true);
        const response = await getProducts();
        setProducts(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

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

  // Check if user can access analytics
  if (!canAccessFeature('analytics')) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-6 space-y-6 bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 min-h-screen">
          {/* Upgrade Notice for Non-Trial Users */}
          <Card className="bg-gradient-to-r from-orange-100 via-yellow-100 to-red-100 border-orange-300 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-orange-500 rounded-full">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-orange-900 mb-2">Advanced Analytics</h2>
              <p className="text-orange-800 mb-4">
                Subscribe to access detailed business insights and advanced reporting.
              </p>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => window.location.href = '/subscription-upgrade'}
              >
                <Crown className="h-4 w-4 mr-2" />
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Get low stock products (stock < 10 or custom threshold)
  const lowStockProducts = products.filter(product => {
    const stock = Number(product.stock) || 0;
    const threshold = Number(product.low_stock_threshold) || 10;
    return stock <= threshold && stock > 0;
  });

  // Get top products data (mock data for now, should come from sales data)
  const topProductsData = products.slice(0, 5).map((product, index) => ({
    name: product.name || `Product ${index + 1}`,
    value: Math.floor(Math.random() * 50) + 10,
    color: ['#16a34a', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'][index] || '#6b7280'
  }));

  // Monthly expenses data (mock data)
  const monthlyExpensesData = [
    { month: 'Jan', expenses: 8000, budget: 10000 },
    { month: 'Feb', expenses: 12000, budget: 10000 },
    { month: 'Mar', expenses: 9000, budget: 10000 },
    { month: 'Apr', expenses: 13000, budget: 12000 },
    { month: 'May', expenses: 11000, budget: 12000 },
    { month: 'Jun', expenses: 14000, budget: 12000 },
  ];

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
                  {products.length}
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
              {/* Charts Section - Moved from Dashboard */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Revenue & Performance</h2>
                <ModernChartsSection data={dashboardData} loading={loading} />
              </div>

              {/* Top Products Card - Moved from Dashboard */}
              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-green-900 flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Top Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0">
                      <div className="w-full sm:w-auto flex justify-center">
                        <ResponsiveContainer width={140} height={140} minWidth={120}>
                          <PieChart>
                            <Pie
                              data={topProductsData}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={55}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {topProductsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full sm:ml-4 space-y-1">
                        {topProductsData.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-gray-700 truncate">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-4 sm:space-y-6">
              {/* Monthly Expenses Chart - Moved from Dashboard */}
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-orange-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Monthly Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-x-auto">
                    <ResponsiveContainer width="100%" height={200} minWidth={300}>
                      <BarChart data={monthlyExpensesData}>
                        <XAxis 
                          dataKey="month" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#6b7280' }} 
                        />
                        <YAxis hide />
                        <Bar dataKey="expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="budget" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span className="text-xs text-gray-600">Actual</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-300 rounded"></div>
                      <span className="text-xs text-gray-600">Budget</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Low Stock Products Card - NEW */}
              <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-red-900 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Low Stock Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productsLoading ? (
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
                      <span className="text-sm font-medium text-gray-700">Monthly Growth</span>
                      <span className="text-sm font-bold text-green-600">+12.5%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Customer Retention</span>
                      <span className="text-sm font-bold text-blue-600">87%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Average Order Value</span>
                      <span className="text-sm font-bold text-purple-600">₦15,750</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Inventory Turnover</span>
                      <span className="text-sm font-bold text-orange-600">4.2x</span>
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