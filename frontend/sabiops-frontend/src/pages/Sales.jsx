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
import { getSales, getProducts, getCustomers, createSale } from "../services/api";
import { enhancedCreateSale } from "../services/enhancedApi";
import { formatNaira, formatDate, formatDateTime, formatPaymentMethod } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast, showErrorToast } from '../utils/errorHandling';
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
      
      DebugLogger.logApiCall('/sales', 'Starting fetch for sales list', 'SalesPage', 'GET');
      console.log('[SalesPage] Fetching sales for date:', selectedDate);
      console.log('[SalesPage] API endpoint being called: /sales with params:', {
        start_date: selectedDate,
        end_date: selectedDate
      });
      
      const response = await getSales({
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
      });

      console.log('[SalesPage] Raw sales response:', response);
      console.log('[SalesPage] Response type:', typeof response);
      console.log('[SalesPage] Response keys:', response ? Object.keys(response) : 'null/undefined');
      DebugLogger.logApiCall('/sales', response, 'SalesPage', 'GET');

      // Handle multiple API response formats
      let salesData = [];
      
      if (response?.data?.sales && Array.isArray(response.data.sales)) {
        console.log('[SalesPage] Using response.data.sales format');
        salesData = response.data.sales;
      } else if (response?.data && Array.isArray(response.data)) {
        console.log('[SalesPage] Using response.data format');
        salesData = response.data;
      } else if (Array.isArray(response)) {
        console.log('[SalesPage] Using direct response array format');
        salesData = response;
      } else if (response?.sales && Array.isArray(response.sales)) {
        console.log('[SalesPage] Using response.sales format');
        salesData = response.sales;
      } else {
        console.warn('[SalesPage] Unexpected sales response format:', response);
        console.warn('[SalesPage] Response structure:', JSON.stringify(response, null, 2));
        salesData = [];
      }

      console.log('[SalesPage] Processed sales data:', salesData);
      console.log('[SalesPage] Sales data length:', salesData.length);
      setSales(salesData);

      // Update stats from response
      if (response?.data?.summary) {
        console.log('[SalesPage] Using response.data.summary for stats');
        setSalesStats(response.data.summary);
      } else if (response?.summary) {
        console.log('[SalesPage] Using response.summary for stats');
        setSalesStats(response.summary);
      }

      // Always calculate stats from sales data
      const totalSales = salesData.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
      const totalQuantity = salesData.reduce((sum, sale) => sum + (parseInt(sale.quantity) || 0), 0);
      const calculatedStats = {
        total_sales: totalSales,
        total_transactions: salesData.length,
        today_sales: totalSales,
        average_sale: salesData.length > 0 ? totalSales / salesData.length : 0,
        total_quantity: totalQuantity
      };
      
      // Use API stats if available, otherwise use calculated stats
      if (response?.data?.summary) {
        setSalesStats({...response.data.summary, total_quantity: totalQuantity});
      } else if (response?.summary) {
        setSalesStats({...response.summary, total_quantity: totalQuantity});
      } else {
        setSalesStats(calculatedStats);
      }
      
      console.log('[SalesPage] Final stats:', calculatedStats);

    } catch (error) {
      console.error('[SalesPage] Error fetching sales:', error);
      console.error('[SalesPage] Error message:', error.message);
      console.error('[SalesPage] Error stack:', error.stack);
      console.error('[SalesPage] Error response:', error.response);
      console.error('[SalesPage] Error status:', error.status);
      DebugLogger.logApiError('/sales', error, 'SalesPage');
      const errorMessage = handleApiErrorWithToast(error, 'Failed to fetch sales');
      setError(errorMessage);
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      DebugLogger.logApiCall('/products', 'Starting fetch for sales dropdown', 'SalesPage', 'GET');
      console.log('[SalesPage] Fetching products for dropdown...');
      console.log('[SalesPage] Products API endpoint: /products');

      const response = await getProducts();

      console.log('[SalesPage] Raw products response:', response);
      console.log('[SalesPage] Products response type:', typeof response);
      console.log('[SalesPage] Products response keys:', response ? Object.keys(response) : 'null/undefined');
      DebugLogger.logDropdownEvent('SalesPage', 'products-loaded', response, null);

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
      } else {
        console.warn('[SalesPage] Unexpected products response structure:', response);
        console.warn('[SalesPage] Products response structure:', JSON.stringify(response, null, 2));
        productsArray = [];
      }

      setProducts(productsArray);

      console.log('[SalesPage] Products set in state:', productsArray.length, 'products');

      // Force a re-render by updating a dummy state
      setError(''); // Clear any previous errors

      // Log if no products found for dropdown
      if (productsArray.length === 0) {
        console.warn('[SalesPage] No products available for sales dropdown');
        DebugLogger.logDropdownIssue('SalesPage', [], null, 'No products available for sales dropdown');
      } else {
        console.log('[SalesPage] Products available:', productsArray.map(p => ({ id: p.id, name: p.name, price: p.price || p.unit_price })));
        console.log('[SalesPage] First product example:', productsArray[0]);
      }

    } catch (error) {
      console.error('[SalesPage] Error fetching products:', error);
      console.error('[SalesPage] Products error message:', error.message);
      console.error('[SalesPage] Products error stack:', error.stack);
      console.error('[SalesPage] Products error response:', error.response);
      DebugLogger.logApiError('/products', error, 'SalesPage');
      handleApiErrorWithToast(error, 'Failed to fetch products');
      setProducts([]);
    }
  };

  const fetchCustomersData = async () => {
    try {
      DebugLogger.logApiCall('/customers', 'Starting fetch for sales dropdown', 'SalesPage', 'GET');
      console.log('[SalesPage] Fetching customers for dropdown...');
      console.log('[SalesPage] Customers API endpoint: /customers');

      const response = await getCustomers();

      console.log('[SalesPage] Raw customers response:', response);
      console.log('[SalesPage] Customers response type:', typeof response);
      console.log('[SalesPage] Customers response keys:', response ? Object.keys(response) : 'null/undefined');
      DebugLogger.logDropdownEvent('SalesPage', 'customers-loaded', response, null);

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
        DebugLogger.logDropdownIssue('SalesPage', [], null, 'No customers available for sales dropdown');
      } else {
        console.log('[SalesPage] Customers available:', customersArray.map(c => ({ id: c.id, name: c.name, email: c.email })));
        console.log('[SalesPage] First customer example:', customersArray[0]);
      }

    } catch (error) {
      console.error('[SalesPage] Error fetching customers:', error);
      console.error('[SalesPage] Customers error message:', error.message);
      console.error('[SalesPage] Customers error stack:', error.stack);
      console.error('[SalesPage] Customers error response:', error.response);
      DebugLogger.logApiError('/customers', error, 'SalesPage');
      handleApiErrorWithToast(error, 'Failed to fetch customers');
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

      if (response?.data) {
        setSalesStats(response.data);
      }
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to fetch sales statistics');
    }
  };

  const handleProductSelect = (productId) => {
    DebugLogger.logDropdownEvent('SalesPage', 'product-selected', products, productId);

    const product = products.find(p => p.id === productId || p.id === parseInt(productId));
    if (product) {
      setFormData(prev => ({
        ...prev,
        product_id: productId,
        unit_price: product.price || product.unit_price || 0,
        total_amount: (prev.quantity || 1) * (product.price || product.unit_price || 0)
      }));
    } else {
      DebugLogger.logDropdownIssue('SalesPage', products, productId, 'Selected product not found in products array');
    }
  };

  const handleQuantityChange = (quantity) => {
    const qty = parseInt(quantity) || 1;
    setFormData(prev => ({
      ...prev,
      quantity: qty,
      total_amount: qty * prev.unit_price
    }));
  };

  const handleUnitPriceChange = (price) => {
    const unitPrice = parseFloat(price) || 0;
    setFormData(prev => ({
      ...prev,
      unit_price: unitPrice,
      total_amount: prev.quantity * unitPrice
    }));
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId || c.id === parseInt(customerId));
    setFormData(prev => ({
      ...prev,
      customer_id: customerId === 'walkin' ? '' : customerId,
      customer_name: customerId === 'walkin' ? 'Walk-in Customer' : (customer?.name || '')
    }));
  };

  const resetForm = () => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    DebugLogger.logFormSubmit('SalesPage', formData, 'submit');

    // Use enhanced validation
    const errors = validateSaleData(formData);
    if (Object.keys(errors).length > 0) {
      const errorMessage = Object.values(errors)[0];
      showErrorToast(errorMessage);
      setError(errorMessage);
      return;
    }

      try {
        setSubmitting(true);
        setError('');

        // Prepare sale data with proper structure
        const selectedProduct = products.find(p => p.id == formData.product_id);
        const selectedCustomer = customers.find(c => c.id == formData.customer_id);
        
        const saleData = {
          product_id: formData.product_id,
          customer_id: formData.customer_id || null,
          customer_name: formData.customer_name || selectedCustomer?.name || 'Walk-in Customer',
          customer_email: selectedCustomer?.email || null,
          quantity: parseInt(formData.quantity),
          unit_price: parseFloat(formData.unit_price),
          total_amount: parseFloat(formData.total_amount),
          payment_method: formData.payment_method,
          payment_status: formData.payment_method === 'pending' ? 'pending' : 'completed',
          currency: 'NGN',
          date: formData.date,
          salesperson_id: formData.salesperson_id || null,
          notes: `Sale for ${formData.customer_name || 'Walk-in Customer'}`,
          discount_amount: 0,
          tax_amount: 0
        };

        DebugLogger.logFormSubmit('SalesPage', saleData, 'processed-data');

        // Create the sale using enhanced API
        const saleResponse = await enhancedCreateSale(saleData);

        // Show success notification (toast only, no bell notification)
      showSuccessToast(`Sale for ${saleData.customer_name || 'Walk-in Customer'} recorded successfully!`);

        // Reset form and close dialog
        setShowAddDialog(false);
        resetForm();

        // Refresh all data immediately
        await Promise.all([
          fetchSales(),
          fetchSalesStats()
        ]);

        // Dispatch events to update other parts of the application
        window.dispatchEvent(new CustomEvent('salesUpdated', {
          detail: {
            sale: saleResponse,
            timestamp: new Date().toISOString()
          }
        }));

      } catch (error) {
        const errorMessage = handleApiErrorWithToast(error, 'Failed to create sale');
        setError(errorMessage);
        
        // Show specific error for common issues
        if (error.response?.data?.error?.includes('product_id')) {
          setError('Please select a product before creating the sale');
        } else if (error.response?.data?.error?.includes('quantity')) {
          setError('Please enter a valid quantity greater than 0');
        }
      } finally {
        setSubmitting(false);
      }
  };

  const downloadReport = async () => {
    try {
      // Simple CSV download for now
      const csvContent = generateCSVReport(sales);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download report');
    }
  };

  const generateCSVReport = (salesData) => {
    const headers = ['Date', 'Customer', 'Product', 'Quantity', 'Unit Price', 'Total Amount', 'Payment Method'];
    const rows = salesData.map(sale => [
      formatDate(sale.date),
      sale.customer_name || 'Walk-in Customer',
      sale.product_name || 'Unknown Product',
      sale.quantity || 0,
      sale.unit_price || 0,
      sale.total_amount || 0,
      formatPaymentMethod(sale.payment_method)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const getPaymentMethodBadge = (method) => {
    const variants = {
      cash: 'default',
      card: 'secondary',
      bank_transfer: 'outline',
      paystack: 'destructive'
    };
    return variants[method] || 'default';
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive',
      refunded: 'outline'
    };
    return variants[status] || 'default';
  };

  const filteredSales = Array.isArray(sales) ? sales.filter(sale => {
    if (!sale) return false;

    const customerName = (sale.customer_name || '').toLowerCase();
    const productName = (sale.product_name || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return customerName.includes(searchLower) || productName.includes(searchLower);
  }) : [];

    return (
      <DashboardLayout>
      {loading ? (
        <div className="p-3 sm:p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading sales...</p>
          </div>
        </div>
      ) : (
      <div className="relative">
        <BackButton to="/dashboard" variant="floating" />
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600 text-sm sm:text-base">Record sales and track performance</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/sales/report'}
                className="h-12 text-base touch-manipulation w-full sm:w-auto"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Sales Report
              </Button>
              <Dialog open={showAddDialog} onOpenChange={(open) => {
                setShowAddDialog(open);
                if (open) {
                  // Refresh products when dialog opens
                  console.log('[SalesPage] Dialog opened, refreshing products...');
                  fetchProductsData();
                  fetchCustomersData();
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="h-12 text-base touch-manipulation w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Sale
                  </Button>
                </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                  <DialogTitle>Record New Sale</DialogTitle>
                  <DialogDescription>
                    Add a new sale transaction
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-1">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="customer_id" className="text-base">Customer (Optional)</Label>
                      <Select value={formData.customer_id || 'walkin'} onValueChange={handleCustomerSelect}>
                        <SelectTrigger className="h-12 text-base touch-manipulation">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="walkin">Walk-in Customer</SelectItem>
                            {Array.isArray(customers) && customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name} {customer.email && `- ${customer.email}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="product_id" className="text-base">Product *</Label>
                      {error && error.includes('select a product') && (
                        <p className="text-red-500 text-sm">Please select a product</p>
                      )}

                      {/* Debug info for products */}
                      <div className="text-xs text-gray-500 mb-2">
                          Products loaded: {Array.isArray(products) ? products.length : 0} | Status: {Array.isArray(products) && products.length > 0 ? 'Available' : 'Loading...'}
                          {Array.isArray(products) && products.length > 0 && (
                          <div className="mt-1">
                            Products: {products.map(p => p.name).join(', ')}
                          </div>
                        )}
                      </div>

                      <Select
                        value={formData.product_id}
                          onValueChange={handleProductSelect}
                      >
                        <SelectTrigger className="h-12 text-base touch-manipulation">
                            <SelectValue placeholder={!Array.isArray(products) || products.length === 0 ? "Loading products..." : "Select product"} />
                        </SelectTrigger>
                        <SelectContent>
                            {!Array.isArray(products) || products.length === 0 ? (
                            <SelectItem value="no-products" disabled>
                              No products available
                            </SelectItem>
                          ) : (
                            products.map((product) => (
                              <SelectItem key={product.id} value={product.id.toString()}>
                                {product.name} - {formatNaira(product.price || product.unit_price || 0)}
                                {product.quantity !== undefined && ` (Stock: ${product.quantity})`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>

                        {(!Array.isArray(products) || products.length === 0) && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">
                            No products found. Please add products first or refresh the list.
                          </p>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('Refreshing products...');
                                fetchProductsData();
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh Products
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => window.open('/products', '_blank')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Products
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sale Details */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-base">Quantity *</Label>
                          <StableInput
                          id="quantity"
                          name="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          placeholder="1"
                          className="h-12 text-base touch-manipulation"
                          debounceMs={300}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit_price" className="text-base">Unit Price (₦) *</Label>
                          <StableInput
                          id="unit_price"
                          name="unit_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.unit_price}
                          onChange={(e) => handleUnitPriceChange(e.target.value)}
                          placeholder="0.00"
                          className="h-12 text-base touch-manipulation"
                          readOnly={!!formData.product_id}
                          style={{ 
                            backgroundColor: formData.product_id ? '#f3f4f6' : 'white',
                            cursor: formData.product_id ? 'not-allowed' : 'text'
                          }}
                        />
                        {formData.product_id && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Price from selected product. Edit product to change price.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base">Total Amount</Label>
                        <StableInput
                          name="total_amount"
                          value={formatNaira(formData.total_amount)}
                          disabled
                          className="font-bold text-green-600 h-12 text-base"
                        />
                      </div>
                    </div>

                    {/* Payment Method and Date */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment_method" className="text-base">Payment Method</Label>
                        <Select value={formData.payment_method} onValueChange={(value) => {
                          DebugLogger.logFocusEvent('SalesPage', 'payment-method-change', document.activeElement, { value });
                          setFormData(prev => ({ ...prev, payment_method: value }));
                        }}>
                          <SelectTrigger className="h-12 text-base touch-manipulation">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="pos">POS</SelectItem>
                            <SelectItem value="mobile_money">Mobile Money</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="online_payment">Online Payment</SelectItem>
                            <SelectItem value="pending">Pending Payment</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-base">Sale Date</Label>
                          <MobileDateInput
                          id="date"
                          name="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="h-12 text-base touch-manipulation"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddDialog(false)}
                        className="h-12 text-base touch-manipulation"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="h-12 text-base touch-manipulation"
                      >
                        {submitting ? 'Recording...' : 'Record Sale'}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
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

          {/* Sales Statistics Summary */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{salesStats.total_transactions || 0}</p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                    <p className="text-2xl font-bold">{formatNaira(salesStats.total_sales || 0)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Items Sold</p>
                    <p className="text-2xl font-bold">{salesStats.total_quantity || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Sale</p>
                    <p className="text-2xl font-bold">{formatNaira(salesStats.average_sale || 0)}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Date Selection */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <StableInput
                      name="search"
                      placeholder="Search by sale number or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-base touch-manipulation"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <MobileDateInput
                    name="filter_date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-12 text-base touch-manipulation"
                  />
                  <Button
                    variant="outline"
                    onClick={downloadReport}
                    className="h-12 text-base touch-manipulation"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sales Display - Mobile Cards and Desktop Table */}
          <Card>
            <CardHeader>
              <CardTitle>Sales for {formatDate(selectedDate)}</CardTitle>
              <CardDescription>
                {filteredSales.length} sale{filteredSales.length !== 1 ? 's' : ''} found
                {sales.length > 0 && filteredSales.length !== sales.length && 
                  ` (${sales.length} total)`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredSales.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No sales found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'No sales recorded for this date'}
                  </p>
                  <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Your First Sale
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                      {Array.isArray(filteredSales) && filteredSales.map((sale) => (
                      <Card key={sale.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header with customer and actions */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {sale.customer_name || 'Walk-in Customer'}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                  {sale.product_name || 'Unknown Product'}
                                </p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                              </div>
                            </div>

                            {/* Sale Details */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Quantity:</span>
                                <span className="font-medium">{sale.quantity || 0}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Unit Price:</span>
                                <span className="font-medium">{formatNaira(sale.unit_price || 0)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Payment:</span>
                                <Badge variant={getPaymentMethodBadge(sale.payment_method)}>
                                  {formatPaymentMethod(sale.payment_method)}
                                </Badge>
                              </div>
                            </div>

                            {/* Total and Date */}
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">
                                  {formatDateTime(sale.created_at || sale.date)}
                                </span>
                                <span className="text-lg font-semibold text-green-600">
                                  {formatNaira(sale.total_amount || 0)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[120px]">Customer</TableHead>
                            <TableHead className="min-w-[120px]">Product</TableHead>
                            <TableHead className="min-w-[80px] text-center">Quantity</TableHead>
                            <TableHead className="min-w-[100px]">Unit Price</TableHead>
                            <TableHead className="min-w-[120px]">Total Amount</TableHead>
                            <TableHead className="min-w-[120px]">Payment Method</TableHead>
                            <TableHead className="min-w-[120px]">Date</TableHead>
                            <TableHead className="min-w-[80px] text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                            {Array.isArray(filteredSales) && filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                              <TableCell className="font-medium">
                                {sale.customer_name || 'Walk-in Customer'}
                            </TableCell>
                              <TableCell className="font-medium">
                                {sale.product_name || 'Unknown Product'}
                            </TableCell>
                              <TableCell className="text-center">
                                {sale.quantity || 0}
                            </TableCell>
                            <TableCell>
                              {formatNaira(sale.unit_price || 0)}
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold text-green-600">
                                {formatNaira(sale.total_amount || 0)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getPaymentMethodBadge(sale.payment_method)}>
                                {formatPaymentMethod(sale.payment_method)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm whitespace-nowrap">
                                {formatDateTime(sale.created_at || sale.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
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
      </div>
      </div>
      )}
    </DashboardLayout>
  );
};

export default Sales;

