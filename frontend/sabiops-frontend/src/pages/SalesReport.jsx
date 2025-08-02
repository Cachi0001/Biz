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
import { downloadSalesCSV } from '../utils/csvDownload';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
        try {
          // Prepare sales data for the CSV utility
          const salesForCSV = salesData.transactions.map(transaction => {
            const dateTime = formatDate(transaction.created_at);
            return {
              id: transaction.id || 'N/A',
              date: dateTime.date,
              time: dateTime.time,
              customer_name: transaction.customer_name || 'Walk-in Customer',
              product_name: transaction.product_name || 'Unknown Product',
              quantity: transaction.total_quantity || 0,
              unit_price: transaction.total_amount && transaction.total_quantity ? 
                (transaction.total_amount / transaction.total_quantity) : 0,
              total_amount: transaction.total_amount || 0,
              payment_method: (transaction.payment_method || 'cash').replace('_', ' ').toUpperCase()
            };
          });

          // Use the proper CSV utility with report-specific filename
          await downloadSalesCSV(salesForCSV, `sales-report-${dateStr}`);
          return; // Exit early since CSV utility handles the download
        } catch (error) {
          console.error('Error generating CSV report:', error);
          toast.error('Failed to generate CSV report');
          return;
        }
        
      } else if (format === 'pdf') {
        try {
          // Generate proper PDF using jsPDF
          const doc = new jsPDF();
          
          // Set up the document
          const pageWidth = doc.internal.pageSize.width;
          const margin = 20;
          let yPosition = margin;
          
          // Title
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text('SALES REPORT', pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 15;
          
          // Report details
          doc.setFontSize(12);
          doc.setFont('helvetica', 'normal');
          doc.text(`Report Period: ${reportType === 'daily' ? selectedDate : `${dateRange.start_date} to ${dateRange.end_date}`}`, margin, yPosition);
          yPosition += 8;
          doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
          yPosition += 8;
          doc.text(`Business: ${user?.business_name || 'SabiOps Business'}`, margin, yPosition);
          yPosition += 15;
          
          // Summary section
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('SALES SUMMARY', margin, yPosition);
          yPosition += 10;
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const summaryData = [
            ['Total Sales Amount', `₦${salesData.summary.total_sales.toLocaleString()}`],
            ['Total Transactions', salesData.summary.total_transactions.toString()],
            ['Total Items Sold', salesData.summary.total_quantity.toString()],
            ['Average Sale Amount', `₦${salesData.summary.average_sale.toFixed(2)}`]
          ];
          
          doc.autoTable({
            startY: yPosition,
            head: [['Metric', 'Value']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            styles: { fontSize: 10 },
            margin: { left: margin, right: margin }
          });
          
          yPosition = doc.lastAutoTable.finalY + 15;
          
          // Payment method breakdown
          if (Object.keys(salesData.payment_breakdown).length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('PAYMENT METHOD BREAKDOWN', margin, yPosition);
            yPosition += 10;
            
            const paymentData = Object.entries(salesData.payment_breakdown).map(([method, data]) => [
              method.replace('_', ' ').toUpperCase(),
              `₦${data.amount.toLocaleString()}`,
              `${data.count} transactions`
            ]);
            
            doc.autoTable({
              startY: yPosition,
              head: [['Payment Method', 'Amount', 'Count']],
              body: paymentData,
              theme: 'grid',
              headStyles: { fillColor: [52, 152, 219] },
              styles: { fontSize: 10 },
              margin: { left: margin, right: margin }
            });
            
            yPosition = doc.lastAutoTable.finalY + 15;
          }
          
          // Detailed transactions
          if (salesData.transactions.length > 0) {
            // Check if we need a new page
            if (yPosition > 200) {
              doc.addPage();
              yPosition = margin;
            }
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('DETAILED TRANSACTIONS', margin, yPosition);
            yPosition += 10;
            
            const transactionData = salesData.transactions.map((transaction) => {
              const dateTime = formatDate(transaction.created_at);
              return [
                transaction.id || 'N/A',
                `${dateTime.date} ${dateTime.time}`,
                transaction.customer_name || 'Walk-in Customer',
                transaction.product_name || 'Unknown Product',
                (transaction.total_quantity || 0).toString(),
                (transaction.payment_method || 'cash').replace('_', ' ').toUpperCase(),
                `₦${(transaction.total_amount || 0).toLocaleString()}`
              ];
            });
            
            doc.autoTable({
              startY: yPosition,
              head: [['ID', 'Date & Time', 'Customer', 'Product', 'Qty', 'Payment', 'Amount']],
              body: transactionData,
              theme: 'grid',
              headStyles: { fillColor: [46, 204, 113] },
              styles: { fontSize: 9 },
              columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 35 },
                2: { cellWidth: 30 },
                3: { cellWidth: 35 },
                4: { cellWidth: 15 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 }
              },
              margin: { left: margin, right: margin }
            });
          }
          
          // Save the PDF
          doc.save(`sales-report-${dateStr}.pdf`);
          return; // Exit early since PDF is handled differently
        } catch (error) {
          console.error('Error generating PDF:', error);
          toast.error('Failed to generate PDF report');
          return;
        }
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

