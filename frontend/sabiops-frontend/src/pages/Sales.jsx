import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Calendar, Download, Eye, Edit, Trash2, ShoppingCart, TrendingUp, Calculator, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { get, post, getProducts, getCustomers, getSalesReport as apiGetSalesReport } from "../services/api";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saleItems, setSaleItems] = useState([{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }]);
  const [formData, setFormData] = useState({
    customer_id: '',
    payment_method: 'cash',
    payment_status: 'completed',
    discount_amount: 0,
    tax_amount: 0,
    notes: ''
  });
  const [dailyReport, setDailyReport] = useState(null);

  useEffect(() => {
    fetchSales();
    fetchProductsData();
    fetchCustomersData();
    fetchDailyReport();
  }, [selectedDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const response = await get('/sales/', {
        params: {
          start_date: selectedDate,
          end_date: selectedDate
        }
      });
      setSales(response.data.sales || []);
    } catch (error) {
      setError('Failed to fetch sales');
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsData = async () => {
    try {
      const response = await getProducts();
      setProducts(response);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomersData = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchDailyReport = async () => {
    try {
      const response = await apiGetSalesReport({ date: selectedDate });
      setDailyReport(response);
    } catch (error) {
      console.error('Error fetching daily report:', error);
    }
  };

  const handleProductSelect = (index, productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      const newItems = [...saleItems];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        product_name: product.name,
        product_sku: product.sku,
        unit_price: product.unit_price
      };
      setSaleItems(newItems);
    }
  };

  const addSaleItem = () => {
    setSaleItems([...saleItems, { product_id: '', product_name: '', quantity: 1, unit_price: 0 }]);
  };

  const removeSaleItem = (index) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const updateSaleItem = (index, field, value) => {
    const newItems = [...saleItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSaleItems(newItems);
  };

  const calculateTotal = () => {
    const subtotal = saleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    return subtotal - formData.discount_amount + formData.tax_amount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const saleData = {
        ...formData,
        sale_items: saleItems.filter(item => item.product_name && item.quantity > 0)
      };

      await post('/sales/', saleData);
      setShowAddDialog(false);
      
      // Reset form
      setFormData({
        customer_id: '',
        payment_method: 'cash',
        payment_status: 'completed',
        discount_amount: 0,
        tax_amount: 0,
        notes: ''
      });
      setSaleItems([{ product_id: '', product_name: '', quantity: 1, unit_price: 0 }]);
      
      fetchSales();
      fetchDailyReport();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to record sale');
    }
  };

  const downloadReport = async (format) => {
    try {
      const response = await apiGetSalesReport({ date: selectedDate, format }, format);
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-report-${selectedDate}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download report');
    }
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

  const filteredSales = sales.filter(sale =>
    sale.sale_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.customer && sale.customer.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales</h1>
            <p className="text-gray-600 text-sm sm:text-base">Record sales and track performance</p>
          </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>
                Add a new sale transaction
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Customer and Payment Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer (Optional)</Label>
                  <Select value={formData.customer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="walkin">Walk-in Customer</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name} - {customer.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select value={formData.payment_method} onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paystack">Paystack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sale Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Sale Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addSaleItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {saleItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-4">
                      <Label>Product</Label>
                      <Select 
                        value={item.product_id} 
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - ₦{product.unit_price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Unit Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateSaleItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Total</Label>
                      <Input
                        value={`₦${(item.quantity * item.unit_price).toLocaleString()}`}
                        disabled
                      />
                    </div>

                    <div className="col-span-2">
                      {saleItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSaleItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Discount and Tax */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount (₦)</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax_amount">Tax (₦)</Label>
                  <Input
                    id="tax_amount"
                    type="number"
                    step="0.01"
                    value={formData.tax_amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <Input
                    value={`₦${calculateTotal().toLocaleString()}`}
                    disabled
                    className="font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about this sale"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Record Sale
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Daily Report Summary */}
      {dailyReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{dailyReport.total_sales}</p>
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
                  <p className="text-2xl font-bold">₦{dailyReport.total_amount.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold">{dailyReport.total_quantity}</p>
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
                  <p className="text-2xl font-bold">₦{dailyReport.average_sale.toLocaleString()}</p>
                </div>
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Date Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by sale number or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => downloadReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" onClick={() => downloadReport('png')}>
                <Download className="h-4 w-4 mr-2" />
                Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sales for {selectedDate}</CardTitle>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 py-0.5 rounded">
                          {sale.sale_number}
                        </code>
                      </TableCell>
                      <TableCell>
                        {sale.customer ? sale.customer.name : 'Walk-in Customer'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {sale.sale_items.length} item{sale.sale_items.length !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPaymentMethodBadge(sale.payment_method)}>
                          {sale.payment_method.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>₦{sale.net_amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(sale.payment_status)}>
                          {sale.payment_status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sale.sale_time ? new Date(`2000-01-01T${sale.sale_time}`).toLocaleTimeString() : 'N/A'}
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
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
};

export default Sales;

