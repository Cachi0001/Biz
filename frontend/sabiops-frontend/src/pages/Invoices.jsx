import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Plus, Search, Edit, Trash2, Download, Filter, FileText, Calendar, RefreshCw, Eye, Printer, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { invoiceApi, productApi, customerApi } from '../services/enhancedApiClient';
import { formatNaira, formatDate, formatDateTime } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast, showErrorToast } from '../utils/errorHandling';
import CustomInvoiceForm from '../components/forms/CustomInvoiceForm';
import ReviewDialog from '../components/invoice/ReviewDialog';
import BackButton from '../components/ui/BackButton';
import StableInput from '../components/ui/StableInput';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const invoicesData = await invoiceApi.getInvoices();
      setInvoices(Array.isArray(invoicesData) ? invoicesData : invoicesData.invoices || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setError('Failed to load invoices. Please try again.');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerApi.getCustomers();

      let customersData = [];

      if (response?.data?.customers && Array.isArray(response.data.customers)) {
        customersData = response.data.customers;
      } else if (response?.data && Array.isArray(response.data)) {
        customersData = response.data;
      } else if (Array.isArray(response)) {
        customersData = response;
      } else if (response?.customers && Array.isArray(response.customers)) {
        customersData = response.customers;
      }

      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productApi.getProducts();

      let productsData = [];

      if (response?.data?.products && Array.isArray(response.data.products)) {
        productsData = response.data.products;
      } else if (response?.data && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (Array.isArray(response)) {
        productsData = response;
      } else if (response?.products && Array.isArray(response.products)) {
        productsData = response.products;
      }

      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowEditDialog(true);
    setIsEdit(true);
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }
    try {
      setLoading(true);
      await invoiceApi.deleteInvoice(invoiceId);
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (invoiceId) => {
    try {
      setLoading(true);
      await invoiceApi.sendInvoice(invoiceId);
      fetchInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoiceId) => {
    try {
      setLoading(true);
      const blob = await invoiceApi.downloadInvoicePdf(invoiceId);
      if (blob && blob.size > 0) {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `invoice-${invoiceId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } else {
        handleApiErrorWithToast(new Error('Failed to download PDF. The file may not exist.'));
      }
    } catch (error) {
      console.error('Error downloading invoice PDF:', error);
      handleApiErrorWithToast(error, 'Failed to download invoice PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (formData) => {
    console.log('Review data:', formData);

    const reviewFormData = {
      ...formData,
      customer_id: formData.customer_id || '',
      items: formData.items || [],
      status: formData.status || 'draft'
    };

    setReviewData(reviewFormData);
    setShowReviewDialog(true);
  };

  const handleFormCancel = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingInvoice(null);
    setIsEdit(false);
  };

  const handleReviewConfirm = async () => {
    try {
      setLoading(true);

      if (!reviewData) {
        handleApiErrorWithToast(new Error('No invoice data to save'));
        setLoading(false);
        return;
      }

      const { validateInvoiceData } = await import('../utils/invoiceValidator');

      const validation = validateInvoiceData(reviewData);

      if (!validation.isValid) {
        const firstErrorKey = Object.keys(validation.errors)[0];
        const firstError = validation.errors[firstErrorKey];

        if (firstErrorKey === 'itemErrors') {
          const itemErrors = validation.errors.itemErrors;
          for (let i = 0; i < itemErrors.length; i++) {
            const itemError = itemErrors[i];
            if (itemError && Object.keys(itemError).length > 0) {
              const firstItemErrorKey = Object.keys(itemError)[0];
              handleApiErrorWithToast(new Error(`Item ${i + 1}: ${itemError[firstItemErrorKey]}`));
              break;
            }
          }
        } else {
          handleApiErrorWithToast(new Error(firstError));
        }

        setLoading(false);
        return;
      }

      // Add status field if not present
      const dataToSave = {
        ...validation.formattedData,
        status: validation.formattedData.status || 'draft'
      };

      console.log('Saving invoice data:', dataToSave);

      if (isEdit && editingInvoice) {
        await invoiceApi.updateInvoice(editingInvoice.id, dataToSave);
      } else {
        await invoiceApi.createInvoice(dataToSave);
      }

      // Close dialogs and reset state
      setShowAddDialog(false);
      setShowEditDialog(false);
      setShowReviewDialog(false);
      setEditingInvoice(null);
      setReviewData(null);
      setIsEdit(false);

      // Refresh invoices list
      fetchInvoices();
    } catch (error) {
      console.error('Error saving invoice:', error);
      handleApiErrorWithToast(error, isEdit ? 'Failed to update invoice' : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  // Handle review cancel
  const handleReviewCancel = () => {
    setShowReviewDialog(false);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    // Search term filter
    const matchesSearch =
      (invoice.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.notes || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      invoice.status === statusFilter;

    // Date filter
    let matchesDate = true;
    const invoiceDate = new Date(invoice.issue_date || invoice.created_at);
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    if (dateFilter === 'last30days') {
      matchesDate = invoiceDate >= thirtyDaysAgo;
    } else if (dateFilter === 'last90days') {
      matchesDate = invoiceDate >= ninetyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Get customer name
  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  // Get status badge variant
  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'overdue': return 'destructive';
      case 'draft': return 'secondary';
      default: return 'outline';
    }
  };

  // Format status
  const formatStatus = (status) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      case 'draft': return 'Draft';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      setLoading(true);
      await invoiceApi.updateInvoiceStatus(invoiceId, { status: newStatus });
      fetchInvoices();
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Invoices</h1>
                <p className="text-gray-600 mt-1">Create and manage your invoices</p>
              </div>
              <div>
                <Button
                  onClick={() => {
                    setShowAddDialog(true);
                    setIsEdit(false);
                  }}
                  className="h-11 px-6 text-sm font-medium bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
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
                    fetchInvoices();
                  }}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Filters Section */}
          <Card className="mb-6 bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">Filter & Search</CardTitle>
              <CardDescription>Filter invoices by status, date, and search for specific invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-1">
                  <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">Search Invoices</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <StableInput
                      id="search"
                      name="search"
                      placeholder="Search by customer, invoice number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500 md:text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status_filter" className="text-sm font-medium text-gray-700 mb-2 block">Filter by Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status_filter" className="h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue 
                        placeholder="Select status"
                        value={statusFilter === 'all' ? undefined : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date_filter" className="text-sm font-medium text-gray-700 mb-2 block">Filter by Date</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger id="date_filter" className="h-11 text-sm border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue 
                        placeholder="Select date range"
                        value={dateFilter === 'all' ? undefined : dateFilter.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="last30days">Last 30 Days</SelectItem>
                      <SelectItem value="last90days">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 mt-4 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateFilter('all');
                  }}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchInvoices}
                  className="h-10 px-4 text-sm font-medium border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Data Section */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Invoices
                  </CardTitle>
                  <CardDescription>
                    {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
                    {invoices.length > 0 && filteredInvoices.length !== invoices.length &&
                      ` (${invoices.length} total)`
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  <span className="ml-3 text-gray-600">Loading invoices...</span>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your search criteria or filters'
                      : 'Get started by creating your first invoice.'}
                  </p>
                  <Button
                    onClick={() => {
                      setShowAddDialog(true);
                      setIsEdit(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Invoice
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="grid grid-cols-2 gap-4 lg:hidden">
                    {filteredInvoices.map((invoice, idx) => (
                      <div key={invoice.id} className={
                        filteredInvoices.length % 2 === 1 && idx === filteredInvoices.length - 1
                          ? 'col-span-2 flex justify-center' : ''
                      }>
                        <Card className="border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-green-300">
                          <CardContent className="p-5">
                            <div className="space-y-4">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 truncate text-base">
                                    Invoice #{invoice.invoice_number || invoice.id}
                                  </h3>
                                  <p className="text-sm text-gray-600 truncate mt-1">
                                    {invoice.customer_name || getCustomerName(invoice.customer_id)}
                                  </p>
                                </div>
                                <Select
                                  value={invoice.status}
                                  onValueChange={(value) => handleStatusChange(invoice.id, value)}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Details */}
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Issue Date</span>
                                  <span className="text-gray-900">
                                    {formatDate(invoice.issue_date || invoice.created_at)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Due Date</span>
                                  <span className="text-gray-900">
                                    {invoice.due_date ? formatDate(invoice.due_date) : 'Not set'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Amount</span>
                                  <span className="font-semibold text-green-600">
                                    {formatNaira(invoice.total_amount || 0)}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500 font-medium block mb-1">Items</span>
                                  <span className="text-gray-900">
                                    {invoice.items?.length || 0} items
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="pt-3 border-t border-gray-100">
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(invoice)}
                                    className="text-xs h-8 flex-1"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownload(invoice.id)}
                                    className="text-xs h-8 flex-1"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    PDF
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDelete(invoice.id)}
                                    className="text-xs h-8 flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block">
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="px-6 py-4 text-left font-semibold text-gray-900">Invoice #</TableHead>
                            <TableHead className="px-6 py-4 text-left font-semibold text-gray-900">Customer</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Issue Date</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Due Date</TableHead>
                            <TableHead className="px-6 py-4 text-right font-semibold text-gray-900">Amount</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Status</TableHead>
                            <TableHead className="px-6 py-4 text-center font-semibold text-gray-900">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map((invoice, index) => (
                            <TableRow key={invoice.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              <TableCell className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  #{invoice.invoice_number || invoice.id}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="font-medium text-gray-900">
                                  {invoice.customer_name || getCustomerName(invoice.customer_id)}
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <span className="text-sm text-gray-600">
                                  {formatDate(invoice.issue_date || invoice.created_at)}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <span className="text-sm text-gray-600">
                                  {invoice.due_date ? formatDate(invoice.due_date) : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <span className="font-semibold text-green-600">
                                  {formatNaira(invoice.total_amount || 0)}
                                </span>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center">
                                <Select
                                  value={invoice.status}
                                  onValueChange={(value) => handleStatusChange(invoice.id, value)}
                                  disabled={loading}
                                >
                                  <SelectTrigger className="w-24 h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="flex justify-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(invoice)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                  >
                                    <Edit className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSend(invoice.id)}
                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                  >
                                    <Send className="h-4 w-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownload(invoice.id)}
                                    className="h-8 w-8 p-0 hover:bg-purple-100"
                                  >
                                    <Download className="h-4 w-4 text-purple-600" />
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

      {/* Add Invoice Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new invoice
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <CustomInvoiceForm
              customers={customers}
              products={products}
              onSuccess={() => {
                setShowAddDialog(false);
                fetchInvoices();
              }}
              onCancel={handleFormCancel}
              onReview={handleReview}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update invoice details
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <CustomInvoiceForm
              customers={customers}
              products={products}
              onSuccess={() => {
                setShowEditDialog(false);
                setEditingInvoice(null);
                fetchInvoices();
              }}
              onCancel={handleFormCancel}
              editingInvoice={editingInvoice}
              onReview={handleReview}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <ReviewDialog
        isOpen={showReviewDialog}
        onClose={() => setShowReviewDialog(false)}
        invoiceData={reviewData}
        customers={customers}
        products={products}
        onConfirm={handleReviewConfirm}
        onCancel={handleReviewCancel}
        isEdit={isEdit}
      />
    </DashboardLayout>
  );
};

export default Invoices;

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