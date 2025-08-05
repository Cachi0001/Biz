import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { TrendingUp, TrendingDown, DollarSign, Clock, CheckCircle, AlertTriangle, BarChart3, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const RevenueRecognitionDashboard = ({ userId }) => {
  const [period, setPeriod] = useState('30'); // days
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRevenueData();
  }, [period, userId]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData = {
        period: {
          start_date: '2025-01-01',
          end_date: '2025-01-30',
          days: parseInt(period)
        },
        current_period: {
          recognized_revenue: 450000,
          recognized_profit: 135000,
          transaction_count: 180,
          profit_margin: 30.0,
          average_sale_value: 2500
        },
        previous_period: {
          recognized_revenue: 380000,
          recognized_profit: 114000,
          transaction_count: 152,
          profit_margin: 30.0,
          average_sale_value: 2500
        },
        growth_metrics: {
          revenue_growth_percentage: 18.4,
          profit_growth_percentage: 18.4
        },
        accounts_receivable: {
          total_accounts_receivable: 125000,
          current_receivable: 75000,
          overdue_receivable: 50000,
          outstanding_sales_count: 25,
          overdue_percentage: 40.0,
          aging_buckets: {
            current: 75000,      // 0-30 days
            '30_days': 25000,    // 31-60 days
            '60_days': 15000,    // 61-90 days
            '90_plus_days': 10000 // 90+ days
          }
        },
        revenue_recognition: {
          total_sales_amount: 575000,
          recognized_revenue: 450000,
          unrecognized_revenue: 125000,
          recognition_rate_percentage: 78.3
        },
        monthly_trend: [
          { month: '2024-11', recognized_revenue: 320000, recognized_profit: 96000 },
          { month: '2024-12', recognized_revenue: 380000, recognized_profit: 114000 },
          { month: '2025-01', recognized_revenue: 450000, recognized_profit: 135000 }
        ]
      };
      
      setRevenueData(mockData);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to load revenue recognition data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getRecognitionRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRecognitionRateIcon = (rate) => {
    if (rate >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (rate >= 75) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue recognition data...</p>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className="text-center p-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No revenue data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Recognition Dashboard</h1>
          <p className="text-gray-600">Track recognized revenue vs accounts receivable</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="365">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recognized Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(revenueData.current_period.recognized_revenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(revenueData.growth_metrics.revenue_growth_percentage)}
                  <span className={`text-xs ${getGrowthColor(revenueData.growth_metrics.revenue_growth_percentage)}`}>
                    {formatPercentage(revenueData.growth_metrics.revenue_growth_percentage)} vs prev period
                  </span>
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accounts Receivable</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(revenueData.accounts_receivable.total_accounts_receivable)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {revenueData.accounts_receivable.outstanding_sales_count} outstanding sales
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recognition Rate</p>
                <p className={`text-2xl font-bold ${getRecognitionRateColor(revenueData.revenue_recognition.recognition_rate_percentage)}`}>
                  {formatPercentage(revenueData.revenue_recognition.recognition_rate_percentage)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Of total sales amount
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                {getRecognitionRateIcon(revenueData.revenue_recognition.recognition_rate_percentage)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recognized Profit</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(revenueData.current_period.recognized_profit)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(revenueData.growth_metrics.profit_growth_percentage)}
                  <span className={`text-xs ${getGrowthColor(revenueData.growth_metrics.profit_growth_percentage)}`}>
                    {formatPercentage(revenueData.growth_metrics.profit_growth_percentage)} vs prev period
                  </span>
                </div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Recognition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Recognition Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-green-50 rounded-lg mb-3">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Recognized Revenue</p>
                <p className="text-xl font-bold text-green-900">
                  {formatCurrency(revenueData.revenue_recognition.recognized_revenue)}
                </p>
                <Badge className="mt-2 bg-green-100 text-green-800">
                  {formatPercentage(revenueData.revenue_recognition.recognition_rate_percentage)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">Revenue from paid sales only</p>
            </div>

            <div className="text-center">
              <div className="p-4 bg-orange-50 rounded-lg mb-3">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Unrecognized Revenue</p>
                <p className="text-xl font-bold text-orange-900">
                  {formatCurrency(revenueData.revenue_recognition.unrecognized_revenue)}
                </p>
                <Badge className="mt-2 bg-orange-100 text-orange-800">
                  {formatPercentage(100 - revenueData.revenue_recognition.recognition_rate_percentage)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500">Revenue from credit/pending sales</p>
            </div>

            <div className="text-center">
              <div className="p-4 bg-blue-50 rounded-lg mb-3">
                <DollarSign className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Total Sales Amount</p>
                <p className="text-xl font-bold text-blue-900">
                  {formatCurrency(revenueData.revenue_recognition.total_sales_amount)}
                </p>
                <Badge className="mt-2 bg-blue-100 text-blue-800">
                  100%
                </Badge>
              </div>
              <p className="text-xs text-gray-500">All sales regardless of payment status</p>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Revenue Recognition Progress</span>
              <span className="text-sm text-gray-600">
                {formatPercentage(revenueData.revenue_recognition.recognition_rate_percentage)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${revenueData.revenue_recognition.recognition_rate_percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Recognized: {formatCurrency(revenueData.revenue_recognition.recognized_revenue)}</span>
              <span>Outstanding: {formatCurrency(revenueData.revenue_recognition.unrecognized_revenue)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Receivable Aging */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Accounts Receivable Aging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">Current (0-30 days)</p>
              <p className="text-xl font-bold text-green-900">
                {formatCurrency(revenueData.accounts_receivable.aging_buckets.current)}
              </p>
              <Badge className="mt-2 bg-green-100 text-green-800">Good</Badge>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">31-60 days</p>
              <p className="text-xl font-bold text-yellow-900">
                {formatCurrency(revenueData.accounts_receivable.aging_buckets['30_days'])}
              </p>
              <Badge className="mt-2 bg-yellow-100 text-yellow-800">Watch</Badge>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">61-90 days</p>
              <p className="text-xl font-bold text-orange-900">
                {formatCurrency(revenueData.accounts_receivable.aging_buckets['60_days'])}
              </p>
              <Badge className="mt-2 bg-orange-100 text-orange-800">Concern</Badge>
            </div>

            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">90+ days</p>
              <p className="text-xl font-bold text-red-900">
                {formatCurrency(revenueData.accounts_receivable.aging_buckets['90_plus_days'])}
              </p>
              <Badge className="mt-2 bg-red-100 text-red-800">Action Needed</Badge>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Overdue Analysis</p>
                <p className="text-xs text-gray-600">
                  {formatCurrency(revenueData.accounts_receivable.overdue_receivable)} of 
                  {formatCurrency(revenueData.accounts_receivable.total_accounts_receivable)} is overdue
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">
                  {formatPercentage(revenueData.accounts_receivable.overdue_percentage)}
                </p>
                <p className="text-xs text-gray-600">Overdue Rate</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Recognition Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {revenueData.monthly_trend.map((month, index) => (
              <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">
                    {new Date(month.month + '-01').toLocaleDateString('en-NG', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Profit Margin: {((month.recognized_profit / month.recognized_revenue) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatCurrency(month.recognized_revenue)}</p>
                  <p className="text-sm text-gray-600">
                    Profit: {formatCurrency(month.recognized_profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueRecognitionDashboard;