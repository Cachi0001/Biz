import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Edit, Trash2, Download, Send, Eye, Filter, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { getInvoices, getCustomers, getProducts, createInvoice, updateInvoice, deleteInvoice, updateInvoiceStatus, sendInvoice, downloadInvoicePdf, getInvoice } from "../services/api";
import { formatNaira, formatDate } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast, showErrorToast, safeArray } from '../utils/errorHandling';
import { useUsageTracking } from '../hooks/useUsageTracking';
import UsageLimitPrompt from '../components/subscription/UsageLimitPrompt';
import StableInput from '../components/ui/StableInput';
import BackButton from '../components/ui/BackButton';

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  items: any[];
}

interface Customer {
  id: string;
  name: string;
  email?: string;
}

interface Product {
  id: string;
  name: string;
  price?: number;
  unit_price?: number;
}

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Simple form state without complex validation
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount_amount: '0',
    notes: '',
    items: [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }]
  });

  // Simple error state
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getInvoices();
      console.log('[INVOICES] Invoices response:', response);

      const invoicesData = safeArray(response?.data?.invoices || response?.invoices || response, []);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      handleApiErrorWithToast(error, 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      console.log('[INVOICES] Customers response:', response);

      const customersData = safeArray(response?.data?.customers || response?.customers || response, []);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      handleApiErrorWithToast(error, 'Failed to load customers');
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      console.log('[INVOICES] Products response:', response);

      const productsData = safeArray(response?.data?.products || response?.products || response, []);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      handleApiErrorWithToast(error, 'Failed to load products');
      setProducts([]);
    }
  };

  // Simplified input change handler without async validation
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let processedValue: any = value;
    if (name === 'discount_amount') {
      processedValue = value === '' ? '0' : Math.max(0, parseFloat(value) || 0).toString();
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    if (typeof value === 'object' && value.preventDefault) {
      value.preventDefault();
      return;
    }

    let processedValue = value;
    if (field === 'quantity') {
      processedValue = value === '' ? 1 : Math.max(1, parseInt(value) || 1);
    } else if (field === 'unit_price') {
      processedValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    } else if (field === 'tax_rate' || field === 'discount_rate') {
      processedValue = value === '' ? 0 : Math.max(0, Math.min(100, parseFloat(value) || 0));
    }

    setFormData(prev => {
      const updatedItems = [...prev.items];
      if (updatedItems[index]) {
        updatedItems[index] = { ...updatedItems[index], [field]: processedValue };

        if (field === 'product_id' && value) {
          const product = products.find(p => p.id === value);
          if (product && updatedItems[index]) {
            updatedItems[index].description = product.name || '';
            updatedItems[index].unit_price = product.price || product.unit_price || 0;
          }
        }
      }

      return { ...prev, items: updatedItems };
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now() + Math.random(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateItemTotal = (item) => {
    const quantity = Math.max(0, parseFloat(item.quantity) || 0);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
    const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);
    total += total * (taxRate / 100);

    return Math.round(total * 100) / 100;
  };

  const calculateInvoiceTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = Math.max(0, parseFloat(formData.discount_amount as any) || 0);
    const total = itemsTotal - discount;

    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.customer_id) {
      errors.push('Please select a customer');
    }

    if (!formData.issue_date) {
      errors.push('Issue date is required');
    }

    if (!formData.items || formData.items.length === 0) {
      errors.push('At least one item is required');
    }

    formData.items.forEach((item, index) => {
      if (!item.description || !item.description.trim()) {
        errors.push(`Item ${index + 1}: Description is required`);
      }

      if (!item.quantity || parseFloat(item.quantity as any) <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }

      if (!item.unit_price || parseFloat(item.unit_price as any) < 0) {
        errors.push(`Item ${index + 1}: Unit price must be 0 or greater`);
      }
    });

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    e.stopPropagation();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showErrorToast(validationErrors[0]);
      return false;
    }

    try {
      setSubmitting(true);

      const invoiceData = {
        customer_id: formData.customer_id,
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        discount_amount: parseFloat(formData.discount_amount as any) || 0,
        notes: formData.notes,
        items: formData.items.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: parseFloat(item.quantity as any),
          unit_price: parseFloat(item.unit_price as any),
          tax_rate: parseFloat(item.tax_rate as any) || 0,
          discount_rate: parseFloat(item.discount_rate as any) || 0
        })),
        total_amount: calculateInvoiceTotal()
      };

      let response;
      if (selectedInvoice) {
        response = await updateInvoice(selectedInvoice.id, invoiceData);
        showSuccessToast('Invoice updated successfully!');
      } else {
        response = await createInvoice(invoiceData);
        showSuccessToast('Invoice created successfully!');
      }

      setIsCreateDialogOpen(false);
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      await fetchInvoices();

      return true;
    } catch (error) {
      handleApiErrorWithToast(error, 'InvoicesPage', formData);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewConfirm = async () => {
    const success = await handleSubmit({ preventDefault: () => {}, stopPropagation: () => {} } as any);
    if (success) {
      setIsReviewDialogOpen(false);
    }
  };

  const handleReviewCancel = () => {
    setIsReviewDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      discount_amount: '0',
      notes: '',
      items: [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }]
    });
    setErrors({});
  };

  const handleEdit = async (invoiceId) => {
    try {
      const invoice = await getInvoice(invoiceId);
      setSelectedInvoice(invoice);
      setFormData({
        customer_id: invoice.customer_id || '',
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || '',
        discount_amount: (invoice.discount_amount || 0).toString(),
        notes: invoice.notes || '',
        items: invoice.items || [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }]
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to load invoice for editing');
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(invoiceId);
        showSuccessToast('Invoice deleted successfully!');
        await fetchInvoices();
      } catch (error) {
        handleApiErrorWithToast(error, 'Failed to delete invoice');
      }
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      await downloadInvoicePdf(invoiceId);
      showSuccessToast('PDF downloaded successfully!');
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to download PDF');
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    try {
      await sendInvoice(invoiceId);
      showSuccessToast('Invoice sent successfully!');
      await fetchInvoices();
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to send invoice');
    }
  };

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      await updateInvoiceStatus(invoiceId, { status: newStatus });
      showSuccessToast('Invoice status updated successfully!');
      await fetchInvoices();
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to update invoice status');
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      fetchInvoices(),
      fetchCustomers(),
      fetchProducts()
    ]);
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: 'secondary',
      sent: 'default',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'outline'
    };
    return variants[status] || 'default';
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm || 
      invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const customerName = customer ? customer.name : 'Unknown Customer';
    const invoiceNumber = invoice.invoice_number || (typeof invoice.id === 'string' ? invoice.id.substring(0, 8).toUpperCase() : '') || '';

    return (
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{invoiceNumber}</h3>
                <p className="text-sm text-gray-600">{customerName}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(invoice.id)}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(invoice.id)}
                  className="h-8 w-8 p-0 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Issue Date</span>
                <span>{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Due Date</span>
                <span>{invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-semibold text-green-600">
                  {formatNaira(invoice.total_amount, true)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Badge variant={getStatusBadge(invoice.status)}>
                {invoice.status}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadPdf(invoice.id)}
                  className="h-8 w-8 p-0 hover:bg-green-100"
                >
                  <Download className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendInvoice(invoice.id)}
                  className="h-8 w-8 p-0 hover:bg-purple-100"
                >
                  <Send className="h-4 w-4 text-purple-600" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const InvoiceForm = ({ isEdit }: { isEdit?: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_id" className="text-base">Customer *</Label>
          <Select value={formData.customer_id} onValueChange={(value) => handleInputChange({ target: { name: 'customer_id', value } } as any)}>
            <SelectTrigger className="h-12 text-base touch-manipulation">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} {customer.email && `- ${customer.email}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="issue_date" className="text-base">Issue Date *</Label>
          <StableInput
            id="issue_date"
            name="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={handleInputChange}
            required
            className="h-12 text-base touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date" className="text-base">Due Date</Label>
          <StableInput
            id="due_date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleInputChange}
            className="h-12 text-base touch-manipulation"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount_amount" className="text-base">Discount Amount (₦)</Label>
          <StableInput
            id="discount_amount"
            name="discount_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.discount_amount}
            onChange={handleInputChange}
            placeholder="0.00"
            className="h-12 text-base touch-manipulation"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          placeholder="Enter invoice notes..."
          rows={3}
          className="text-base touch-manipulation"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Invoice Items</h3>
          <Button type="button" onClick={addItem} variant="outline" className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {formData.items.map((item, index) => (
          <Card key={item.id} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Label className="text-sm">Product</Label>
                <Select value={item.product_id} onValueChange={(value) => handleItemChange(index, 'product_id', value)}>
                  <SelectTrigger className="h-10 text-sm">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {formatNaira(product.price || product.unit_price || 0)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm">Description *</Label>
                <StableInput
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Item description"
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <Label className="text-sm">Qty *</Label>
                <StableInput
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <Label className="text-sm">Unit Price (₦) *</Label>
                <StableInput
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-sm">Total</Label>
                  <div className="h-10 flex items-center text-sm font-medium text-green-600">
                    {formatNaira(calculateItemTotal(item))}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => removeItem(index)}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-lg font-semibold">
          Total: {formatNaira(calculateInvoiceTotal())}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedInvoice(null);
            }}
            className="h-12 text-base touch-manipulation"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-12 text-base touch-manipulation"
          >
            {submitting ? 'Saving...' : (isEdit ? 'Update Invoice' : 'Create Invoice')}
          </Button>
        </div>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Eye className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative">
        <BackButton to="/dashboard" variant="floating" />
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600 text-sm sm:text-base">Create and manage your invoices</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="h-12 text-base touch-manipulation w-full sm:w-auto"
              >
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto min-h-[44px] bg-green-600 hover:bg-green-700 touch-manipulation">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Create a new invoice for your customer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4">
                    <InvoiceForm />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <StableInput
                    placeholder="Search invoices by number, customer, or notes..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                    aria-label="Search invoices by number, customer, or notes"
                    aria-describedby="search-help"
                    role="searchbox"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-12 min-h-[48px] touch-manipulation">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice List ({filteredInvoices.length})</CardTitle>
              <CardDescription>
                Manage and track all your invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {invoices.length === 0 ? 'No invoices found' : 'No invoices match your search criteria'}
                  </p>
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Invoice
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:hidden">
                    {filteredInvoices.map((invoice) => (
                      <InvoiceCard key={invoice.id} invoice={invoice} />
                    ))}
                  </div>

                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Issue Date</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvoices.map((invoice: Invoice) => {
                          const customer = customers.find(c => c.id === invoice.customer_id);
                          const customerName = customer ? customer.name : 'Unknown Customer';
                          const invoiceNumber = invoice.invoice_number || (typeof invoice.id === 'string' ? invoice.id.substring(0, 8).toUpperCase() : '') || '';

                          return (
                            <TableRow key={invoice.id}>
                              <TableCell className="font-medium">{invoiceNumber}</TableCell>
                              <TableCell>{customerName}</TableCell>
                              <TableCell>{formatDate(invoice.issue_date)}</TableCell>
                              <TableCell>
                                {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                              </TableCell>
                              <TableCell className="font-semibold">
                                {formatNaira(invoice.total_amount, true)}
                              </TableCell>
                              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice.id)}>
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(invoice.id)}>
                                    <Download className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                                    <Send className="h-4 w-4 text-purple-600" />
                                  </Button>
                                  <Select
                                    value={invoice.status}
                                    onValueChange={(newStatus: Invoice["status"]) => handleStatusUpdate(invoice.id, newStatus)}
                                  >
                                    <SelectTrigger className="w-20 h-8 text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="draft">Draft</SelectItem>
                                      <SelectItem value="sent">Sent</SelectItem>
                                      <SelectItem value="paid">Paid</SelectItem>
                                      <SelectItem value="overdue">Overdue</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(invoice.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Invoice</DialogTitle>
                <DialogDescription>
                  Update invoice details
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-2 sm:px-6 py-4">
                <InvoiceForm isEdit={true} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;