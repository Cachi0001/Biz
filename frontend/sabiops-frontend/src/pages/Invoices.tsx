import React, { useState, useEffect, memo } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Edit, Trash2, Download, Send, Eye, Filter, Calendar, DollarSign, User, FileText, RefreshCw } from 'lucide-react';
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
import useDebugRenders from '../hooks/useDebugRenders';

// Enhanced debugging hook for Invoices component
const useInvoicesDebug = () => {
  const renderCountRef = React.useRef(0);
  const lastRenderTimeRef = React.useRef(Date.now());
  
  renderCountRef.current += 1;
  const currentTime = Date.now();
  const timeSinceLastRender = currentTime - lastRenderTimeRef.current;
  lastRenderTimeRef.current = currentTime;
  
  console.log(`🏢 Invoices component rendered #${renderCountRef.current}`, {
    timestamp: new Date().toISOString(),
    timeSinceLastRender: `${timeSinceLastRender}ms`,
    stackTrace: new Error().stack?.split('\n').slice(2, 5).join('\n')
  });
  
  return { renderCount: renderCountRef.current, timeSinceLastRender };
};

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
  useDebugRenders('Invoices');
  const { renderCount, timeSinceLastRender } = useInvoicesDebug();

  // State with debugging
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state with debugging
  const [customerId, setCustomerId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    {
      id: Date.now(),
      product_id: '',
      description: '',
      quantity: 1,
      unit_price: 0
    }
  ]);

  // Debug state changes
  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`📊 Invoices state changed - customerId:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: customerId,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [customerId, renderCount]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`📊 Invoices state changed - issueDate:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: issueDate,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [issueDate, renderCount]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`📊 Invoices state changed - dueDate:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: dueDate,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [dueDate, renderCount]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`📊 Invoices state changed - discountAmount:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: discountAmount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [discountAmount, renderCount]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`📊 Invoices state changed - notes:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: notes,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [notes, renderCount]);

  useEffect(() => {
    console.log(`📊 Invoices state changed - invoiceItems:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      itemCount: invoiceItems.length,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [invoiceItems, renderCount]);

  // Debug dialog state changes
  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`🚪 Dialog state changed - showAddDialog:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: showAddDialog,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [showAddDialog, renderCount]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`🚪 Dialog state changed - showEditDialog:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: showEditDialog,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [showEditDialog, renderCount]);

  // Debug loading and error state changes
  useEffect(() => {
    console.log(`📊 Invoices state changed - loading:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: loading,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [loading, renderCount]);

  useEffect(() => {
    console.log(`📊 Invoices state changed - error:`, {
      timestamp: new Date().toISOString(),
      renderCount,
      value: error,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
  }, [error, renderCount]);

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

  // Simple handlers for individual fields
  const handleCustomerIdChange = (value: string) => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log('🎯 Customer ID changed:', {
      timestamp: new Date().toISOString(),
      value,
      renderCount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
    setCustomerId(value);
  };

  const handleIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log('🎯 Issue date changed:', {
      timestamp: new Date().toISOString(),
      value: e.target.value,
      renderCount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
    setIssueDate(e.target.value);
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log('🎯 Due date changed:', {
      timestamp: new Date().toISOString(),
      value: e.target.value,
      renderCount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
    setDueDate(e.target.value);
  };

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log('🎯 Discount amount changed:', {
      timestamp: new Date().toISOString(),
      value: e.target.value,
      renderCount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
    setDiscountAmount(e.target.value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log('🎯 Notes changed:', {
      timestamp: new Date().toISOString(),
      value: e.target.value,
      renderCount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
    setNotes(e.target.value);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const activeElement = document.activeElement as HTMLInputElement | null;
    console.log(`🎯 Item ${index} ${field} changed:`, {
      timestamp: new Date().toISOString(),
      index,
      field,
      value,
      renderCount,
      activeElement: activeElement?.tagName,
      activeElementName: activeElement?.name,
      stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
    });
    setInvoiceItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Global focus monitoring
  useEffect(() => {
    const handleGlobalFocusChange = () => {
      const activeElement = document.activeElement as HTMLInputElement | null;
      console.log(`🌍 Global focus changed:`, {
        timestamp: new Date().toISOString(),
        renderCount,
        activeElement: activeElement?.tagName,
        activeElementId: activeElement?.id,
        activeElementName: activeElement?.name,
        activeElementValue: activeElement?.value,
        stackTrace: new Error().stack?.split('\n').slice(2, 4).join('\n')
      });
    };

    // Monitor focus changes
    document.addEventListener('focusin', handleGlobalFocusChange);
    document.addEventListener('focusout', handleGlobalFocusChange);

    return () => {
      document.removeEventListener('focusin', handleGlobalFocusChange);
      document.removeEventListener('focusout', handleGlobalFocusChange);
    };
  }, [renderCount]);

  const addItem = () => {
    setInvoiceItems(prev => [...prev, { id: Date.now() + Math.random(), product_id: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateItemTotal = (item: any) => {
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
    const itemsTotal = invoiceItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = Math.max(0, parseFloat(discountAmount as any) || 0);
    const total = itemsTotal - discount;

    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!customerId) {
      errors.push('Please select a customer');
    }

    if (!issueDate) {
      errors.push('Issue date is required');
    }

    if (!invoiceItems || invoiceItems.length === 0) {
      errors.push('At least one item is required');
    }

    invoiceItems.forEach((item, index) => {
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
    console.log('Invoices form submitted');

    const errors = validateForm();
    if (errors.length > 0) {
      showErrorToast(errors[0]);
      return false;
    }

    try {
      setSubmitting(true);

      const invoiceData = {
        customer_id: customerId,
        issue_date: issueDate,
        due_date: dueDate || null,
        discount_amount: parseFloat(discountAmount as any) || 0,
        notes: notes,
        items: invoiceItems.map(item => ({
          product_id: item.product_id,
          description: item.description,
          quantity: parseInt(item.quantity) || 1,
          unit_price: parseFloat(item.unit_price) || 0
        }))
      };

      let response;
      if (editingInvoice) {
        response = await updateInvoice(editingInvoice.id, invoiceData);
        showSuccessToast('Invoice updated successfully!');
      } else {
        response = await createInvoice(invoiceData);
        showSuccessToast('Invoice created successfully!');
      }

      setShowAddDialog(false);
      setShowEditDialog(false);
      setEditingInvoice(null);
      resetForm();
      await fetchInvoices();

      return true;
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to save invoice');
      return false;
    } finally {
      setSubmitting(false);
    }
  };



  const resetForm = () => {
    setCustomerId('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setDiscountAmount('0');
    setNotes('');
    setInvoiceItems([{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleEdit = async (invoiceId: string) => {
    try {
      const invoice = await getInvoice(invoiceId);
      setEditingInvoice(invoice);
      setCustomerId(invoice.customer_id || '');
      setIssueDate(invoice.issue_date || new Date().toISOString().split('T')[0]);
      setDueDate(invoice.due_date || '');
      setDiscountAmount((invoice.discount_amount || 0).toString());
      setNotes(invoice.notes || '');
      setInvoiceItems(invoice.items || [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0 }]);
      setShowEditDialog(true);
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to load invoice for editing');
    }
  };

  const handleDelete = async (invoiceId: string) => {
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

  const handleDownloadPdf = async (invoiceId: string) => {
    try {
      await downloadInvoicePdf(invoiceId);
      showSuccessToast('PDF downloaded successfully!');
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to download PDF');
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await sendInvoice(invoiceId);
      showSuccessToast('Invoice sent successfully!');
      await fetchInvoices();
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to send invoice');
    }
  };

  const handleStatusUpdate = async (invoiceId: string, newStatus: Invoice["status"]) => {
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

  const getStatusBadge = (status: Invoice["status"]) => {
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

  const InvoiceForm = ({ isEdit }: { isEdit?: boolean }) => {
    console.log(`📝 InvoiceForm rendered (isEdit: ${isEdit})`, {
      timestamp: new Date().toISOString(),
      renderCount,
      customerId,
      issueDate,
      dueDate,
      discountAmount,
      notes,
      invoiceItemsLength: invoiceItems.length
    });

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Test input to isolate focus issue */}
        <div className="space-y-2">
          <Label htmlFor="test_input" className="text-base">Test Input (Debug)</Label>
          <StableInput
            id="test_input"
            name="test_input"
            value="test value"
            onChange={(e) => console.log('Test input changed:', e.target.value)}
            placeholder="Test input for debugging"
            className="h-12 text-base touch-manipulation"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customer_id" className="text-base">Customer *</Label>
            <Select value={customerId} onValueChange={handleCustomerIdChange}>
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
              value={issueDate}
              onChange={handleIssueDateChange}
              className="h-12 text-base touch-manipulation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-base">Due Date</Label>
            <StableInput
              id="due_date"
              name="due_date"
              type="date"
              value={dueDate}
              onChange={handleDueDateChange}
              className="h-12 text-base touch-manipulation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount_amount" className="text-base">Discount Amount</Label>
            <StableInput
              id="discount_amount"
              name="discount_amount"
              type="number"
              value={discountAmount}
              onChange={handleDiscountAmountChange}
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
            value={notes}
            onChange={handleNotesChange}
            placeholder="Additional notes..."
            className="min-h-[100px] text-base touch-manipulation"
          />
        </div>

        {/* Invoice Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Invoice Items</Label>
            <Button type="button" onClick={addItem} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {invoiceItems.map((item, index) => (
            <Card key={item.id} className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Product</Label>
                  <Select 
                    value={item.product_id} 
                    onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                  >
                    <SelectTrigger className="h-10 text-sm touch-manipulation">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  <StableInput
                    name={`item_${index}_description`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                    className="h-10 text-sm touch-manipulation"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Quantity</Label>
                  <StableInput
                    name={`item_${index}_quantity`}
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="1"
                    className="h-10 text-sm touch-manipulation"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Unit Price</Label>
                  <StableInput
                    name={`item_${index}_unit_price`}
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="h-10 text-sm touch-manipulation"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Total: {formatNaira(calculateItemTotal(item), true)}
                </div>
                {invoiceItems.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeItem(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-lg font-semibold">Total Amount:</span>
          <span className="text-2xl font-bold text-green-600">
            {formatNaira(calculateInvoiceTotal(), true)}
          </span>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-base touch-manipulation">
            {isEdit ? 'Update Invoice' : 'Create Invoice'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setShowAddDialog(false);
              setShowEditDialog(false);
              resetForm();
            }}
            className="h-12 text-base touch-manipulation"
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  };

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your invoices and billing</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="h-12 text-base touch-manipulation"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                  <div className="flex-1 overflow-y-auto px-1">
                    <InvoiceForm />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
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
                    fetchInvoices();
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* No Invoices State */}
          {!loading && invoices.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-gray-900">No invoices found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first invoice</p>
                <Button
                  onClick={() => setShowAddDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          {invoices.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <StableInput
                        placeholder="Search invoices by number, customer, or notes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-12 text-base touch-manipulation"
                      />
                    </div>
                  </div>
                  <div className="w-full">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-12 text-base touch-manipulation">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
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
          )}

          {/* Invoices Display */}
          {!loading && invoices.length > 0 && (
            <div className="space-y-4">
              {/* Mobile Cards */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard key={invoice.id} invoice={invoice} />
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block">
                <Card>
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
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}

          {/* Edit Dialog */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Edit Invoice</DialogTitle>
                <DialogDescription>
                  Update invoice information
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <InvoiceForm isEdit />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default memo(Invoices);