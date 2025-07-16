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
        params = { date: selectedDate };
      } else {
        params = dateRange;
      }
      
      console.log('[SALES_REPORT] Fetching with params:', params);
      const response = await getSalesReport(params);
      console.log('[SALES_REPORT] Response:', response);
      
      // Handle different response formats with defensive programming
      if (response && typeof response === 'object') {
        if (response.data) {
          setSalesData(response.data);
        } else if (response.summary || response.transactions) {
          setSalesData(response);
        } else {
          setSalesData({
            summary: { total_sales: 0, total_transactions: 0, total_quantity: 0, average_sale: 0 },
            transactions: [],
            payment_breakdown: {}
          });
        }
      } else {
        setSalesData(null);
      }
    } catch (error) {
      console.error('Failed to fetch sales report:', error);
      const errorMessage = getErrorMessage(error, 'Failed to load sales report');
      toast.error(errorMessage);
      setSalesData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (format) => {
    setLoading(true);
    try {
      let params = {};
      
      if (reportType === 'daily') {
        params = { date: selectedDate };
      } else {
        params = dateRange;
      }
      
      console.log('[SALES_REPORT] Downloading report with params:', params);
      const blob = await downloadSalesReport(params, format);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales-report-${selectedDate}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Sales report downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to download report:', error);
      toast.error(getErrorMessage(error, 'Failed to download report'));
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
            variant="outline" 
            onClick={() => handleDownloadReport('pdf')}
            disabled={loading || !salesData}
            className="w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download </span>PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleDownloadReport('png')}
            disabled={loading || !salesData}
            className="w-full sm:w-auto"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Download </span>Image
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

