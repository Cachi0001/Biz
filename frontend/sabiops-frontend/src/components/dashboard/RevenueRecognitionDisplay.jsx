import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  CreditCard, 
  AlertCircle,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { revenueApi } from '../../services/enhancedApiClient';

const RevenueRecognitionDisplay = ({ className = '' }) => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [monthlyTrend, setMonthlyTrend] = useState(null);

  useEffect(() => {
    fetchRevenueData();
    fetchMonthlyTrend();
  }, [selectedPeriod]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await revenueApi.getRevenueRecognitionSummary(parseInt(selectedPeriod));
      setRevenueData(response);
    } catch (error) {
      console.error('Error fetching revenue recognition data:', error);
      setRevenueData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTrend = async () => {
    try {
      const response = await revenueApi.getMonthlyRevenueTrend(12); // 12 months
      setMonthlyTrend(response);
    } catch (error) {
      console.error('Error fetching monthly trend:', error);
      setMonthlyTrend(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([fetchRevenueData(), fetchMonthlyTrend()]);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(1)}%`;
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4" />;
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading revenue recognition data...</p>
        </div>
      </div>
    );
  }

  if (!revenueData) {
    return (
      <div className={`text-center p-8 ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Failed to load revenue recognition data</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  const {
    current_period = {},
    previous_period = {},
    growth_metrics = {},
    accounts_receivable = {},
    revenue_recognition = {}
  } = revenueData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Recognition</h2>
          <p className="text-gray-600">Proper accounting-based revenue tracking</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 Days</SelectItem>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="60">60 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Revenue Recognition Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recognized Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(current_period.recognized_revenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(growth_metrics.revenue_growth_percentage)}
                  <span className={`text-xs ${getGrowthColor(growth_metrics.revenue_growth_percentage)}`}>
                    {formatPercentage(Math.abs(growth_metrics.revenue_growth_percentage))} vs prev period
                  </span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recognized Profit</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(current_period.recognized_profit)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(growth_metrics.profit_growth_percentage)}
                  <span className={`text-xs ${getGrowthColor(growth_metrics.profit_growth_percentage)}`}>
                    {formatPercentage(Math.abs(growth_metrics.profit_growth_percentage))} vs prev period
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Accounts Receivable</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(accounts_receivable.total_accounts_receivable)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accounts_receivable.outstanding_sales_count || 0} outstanding sales
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recognition Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatPercentage(revenue_recognition.recognition_rate_percentage)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Revenue recognized vs total sales
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Recognition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Revenue Recognition Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Recognized Revenue</p>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(revenue_recognition.recognized_revenue)}
              </p>
              <p className="text-xs text-gray-500">
                From paid sales only
              </p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Unrecognized Revenue</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(revenue_recognition.unrecognized_revenue)}
              </p>
              <p className="text-xs text-gray-500">
                From credit/pending sales
              </p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mb-1">Total Sales Amount</p>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(revenue_recognition.total_sales_amount)}
              </p>
              <p className="text-xs text-gray-500">
                All sales (paid + unpaid)
              </p>
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
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Current (0-30 days)</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(accounts_receivable.aging_buckets?.current || 0)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">31-60 days</p>
              <p className="text-lg font-bold text-yellow-600">
                {formatCurrency(accounts_receivable.aging_buckets?.['30_days'] || 0)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">61-90 days</p>
              <p className="text-lg font-bold text-orange-600">
                {formatCurrency(accounts_receivable.aging_buckets?.['60_days'] || 0)}
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm text-gray-600 mb-1">90+ days</p>
              <p className="text-lg font-bold text-red-600">
                {formatCurrency(accounts_receivable.aging_buckets?.['90_plus_days'] || 0)}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Days Outstanding</p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.round(accounts_receivable.average_days_outstanding || 0)} days
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Collection Efficiency</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatPercentage(accounts_receivable.collection_efficiency)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      {monthlyTrend && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Monthly Revenue Recognition Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyTrend.monthly_data?.slice(0, 6).map((month, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{month.month_year}</p>
                    <p className="text-sm text-gray-600">
                      {month.total_transactions} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(month.recognized_revenue)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatPercentage(month.recognition_rate)}% recognized
                    </p>
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

export default RevenueRecognitionDisplay;