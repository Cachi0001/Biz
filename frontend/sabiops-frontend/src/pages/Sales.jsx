import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Edit, Trash2, Download, Filter, TrendingUp, DollarSign, ShoppingCart, Users, Package, Calendar, RefreshCw, Calculator, Eye } from 'lucide-react';
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
import MobileDateInput from '@/components/ui/MobileDateInput';
import BackButton from '@/components/ui/BackButton';
import DebugLogger from '../utils/debugLogger';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    customer_id: '',
    customer_name: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    salesperson_id: ''
  });
  const [salesStats, setSalesStats] = useState({
    total_sales: 0,
    total_transactions: 0,
    today_sales: 0,
    average_sale: 0
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
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
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
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
      });

      // Use the original working logic
      if (response?.data) {
        setSalesStats(response.data);
      } else {
        // Fallback calculation if response.data doesn't exist
        let salesData = [];
        if (response?.sales && Array.isArray(response.sales)) {
          salesData = response.sales;
        } else if (Array.isArray(response)) {
          salesData = response;
        }

        const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
        const totalQuantity = salesData.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0);
        const totalTransactions = salesData.length;
        const averageSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        setSalesStats({
          total_sales: totalSales,
          total_transactions: totalTransactions,
          total_quantity: totalQuantity,
          average_sale: averageSale
        });
      }
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      // Set default stats on error
      setSalesStats({
        total_sales: 0,
        total_transactions: 0,
        total_quantity: 0,
        average_sale: 0
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Import the validator dynamically to avoid circular dependencies
      const { validateSaleData } = await import('../utils/salesValidator');
      
      // Validate the sale data
      const validation = validateSaleData(formData);
      
      if (!validation.isValid) {
        // Show the first validation error
        const firstError = Object.values(validation.errors)[0];
        setError(firstError);
        setSubmitting(false);
        return;
      }

      // Quantity validation against available stock
      const selectedProduct = products.find(p => p.id === formData.product_id);
      if (selectedProduct) {
        const availableQuantity = parseInt(selectedProduct.quantity) || 0;
        const requestedQuantity = parseInt(formData.quantity) || 1;
        if (requestedQuantity > availableQuantity) {
          toastService.error(`Cannot sell more than available stock. Only ${availableQuantity} units available for ${selectedProduct.name}.`);
          setSubmitting(false);
          return;
        }
      }

      // Use the formatted data from the validator
      await createSale(validation.formattedData);
      
      toastService.success('Sale recorded successfully!');
      
      setShowAddDialog(false);
      setFormData({
        product_id: '',
        customer_id: '',
        customer_name: '',
        quantity: 1,
        unit_price: 0,
        total_amount: 0,
        payment_method: 'cash',
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
      const headers = [
        'Date',
        'Customer',
        'Product',
        'Quantity',
        'Unit Price',
        'Total Amount',
        'Payment Method'
      ];

      const csvRows = [headers.join(',')];
      
      filteredSales.forEach(sale => {
        const row = [
          formatDate(sale.created_at || sale.date),
          `"${sale.customer_name || 'Walk-in Customer'}"`,
          `"${sale.product_name || 'Unknown Product'}"`,
          sale.quantity || 0,
          sale.unit_price || 0,
          sale.total_amount || 0,
          `"${formatPaymentMethod(sale.payment_method)}"`
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `sales-${selectedDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toastService.success('Sales report downloaded successfully!');
    } catch (error) {
      console.error('Error downloading report:', error);
      toastService.error('Failed to download report');
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
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
                <p className="text-gray-600 mt-1">Record sales and track performance</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
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
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

          {/* Sales Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{salesStats.total_transactions || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">{formatNaira(salesStats.total_sales || 0)}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Items Sold</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{salesStats.total_quantity || 0}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Sale</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{formatNaira(salesStats.average_sale || 0)}</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calculator className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section */}
          <Card className="mb-6 bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Filter & Search</CardTitle>
              <CardDescription>Filter sales by date and search for specific transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Search Sales</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <StableInput
                      id="search"
                      name="search"
                      placeholder="Search by customer name, product, or sale details..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="filter_date" className="text-sm font-medium text-gray-700 mb-2 block">Filter by Date</Label>
                  <MobileDateInput
                    id="filter_date"
                    name="filter_date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={downloadReport}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    fetchSales();
                    fetchSalesStats();
                  }}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
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
                  <div className="grid grid-cols-1 gap-4 lg:hidden">
                    {Array.isArray(filteredSales) && filteredSales.map((sale) => (
                      <Card key={sale.id} className="border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
                        <CardContent className="p-5">
                          <div className="space-y-4">
                            {/* Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate text-base">
                                  {sale.customer_name || 'Walk-in Customer'}
                                </h3>
                                <p className="text-sm text-gray-600 truncate mt-1">
                                  {sale.product_name || 'Unknown Product'}
                                </p>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-50">
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500 font-medium block mb-1">Quantity</span>
                                <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                  {sale.quantity || 0}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium block mb-1">Unit Price</span>
                                <span className="font-semibold text-gray-900">
                                  {formatNaira(sale.unit_price || 0)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 font-medium block mb-1">Payment</span>
                                <Badge variant={getPaymentMethodBadge(sale.payment_method)} className="text-xs">
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
                            <div className="pt-3 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-600">Total Amount</span>
                                <span className="text-xl font-bold text-green-600">
                                  {formatNaira(sale.total_amount || 0)}
                                </span>
                              </div>
                            </div>
                            {/* Profit */}
                            <div className="pt-1 flex justify-between items-center">
                              <span className="text-sm text-blue-700 font-medium">Profit:</span>
                              <span className="text-base font-bold text-blue-700">
                                {sale.gross_profit !== undefined ? formatNaira(sale.gross_profit) : '-'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

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
                                <span className="font-bold text-green-600 text-lg">
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
                                  {sale.gross_profit !== undefined ? formatNaira(sale.gross_profit) : '-'}
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
                      value={formData.customer_id || 'walkin'}
                      onValueChange={(value) => {
                        const customer = customers.find(c => c.id === value);
                        setFormData(prev => ({
                          ...prev,
                          customer_id: value === 'walkin' ? '' : value,
                          customer_name: customer ? customer.name : (value === 'walkin' ? 'Walk-in Customer' : '')
                        }));
                      }}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="walkin">Walk-in Customer</SelectItem>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="product" className="text-base font-medium">Product *</Label>
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
                      value={formData.product_id}
                      onValueChange={(value) => {
                        const product = products.find(p => p.id === value);
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
                              product_id: value,
                              unit_price: parseFloat(product.price || product.unit_price || 0),
                              quantity: productQuantity,
                              total_amount: productQuantity * parseFloat(product.price || product.unit_price || 0)
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              product_id: value,
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
                        <SelectValue placeholder={productsLoading ? 'Loading products...' : (productsError ? productsError : 'Select product')} />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="" disabled>
                            Loading products...
                          </SelectItem>
                        ) : productsError ? (
                          <SelectItem value="" disabled>
                            {productsError}
                          </SelectItem>
                        ) : products.length === 0 ? (
                          <SelectItem value="" disabled>
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
                                value={product.id}
                                disabled={isOutOfStock}
                                className={isOutOfStock ? 'opacity-50' : ''}
                              >
                                <div className="flex justify-between items-center w-full">
                                  <span className={isOutOfStock ? 'line-through' : ''}>
                                    {product.stockLabel || product.name}
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
                                      {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock: ${quantity}` : `Qty: ${quantity}`}
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
                    <Label htmlFor="quantity" className="text-base font-medium">Quantity *</Label>
                    <StableInput
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => {
                        const quantity = parseInt(e.target.value) || 1;
                        const selectedProduct = products.find(p => p.id === formData.product_id);
                        
                        if (selectedProduct) {
                          const availableQuantity = parseInt(selectedProduct.quantity) || 0;
                          const lowStockThreshold = parseInt(selectedProduct.low_stock_threshold) || 5;
                          
                          if (quantity > availableQuantity && availableQuantity > 0) {
                            toastService.warning(
                              `Only ${availableQuantity} units available for ${selectedProduct.name}. Quantity adjusted.`
                            );
                            setFormData(prev => ({
                              ...prev,
                              quantity: availableQuantity,
                              total_amount: prev.unit_price * availableQuantity
                            }));
                            return;
                          }
                          
                          if (availableQuantity === 0) {
                            toastService.error(`${selectedProduct.name} is out of stock!`);
                            return;
                          }
                          
                          // Show low stock warning
                          if (quantity <= lowStockThreshold && availableQuantity > 0) {
                            toastService.info(
                              `${selectedProduct.name} is running low on stock (${availableQuantity} remaining)`
                            );
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
                    <Label htmlFor="unit_price" className="text-base font-medium">Unit Price (₦) *</Label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="text-base font-medium">Payment Method</Label>
                    <Select
                      value={formData.payment_method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="online_payment">Online Payment</SelectItem>
                        <SelectItem value="pending">Pending Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-base font-medium">Sale Date</Label>
                    <MobileDateInput
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="h-12 text-base"
                    />
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
    </DashboardLayout>
  );
};

export default Sales;

