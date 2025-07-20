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
import SearchableSelect from '../components/ui/SearchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Edit, Trash2, Download, Send, Filter, RefreshCw, Eye } from 'lucide-react';
import { getInvoices, getCustomers, getProducts, updateInvoice, createInvoice, getInvoice, deleteInvoice, downloadInvoicePdf, sendInvoice, updateInvoiceStatus } from "../services/api";
import { handleApiError, showSuccessToast, showErrorToast, safeArray } from '../utils/errorHandling';
import { useFormValidation } from '../hooks/useFormValidation';
import { handleFormSubmissionError, handleInvoiceError } from '../services/apiErrorHandler';
import ErrorMessage, { FieldError, ErrorList } from '../components/ui/ErrorMessage';
import FormField, { FormFieldGroup, FormRow } from '../components/ui/FormField';
import { formatCurrency, formatNaira, formatDate, formatInvoiceStatus, getStatusColor } from '../utils/formatting';
import BackButton from '../components/ui/BackButton';
import ReviewDialog from '../components/invoice/ReviewDialog';
import { useUsageTracking } from '../hooks/useUsageTracking';
import UsageLimitPrompt from '../components/subscription/UsageLimitPrompt';

import { Invoice, Customer, Product } from '../types/invoice';

const Invoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);

  // Focus management for accessibility
  const [focusedElement, setFocusedElement] = useState(null);
  const formRef = React.useRef(null);
  const firstFieldRef = React.useRef(null);

  // Enhanced keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global keyboard shortcuts for accessibility
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'n':
            // Ctrl+N to create new invoice
            e.preventDefault();
            setIsCreateDialogOpen(true);
            break;
          case 'f':
            // Ctrl+F to focus search
            e.preventDefault();
            const searchInput = document.querySelector('input[role="searchbox"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
            break;
          case 'r':
            // Ctrl+R to refresh (prevent default browser refresh)
            e.preventDefault();
            handleRefresh();
            break;
        }
      }

      // Escape key to close dialogs
      if (e.key === 'Escape') {
        if (isCreateDialogOpen) {
          setIsCreateDialogOpen(false);
        } else if (isEditDialogOpen) {
          setIsEditDialogOpen(false);
        } else if (isReviewDialogOpen) {
          setIsReviewDialogOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCreateDialogOpen, isEditDialogOpen, isReviewDialogOpen]);

  // Focus management when dialogs open
  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      // Focus first field when form dialog opens
      setTimeout(() => {
        const firstInput = document.querySelector('#field-customer_id') as HTMLInputElement;
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, [isCreateDialogOpen, isEditDialogOpen]);

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

  // Enhanced form validation with real-time error handling
  const {
    errors,
    itemErrors,
    touchedFields,
    isValidating,
    isValid,
    touchField,
    touchItemField,
    validateSingleField,
    validateItemField,
    validateForm: validateFormWithHook,
    clearErrors,
    getFieldError,
    getItemFieldError,
    hasFieldError,
    hasItemFieldError,
    getAllErrors,
    setExternalErrors
  } = useFormValidation(formData);

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

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Apply validation for specific fields
    let processedValue: any = value;
    if (name === 'discount_amount') {
      // Prevent negative discount amounts
      processedValue = value === '' ? '0' : Math.max(0, parseFloat(value) || 0).toString();
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    // Mark field as touched and validate
    touchField(name);
    await validateSingleField(name, processedValue, { ...formData, [name]: processedValue });
  };

  const handleItemChange = async (index: number, field: string, value: any) => {
    // Prevent form submission on Enter key or event objects
    if (typeof value === 'object' && value.preventDefault) {
      value.preventDefault();
      return;
    }

    // Apply validation for specific fields
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

        // Auto-populate product details when product is selected
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

    // Mark item field as touched and validate
    touchItemField(index, field);
    const updatedItem = { ...formData.items[index], [field]: processedValue };
    await validateItemField(index, field, updatedItem);
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
    // Prevent negative values using Math.max()
    const quantity = Math.max(0, parseFloat(item.quantity) || 0);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);

    // Limit discount rates to 0-100% range
    const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);
    total += total * (taxRate / 100);

    // Add proper rounding to 2 decimal places using Math.round()
    return Math.round(total * 100) / 100;
  };

  const calculateInvoiceTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    // Prevent negative discount amounts
    const discount = Math.max(0, parseFloat(formData.discount_amount as any) || 0);
    const total = itemsTotal - discount;

    // Add proper rounding to 2 decimal places using Math.round()
    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

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
    // Prevent all form submission behaviors
    e.preventDefault();
    e.stopPropagation();

    // Use enhanced validation system
    const validationResult = validateFormWithHook(formData);

    if (validationResult.hasErrors) {
      // Show comprehensive error list
      const allErrors: string[] = [];
      Object.values(validationResult.formErrors).forEach((error: any) => allErrors.push(error));
      validationResult.itemErrors.forEach((itemError: any, index: number) => {
        if (itemError) {
          Object.values(itemError).forEach((error: any) => {
            allErrors.push(`Item ${index + 1}: ${error}`);
          });
        }
      });

      if (allErrors.length === 1) {
        showErrorToast(allErrors[0]);
      } else {
        showErrorToast(`Please fix ${allErrors.length} errors before submitting`);
      }
      return false;
    }

    // Show review dialog instead of directly submitting
    setIsReviewDialogOpen(true);
    return true;
  };

  const handleReviewConfirm = async () => {
    try {
      setLoading(true);
      console.log('[INVOICES] Submitting invoice data:', formData);

      // Format data for backend with proper validation
      const invoiceData = {
        customer_id: formData.customer_id, // UUID as string
        issue_date: formData.issue_date,
        due_date: formData.due_date || null,
        payment_terms: formData.payment_terms || 'Net 30',
        notes: formData.notes || '',
        terms_and_conditions: formData.terms_and_conditions || 'Payment is due within 30 days of invoice date.',
        currency: formData.currency || 'NGN',
        discount_amount: parseFloat(formData.discount_amount as any) || 0,
        items: formData.items.map(item => ({
          product_id: item.product_id || null, // UUID as string
          description: item.description.trim(),
          quantity: parseInt(item.quantity as any),
          unit_price: parseFloat(item.unit_price as any),
          tax_rate: parseFloat(item.tax_rate as any) || 0,
          discount_rate: parseFloat(item.discount_rate as any) || 0,
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

      setIsReviewDialogOpen(false);
      resetForm();
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      handleApiError(error, 'Invoice Save');
      // Keep review dialog open on error so user can retry or go back to edit
      // setIsReviewDialogOpen(false); // Don't close on error
    } finally {
      setLoading(false);
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
    const invoiceNumber = invoice.invoice_number || (typeof invoice.id === 'string' ? invoice.id.substring(0, 8).toUpperCase() : '') || '';

    // Search filter
    const matchesSearch = !searchTerm ||
      invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus = !statusFilter || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Mobile card component for invoices - Enhanced for touch accessibility
  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const customerName = customer ? customer.name : 'Unknown Customer';
    const invoiceNumber = invoice.invoice_number || (typeof invoice.id === 'string' ? invoice.id.substring(0, 8).toUpperCase() : '') || '';

    return (
      <Card className="bg-white border-2 border-gray-200 hover:shadow-lg transition-all duration-200 touch-manipulation">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Header with invoice number and status - Enhanced spacing */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {invoiceNumber}
                </h3>
                <p className="text-base text-gray-600 truncate mt-1">
                  {customerName}
                </p>
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(invoice.status)}
              </div>
            </div>

            {/* Invoice details - Enhanced spacing and readability */}
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-gray-500 font-medium">Issue Date:</span>
                <span className="text-gray-900 font-medium">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-500 font-medium">Due Date:</span>
                <span className="text-gray-900 font-medium">
                  {invoice.due_date ? formatDate(invoice.due_date) : 'N/A'}
                </span>
              </div>
            </div>

            {/* Amount - Enhanced visibility */}
            <div className="pt-3 border-t-2 border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-base text-gray-500 font-medium">Total Amount:</span>
                <span className="text-xl font-bold text-green-600">
                  {formatCurrency(invoice.total_amount, true, invoice.currency || 'NGN')}
                </span>
              </div>
            </div>

            {/* Actions - Mobile-optimized with proper touch targets */}
            <div className="pt-3 border-t-2 border-gray-100 space-y-3">
              {/* Action buttons - Full width on mobile */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(invoice.id)}
                  className="min-h-[44px] flex flex-col items-center justify-center p-2 touch-manipulation hover:bg-blue-50"
                >
                  <Edit className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-xs text-blue-600 font-medium">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadPdf(invoice.id)}
                  className="min-h-[44px] flex flex-col items-center justify-center p-2 touch-manipulation hover:bg-green-50"
                >
                  <Download className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-xs text-green-600 font-medium">PDF</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSendInvoice(invoice.id)}
                  className="min-h-[44px] flex flex-col items-center justify-center p-2 touch-manipulation hover:bg-purple-50"
                >
                  <Send className="h-5 w-5 text-purple-600 mb-1" />
                  <span className="text-xs text-purple-600 font-medium">Send</span>
                </Button>
              </div>

              {/* Status and Delete - Full width controls */}
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={invoice.status}
                  onValueChange={(newStatus: string) => handleStatusUpdate(invoice.id, newStatus)}
                >
                  <SelectTrigger className="h-12 min-h-[48px] text-base touch-manipulation">
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
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(invoice.id)}
                  className="min-h-[48px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 touch-manipulation"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  <span className="font-medium">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const InvoiceForm = ({ isEdit }: { isEdit?: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {/* Show form-level errors */}
      {Object.keys(errors).length > 0 && (
        <ErrorList
          errors={Object.values(errors)}
          className="mb-6"
        />
      )}

      {/* Mobile-first responsive grid - single column on mobile, 2 columns on larger screens */}
      <FormRow columns={2}>
        <FormField
          type="select"
          label="Customer"
          name="customer_id"
          value={formData.customer_id}
          onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, customer_id: value }));
            touchField("customer_id");
            await validateSingleField("customer_id", value, { ...formData, customer_id: value });
          }}
          onBlur={() => touchField('customer_id')}
          error={getFieldError('customer_id')}
          touched={touchedFields.has('customer_id')}
          required
          placeholder="Search and select a customer..."
          disabled={customers.length === 0}
          className={hasFieldError('customer_id') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Select customer for invoice"
          aria-describedby={hasFieldError('customer_id') ? 'customer_id-error' : 'customer_id-help'}
          aria-required="true"
        >
          {customers.length === 0 ? (
            <SelectItem value="" disabled>
              No customers available. Please add a customer first.
            </SelectItem>
          ) : (
            customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))
          )}
        </FormField>

        <FormField
          type="date"
          label="Issue Date"
          name="issue_date"
          value={formData.issue_date}
          onChange={handleInputChange}
          onBlur={() => touchField('issue_date')}
          error={getFieldError('issue_date')}
          touched={touchedFields.has('issue_date')}
          required
          className={hasFieldError('issue_date') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Invoice issue date"
          aria-describedby={hasFieldError('issue_date') ? 'issue_date-error' : 'issue_date-help'}
          aria-required="true"
        />

        <FormField
          type="date"
          label="Due Date"
          name="due_date"
          value={formData.due_date}
          onChange={handleInputChange}
          onBlur={() => touchField('due_date')}
          error={getFieldError('due_date')}
          touched={touchedFields.has('due_date')}
          className={hasFieldError('due_date') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Invoice due date (optional)"
          aria-describedby={hasFieldError('due_date') ? 'due_date-error' : 'due_date-help'}
        />

        <FormField
          type="input"
          label="Payment Terms"
          name="payment_terms"
          value={formData.payment_terms}
          onChange={handleInputChange}
          onBlur={() => touchField('payment_terms')}
          error={getFieldError('payment_terms')}
          touched={touchedFields.has('payment_terms')}
          placeholder="e.g., Net 30"
          className={hasFieldError('payment_terms') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Payment terms for invoice"
          aria-describedby={hasFieldError('payment_terms') ? 'payment_terms-error' : 'payment_terms-help'}
        />

        <FormField
          type="select"
          label="Currency"
          name="currency"
          value={formData.currency}
          onChange={async (e: React.ChangeEvent<HTMLSelectElement>) => {
            const value = e.target.value;
            setFormData(prev => ({ ...prev, currency: value }));
            touchField("currency");
            await validateSingleField("currency", value, { ...formData, currency: value });
          }}
          onBlur={() => touchField('currency')}
          error={getFieldError('currency')}
          touched={touchedFields.has('currency')}
          className={hasFieldError('currency') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Select currency for invoice"
          aria-describedby={hasFieldError('currency') ? 'currency-error' : 'currency-help'}
        >
          <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
          <SelectItem value="USD">US Dollar ($)</SelectItem>
          <SelectItem value="EUR">Euro (€)</SelectItem>
          <SelectItem value="GBP">British Pound (£)</SelectItem>
          <SelectItem value="ZAR">South African Rand (R)</SelectItem>
          <SelectItem value="GHS">Ghanaian Cedi (₵)</SelectItem>
          <SelectItem value="KES">Kenyan Shilling (KSh)</SelectItem>
        </FormField>
      </FormRow>

      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <Label className="text-base font-medium">Invoice Items *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
        {formData.items.map((item, index) => (
          <Card key={item.id} className="p-4 sm:p-6 mb-4 border-2 border-gray-100">
            {/* Mobile-first layout with enhanced spacing */}
            <div className="space-y-4 sm:space-y-6">
              {/* Product Selection - Full width on mobile, better spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor={`product_id-${index}`} className="text-sm font-medium">Product</Label>
                  <Select
                    value={item.product_id}
                    onValueChange={(value: string) => handleItemChange(index, 'product_id', value)}
                  >
                    <SelectTrigger
                      id={`product_id-${index}`}
                      className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                      aria-label={`Select product for item ${index + 1}`}
                      aria-describedby={`product_id-${index}-help`}
                    >
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
                  <Label htmlFor={`description-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'description') ? 'text-red-700' : ''}`}>
                    Description *
                  </Label>
                  <Input
                    id={`description-${index}`}
                    name="description"
                    value={item.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleItemChange(index, 'description', e.target.value)}
                    onBlur={() => touchItemField(index, 'description')}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder="Item description"
                    className={`h-12 min-h-[48px] text-base sm:text-sm touch-manipulation ${hasItemFieldError(index, 'description') ? 'border-red-500 bg-red-50' : ''
                      }`}
                    required
                    aria-label={`Description for item ${index + 1}`}
                    aria-describedby={hasItemFieldError(index, 'description') ? `description-${index}-error` : `description-${index}-help`}
                    aria-required="true"
                  />
                  {getItemFieldError(index, 'description') && (
                    <FieldError error={getItemFieldError(index, 'description')} />
                  )}
                </div>
              </div>

              {/* Quantity and Pricing - Mobile-optimized grid with error handling */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`quantity-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'quantity') ? 'text-red-700' : ''}`}>
                    Qty *
                  </Label>
                  <Input
                    id={`quantity-${index}`}
                    name="quantity"
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'quantity', e.target.value)}
                    onBlur={() => touchItemField(index, 'quantity')}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className={`h-12 min-h-[48px] text-base sm:text-sm touch-manipulation ${hasItemFieldError(index, 'quantity') ? 'border-red-500 bg-red-50' : ''
                      }`}
                    required
                    aria-label={`Quantity for item ${index + 1}`}
                    aria-describedby={hasItemFieldError(index, 'quantity') ? `quantity-${index}-error` : `quantity-${index}-help`}
                    aria-required="true"
                  />
                  {getItemFieldError(index, 'quantity') && (
                    <FieldError error={getItemFieldError(index, 'quantity')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`unit_price-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'unit_price') ? 'text-red-700' : ''}`}>
                    Unit Price (₦) *
                  </Label>
                  <Input
                    id={`unit_price-${index}`}
                    name="unit_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'unit_price', e.target.value)}
                    onBlur={() => touchItemField(index, 'unit_price')}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className={`h-12 min-h-[48px] text-base sm:text-sm touch-manipulation ${hasItemFieldError(index, 'unit_price') ? 'border-red-500 bg-red-50' : ''
                      }`}
                    required
                    aria-label={`Unit price for item ${index + 1} in Naira`}
                    aria-describedby={hasItemFieldError(index, 'unit_price') ? `unit_price-${index}-error` : `unit_price-${index}-help`}
                    aria-required="true"
                  />
                  {getItemFieldError(index, 'unit_price') && (
                    <FieldError error={getItemFieldError(index, 'unit_price')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tax_rate-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'tax_rate') ? 'text-red-700' : ''}`}>
                    Tax (%)
                  </Label>
                  <Input
                    id={`tax_rate-${index}`}
                    name="tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={item.tax_rate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'tax_rate', e.target.value)}
                    onBlur={() => touchItemField(index, 'tax_rate')}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className={`h-12 min-h-[48px] text-base sm:text-sm touch-manipulation ${hasItemFieldError(index, 'tax_rate') ? 'border-red-500 bg-red-50' : ''
                      }`}
                    aria-label={`Tax rate for item ${index + 1} (0-100%)`}
                    aria-describedby={hasItemFieldError(index, 'tax_rate') ? `tax_rate-${index}-error` : `tax_rate-${index}-help`}
                  />
                  {getItemFieldError(index, 'tax_rate') && (
                    <FieldError error={getItemFieldError(index, 'tax_rate')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`discount_rate-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'discount_rate') ? 'text-red-700' : ''}`}>
                    Discount (%)
                  </Label>
                  <Input
                    id={`discount_rate-${index}`}
                    name="discount_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={item.discount_rate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'discount_rate', e.target.value)}
                    onBlur={() => touchItemField(index, 'discount_rate')}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    className={`h-12 min-h-[48px] text-base sm:text-sm touch-manipulation ${hasItemFieldError(index, 'discount_rate') ? 'border-red-500 bg-red-50' : ''
                      }`}
                    aria-label={`Discount rate for item ${index + 1} (0-100%)`}
                    aria-describedby={hasItemFieldError(index, 'discount_rate') ? `discount_rate-${index}-error` : `discount_rate-${index}-help`}
                  />
                  {getItemFieldError(index, 'discount_rate') && (
                    <FieldError error={getItemFieldError(index, 'discount_rate')} />
                  )}
                </div>
              </div>

              {/* Item total and remove button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-200">
                <div className="text-base font-medium text-gray-900">
                  Item Total: <span className="text-green-600">{formatCurrency(calculateItemTotal(item), true, formData.currency || 'NGN')}</span>
                </div>
                {formData.items.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-h-[44px] touch-manipulation"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Item
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Additional form fields with error handling */}
      <FormRow columns={2}>
        <FormField
          type="number"
          label="Discount Amount (₦)"
          name="discount_amount"
          value={formData.discount_amount}
          onChange={handleInputChange}
          onBlur={() => touchField('discount_amount')}
          error={getFieldError('discount_amount')}
          touched={touchedFields.has('discount_amount')}
          min="0"
          step="0.01"
          placeholder="0.00"
          className={hasFieldError('discount_amount') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Overall discount amount in Naira"
          aria-describedby={hasFieldError('discount_amount') ? 'discount_amount-error' : 'discount_amount-help'}
        />

        <div className="space-y-2">
          <Label className="text-sm font-medium">Invoice Total</Label>
          <div className="h-12 min-h-[48px] px-3 py-2 bg-gray-50 border border-gray-300 rounded-md flex items-center text-base sm:text-sm font-semibold text-green-600">
            {formatCurrency(calculateInvoiceTotal(), true, formData.currency || 'NGN')}
          </div>
        </div>
      </FormRow>

      <FormRow columns={1}>
        <FormField
          type="textarea"
          label="Notes"
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          onBlur={() => touchField('notes')}
          error={getFieldError('notes')}
          touched={touchedFields.has('notes')}
          placeholder="Additional notes for this invoice..."
          className={hasFieldError('notes') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Additional notes for invoice"
          aria-describedby={hasFieldError('notes') ? 'notes-error' : 'notes-help'}
        />

        <FormField
          type="textarea"
          label="Terms and Conditions"
          name="terms_and_conditions"
          value={formData.terms_and_conditions}
          onChange={handleInputChange}
          onBlur={() => touchField('terms_and_conditions')}
          error={getFieldError('terms_and_conditions')}
          touched={touchedFields.has('terms_and_conditions')}
          placeholder="Terms and conditions for this invoice..."
          className={hasFieldError('terms_and_conditions') ? 'border-red-500 bg-red-50' : ''}
          aria-label="Terms and conditions for invoice"
          aria-describedby={hasFieldError('terms_and_conditions') ? 'terms_and_conditions-error' : 'terms_and_conditions-help'}
        />
      </FormRow>

      {/* Form submission buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <Button
          type="submit"
          className="flex-1 min-h-[48px] touch-manipulation"
          disabled={loading || isValidating}
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              {isEdit ? 'Update Invoice' : 'Review & Create Invoice'}
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            resetForm();
            clearErrors();
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
          }}
          className="flex-1 sm:flex-initial min-h-[48px] touch-manipulation"
          disabled={loading}
        >
          Cancel
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
          {/* Header - Mobile-optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your invoices and billing</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 touch-manipulation"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
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

          {/* Filters and Search - Mobile-optimized */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
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
                  {/* Mobile Card View - Enhanced responsive grid */}
                  <div className="grid grid-cols-1 gap-4 sm:gap-6 md:hidden">
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

          {/* Edit Dialog */}
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

          {/* Review Dialog */}
          <ReviewDialog
            isOpen={isReviewDialogOpen}
            onClose={() => setIsReviewDialogOpen(false)}
            invoiceData={formData}
            customers={customers}
            products={products}
            onConfirm={handleReviewConfirm}
            onCancel={handleReviewCancel}
            isEdit={!!selectedInvoice}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { formatCurrency, formatNaira, formatDate } from '../../utils/formatting';
import { getProfile } from '../../services/api';
import { showErrorToast } from '../../utils/errorHandling';
import { Building2, User, Calendar, CreditCard, FileText, Package } from 'lucide-react';

const ReviewDialog = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  customers, 
  products, 
  onConfirm, 
  onCancel,
  isEdit = false 
}) => {
  const [sellerInfo, setSellerInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch seller information when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchSellerInfo();
    }
  }, [isOpen]);

  const fetchSellerInfo = async () => {
    try {
      setLoading(true);
      const profile = await getProfile();
      console.log('[REVIEW_DIALOG] Profile data:', profile);
      
      // Extract seller information from profile
      const seller = {
        name: profile.business_name || profile.full_name || profile.name || 'Your Business',
        address: profile.business_address || profile.address || 'Business Address',
        contact: profile.business_contact || profile.phone || profile.email || 'Contact Information',
        email: profile.email || '',
        phone: profile.phone || profile.business_phone || ''
      };
      
      setSellerInfo(seller);
    } catch (error) {
      console.error('Failed to fetch seller info:', error);
      // Use fallback seller information
      setSellerInfo({
        name: 'Your Business',
        address: 'Business Address',
        contact: 'Contact Information',
        email: '',
        phone: ''
      });
      showErrorToast('Could not load seller information');
    } finally {
      setLoading(false);
    }
  };

  // Get customer information
  const getCustomerInfo = () => {
    if (!invoiceData.customer_id) return null;
    return customers.find(c => c.id === invoiceData.customer_id) || null;
  };

  // Get product information for an item
  const getProductInfo = (productId) => {
    if (!productId) return null;
    return products.find(p => p.id === productId) || null;
  };

  // Calculate item total
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

  // Calculate invoice total
  const calculateInvoiceTotal = () => {
    const itemsTotal = invoiceData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = Math.max(0, parseFloat(invoiceData.discount_amount) || 0);
    const total = itemsTotal - discount;
    
    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const customer = getCustomerInfo();
  const invoiceTotal = calculateInvoiceTotal();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  if (!invoiceData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-auto"
        aria-labelledby="review-dialog-title"
        aria-describedby="review-dialog-description"
        role="dialog"
        aria-modal="true"
      >
        <DialogHeader>
          <DialogTitle 
            id="review-dialog-title"
            className="flex items-center gap-2"
          >
            <FileText className="h-5 w-5" aria-hidden="true" />
            {isEdit ? 'Review Invoice Changes' : 'Review New Invoice'}
          </DialogTitle>
          <DialogDescription id="review-dialog-description">
            Please review all invoice details before {isEdit ? 'updating' : 'creating'} the invoice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Seller and Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Building2 className="h-4 w-4" />
                    From (Seller)
                  </div>
                  {loading ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ) : sellerInfo ? (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                      <div className="font-semibold text-gray-900">{sellerInfo.name}</div>
                      <div className="text-sm text-gray-600">{sellerInfo.address}</div>
                      <div className="text-sm text-gray-600">{sellerInfo.contact}</div>
                      {sellerInfo.email && (
                        <div className="text-sm text-gray-600">{sellerInfo.email}</div>
                      )}
                      {sellerInfo.phone && sellerInfo.phone !== sellerInfo.contact && (
                        <div className="text-sm text-gray-600">{sellerInfo.phone}</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600">Seller information not available</div>
                    </div>
                  )}
                </div>

                {/* Customer Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <User className="h-4 w-4" />
                    To (Customer)
                  </div>
                  {customer ? (
                    <div className="bg-blue-50 p-4 rounded-lg space-y-1">
                      <div className="font-semibold text-gray-900">{customer.name}</div>
                      {customer.email && (
                        <div className="text-sm text-gray-600">{customer.email}</div>
                      )}
                      {customer.phone && (
                        <div className="text-sm text-gray-600">{customer.phone}</div>
                      )}
                      {customer.address && (
                        <div className="text-sm text-gray-600">{customer.address}</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-sm text-red-600">Customer not selected</div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Invoice Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Issue Date
                  </div>
                  <div className="text-sm font-semibold">
                    {formatDate(invoiceData.issue_date)}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </div>
                  <div className="text-sm font-semibold">
                    {invoiceData.due_date ? formatDate(invoiceData.due_date) : 'Not specified'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <CreditCard className="h-4 w-4" />
                    Payment Terms
                  </div>
                  <div className="text-sm font-semibold">
                    {invoiceData.payment_terms || 'Net 30'}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600">Currency</div>
                  <Badge variant="outline" className="text-xs">
                    {invoiceData.currency || 'NGN'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Invoice Items ({invoiceData.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoiceData.items && invoiceData.items.length > 0 ? (
                <div className="space-y-4">
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-sm font-medium text-gray-600">Description</th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600">Qty</th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">Unit Price</th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600">Tax %</th>
                            <th className="text-center py-2 text-sm font-medium text-gray-600">Discount %</th>
                            <th className="text-right py-2 text-sm font-medium text-gray-600">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceData.items.map((item, index) => {
                            const product = getProductInfo(item.product_id);
                            const itemTotal = calculateItemTotal(item);
                            
                            return (
                              <tr key={item.id || index} className="border-b">
                                <td className="py-3">
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {item.description || 'No description'}
                                    </div>
                                    {product && (
                                      <div className="text-xs text-gray-500">
                                        Product: {product.name}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 text-center text-sm">
                                  {item.quantity || 0}
                                </td>
                                <td className="py-3 text-right text-sm">
                                  {formatCurrency(item.unit_price || 0, true, invoiceData.currency || 'NGN')}
                                </td>
                                <td className="py-3 text-center text-sm">
                                  {item.tax_rate || 0}%
                                </td>
                                <td className="py-3 text-center text-sm">
                                  {item.discount_rate || 0}%
                                </td>
                                <td className="py-3 text-right font-semibold">
                                  {formatCurrency(itemTotal, true, invoiceData.currency || 'NGN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-3">
                    {invoiceData.items.map((item, index) => {
                      const product = getProductInfo(item.product_id);
                      const itemTotal = calculateItemTotal(item);
                      
                      return (
                        <Card key={item.id || index} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="font-medium text-gray-900">
                                {item.description || 'No description'}
                              </div>
                              {product && (
                                <div className="text-xs text-gray-500">
                                  Product: {product.name}
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>Quantity: <span className="font-medium">{item.quantity || 0}</span></div>
                                <div>Unit Price: <span className="font-medium">{formatCurrency(item.unit_price || 0, true, invoiceData.currency || 'NGN')}</span></div>
                                <div>Tax: <span className="font-medium">{item.tax_rate || 0}%</span></div>
                                <div>Discount: <span className="font-medium">{item.discount_rate || 0}%</span></div>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Item Total:</span>
                                  <span className="font-bold text-green-600">{formatCurrency(itemTotal, true, invoiceData.currency || 'NGN')}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No items added to this invoice
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    {formatCurrency(invoiceData.items?.reduce((sum, item) => sum + calculateItemTotal(item), 0) || 0, true, invoiceData.currency || 'NGN')}
                  </span>
                </div>
                
                {invoiceData.discount_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overall Discount:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(invoiceData.discount_amount, true, invoiceData.currency || 'NGN')}
                    </span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span className="text-green-600">{formatCurrency(invoiceTotal, true, invoiceData.currency || 'NGN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes and Terms */}
          {(invoiceData.notes || invoiceData.terms_and_conditions) && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoiceData.notes && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Notes:</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      {invoiceData.notes}
                    </div>
                  </div>
                )}
                
                {invoiceData.terms_and_conditions && (
                  <div>
                    <div className="text-sm font-medium text-gray-600 mb-2">Terms and Conditions:</div>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      {invoiceData.terms_and_conditions}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t" role="group" aria-label="Invoice review actions">
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="w-full sm:w-auto min-h-[48px] order-2 sm:order-1"
              aria-label="Cancel and return to edit invoice form"
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
            >
              Back to Edit
            </Button>
            <Button 
              onClick={handleConfirm}
              className="w-full sm:w-auto min-h-[48px] bg-green-600 hover:bg-green-700 order-1 sm:order-2"
              aria-label={isEdit ? 'Confirm and update invoice' : 'Confirm and create invoice'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
            >
              {isEdit ? 'Update Invoice' : 'Create Invoice'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
/**
 * InvoiceForm - Enhanced invoice creation form with focus stability
 * Addresses focus loss issues in invoice creation forms
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import SimpleFocusInput from '../ui/SimpleFocusInput';
import { enhancedGetCustomers, enhancedGetProducts } from '../../services/enhancedApi';

const InvoiceForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: 'Payment is due within 30 days of invoice date.',
    currency: 'NGN',
    discount_amount: 0,
    items: [
      { 
        id: Date.now(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }
    ],
    ...initialData
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load customers and products on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [customersData, productsData] = await Promise.all([
          enhancedGetCustomers(),
          enhancedGetProducts()
        ]);
        
        setCustomers(customersData);
        setProducts(productsData.products || []);
      } catch (error) {
        DebugLogger.logApiError('invoice-form-data-load', error, 'InvoiceForm');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleItemChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value };
        return { ...prev, items: updatedItems };
      });
    });
  }, []);

  const addItem = useCallback(() => {
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, { 
          id: Date.now() + Math.random(), 
          product_id: '', 
          description: '', 
          quantity: 1, 
          unit_price: 0, 
          tax_rate: 0, 
          discount_rate: 0 
        }]
      }));
    });
  }, []);

  const removeItem = useCallback((index) => {
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    });
  }, []);

  const handleProductSelect = useCallback((index, productId) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      FocusManager.preserveFocus(() => {
        setFormData(prev => {
          const updatedItems = [...prev.items];
          updatedItems[index] = {
            ...updatedItems[index],
            product_id: productId,
            description: product.name,
            unit_price: product.price || 0
          };
          return { ...prev, items: updatedItems };
        });
      });
    }
  }, [products]);

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
    const discount = Math.max(0, parseFloat(formData.discount_amount) || 0);
    const total = itemsTotal - discount;
    
    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required';
    }
    
    formData.items.forEach((item, index) => {
      if (!item.description?.trim()) {
        newErrors[`item_${index}_description`] = 'Item description is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        newErrors[`item_${index}_unit_price`] = 'Valid unit price is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    DebugLogger.logFormSubmit('InvoiceForm', formData, 'submit');
    
    if (!validateForm()) {
      DebugLogger.logFormSubmit('InvoiceForm', errors, 'validation-failed');
      return;
    }
    
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      DebugLogger.logApiError('invoice-form-submit', error, 'InvoiceForm');
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {initialData ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id" className="text-sm font-medium">
                Customer *
              </Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => {
                  FocusManager.preserveFocus(() => {
                    setFormData(prev => ({ ...prev, customer_id: value }));
                    if (errors.customer_id) {
                      setErrors(prev => ({ ...prev, customer_id: null }));
                    }
                  });
                }}
                required
              >
                <SelectTrigger className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && (
                <p className="text-sm text-red-500">{errors.customer_id}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issue_date" className="text-sm font-medium">
                Issue Date *
              </Label>
              <SimpleFocusInput
                id="issue_date"
                name="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={handleInputChange}
                className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                required
              />
              {errors.issue_date && (
                <p className="text-sm text-red-500">{errors.issue_date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-medium">
                Due Date
              </Label>
              <StableInput
                id="due_date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                componentName="InvoiceForm-DueDate"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_terms" className="text-sm font-medium">
                Payment Terms
              </Label>
              <StableInput
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                placeholder="e.g., Net 30"
                className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                componentName="InvoiceForm-PaymentTerms"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <Label className="text-base font-medium">Invoice Items *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addItem}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            {formData.items.map((item, index) => (
              <Card key={item.id} className="p-4 border-2 border-gray-100">
                <div className="space-y-4">
                  
                  {/* Product Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`product_id-${index}`} className="text-sm font-medium">
                        Product
                      </Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger 
                          id={`product_id-${index}`}
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        >
                          <SelectValue placeholder="Select product (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {formatNaira(product.price || 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`description-${index}`} className="text-sm font-medium">
                        Description *
                      </Label>
                      <SimpleFocusInput
                        id={`description-${index}`}
                        name="description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        required
                      />
                      {errors[`item_${index}_description`] && (
                        <p className="text-sm text-red-500">{errors[`item_${index}_description`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Pricing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">
                        Quantity *
                      </Label>
                      <StableInput
                        id={`quantity-${index}`}
                        name="quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemQuantity-${index}`}
                        required
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="text-sm text-red-500">{errors[`item_${index}_quantity`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`unit_price-${index}`} className="text-sm font-medium">
                        Unit Price (₦) *
                      </Label>
                      <StableInput
                        id={`unit_price-${index}`}
                        name="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemUnitPrice-${index}`}
                        required
                      />
                      {errors[`item_${index}_unit_price`] && (
                        <p className="text-sm text-red-500">{errors[`item_${index}_unit_price`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`tax_rate-${index}`} className="text-sm font-medium">
                        Tax (%)
                      </Label>
                      <StableInput
                        id={`tax_rate-${index}`}
                        name="tax_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.tax_rate}
                        onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemTaxRate-${index}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`discount_rate-${index}`} className="text-sm font-medium">
                        Discount (%)
                      </Label>
                      <StableInput
                        id={`discount_rate-${index}`}
                        name="discount_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.discount_rate}
                        onChange={(e) => handleItemChange(index, 'discount_rate', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemDiscountRate-${index}`}
                      />
                    </div>
                  </div>

                  {/* Total and Remove Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatNaira(calculateItemTotal(item))}
                      </span>
                    </div>
                    {formData.items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeItem(index)}
                        className="w-full sm:w-auto min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Item
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Total Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Label htmlFor="discount_amount" className="text-sm font-medium whitespace-nowrap">
                    Overall Discount (₦)
                  </Label>
                  <StableInput
                    id="discount_amount"
                    name="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    className="w-full sm:w-32 h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                    componentName="InvoiceForm-DiscountAmount"
                  />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    Grand Total: {formatNaira(calculateInvoiceTotal())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <StableInput
                id="notes"
                name="notes"
                placeholder="Additional notes for the invoice"
                value={formData.notes}
                onChange={handleInputChange}
                className="min-h-[96px] text-base sm:text-sm touch-manipulation resize-y"
                component="textarea"
                componentName="InvoiceForm-Notes"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions" className="text-sm font-medium">
                Terms and Conditions
              </Label>
              <StableInput
                id="terms_and_conditions"
                name="terms_and_conditions"
                placeholder="Terms and conditions for the invoice"
                value={formData.terms_and_conditions}
                onChange={handleInputChange}
                className="min-h-[96px] text-base sm:text-sm touch-manipulation resize-y"
                component="textarea"
                componentName="InvoiceForm-TermsAndConditions"
                rows={4}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto min-h-[48px] touch-manipulation"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto min-h-[48px] bg-green-600 hover:bg-green-700 touch-manipulation"
              disabled={loading}
            >
              {loading ? 'Creating...' : (initialData ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, FileText, Calendar, User } from 'lucide-react';
import { formatNaira, formatDate, formatInvoiceStatus, getStatusColor } from '../../utils/formatting';

const InvoiceCard = ({ invoice, onEdit, onDelete, onView, onSend, onMarkPaid }) => {
  const statusColor = getStatusColor(invoice.status, 'invoice');

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">
                  {invoice.invoice_number || `INV-${invoice.id?.slice(0, 8)}`}
                </h3>
                {invoice.customer_name && (
                  <p className="text-sm text-gray-500 truncate flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {invoice.customer_name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(invoice)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(invoice)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(invoice.id)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${statusColor}`}>
              {formatInvoiceStatus(invoice.status)}
            </Badge>
            {invoice.created_at && (
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(invoice.created_at)}
              </div>
            )}
          </div>

          {/* Amount and Due Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Total Amount</p>
              <p className="text-sm font-semibold text-green-600">
                {formatNaira(invoice.total_amount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Due Date</p>
              <p className="text-sm text-gray-700">
                {invoice.due_date ? formatDate(invoice.due_date) : 'Not set'}
              </p>
            </div>
          </div>

          {/* Action Buttons for Status */}
          {invoice.status !== 'paid' && (
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {invoice.status === 'draft' && onSend && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSend(invoice)}
                  className="flex-1 text-xs"
                >
                  Send Invoice
                </Button>
              )}
              {(invoice.status === 'sent' || invoice.status === 'overdue') && onMarkPaid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkPaid(invoice)}
                  className="flex-1 text-xs bg-green-50 text-green-700 hover:bg-green-100"
                >
                  Mark as Paid
                </Button>
              )}
            </div>
          )}

          {/* Additional Info */}
          {(invoice.description || invoice.payment_terms) && (
            <div className="pt-2 border-t border-gray-100">
              {invoice.description && (
                <p className="text-xs text-gray-600 truncate">
                  {invoice.description}
                </p>
              )}
              {invoice.payment_terms && (
                <p className="text-xs text-gray-500 mt-1">
                  Terms: {invoice.payment_terms}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { InvoiceCard };
export default InvoiceCard;
import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, Trash2, Eye, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatNaira, getStockStatus, formatStockStatus, getStatusColor } from '../../utils/formatting';

const ProductCard = ({ product, onEdit, onDelete, onView }) => {
  const stockStatus = getStockStatus(product.quantity, product.low_stock_threshold);
  const stockColor = getStatusColor(stockStatus, 'stock');

  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                {product.sku && (
                  <p className="text-sm text-gray-500 truncate">SKU: {product.sku}</p>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(product)}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(product)}
                className="h-8 w-8 p-0 hover:bg-green-100"
              >
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(product.id)}
                className="h-8 w-8 p-0 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Category and Stock Status */}
          <div className="flex items-center justify-between">
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
            <Badge className={`text-xs ${stockColor}`}>
              {stockStatus === 'out_of_stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {stockStatus === 'in_stock' && <CheckCircle className="h-3 w-3 mr-1" />}
              {stockStatus === 'low_stock' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {formatStockStatus(stockStatus)}
            </Badge>
          </div>

          {/* Price and Stock Info */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">Selling Price</p>
              <p className="text-sm font-semibold text-green-600">
                {formatNaira(product.price)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock Qty</p>
              <p className={`text-sm font-semibold ${
                stockStatus === 'out_of_stock' ? 'text-red-600' : 
                stockStatus === 'low_stock' ? 'text-yellow-600' : 'text-gray-900'
              }`}>
                {product.quantity || 0}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {(product.cost_price || product.low_stock_threshold) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              {product.cost_price && (
                <div>
                  <p className="text-xs text-gray-500">Cost Price</p>
                  <p className="text-xs text-gray-700">
                    {formatNaira(product.cost_price)}
                  </p>
                </div>
              )}
              {product.low_stock_threshold && (
                <div>
                  <p className="text-xs text-gray-500">Low Stock Alert</p>
                  <p className="text-xs text-gray-700">
                    {product.low_stock_threshold}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { ProductCard };
export default ProductCard;a