import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import BulletproofInput from '../components/ui/BulletproofInput';
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
      <Card 
        className="bg-white border-2 border-gray-200 hover:shadow-lg transition-all duration-200 touch-manipulation"
        onMouseDown={(e) => {
          // Prevent card from stealing focus from inputs
          const target = e.target as HTMLElement;
          if (!target.closest('input, select, textarea, button')) {
            e.preventDefault();
          }
        }}
        onClick={(e) => {
          // Prevent card click events from interfering with input focus
          const target = e.target as HTMLElement;
          if (!target.closest('input, select, textarea, button')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
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
            <SelectItem value="no-customers" disabled>
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
          <Card 
            key={item.id} 
            className="p-4 sm:p-6 mb-4 border-2 border-gray-100"
          >
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
                  <BulletproofInput
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
                    componentName={`InvoiceItem-${index}-Description`}
                    debounceMs={300}
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
                  <BulletproofInput
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
                    componentName={`InvoiceItem-${index}-Quantity`}
                    debounceMs={300}
                  />
                  {getItemFieldError(index, 'quantity') && (
                    <FieldError error={getItemFieldError(index, 'quantity')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`unit_price-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'unit_price') ? 'text-red-700' : ''}`}>
                    Unit Price (₦) *
                  </Label>
                  <BulletproofInput
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
                    componentName={`InvoiceItem-${index}-UnitPrice`}
                    debounceMs={300}
                  />
                  {getItemFieldError(index, 'unit_price') && (
                    <FieldError error={getItemFieldError(index, 'unit_price')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`tax_rate-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'tax_rate') ? 'text-red-700' : ''}`}>
                    Tax (%)
                  </Label>
                  <BulletproofInput
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
                    componentName={`InvoiceItem-${index}-TaxRate`}
                    debounceMs={300}
                  />
                  {getItemFieldError(index, 'tax_rate') && (
                    <FieldError error={getItemFieldError(index, 'tax_rate')} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`discount_rate-${index}`} className={`text-sm font-medium ${hasItemFieldError(index, 'discount_rate') ? 'text-red-700' : ''}`}>
                    Discount (%)
                  </Label>
                  <BulletproofInput
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
                    componentName={`InvoiceItem-${index}-DiscountRate`}
                    debounceMs={300}
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
                  <FocusStableInput
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