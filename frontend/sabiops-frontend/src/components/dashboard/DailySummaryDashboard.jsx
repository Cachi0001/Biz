import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, CreditCard, Smartphone, Building2, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const DailySummaryDashboard = ({ userId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadingHtml, setDownloadingHtml] = useState(false);

  useEffect(() => {
    fetchDailySummary();
  }, [selectedDate, userId]);

  const fetchDailySummary = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSummary = {
        summary_date: selectedDate,
        generated_at: new Date().toISOString(),
        revenue_metrics: {
          total_revenue: 125000,
          total_transactions: 45,
          average_transaction_value: 2777.78,
          outstanding_credit: 35000,
          gross_profit: 37500,
          profit_margin: 30.0
        },
        cash_flow: {
          cash_at_hand: 45000,
          pos_net_flow: 80000,
          total_cash_flow: 125000,
          cash_transactions: 20,
          pos_transactions: 25
        },
        payment_method_breakdown: {
          payment_methods: [
            {
              payment_method_name: 'Cash',
              total_amount: 45000,
              transaction_count: 20,
              percentage: 36.0
            },
            {
              payment_method_name: 'POS - Card',
              total_amount: 60000,
              transaction_count: 18,
              percentage: 48.0
            },
            {
              payment_method_name: 'Mobile Money',
              total_amount: 20000,
              transaction_count: 7,
              percentage: 16.0
            }
          ]
        },
        product_category_sales: {
          category_breakdown: [
            {
              category_name: 'Beverages',
              total_amount: 50000,
              transaction_count: 20,
              percentage: 40.0
            },
            {
              category_name: 'Snacks',
              total_amount: 35000,
              transaction_count: 15,
              percentage: 28.0
            },
            {
              category_name: 'Household Items',
              total_amount: 25000,
              transaction_count: 8,
              percentage: 20.0
            },
            {
              category_name: 'Personal Care',
              total_amount: 15000,
              transaction_count: 2,
              percentage: 12.0
            }
          ]
        },
        pos_summary: {
          pos_accounts: [
            {
              account_name: 'Opay POS',
              deposits: 35000,
              withdrawals: 2000,
              net_flow: 33000,
              transaction_count: 10
            }
          ]
        },
        performance_indicators: {
          revenue_recognition_rate: 78.1,
          cash_to_revenue_ratio: 100.0,
          credit_sales_ratio: 21.9
        }
      };
      
      setSummaryData(mockSummary);
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      toast.error('Failed to load daily summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHtml = async () => {
    try {
      setDownloadingHtml(true);
      // Simulate HTML download
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In real app, this would trigger actual download
      toast.success('HTML report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading HTML report:', error);
      toast.error('Failed to download HTML report');
    } finally {
      setDownloadingHtml(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentMethodIcon = (methodName) => {
    if (methodName.includes('Cash')) return <DollarSign className="h-4 w-4" />;
    if (methodName.includes('POS')) return <CreditCard className="h-4 w-4" />;
    if (methodName.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  const getTrendIcon = (value, threshold = 0) => {
    if (value > threshold) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (value < threshold) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading daily summary...</p>
        </div>
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="text-center p-8">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No data available for selected date</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Financial Summary</h1>
          <p className="text-gray-600">{formatDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-selector">Date:</Label>
            <Input
              id="date-selector"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-auto"
            />
          </div>
          <Button
            onClick={handleDownloadHtml}
            disabled={downloadingHtml}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {downloadingHtml ? 'Generating...' : 'Download HTML'}
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryData.revenue_metrics.total_revenue)}
                </p>
                <p className="text-xs text-gray-500">
                  {summaryData.revenue_metrics.total_transactions} transactions
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash at Hand</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryData.cash_flow.cash_at_hand)}
                </p>
                <p className="text-xs text-gray-500">
                  {summaryData.cash_flow.cash_transactions} cash transactions
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">POS Net Flow</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryData.cash_flow.pos_net_flow)}
                </p>
                <p className="text-xs text-gray-500">
                  {summaryData.cash_flow.pos_transactions} POS transactions
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding Credit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summaryData.revenue_metrics.outstanding_credit)}
                </p>
                <p className="text-xs text-gray-500">
                  {summaryData.performance_indicators.credit_sales_ratio.toFixed(1)}% of total sales
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Revenue Recognition Rate</p>
                <p className="text-xl font-bold text-blue-900">
                  {summaryData.performance_indicators.revenue_recognition_rate.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(summaryData.performance_indicators.revenue_recognition_rate, 75)}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-xl font-bold text-green-900">
                  {summaryData.revenue_metrics.profit_margin.toFixed(1)}%
                </p>
              </div>
              {getTrendIcon(summaryData.revenue_metrics.profit_margin, 25)}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Avg Transaction Value</p>
                <p className="text-xl font-bold text-purple-900">
                  {formatCurrency(summaryData.revenue_metrics.average_transaction_value)}
                </p>
              </div>
              {getTrendIcon(summaryData.revenue_metrics.average_transaction_value, 2000)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summaryData.payment_method_breakdown.payment_methods.map((method, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getPaymentMethodIcon(method.payment_method_name)}
                  </div>
                  <div>
                    <p className="font-medium">{method.payment_method_name}</p>
                    <p className="text-sm text-gray-600">{method.transaction_count} transactions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(method.total_amount)}</p>
                  <Badge variant="outline">{method.percentage.toFixed(1)}%</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Categories and POS Accounts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Product Category Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryData.product_category_sales.category_breakdown.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{category.category_name}</span>
                      <span className="text-sm text-gray-600">{formatCurrency(category.total_amount)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">{category.transaction_count} transactions</span>
                      <span className="text-xs text-gray-500">{category.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* POS Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>POS Accounts Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {summaryData.pos_summary.pos_accounts.map((account, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{account.account_name}</h4>
                    <Badge variant="outline">{account.transaction_count} transactions</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Deposits</p>
                      <p className="font-semibold text-green-600">{formatCurrency(account.deposits)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Withdrawals</p>
                      <p className="font-semibold text-red-600">{formatCurrency(account.withdrawals)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Net Flow</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(account.net_flow)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailySummaryDashboard;