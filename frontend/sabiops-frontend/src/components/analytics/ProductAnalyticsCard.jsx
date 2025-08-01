import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Package, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../../lib/utils/index.js';

const ProductAnalyticsCard = ({ productData, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    total_products = 0,
    top_products_by_revenue = [],
    top_products_by_quantity = [],
    low_stock_count = 0,
    low_stock_products = [],
    inventory_turnover = 0,
    total_quantity_sold = 0
  } = productData || {};

  // Transform top products for pie chart
  const topProductsChartData = top_products_by_revenue.slice(0, 5).map((product, index) => ({
    name: product.name,
    value: product.revenue,
    color: ['#16a34a', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'][index] || '#6b7280'
  }));

  // Transform quantity data for bar chart
  const quantityChartData = top_products_by_quantity.slice(0, 6).map(product => ({
    name: product.name.length > 10 ? product.name.substring(0, 10) + '...' : product.name,
    quantity: product.quantity_sold,
    revenue: product.revenue
  }));

  return (
    <div className="space-y-4">
      {/* Product Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 text-center">
            <Package className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-purple-900">{total_products.toLocaleString()}</p>
            <p className="text-xs text-purple-700">Total Products</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 text-center">
            <BarChart3 className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-900">{total_quantity_sold.toLocaleString()}</p>
            <p className="text-xs text-green-700">Units Sold</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-900">{inventory_turnover.toFixed(1)}x</p>
            <p className="text-xs text-blue-700">Inventory Turnover</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 text-center">
            <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-red-900">{low_stock_count}</p>
            <p className="text-xs text-red-700">Low Stock Items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Products by Revenue - Pie Chart */}
        {topProductsChartData.length > 0 && (
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Top Products by Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0">
                <div className="w-full sm:w-auto flex justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={topProductsChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {topProductsChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:ml-4 space-y-2">
                  {topProductsChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-700 truncate">{item.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Products by Quantity - Bar Chart */}
        {quantityChartData.length > 0 && (
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-blue-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Top Products by Quantity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={quantityChartData} layout="horizontal">
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#6b7280' }} 
                    width={80}
                  />
                  <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Low Stock Products Alert */}
      {low_stock_products.length > 0 && (
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Low Stock Alert ({low_stock_products.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {low_stock_products.slice(0, 6).map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-red-400">
                  <div>
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">Threshold: {product.threshold}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{product.current_stock} left</p>
                    <p className="text-xs text-red-500">
                      {product.shortage > 0 ? `Need ${product.shortage} more` : 'At threshold'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {low_stock_products.length > 6 && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  And {low_stock_products.length - 6} more products need restocking
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductAnalyticsCard;