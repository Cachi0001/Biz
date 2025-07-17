import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Edit, Trash2, Download, Send, Filter, RefreshCw, Eye } from 'lucide-react';
import { getInvoices, getCustomers, getProducts, updateInvoice, createInvoice, getInvoice, deleteInvoice, downloadInvoicePdf, sendInvoice, updateInvoiceStatus } from "../services/api";
import { handleApiError, showSuccessToast, showErrorToast, safeArray } from '../utils/errorHandling';
import { formatNaira, formatDate, formatInvoiceStatus, getStatusColor } from '../utils/formatting';
import BackButton from '../components/ui/BackButton';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: 'Payment is due within 30 days of invoice date.',
    currency: 'NGN',
    discount_amount: 0,
    items: [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
  });

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
      
      // Use safeArray to handle different response formats
      const invoicesData = safeArray(response?.data?.invoices || response?.invoices || response, []);
      setInvoices(invoicesData);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      handleApiError(error, 'Failed to load invoices');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      console.log('[INVOICES] Customers response:', response);
      
      // Use safeArray to handle different response formats
      const customersData = safeArray(response?.data?.customers || response?.customers || response, []);
      setCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      handleApiError(error, 'Failed to load customers');
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      console.log('[INVOICES] Products response:', response);
      
      // Use safeArray to handle different response formats
      const productsData = safeArray(response?.data?.products || response?.products || response, []);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      handleApiError(error, 'Failed to load products');
      setProducts([]);
    }
  };

  const handleInputChange = (e) => {
    // Prevent any form submission on Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    // Prevent form submission on Enter key or event objects
    if (typeof value === 'object' && value.preventDefault) {
      value.preventDefault();
      return;
    }
    
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };

      // Auto-populate product details when product is selected
      if (field === 'product_id' && value) {
        const product = products.find(p => p.id === value);
        if (product) {
          updatedItems[index].description = product.name || '';
          updatedItems[index].unit_price = product.price || product.unit_price || 0;
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
    const quantity = parseFloat(item.quantity) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const taxRate = parseFloat(item.tax_rate) || 0;
    const discountRate = parseFloat(item.discount_rate) || 0;

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);
    total += total * (taxRate / 100);
    return total;
  };

  const calculateInvoiceTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = parseFloat(formData.discount_amount) || 0;
    return itemsTotal - discount;
  };

  const validateForm = () => {
    const errors = [];
    
    // Basic validation
    if (!formData.customer_id) {
      errors.push('Please select a customer');
    }
    
    if (!formData.issue_date) {
      errors.push('Issue date is required');
    }
    
    if (!formData.items || formData.items.length === 0) {
      errors.push('At least one item is required');
    }
    
    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.description || !item.description.trim()) {
        errors.push(`Item ${index + 1}: Description is required`);
      }
      
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      
      if (!item.unit_price || parseFloat(item.unit_price) < 0) {
        errors.push(`Item ${index + 1}: Unit price must be 0 or greater`);
      }
    });
    
    return errors;
  };

  const handleSubmit = async (e) => {
    // Prevent all form submission behaviors
    e.preventDefault();
    e.stopPropagation();
    
    // Validate form using comprehensive validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      showErrorToast(validationErrors[0]); // Show first error with styled toast
      return false;
    }

    try {
      setLoading(true);
      console.log('[INVOICES] Submitting invoice data:', formData);

      // Format data for backend with proper validation
      const invoiceData = {
        customer_id: parseInt(formData.customer_id),
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        payment_terms: formData.payment_terms || 'Net 30',
        notes: formData.notes || '',
        terms_and_conditions: formData.terms_and_conditions || 'Payment is due within 30 days of invoice date.',
        currency: formData.currency || 'NGN',
        discount_amount: parseFloat(formData.discount_amount) || 0,
        items: formData.items.map(item => ({
          product_id: item.product_id ? parseInt(item.product_id) : null,
          description: item.description.trim(),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          tax_rate: parseFloat(item.tax_rate) || 0,
          discount_rate: parseFloat(item.discount_rate) || 0,
        })),
        total_amount: calculateInvoiceTotal(),
        amount_due: calculateInvoiceTotal(),
        status: 'draft'
      };

      if (selectedInvoice) {
        const response = await updateInvoice(selectedInvoice.id, invoiceData);
        console.log('[INVOICES] Update response:', response);
        showSuccessToast('Invoice updated successfully!');
        setIsEditDialogOpen(false);
      } else {
        const response = await createInvoice(invoiceData);
        console.log('[INVOICES] Create response:', response);
        showSuccessToast('Invoice created successfully!');
        setIsCreateDialogOpen(false);
      }
      resetForm();
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      handleApiError(error, 'Invoice Save');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_terms: 'Net 30',
      notes: '',
      terms_and_conditions: 'Payment is due within 30 days of invoice date.',
      currency: 'NGN',
      discount_amount: 0,
      items: [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
    });
    setSelectedInvoice(null);
  };

  const handleEdit = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await getInvoice(invoiceId);
      console.log('[INVOICES] Get invoice response:', response);
      
      let invoice;
      if (response && response.invoice) {
        invoice = response.invoice;
      } else if (response && response.data && response.data.invoice) {
        invoice = response.data.invoice;
      } else {
        invoice = response;
      }
      
      setSelectedInvoice(invoice);
      setFormData({
        customer_id: invoice.customer_id || '',
        issue_date: invoice.issue_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || '',
        payment_terms: invoice.payment_terms || 'Net 30',
        notes: invoice.notes || '',
        terms_and_conditions: invoice.terms_and_conditions || 'Payment is due within 30 days of invoice date.',
        currency: invoice.currency || 'NGN',
        discount_amount: invoice.discount_amount || 0,
        items: invoice.items && invoice.items.length > 0 
          ? invoice.items.map((item, index) => ({
              id: item.id || Date.now() + index,
              product_id: item.product_id || '',
              description: item.description || '',
              quantity: item.quantity || 1,
              unit_price: item.unit_price || 0,
              tax_rate: item.tax_rate || 0,
              discount_rate: item.discount_rate || 0,
            }))
          : [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch invoice for edit:', error);
      handleApiError(error, 'Failed to load invoice for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        setLoading(true);
        const response = await deleteInvoice(invoiceId);
        console.log('[INVOICES] Delete response:', response);
        showSuccessToast('Invoice deleted successfully!');
        await fetchInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        handleApiError(error, 'Failed to delete invoice');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      setLoading(true);
      const response = await downloadInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showSuccessToast('Invoice PDF downloaded successfully!');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      handleApiError(error, 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to send this invoice?')) {
      try {
        setLoading(true);
        const response = await sendInvoice(invoiceId);
        console.log('[INVOICES] Send response:', response);
        showSuccessToast('Invoice sent successfully!');
        await fetchInvoices();
      } catch (error) {
        console.error('Failed to send invoice:', error);
        handleApiError(error, 'Failed to send invoice');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      setLoading(true);
      const response = await updateInvoiceStatus(invoiceId, { status: newStatus });
      console.log('[INVOICES] Status update response:', response);
      showSuccessToast(`Invoice status updated to ${formatInvoiceStatus(newStatus)}!`);
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      handleApiError(error, 'Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchInvoices();
      showSuccessToast('Invoices refreshed successfully!');
    } catch (error) {
      handleApiError(error, 'Failed to refresh invoices');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    return (
      <Badge className={getStatusColor(status, 'invoice')}>
        {formatInvoiceStatus(status)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const customerName = customer ? customer.name : 'Unknown Customer';
    const invoiceNumber = invoice.invoice_number || invoice.id?.substring(0, 8).toUpperCase() || '';
    
    // Search filter
    const matchesSearch = !searchTerm || 
      invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = !statusFilter || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Mobile card component for invoices
  const InvoiceCard = ({ invoice }) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const customerName = customer ? customer.name : 'Unknown Customer';
    const invoiceNumber = invoice.invoice_number || invoice.id?.substring(0, 8).toUpperCase() || '';

    return (
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header with invoice number and status */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {invoiceNumber}
                </h3>
                <p className="text-sm text-gray-600 truncate">
                  {customerName}
                </p>
              </div>
              <div className="ml-2">
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            {/* Invoice details */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Issue Date:</span>
                <span className="text-gray-900">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Due Date:</span>
                <span className="text-gray-900">
                  {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Total Amount:</span>
                <span className="text-lg font-bold text-green-600">
                  {formatNaira(invoice.total_amount, true)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice.id)}>
                  <Edit className="h-4 w-4 text-blue-600" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(invoice.id)}>
                  <Download className="h-4 w-4 text-green-600" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                  <Send className="h-4 w-4 text-purple-600" />
                </Button>
              </div>
              <div className="flex gap-1">
                <Select
                  value={invoice.status}
                  onValueChange={(newStatus) => handleStatusUpdate(invoice.id, newStatus)}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
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
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const InvoiceForm = ({ isEdit }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer_id">Customer *</Label>
          <Select
            value={formData.customer_id}
            onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.length === 0 ? (
                <SelectItem value="none" disabled>
                  No customers available. Please add a customer first.
                </SelectItem>
              ) : (
                customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="issue_date">Issue Date *</Label>
          <Input
            id="issue_date"
            name="issue_date"
            type="date"
            value={formData.issue_date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            value={formData.due_date}
            onChange={handleInputChange}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_terms">Payment Terms</Label>
          <Input
            id="payment_terms"
            name="payment_terms"
            value={formData.payment_terms}
            onChange={handleInputChange}
            placeholder="e.g., Net 30"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Invoice Items *</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
        {formData.items.map((item, index) => (
          <Card key={item.id} className="p-3 sm:p-4 mb-4">
            {/* Mobile-first layout */}
            <div className="space-y-4">
              {/* Product Selection - Full width on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`product_id-${index}`}>Product</Label>
                  <Select
                    value={item.product_id}
                    onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                  >
                    <SelectTrigger id={`product_id-${index}`}>
                      <SelectValue placeholder="Select product (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No products available. Please add a product first.
                        </SelectItem>
                      ) : (
                        products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`description-${index}`}>Description *</Label>
                  <Input
                    id={`description-${index}`}
                    name="description"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder="Item description"
                    required
                  />
                </div>
              </div>

              {/* Quantity and Pricing - 2 columns on mobile, 4 on desktop */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`quantity-${index}`}>Qty *</Label>
                  <Input
                    id={`quantity-${index}`}
                    name="quantity"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value === '' ? 1 : parseInt(e.target.value) || 1)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`unit_price-${index}`}>Unit Price (₦) *</Label>
                  <Input
                    id={`unit_price-${index}`}
                    name="unit_price"
                    type="number"
                    step="0.01"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`tax_rate-${index}`}>Tax (%)</Label>
                  <Input
                    id={`tax_rate-${index}`}
                    name="tax_rate"
                    type="number"
                    step="0.01"
                    value={item.tax_rate}
                    onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`discount_rate-${index}`}>Discount (%)</Label>
                  <Input
                    id={`discount_rate-${index}`}
                    name="discount_rate"
                    type="number"
                    step="0.01"
                    value={item.discount_rate}
                    onChange={(e) => handleItemChange(index, 'discount_rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                </div>
              </div>

              {/* Total and Remove Button */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatNaira(calculateItemTotal(item), true)}
                  </span>
                </div>
                {formData.items.length > 1 && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1 hidden sm:inline">Remove</span>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        <div className="text-right space-y-2">
          <div className="flex justify-end items-center gap-2">
            <Label htmlFor="discount_amount">Overall Discount (₦)</Label>
            <Input
              id="discount_amount"
              name="discount_amount"
              type="number"
              step="0.01"
              value={formData.discount_amount}
              onChange={handleInputChange}
              className="w-32"
            />
          </div>
          <div className="text-lg font-bold">
            Grand Total: {formatNaira(calculateInvoiceTotal(), true)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Additional notes for the invoice"
          value={formData.notes}
          onChange={handleInputChange}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
        <Textarea
          id="terms_and_conditions"
          name="terms_and_conditions"
          placeholder="Terms and conditions for the invoice"
          value={formData.terms_and_conditions}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={() => { isEdit ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false); resetForm(); }}>
          Cancel
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          {isEdit ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-green-600" />
            <p>Loading invoices...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your invoices and billing</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>
                    Create a new invoice for your customer
                  </DialogDescription>
                </DialogHeader>
                <InvoiceForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices by number, customer, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
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

        {/* Invoice List */}
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
                {/* Mobile Card View */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
                  {filteredInvoices.map((invoice) => (
                    <InvoiceCard key={invoice.id} invoice={invoice} />
                  ))}
                </div>

                {/* Desktop Table View */}
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
                      {filteredInvoices.map((invoice) => {
                        const customer = customers.find(c => c.id === invoice.customer_id);
                        const customerName = customer ? customer.name : 'Unknown Customer';
                        const invoiceNumber = invoice.invoice_number || invoice.id?.substring(0, 8).toUpperCase() || '';

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
                                  onValueChange={(newStatus) => handleStatusUpdate(invoice.id, newStatus)}
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Invoice</DialogTitle>
              <DialogDescription>
                Update invoice details
              </DialogDescription>
            </DialogHeader>
            <InvoiceForm isEdit={true} />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;