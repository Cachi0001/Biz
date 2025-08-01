import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, TrendingUp, UserPlus, DollarSign } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { formatCurrency } from '../../lib/utils/index.js';

const CustomerAnalyticsCard = ({ customerData, loading }) => {
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
    total_customers = 0,
    new_customers_current = 0,
    customer_growth = 0,
    top_customers = [],
    avg_order_value = 0,
    acquisition_trends = []
  } = customerData || {};

  // Transform acquisition trends for chart
  const acquisitionChartData = acquisition_trends.map(item => ({
    period: item.period,
    customers: item.new_customers
  }));

  return (
    <div className="space-y-4">
      {/* Customer Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 text-center">
            <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-900">{total_customers.toLocaleString()}</p>
            <p className="text-xs text-blue-700">Total Customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 text-center">
            <UserPlus className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-900">{new_customers_current}</p>
            <p className="text-xs text-green-700">New This Period</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className={`text-lg font-bold ${customer_growth >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {customer_growth >= 0 ? '+' : ''}{customer_growth.toFixed(1)}%
            </p>
            <p className="text-xs text-purple-700">Growth Rate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-3 text-center">
            <DollarSign className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-orange-900">{formatCurrency(avg_order_value)}</p>
            <p className="text-xs text-orange-700">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Acquisition Trends */}
      {acquisitionChartData.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Customer Acquisition Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={acquisitionChartData}>
                <XAxis 
                  dataKey="period" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#6b7280' }} 
                />
                <YAxis hide />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Customers */}
      {top_customers.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {top_customers.slice(0, 5).map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border-l-4 border-green-400">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{customer.name}</p>
                      <p className="text-xs text-gray-600">{customer.orders} orders</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">{formatCurrency(customer.revenue)}</p>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerAnalyticsCard;