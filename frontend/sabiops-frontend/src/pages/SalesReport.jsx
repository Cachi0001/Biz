import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { getSalesReport, downloadSalesReport, getErrorMessage } from "../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  CreditCard,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const SalesReport = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('daily');

  useEffect(() => {
    fetchSalesReport();
  }, [selectedDate, dateRange, reportType]);

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      let params = {};
      
      if (reportType === 'daily') {
        params = { 
          start_date: selectedDate,
          end_date: selectedDate 
        };
      } else {
        params = {
          start_date: dateRange.start_date,
          end_date: dateRange.end_date
        };
      }
      
      console.log('[SALES_REPORT] Fetching with params:', params);
      
      // Fetch sales data directly from the sales API
      const salesResponse = await getSalesReport(params);
      console.log('[SALES_REPORT] Sales response:', salesResponse);
      
      // Process the response to create comprehensive report data
      let processedData = {
        summary: {
          total_sales: 0,
          total_transactions: 0,
          total_quantity: 0,
          average_sale: 0
        },
        transactions: [],
        payment_breakdown: {}
      };
      
      if (salesResponse && salesResponse.transactions && Array.isArray(salesResponse.transactions)) {
        const transactions = salesResponse.transactions;
        
        // Calculate summary statistics
        const totalSales = transactions.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);
        const totalQuantity = transactions.reduce((sum, t) => sum + (parseInt(t.total_quantity) || 0), 0);
        
        processedData.summary = {
          total_sales: totalSales,
          total_transactions: transactions.length,
          total_quantity: totalQuantity,
          average_sale: transactions.length > 0 ? totalSales / transactions.length : 0
        };
        
        // Process payment method breakdown
        const paymentBreakdown = {};
        transactions.forEach(transaction => {
          const method = transaction.payment_method || 'cash';
          if (!paymentBreakdown[method]) {
            paymentBreakdown[method] = { amount: 0, count: 0 };
          }
          paymentBreakdown[method].amount += parseFloat(transaction.total_amount) || 0;
          paymentBreakdown[method].count += 1;
        });
        
        processedData.transactions = transactions;
        processedData.payment_breakdown = paymentBreakdown;
      } else if (salesResponse && salesResponse.summary) {
        // Use existing summary if available
        processedData = salesResponse;
      }
      
      setSalesData(processedData);
      console.log('[SALES_REPORT] Processed data:', processedData);
      
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      const errorMessage = getErrorMessage(error, 'Failed to load sales report');
      toast.error(errorMessage);
      
      // Set empty data structure instead of null
      setSalesData({
        summary: { total_sales: 0, total_transactions: 0, total_quantity: 0, average_sale: 0 },
        transactions: [],
        payment_breakdown: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format) => {
    if (!salesData || !salesData.transactions || salesData.transactions.length === 0) {
      toast.error('No sales data available to download');
      return;
    }
    
    setLoading(true);
    try {
      let content = '';
      let filename = '';
      let mimeType = '';
      
      const dateStr = reportType === 'daily' ? selectedDate : `${dateRange.start_date}_to_${dateRange.end_date}`;
      
      if (format === 'csv') {
        // Generate comprehensive CSV content
        const headers = [
          'Transaction ID',
          'Date',
          'Time', 
          'Customer Name',
          'Product Name',
          'Quantity',
          'Unit Price (₦)',
          'Total Amount (₦)',
          'Payment Method'
        ];
        const csvRows = [headers.join(',')];
        
        salesData.transactions.forEach(transaction => {
          const dateTime = formatDate(transaction.created_at);
          const unitPrice = transaction.total_amount && transaction.total_quantity ? 
            (transaction.total_amount / transaction.total_quantity).toFixed(2) : '0.00';
          
          const row = [
            `"${transaction.id || 'N/A'}"`,
            `"${dateTime.date}"`,
            `"${dateTime.time}"`,
            `"${transaction.customer_name || 'Walk-in Customer'}"`,
            `"${transaction.product_name || 'Unknown Product'}"`,
            transaction.total_quantity || 0,
            unitPrice,
            (transaction.total_amount || 0).toFixed(2),
            `"${(transaction.payment_method || 'cash').replace('_', ' ').toUpperCase()}"`
          ];
          csvRows.push(row.join(','));
        });
        
        // Add summary section
        csvRows.push('');
        csvRows.push('SALES SUMMARY');
        csvRows.push(`"Total Sales Amount (₦)",,,,,,,${salesData.summary.total_sales.toFixed(2)},`);
        csvRows.push(`"Total Transactions",,,,,,,${salesData.summary.total_transactions},`);
        csvRows.push(`"Total Items Sold",,,,,,,${salesData.summary.total_quantity},`);
        csvRows.push(`"Average Sale Amount (₦)",,,,,,,${salesData.summary.average_sale.toFixed(2)},`);
        
        // Add payment method breakdown
        if (Object.keys(salesData.payment_breakdown).length > 0) {
          csvRows.push('');
          csvRows.push('PAYMENT METHOD BREAKDOWN');
          Object.entries(salesData.payment_breakdown).forEach(([method, data]) => {
            csvRows.push(`"${method.replace('_', ' ').toUpperCase()}",,,,,,,${data.amount.toFixed(2)},"${data.count} transactions"`);
          });
        }
        
        content = csvRows.join('\n');
        filename = `sales-report-${dateStr}.csv`;
        mimeType = 'text/csv;charset=utf-8;';
        
      } else if (format === 'pdf') {
        // Generate text format for PDF (can be enhanced with actual PDF generation)
        const lines = [];
        lines.push('SALES REPORT');
        lines.push('='.repeat(60));
        lines.push(`Report Period: ${reportType === 'daily' ? selectedDate : `${dateRange.start_date} to ${dateRange.end_date}`}`);
        lines.push(`Generated: ${new Date().toLocaleString()}`);
        lines.push(`Business: ${user?.business_name || 'SabiOps Business'}`);
        lines.push('');
        
        // Summary
        lines.push('SALES SUMMARY');
        lines.push('-'.repeat(40));
        lines.push(`Total Sales Amount: ₦${salesData.summary.total_sales.toLocaleString()}`);
        lines.push(`Total Transactions: ${salesData.summary.total_transactions}`);
        lines.push(`Total Items Sold: ${salesData.summary.total_quantity}`);
        lines.push(`Average Sale Amount: ₦${salesData.summary.average_sale.toFixed(2)}`);
        lines.push('');
        
        // Payment Breakdown
        if (Object.keys(salesData.payment_breakdown).length > 0) {
          lines.push('PAYMENT METHOD BREAKDOWN');
          lines.push('-'.repeat(40));
          Object.entries(salesData.payment_breakdown).forEach(([method, data]) => {
            lines.push(`${method.replace('_', ' ').toUpperCase()}: ₦${data.amount.toLocaleString()} (${data.count} transactions)`);
          });
          lines.push('');
        }
        
        // Detailed Transactions
        lines.push('DETAILED TRANSACTIONS');
        lines.push('-'.repeat(40));
        salesData.transactions.forEach((transaction, index) => {
          const dateTime = formatDate(transaction.created_at);
          lines.push(`${index + 1}. Transaction #${transaction.id || 'N/A'}`);
          lines.push(`   Date: ${dateTime.date} ${dateTime.time}`);
          lines.push(`   Customer: ${transaction.customer_name || 'Walk-in Customer'}`);
          lines.push(`   Product: ${transaction.product_name || 'Unknown Product'}`);
          lines.push(`   Quantity: ${transaction.total_quantity || 0}`);
          lines.push(`   Payment Method: ${(transaction.payment_method || 'cash').replace('_', ' ').toUpperCase()}`);
          lines.push(`   Total Amount: ₦${(transaction.total_amount || 0).toLocaleString()}`);
          lines.push('');
        });
        
        content = lines.join('\n');
        filename = `sales-report-${dateStr}.txt`;
        mimeType = 'text/plain;charset=utf-8;';
      }
      
      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Sales report downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }).format(amount || 0);
    } catch (error) {
      return `₦${(amount || 0).toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-NG'),
        time: date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
      };
    } catch (error) {
      return { date: 'Invalid date', time: '' };
    }
  };

  const getPaymentMethodBadge = (method) => {
    const colors = {
      'cash': 'default',
      'bank_transfer': 'secondary',
      'mobile_money': 'outline',
      'card': 'destructive'
    };
    
    return (
      <Badge variant={colors[method] || 'default'}>
        {method?.replace('_', ' ').toUpperCase() || 'N/A'}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Professional sales reporting and analytics for your business
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => window.location.href = '/sales'}
            className="w-full sm:w-auto h-12 text-base touch-manipulation"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Record Sale
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleDownloadReport('csv')}
            disabled={loading || !salesData}
            className="w-full sm:w-auto h-12 text-base touch-manipulation"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download </span>CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleDownloadReport('pdf')}
            disabled={loading || !salesData}
            className="w-full sm:w-auto h-12 text-base touch-manipulation"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download </span>PDF
          </Button>
        </div>
      </div>

      {/* Date Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Configuration
          </CardTitle>
          <CardDescription>
            Select date range and report type for your sales analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="range">Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {reportType === 'daily' ? (
              <div className="space-y-2">
                <Label>Select Date</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={dateRange.start_date}
                    onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={dateRange.end_date}
                    onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </>
            )}
            
            <div className="flex items-end">
              <Button onClick={fetchSalesReport} disabled={loading} className="w-full">
                {loading ? 'Loading...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Summary */}
      {salesData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{formatCurrency(salesData.summary?.total_sales || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{salesData.summary?.total_transactions || 0}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                    <p className="text-2xl font-bold">{salesData.summary?.total_quantity || 0}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Sale</p>
                    <p className="text-2xl font-bold">{formatCurrency(salesData.summary?.average_sale || 0)}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Method Breakdown */}
          {salesData.payment_breakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Breakdown</CardTitle>
                <CardDescription>
                  Sales distribution by payment method
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(salesData.payment_breakdown).map(([method, data]) => (
                    <div key={method} className="text-center p-4 border rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {method.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xl font-bold">{formatCurrency(data.amount || 0)}</p>
                      <p className="text-sm text-muted-foreground">{data.count || 0} transactions</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Sales Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales Transactions</CardTitle>
              <CardDescription>
                Detailed list of all sales transactions for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {salesData.transactions && salesData.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Products</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {formatDate(transaction.created_at).date}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.created_at).time}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{transaction.customer_name || 'Walk-in Customer'}</p>
                              {transaction.customer_email && (
                                <p className="text-sm text-muted-foreground">{transaction.customer_email}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              {transaction.items?.map((item, index) => (
                                <p key={index} className="text-sm">
                                  {item.product_name} (x{item.quantity})
                                </p>
                              )) || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {transaction.total_quantity || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getPaymentMethodBadge(transaction.payment_method)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(transaction.total_amount || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No sales transactions found for the selected period.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!salesData && !loading && (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Select a date and click "Generate Report" to view your sales data.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
};

export default SalesReport;

