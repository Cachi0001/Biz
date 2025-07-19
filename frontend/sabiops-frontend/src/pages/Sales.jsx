import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Download, Eye, Trash2, ShoppingCart, TrendingUp, Calculator, Package, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import BackButton from '@/components/ui/BackButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { get, post } from "../services/api";
import { enhancedGetProducts, enhancedGetCustomers, enhancedCreateSale, validateSaleData } from "../services/enhancedApi";
import { recordPayment } from "../services/api";
import { handleApiError, showSuccessToast, safeArray } from '../utils/errorHandling';
import StableInput from '../components/ui/StableInput';
import FocusManager from '../utils/focusManager';
import DebugLogger from '../utils/debugLogger';
import { formatNaira, formatDateTime, formatDate, formatPaymentMethod } from '../utils/formatting';

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
      const response = await get('/sales/', {
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
      });

      // Handle new API response format
      const salesData = safeArray(response?.data?.sales || response?.data || response, []);
      setSales(salesData);

      // Update stats from response
      if (response?.data?.summary) {
        setSalesStats(response.data.summary);
      }
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to fetch sales', false);
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

      const normalizedData = await enhancedGetProducts();

      console.log('[SalesPage] Products fetched:', normalizedData);
      DebugLogger.logDropdownEvent('SalesPage', 'products-loaded', normalizedData.products, null);

      const productsArray = normalizedData.products || [];
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
      DebugLogger.logApiError('/products', error, 'SalesPage');
      handleApiError(error, 'Failed to fetch products', false);
      setProducts([]);
    }
  };

  const fetchCustomersData = async () => {
    try {
      DebugLogger.logApiCall('/customers', 'Starting fetch for sales dropdown', 'SalesPage', 'GET');

      const customersData = await enhancedGetCustomers();

      DebugLogger.logDropdownEvent('SalesPage', 'customers-loaded', customersData, null);

      setCustomers(customersData || []);

    } catch (error) {
      DebugLogger.logApiError('/customers', error, 'SalesPage');
      handleApiError(error, 'Failed to fetch customers', false);
      setCustomers([]);
    }
  };

  const fetchSalesStats = async () => {
    try {
      const response = await get('/sales/stats', {
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
      });

      if (response?.data) {
        setSalesStats(response.data);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch sales statistics', false);
    }
  };

  const handleProductSelect = (productId) => {
    DebugLogger.logDropdownEvent('SalesPage', 'product-selected', products, productId);

    const product = products.find(p => p.id === productId || p.id === parseInt(productId));
    if (product) {
      FocusManager.preserveFocus(() => {
        setFormData(prev => ({
          ...prev,
          product_id: productId,
          unit_price: product.price || product.unit_price || 0,
          total_amount: (prev.quantity || 1) * (product.price || product.unit_price || 0)
        }));
      });
    } else {
      DebugLogger.logDropdownIssue('SalesPage', products, productId, 'Selected product not found in products array');
    }
  };

  const handleQuantityChange = (quantity) => {
    const qty = parseInt(quantity) || 1;
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({
        ...prev,
        quantity: qty,
        total_amount: qty * prev.unit_price
      }));
    });
  };

  const handleUnitPriceChange = (price) => {
    const unitPrice = parseFloat(price) || 0;
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({
        ...prev,
        unit_price: unitPrice,
        total_amount: prev.quantity * unitPrice
      }));
    });
  };

  const handleCustomerSelect = (customerId) => {
    const customer = customers.find(c => c.id === customerId || c.id === parseInt(customerId));
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({
        ...prev,
        customer_id: customerId === 'walkin' ? '' : customerId,
        customer_name: customerId === 'walkin' ? 'Walk-in Customer' : (customer?.name || '')
      }));
    });
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
      setError(errorMessage);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Prepare sale data according to backend API format
      const saleData = {
        product_id: formData.product_id,
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name || 'Walk-in Customer',
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: formData.total_amount,
        payment_method: formData.payment_method,
        date: formData.date,
        salesperson_id: formData.salesperson_id || null
      };

      DebugLogger.logFormSubmit('SalesPage', saleData, 'processed-data');

      // Create the sale first
      const saleResponse = await enhancedCreateSale(saleData);

      // If payment method is provided and not 'pending', create a payment record
      if (saleData.payment_method && saleData.payment_method !== 'pending') {
        try {
          const paymentData = {
            customer_name: saleData.customer_name || 'Walk-in Customer',
            amount: saleData.total_amount,
            payment_method: saleData.payment_method,
            payment_date: saleData.date,
            reference_number: `SALE-${Date.now()}`,
            notes: `Payment for sale - ${saleData.customer_name || 'Walk-in Customer'}`,
            status: 'completed'
          };

          await recordPayment(paymentData);
          DebugLogger.logFormSubmit('SalesPage', paymentData, 'payment-recorded');
        } catch (paymentError) {
          // Don't fail the sale if payment recording fails, just log it
          DebugLogger.logApiError('/payments', paymentError, 'SalesPage-PaymentRecord');
          console.warn('Sale created but payment recording failed:', paymentError);
        }
      }

      if (saleData.payment_method && saleData.payment_method !== 'pending') {
        showSuccessToast('Sale and payment recorded successfully!');
      } else {
        showSuccessToast('Sale recorded successfully!');
      }
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

      // Also dispatch a general data update event
      window.dispatchEvent(new CustomEvent('dataUpdated', {
        detail: {
          type: 'sale',
          data: saleResponse,
          timestamp: new Date().toISOString()
        }
      }));
    } catch (error) {
      const errorMessage = handleApiError(error, 'Failed to create sale');
      setError(errorMessage);
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

  const filteredSales = sales.filter(sale => {
    if (!sale) return false;

    const customerName = (sale.customer_name || '').toLowerCase();
    const productName = (sale.product_name || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();

    return customerName.includes(searchLower) || productName.includes(searchLower);
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <ShoppingCart className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading sales...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative">
        <BackButton to="/dashboard" variant="floating" />
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
              <p className="text-gray-600 text-sm sm:text-base">Record sales and track performance</p>
            </div>
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
                <Button className="h-12 text-base touch-manipulation">
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
                          {customers.map((customer) => (
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
                        Products loaded: {products.length} | Status: {products.length > 0 ? 'Available' : 'Loading...'}
                        {products.length > 0 && (
                          <div className="mt-1">
                            Products: {products.map(p => p.name).join(', ')}
                          </div>
                        )}
                      </div>

                      <Select
                        value={formData.product_id}
                        onValueChange={(value) => {
                          DebugLogger.logDropdownEvent('SalesPage', 'product-select-change', products, value);
                          handleProductSelect(value);
                        }}
                      >
                        <SelectTrigger className="h-12 text-base touch-manipulation">
                          <SelectValue placeholder={products.length === 0 ? "Loading products..." : "Select product"} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.length === 0 ? (
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

                      {products.length === 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-500">
                            No products found. Please add products first.
                          </p>
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
                        </div>
                      )}
                    </div>

                    {/* Sale Details */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="quantity" className="text-base">Quantity *</Label>
                        <StableInput
                          id="quantity"
                          type="number"
                          min="1"
                          value={formData.quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          placeholder="1"
                          className="h-12 text-base touch-manipulation"
                          componentName="SalesPage-Quantity"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit_price" className="text-base">Unit Price (₦) *</Label>
                        <StableInput
                          id="unit_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.unit_price}
                          onChange={(e) => handleUnitPriceChange(e.target.value)}
                          placeholder="0.00"
                          className="h-12 text-base touch-manipulation"
                          componentName="SalesPage-UnitPrice"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base">Total Amount</Label>
                        <StableInput
                          value={formatNaira(formData.total_amount)}
                          disabled
                          className="font-bold text-green-600 h-12 text-base"
                          componentName="SalesPage-TotalAmount"
                        />
                      </div>
                    </div>

                    {/* Payment Method and Date */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="payment_method" className="text-base">Payment Method</Label>
                        <Select value={formData.payment_method} onValueChange={(value) => {
                          DebugLogger.logFocusEvent('SalesPage', 'payment-method-change', document.activeElement, { value });
                          FocusManager.preserveFocus(() => {
                            setFormData(prev => ({ ...prev, payment_method: value }));
                          });
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
                        <StableInput
                          id="date"
                          type="date"
                          value={formData.date}
                          onChange={(e) => FocusManager.preserveFocus(() => setFormData(prev => ({ ...prev, date: e.target.value })))}
                          className="h-12 text-base touch-manipulation"
                          componentName="SalesPage-Date"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    <p className="text-sm font-medium text-muted-foreground">Today's Sales</p>
                    <p className="text-2xl font-bold">{formatNaira(salesStats.today_sales || 0)}</p>
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
                    <p className="text-2xl font-bold">{formatNaira(salesStats.average_sale_value || 0)}</p>
                  </div>
                  <Calculator className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Date Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <StableInput
                      placeholder="Search by sale number or customer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-base touch-manipulation"
                      componentName="SalesPage-Search"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StableInput
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-12 text-base touch-manipulation"
                    componentName="SalesPage-DateFilter"
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
                    {filteredSales.map((sale) => (
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
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSales.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell>
                              <div className="font-medium">
                                {sale.customer_name || 'Walk-in Customer'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {sale.product_name || 'Unknown Product'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-center">
                                {sale.quantity || 0}
                              </div>
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
                              <div className="text-sm">
                                {formatDateTime(sale.created_at || sale.date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Sales;

