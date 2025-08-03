import React, { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Edit, Trash2, Download, Filter, TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar, RefreshCw, Calculator, Eye, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getSales, getProductsWithStock, getCustomers, createSale } from "../services/api";
import { enhancedCreateSale } from "../services/enhancedApi";
import { formatNaira, formatDate, formatDateTime, formatPaymentMethod } from '../utils/formatting';
import { toastService } from '../services/ToastService';
import { handleApiErrorWithToast } from '../utils/errorHandling';
import { validateSaleData } from "../services/enhancedApi";
import { useUsageTracking } from '../hooks/useUsageTracking';
import UsageLimitPrompt from '../components/subscription/UsageLimitPrompt';
import StableInput from '@/components/ui/StableInput';
import SimpleDatePicker from '@/components/ui/SimpleDatePicker';
import BackButton from '@/components/ui/BackButton';
import DebugLogger from '../utils/debugLogger';
import RequiredFieldIndicator from '../components/ui/RequiredFieldIndicator';
import { PAYMENT_METHODS, PAYMENT_METHOD_OPTIONS, DEFAULT_PAYMENT_METHOD, getPaymentMethodLabel } from '@/constants/paymentMethods';
import { downloadSalesHTML, downloadSalesCSV } from '../utils/csvDownload';
import { MobileButtonGroup, MobileCard, MobileGrid, MobileStatsCard, MobileContainer } from '../components/ui/MobileLayoutUtils';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    customer_id: '',
    customer_name: '',
    quantity: '',
    unit_price: 0,
    total_amount: 0,
    payment_method: DEFAULT_PAYMENT_METHOD,
    date: new Date().toLocaleDateString('en-CA'),
    salesperson_id: ''
  });
  const [salesStats, setSalesStats] = useState({
    total_sales: 0,
    total_transactions: 0,
    today_sales: 0,
    average_sale: 0,
    profit_from_sales_monthly: 0
  });
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    fetchSales();
    fetchProductsData();
    fetchCustomersData();
    fetchSalesStats();
  }, [selectedDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getSales({
        start_date: selectedDate,
        end_date: selectedDate
      });

      let salesData = [];
      
      if (response?.data?.sales && Array.isArray(response.data.sales)) {
        salesData = response.data.sales;
      } else if (response?.data && Array.isArray(response.data)) {
        salesData = response.data;
      } else if (Array.isArray(response)) {
        salesData = response;
      } else if (response?.sales && Array.isArray(response.sales)) {
        salesData = response.sales;
      }

      setSales(salesData);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setError('Failed to load sales data. Please try again.');
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      console.log('[SalesPage] Fetching products with stock for dropdown...');
      console.log('[SalesPage] Products API endpoint: /products/with-stock');

      const response = await getProductsWithStock();

      console.log('[SalesPage] Raw products with stock response:', response);
      console.log('[SalesPage] Products response type:', typeof response);
      console.log('[SalesPage] Products response keys:', response ? Object.keys(response) : 'null/undefined');

      // Handle the new API response structure
      let productsArray = [];
      if (response && response.success && response.data) {
        console.log('[SalesPage] Using response.success && response.data format');
        productsArray = response.data.products || [];
      } else if (response && response.products && Array.isArray(response.products)) {
        console.log('[SalesPage] Using response.products format');
        productsArray = response.products;
      } else if (response && Array.isArray(response)) {
        console.log('[SalesPage] Using direct response array format');
        productsArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        console.log('[SalesPage] Using response.data array format');
        productsArray = response.data;
      } else {
        console.warn('[SalesPage] Unexpected products response structure:', response);
        console.warn('[SalesPage] Products response structure:', JSON.stringify(response, null, 2));
        productsArray = [];
      }

      // Enhance products with stock labeling for better UX
      const productsWithLabels = productsArray.map(product => {
        const quantity = parseInt(product.quantity) || 0;
        const lowStockThreshold = parseInt(product.low_stock_threshold) || 5;
        
        let stockLabel = '';
        if (quantity > lowStockThreshold) {
          stockLabel = `${product.name} (Qty: ${quantity})`;
        } else if (quantity <= lowStockThreshold && quantity > 0) {
          stockLabel = `${product.name} (Low Stock: ${quantity})`;
        } else {
          stockLabel = `${product.name} (Out of Stock)`;
        }

        return {
          ...product,
          stockLabel,
          isLowStock: quantity <= lowStockThreshold && quantity > 0,
          isOutOfStock: quantity === 0
        };
      });

      setProducts(productsWithLabels);

      console.log('[SalesPage] Products with stock labels set in state:', productsWithLabels.length, 'products');

      // Log if no products found for dropdown
      if (productsWithLabels.length === 0) {
        console.warn('[SalesPage] No products available for sales dropdown');
      } else {
        console.log('[SalesPage] Products available with stock info:', productsWithLabels.map(p => ({ 
          id: p.id, 
          name: p.name, 
          stockLabel: p.stockLabel,
          quantity: p.quantity,
          lowStockThreshold: p.low_stock_threshold,
          price: p.price || p.unit_price 
        })));
        console.log('[SalesPage] First product example with stock info:', productsWithLabels[0]);
      }

    } catch (error) {
      setProductsError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchCustomersData = async () => {
    try {
      console.log('[SalesPage] Fetching customers for dropdown...');
      console.log('[SalesPage] Customers API endpoint: /customers');

      const response = await getCustomers();

      console.log('[SalesPage] Raw customers response:', response);
      console.log('[SalesPage] Customers response type:', typeof response);
      console.log('[SalesPage] Customers response keys:', response ? Object.keys(response) : 'null/undefined');

      // Handle the new API response structure
      let customersArray = [];
      if (response && response.success && response.data) {
        console.log('[SalesPage] Using response.success && response.data format');
        customersArray = response.data.customers || [];
      } else if (response && response.customers && Array.isArray(response.customers)) {
        console.log('[SalesPage] Using response.customers format');
        customersArray = response.customers;
      } else if (response && Array.isArray(response)) {
        console.log('[SalesPage] Using direct response array format');
        customersArray = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        console.log('[SalesPage] Using response.data array format');
        customersArray = response.data;
      } else {
        console.warn('[SalesPage] Unexpected customers response structure:', response);
        console.warn('[SalesPage] Customers response structure:', JSON.stringify(response, null, 2));
        customersArray = [];
      }

      setCustomers(customersArray);
      console.log('[SalesPage] Customers set in state:', customersArray.length, 'customers');

      // Log if no customers found for dropdown
      if (customersArray.length === 0) {
        console.warn('[SalesPage] No customers available for sales dropdown');
      } else {
        console.log('[SalesPage] Customers available:', customersArray.map(c => ({ id: c.id, name: c.name, email: c.email })));
        console.log('[SalesPage] First customer example:', customersArray[0]);
      }

    } catch (error) {
      console.error('[SalesPage] Error fetching customers:', error);
      console.error('[SalesPage] Customers error message:', error.message);
      setCustomers([]);
    }
  };

  const fetchSalesStats = async () => {
    try {
      const response = await getSales({
        start_date: selectedDate,
        end_date: selectedDate
      });

      console.log('[DEBUG] fetchSalesStats - Full API response:', response);
      console.log('[DEBUG] fetchSalesStats - Response type:', typeof response);
      console.log('[DEBUG] fetchSalesStats - Response has data?', !!response?.data);
      console.log('[DEBUG] fetchSalesStats - Response.data:', response?.data);

      // Use the original working logic
      if (response?.data) {
        console.log('[DEBUG] fetchSalesStats - Using response.data directly');
        console.log('[DEBUG] fetchSalesStats - response.data.profit_from_sales_monthly:', response.data.profit_from_sales_monthly);
        setSalesStats(response.data);
      } else {
        console.log('[DEBUG] fetchSalesStats - Using fallback calculation');
        // Fallback calculation if response.data doesn't exist
        let salesData = [];
        if (response?.sales && Array.isArray(response.sales)) {
          salesData = response.sales;
          console.log('[DEBUG] fetchSalesStats - Using response.sales');
        } else if (Array.isArray(response)) {
          salesData = response;
          console.log('[DEBUG] fetchSalesStats - Using response as array');
        }

        console.log('[DEBUG] fetchSalesStats - salesData length:', salesData.length);
        console.log('[DEBUG] fetchSalesStats - First sale item:', salesData[0]);
        
        // Log individual profit values
        salesData.forEach((sale, index) => {
          console.log(`[DEBUG] fetchSalesStats - Sale ${index + 1}:`, {
            id: sale.id,
            total_amount: sale.total_amount,
            profit_from_sales: sale.profit_from_sales,
            profit_from_sales_type: typeof sale.profit_from_sales
          });
        });

        const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        const totalQuantity = salesData.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0);
        const totalTransactions = salesData.length;
        const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        const profitFromSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.profit_from_sales) || 0), 0);

        console.log('[DEBUG] fetchSalesStats - Calculated stats:', {
          totalSales,
          totalQuantity,
          totalTransactions,
          averageSale,
          profitFromSales
        });

        setSalesStats({
          total_sales: totalSales,
          total_transactions: totalTransactions,
          total_quantity: totalQuantity,
          average_sale: averageSale,
          profit_from_sales_monthly: profitFromSales
        });
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      // Set default stats on error
      setSalesStats({
        total_sales: 0,
        total_transactions: 0,
        total_quantity: 0,
        average_sale: 0,
        profit_from_sales_monthly: 0
      });
    }
  };

  const handleDateChange = (dateValue) => {
    console.log('[Sales] Date change requested:', {
      inputValue: dateValue,
      currentSelectedDate: selectedDate
    });
    
    if (dateValue) {
      // Simply use the date value as-is without timezone adjustments
      // The date picker already provides the correct YYYY-MM-DD format
      setSelectedDate(dateValue);
      console.log('[Sales] Date updated to:', dateValue);
    } else {
      setSelectedDate(dateValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      console.log('[DEBUG] Form data before validation:', formData);
      
      // Import the validator dynamically to avoid circular dependencies
      const { validateSaleData } = await import('../utils/salesValidator');
      
      // Validate the sale data
      const validation = validateSaleData(formData);
      console.log('[DEBUG] Validation result:', validation);
      
      if (!validation.isValid) {
        // Show the first validation error
        const firstError = Object.values(validation.errors)[0];
        console.error('[ERROR] Validation failed:', validation.errors);
        setError(firstError);
        setSubmitting(false);
        return;
      }

      // Quantity validation against available stock
      const selectedProduct = products.find(p => p.name === formData.product_name);
      if (selectedProduct) {
        const availableQuantity = parseInt(selectedProduct.quantity) || 0;
        const requestedQuantity = parseInt(formData.quantity) || 1; // Default to 1 if empty
        if (requestedQuantity > availableQuantity) {
          toastService.error(`Cannot sell more than available stock. Only ${availableQuantity} units available for ${selectedProduct.name}.`);
          setSubmitting(false);
          return;
        }
      }

      // Log the data before sending to API
      console.log('[DEBUG] Data being sent to API:', JSON.stringify(validation.formattedData, null, 2));
      
      // Use the formatted data from the validator
      await createSale(validation.formattedData);
      
      toastService.success('Sale recorded successfully!');
      
      setShowAddDialog(false);
      setFormData({
        product_name: '',
        customer_id: '',
        customer_name: '',
        quantity: '',
        unit_price: 0,
        total_amount: 0,
        payment_method: DEFAULT_PAYMENT_METHOD,
        date: new Date().toISOString().split('T')[0],
        salesperson_id: ''
      });
      fetchSales();
      fetchSalesStats();
    } catch (error) {
      console.error('Error creating sale:', error);
      setError(error.message || 'Failed to record sale. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadReport = async () => {
    try {
      if (filteredSales.length === 0) {
        toastService.error('No sales data to download');
        return;
      }

      await downloadSalesHTML(filteredSales, `sales-report-${selectedDate}`);
      toastService.success('Sales report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toastService.error('Failed to download report');
    }
  };

  const downloadCSVReport = async () => {
    try {
      if (filteredSales.length === 0) {
        toastService.error('No sales data to download');
        return;
      }

      await downloadSalesCSV(filteredSales, `sales-${selectedDate}`);
      toastService.success('Sales CSV downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CSV:', error);
      toastService.error('Failed to download CSV');
    }
  };

  const getPaymentMethodBadge = (method) => {
    switch (method) {
      case 'cash': return 'default';
      case 'card': return 'secondary';
      case 'transfer': return 'outline';
      case 'pending': return 'destructive';
      default: return 'default';
    }
  };

  const filteredSales = sales.filter(sale => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (sale.customer_name || '').toLowerCase().includes(searchLower) ||
      (sale.product_name || '').toLowerCase().includes(searchLower) ||
      (sale.payment_method || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
                <p className="text-gray-600 mt-1">Record sales and track performance</p>
              </div>
              <div className="hidden sm:flex sm:flex-row gap-3">
                <Button
                  onClick={() => window.location.href = '/sales/report'}
                  variant="outline"
                  className="h-11 px-6 text-sm font-medium"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Sales Report
                </Button>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="h-11 px-6 text-sm font-medium bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record Sale
                </Button>
              </div>
              
              {/* Mobile button layout */}
              <div className="sm:hidden">
                <MobileButtonGroup>
                  <Button
                    onClick={() => window.location.href = '/sales/report'}
                    variant="outline"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Report
                  </Button>
                  <Button
                    onClick={() => setShowAddDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Sale
                  </Button>
                </MobileButtonGroup>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Usage Limit Prompt */}
          <UsageLimitPrompt />

          {/* Error Display */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription className="flex items-center justify-between">
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError('');
                    fetchSales();
                    fetchSalesStats();
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Sales Statistics Cards - 2x2 mobile layout */}
          <MobileGrid className="md:grid-cols-4 gap-3 sm:gap-4">
            <MobileStatsCard
              title="Total Sales"
              value={salesStats.total_transactions || 0}
              icon={ShoppingCart}
              color="blue"
            />
            
            <MobileStatsCard
              title="Total Revenue"
              value={formatNaira(salesStats.total_sales || 0)}
              icon={DollarSign}
              color="green"
            />
            
            <MobileStatsCard
              title="Items Sold"
              value={salesStats.total_quantity || 0}
              icon={Package}
              color="purple"
            />
            
            <MobileStatsCard
              title="Profit"
              value={formatNaira(salesStats.profit_from_sales_monthly || 0)}
              icon={DollarSign}
              color="green"
            />
          </MobileGrid>

          {/* Filters Section - 2x2 mobile layout like transaction history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Filter sales by date and search for specific transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile Layout - Stack vertically */}
              <div className="sm:hidden space-y-4">
                <div className="space-y-2">
                  <Label>Search Sales</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <StableInput
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-center">Date</Label>
                  <div className="flex justify-center">
                    <SimpleDatePicker
                      value={selectedDate}
                      onChange={(e) => {
                        console.log('[Sales] Mobile date picker changed:', {
                          oldValue: selectedDate,
                          newValue: e.target.value,
                          eventType: e.type
                        });
                        handleDateChange(e.target.value);
                      }}
                      className="w-full max-w-[280px] mx-auto"
                      max={new Date().toLocaleDateString('en-CA')} // Don't allow future dates
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <MobileButtonGroup>
                    <Button
                      variant="outline"
                      onClick={downloadReport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download HTML
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        fetchSales();
                        fetchSalesStats();
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </MobileButtonGroup>
                  <Button
                    variant="outline"
                    onClick={downloadCSVReport}
                    className="w-full mt-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download as CSV
                  </Button>
                </div>
              </div>
              
              {/* Desktop Layout - 3 columns */}
              <div className="hidden sm:grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search Sales</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <StableInput
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-center sm:text-left">Date</Label>
                  <div className="flex justify-center sm:block">
                    <SimpleDatePicker
                      value={selectedDate}
                      onChange={(e) => {
                        console.log('[Sales] Desktop date picker changed:', {
                          oldValue: selectedDate,
                          newValue: e.target.value,
                          eventType: e.type
                        });
                        handleDateChange(e.target.value);
                      }}
                      className="w-full"
                      max={new Date().toISOString().split('T')[0]} // Don't allow future dates
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Actions</Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={downloadReport}
                      className="h-10 px-3 text-sm"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={downloadCSVReport}
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-10"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download as CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Data Section */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Sales for {formatDate(selectedDate)}
                  </CardTitle>
                  <CardDescription>
                    {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''} found
                    {sales.length > 0 && filteredSales.length !== sales.length && 
                      ` (${sales.length} total)`
                    }
                  </CardDescription>
                </div>
                {filteredSales.length > 0 && (
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold text-green-600">
                      {formatNaira(filteredSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0))}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Loading sales data...</span>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingCart className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchTerm
                      ? 'Try adjusting your search criteria or selecting a different date'
                      : 'No sales recorded for this date. Start by recording your first sale.'}
                  </p>
                  <Button 
                    onClick={() => setShowAddDialog(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Your First Sale
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <MobileGrid className="lg:hidden gap-3">
                    {Array.isArray(filteredSales) && filteredSales.map((sale, idx) => {
                      const isLastOdd = filteredSales.length % 2 === 1 && idx === filteredSales.length - 1;
                      return (
                        <div key={sale.id} className={isLastOdd ? 'col-span-2 flex justify-center' : ''}>
                          <MobileCard className={`w-full ${isLastOdd ? 'max-w-xs' : ''} hover:border-green-300`}>
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate text-sm">
                                    {sale.customer_name || 'Walk-in Customer'}
                                  </h3>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {sale.product_name || 'Unknown Product'}
                                  </p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-blue-50 flex-shrink-0">
                                  <Eye className="h-3 w-3 text-blue-600" />
                                </Button>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Quantity</span>
                                  <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                    {sale.quantity || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Unit Price</span>
                                  <span className="font-medium text-gray-900 text-xs">
                                    {formatNaira(sale.unit_price || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Payment</span>
                                  <Badge variant={getPaymentMethodBadge(sale.payment_method)} className="text-xs px-1 py-0">
                                    {formatPaymentMethod(sale.payment_method)}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Date</span>
                                  <span className="text-xs text-gray-600">
                                    {formatDateTime(sale.created_at || sale.date)}
                                  </span>
                                </div>
                              </div>

                              {/* Total */}
                              <div className="pt-2 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-gray-600">Total Amount</span>
                                  <span className="text-sm font-bold text-green-600">
                                    {formatNaira(sale.total_amount || 0)}
                                  </span>
                                </div>
                              </div>
                              {/* Profit */}
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-blue-700 font-medium">Profit:</span>
                                <span className="text-xs font-bold text-blue-700">
                                  {sale.profit_from_sales !== undefined ? formatNaira(sale.profit_from_sales) : '-'}
                                </span>
                              </div>
                            </div>
                          </MobileCard>
                        </div>
                      );
                    })}
                  </MobileGrid>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="px-6 py-4 text-left font-semibold text-gray-900">Customer</TableHead>
                            <TableHead className="px-6 py-4 text-left font-semibold text-gray-900">Product</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Quantity</TableHead>
                            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Unit Price</TableHead>
                            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Total Amount</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Payment Method</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Date</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Actions</TableHead>
                            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Profit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.isArray(filteredSales) && filteredSales.map((sale, index) => (
                            <TableRow key={sale.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              <TableCell className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {sale.customer_name || 'Walk-in Customer'}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {sale.product_name || 'Unknown Product'}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                  {sale.quantity || 0}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <span className="font-medium text-gray-700">
                                  {formatNaira(sale.unit_price || 0)}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <span className="text-sm font-bold text-green-600">
                                  {formatNaira(sale.total_amount || 0)}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <Badge variant={getPaymentMethodBadge(sale.payment_method)} className="font-medium">
                                  {formatPaymentMethod(sale.payment_method)}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <div className="text-sm text-gray-600">
                                  {formatDateTime(sale.created_at || sale.date)}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50">
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <span className="font-medium text-blue-700">
                                  {sale.profit_from_sales !== undefined ? formatNaira(sale.profit_from_sales) : '-'}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Sale Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Record New Sale</DialogTitle>
              <DialogDescription>
                Add a new sale transaction to your records
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer" className="text-base font-medium">Customer</Label>
                    <Select
                      value={String(formData.customer_id || 'walkin')}
                      onValueChange={(value) => {
                        console.log('[DEBUG] Customer selection changed:', { value, customers: customers.length });
                        const customer = customers.find(c => String(c.id) === String(value));
                        console.log('[DEBUG] Found customer:', customer);
                        setFormData(prev => ({
                          ...prev,
                          customer_id: value === 'walkin' ? '' : value,
                          customer_name: customer ? customer.name : (value === 'walkin' ? 'Walk-in Customer' : '')
                        }));
                      }}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select customer">
                          {formData.customer_id && formData.customer_id !== 'walkin' 
                            ? customers.find(c => String(c.id) === String(formData.customer_id))?.name || `Unknown Customer (${formData.customer_id})`
                            : formData.customer_id === 'walkin' || (!formData.customer_id && formData.customer_name === 'Walk-in Customer')
                            ? 'Walk-in Customer'
                            : 'Select customer'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walkin">Walk-in Customer</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                    <Label htmlFor="product" className="text-base font-medium flex items-center gap-1">
                      Product
                      <RequiredFieldIndicator />
                    </Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={fetchProductsData}
                        disabled={productsLoading}
                        className="ml-2 px-2 py-1 text-xs h-8"
                        aria-label="Refresh products"
                      >
                        {productsLoading ? 'Refreshing...' : 'Refresh'}
                      </Button>
                    </div>
                    <Select
                      value={formData.product_name || ''}
                      onValueChange={(selectedName) => {
                        console.log('[DEBUG] Product selection changed:', { selectedName, products: products.length });
                        const product = products.find(p => p.name === selectedName);
                        if (product) {
                          const productQuantity = parseInt(product.quantity) || 0;
                          const requestedQuantity = parseInt(formData.quantity) || 1;
                          
                          // Check if requested quantity exceeds available stock
                          if (requestedQuantity > productQuantity && productQuantity > 0) {
                            toastService.warning(
                              `Only ${productQuantity} units available for ${product.name}. Quantity adjusted.`
                            );
                            // Adjust quantity to available stock
                            setFormData(prev => ({
                              ...prev,
                              product_name: product.name,
                              unit_price: parseFloat(product.price || product.unit_price || 0),
                              quantity: productQuantity,
                              total_amount: productQuantity * parseFloat(product.price || product.unit_price || 0)
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              product_name: product.name,
                              unit_price: parseFloat(product.price || product.unit_price || 0),
                              total_amount: parseFloat(product.price || product.unit_price || 0) * prev.quantity
                            }));
                          }
                          
                          // Show out of stock warning
                          if (productQuantity === 0) {
                            toastService.error(`${product.name} is out of stock!`);
                          }
                        }
                      }}
                      disabled={productsLoading || !!productsError || products.length === 0}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue 
                          placeholder={productsLoading ? 'Loading products...' : (productsError ? productsError : 'Select product')}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="all" disabled>
                            Loading products...
                          </SelectItem>
                        ) : productsError ? (
                          <SelectItem value="all" disabled>
                            {productsError}
                          </SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="all" disabled>
                            No products available
                          </SelectItem>
                        ) : (
                          products.map((product) => {
                          const quantity = parseInt(product.quantity) || 0;
                          const lowStockThreshold = parseInt(product.low_stock_threshold) || 5;
                          const isOutOfStock = quantity === 0;
                          const isLowStock = quantity <= lowStockThreshold && quantity > 0;
                          
                          return (
                            <SelectItem 
                              key={product.id} 
                              value={product.name}
                              disabled={isOutOfStock}
                              className={isOutOfStock ? 'opacity-50' : ''}
                            >
                              <div className="flex justify-between items-center w-full">
                                <span className={isOutOfStock ? 'line-through' : ''}>
                                  {product.name} (Qty: {product.quantity})
                                </span>
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="text-sm text-green-600 font-medium">
                                    {formatNaira(product.price || product.unit_price || 0)}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    isOutOfStock 
                                      ? 'bg-red-100 text-red-700' 
                                      : isLowStock 
                                      ? 'bg-yellow-100 text-yellow-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low: ${quantity}` : `Qty: ${quantity}`}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-base font-medium flex items-center gap-1">
                      Quantity
                      <RequiredFieldIndicator />
                    </Label>
                    <StableInput
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        const selectedProduct = products.find(p => p.name === formData.product_name);
                        
                        // Only perform basic validation without showing toasts
                        if (selectedProduct) {
                          const availableQuantity = parseInt(selectedProduct.quantity) || 0;
                          
                          // Silently adjust quantity if it exceeds available stock
                          if (quantity > availableQuantity && availableQuantity > 0) {
                            setFormData(prev => ({
                              ...prev,
                              quantity: availableQuantity,
                              total_amount: prev.unit_price * availableQuantity
                            }));
                            return;
                          }
                          
                          // Prevent setting quantity if out of stock
                          if (availableQuantity === 0) {
                            return;
                          }
                        }
                        
                        setFormData(prev => ({
                          ...prev,
                          quantity,
                          total_amount: prev.unit_price * quantity
                        }));
                      }}
                      className="h-12 text-base"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_price" className="text-base font-medium flex items-center gap-1">
                      Unit Price (₦)
                      <RequiredFieldIndicator />
                    </Label>
                    <StableInput
                      id="unit_price"
                      name="unit_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_price}
                      onChange={(e) => {
                        const unitPrice = parseFloat(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          unit_price: unitPrice,
                          total_amount: unitPrice * prev.quantity
                        }));
                      }}
                      className="h-12 text-base"
                      required
                      disabled={!!formData.product_name}
                    />
                    {formData.product_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        Price from selected product. Edit product to change price.
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="text-base font-medium">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select payment method">
                          {formData.payment_method 
                            ? (() => {
                                const paymentOption = PAYMENT_METHOD_OPTIONS.find(opt => opt.value === formData.payment_method);
                                console.log('[DEBUG] Payment method display value:', { 
                                  paymentMethod: formData.payment_method, 
                                  paymentLabel: paymentOption?.label,
                                  paymentOption 
                                });
                                return paymentOption?.label || `Unknown Payment Method (${formData.payment_method})`;
                              })()
                            : 'Select payment method'
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>


                </div>

                {/* Total Amount Display */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-green-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatNaira(formData.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="h-12 px-6 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 px-6 text-base bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? 'Recording...' : 'Record Sale'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <style>{`
  @media (max-width: 639px) {
    .mobile-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .mobile-grid-2 > .col-span-2 {
      grid-column: span 2 / span 2;
      justify-content: center;
    }
    .mobile-card-content {
      padding: 1rem !important;
    }
    .mobile-btn,
    .mobile-input {
      width: 100% !important;
      min-width: 0;
      font-size: 16px;
      padding: 0.75rem;
      height: auto;
      min-height: 2.5rem;
    }
  }
`}</style>
    </DashboardLayout>
  );
};

export default Sales;
