import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '../../lib/utils/index.js';

const FinancialAnalyticsCard = ({ financialData, loading }) => {
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
    total_revenue = 0,
    total_expenses = 0,
    gross_profit = 0,
    net_profit = 0,
    gross_margin = 0,
    net_margin = 0,
    cash_flow_trends = [],
    expense_breakdown = [],
    roi_metrics = {}
  } = financialData || {};

  // Transform cash flow data for chart
  const cashFlowChartData = cash_flow_trends.map(item => ({
    period: item.period,
    revenue: item.money_in,
    expenses: item.money_out,
    netFlow: item.net_cash_flow
  }));

  // Transform expense breakdown for pie chart
  const expenseChartData = expense_breakdown.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    color: ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#f97316'][index] || '#6b7280'
  }));

  return (
    <div className="space-y-4">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-3 text-center">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-green-900">{formatCurrency(total_revenue)}</p>
            <p className="text-xs text-green-700">Total Revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-3 text-center">
            <TrendingDown className="h-6 w-6 text-red-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-red-900">{formatCurrency(total_expenses)}</p>
            <p className="text-xs text-red-700">Total Expenses</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <p className="text-lg font-bold text-blue-900">{formatCurrency(gross_profit)}</p>
            <p className="text-xs text-blue-700">Gross Profit</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-3 text-center">
            <DollarSign className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <p className={`text-lg font-bold ${net_profit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
              {formatCurrency(net_profit)}
            </p>
            <p className="text-xs text-purple-700">Net Profit</p>
          </CardContent>
        </Card>
      </div>

      {/* Profitability Metrics */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Profitability Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-indigo-900">{gross_margin.toFixed(1)}%</p>
              <p className="text-sm text-gray-600">Gross Margin</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className={`text-2xl font-bold ${net_margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {net_margin.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Net Margin</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {roi_metrics.return_on_investment?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-600">ROI</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(roi_metrics.profit_per_sale || 0)}
              </p>
              <p className="text-sm text-gray-600">Profit/Sale</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cash Flow Trends */}
        {cashFlowChartData.length > 0 && (
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Cash Flow Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={cashFlowChartData}>
                  <XAxis 
                    dataKey="period" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#6b7280' }} 
                  />
                  <YAxis hide />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ fill: '#16a34a', strokeWidth: 2, r: 3 }}
                    name="Revenue"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 3 }}
                    name="Expenses"
                  />
                  <Line
                    type="monotone"
                    dataKey="netFlow"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    name="Net Flow"
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-center space-x-4 mt-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-xs text-gray-600">Revenue</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-xs text-gray-600">Expenses</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-xs text-gray-600">Net Flow</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Expense Breakdown */}
        {expenseChartData.length > 0 && (
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Expense Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0">
                <div className="w-full sm:w-auto flex justify-center">
                  <ResponsiveContainer width={160} height={160}>
                    <RechartsPieChart>
                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {expenseChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:ml-4 space-y-2">
                  {expenseChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm text-gray-700 truncate">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
                        <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Financial Health Summary */}
      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-lg">
        <CardHeader>
          <CardTitle className="text-yellow-900">Financial Health Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className={`text-3xl font-bold mb-2 ${net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {net_profit >= 0 ? '✓' : '⚠'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {net_profit >= 0 ? 'Profitable' : 'Loss Making'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {net_profit >= 0 ? 'Business is generating profit' : 'Expenses exceed revenue'}
              </p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className={`text-3xl font-bold mb-2 ${gross_margin >= 20 ? 'text-green-600' : gross_margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {gross_margin >= 20 ? '✓' : gross_margin >= 10 ? '⚠' : '✗'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {gross_margin >= 20 ? 'Healthy Margins' : gross_margin >= 10 ? 'Fair Margins' : 'Low Margins'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Gross margin: {gross_margin.toFixed(1)}%
              </p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg">
              <div className={`text-3xl font-bold mb-2 ${total_revenue > total_expenses * 1.2 ? 'text-green-600' : total_revenue > total_expenses ? 'text-yellow-600' : 'text-red-600'}`}>
                {total_revenue > total_expenses * 1.2 ? '✓' : total_revenue > total_expenses ? '⚠' : '✗'}
              </div>
              <p className="text-sm font-medium text-gray-700">
                {total_revenue > total_expenses * 1.2 ? 'Strong Growth' : total_revenue > total_expenses ? 'Stable' : 'At Risk'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Revenue vs Expenses ratio
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialAnalyticsCard;