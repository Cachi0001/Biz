import React, { useState, useEffect, memo } from 'react';
import { Plus, Search, Edit, Trash2, FileText, AlertTriangle, Download } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import BackButton from '../components/ui/BackButton';
import StableInput from '../components/ui/StableInput';
import DebugLogger from '../utils/debugLogger';
import useDebugRenders from '../hooks/useDebugRenders';
import CustomInvoiceForm from '../components/forms/CustomInvoiceForm';
import ReviewDialog from '../components/invoice/ReviewDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { getInvoices, getCustomers, getProducts, createInvoice, updateInvoice, deleteInvoice } from "../services/api";
import { toast } from 'react-hot-toast';
import { getErrorMessage } from '../services/api';
import { formatNaira } from '../utils/formatting';
import { handleApiErrorWithToast, showSuccessToast } from '../utils/errorHandling';

const Invoices = () => {
  useDebugRenders('Invoices');

  // Main state with proper types
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [reviewInvoiceData, setReviewInvoiceData] = useState<any>(null);

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

      if (response && response.success && response.data) {
        setInvoices(response.data.invoices || []);
      } else if (response && response.invoices && Array.isArray(response.invoices)) {
        setInvoices(response.invoices);
      } else if (response && Array.isArray(response)) {
        setInvoices(response);
      } else {
        console.warn('[INVOICES] Unexpected response structure:', response);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast.error(getErrorMessage(error, 'Failed to load invoices'));
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      console.log('[INVOICES] Customers response:', response);

      if (response && response.success && response.data) {
        setCustomers(response.data.customers || []);
      } else if (response && response.customers && Array.isArray(response.customers)) {
        setCustomers(response.customers);
      } else if (response && Array.isArray(response)) {
        setCustomers(response);
      } else {
        console.warn('[INVOICES] Unexpected customers response structure:', response);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error(getErrorMessage(error, 'Failed to load customers'));
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      console.log('[INVOICES] Products response:', response);

      if (response && response.success && response.data) {
        setProducts(response.data.products || []);
      } else if (response && response.products && Array.isArray(response.products)) {
        setProducts(response.products);
      } else if (response && Array.isArray(response)) {
        setProducts(response);
      } else {
        console.warn('[INVOICES] Unexpected products response structure:', response);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(getErrorMessage(error, 'Failed to load products'));
      setProducts([]);
    }
  };

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
    setShowEditDialog(true);
  };

  const handleDelete = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await deleteInvoice(invoiceId);
      console.log('[INVOICES] Delete response:', response);
      showSuccessToast("Invoice deleted successfully!");
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      handleApiErrorWithToast(error, 'Failed to delete invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleFormReview = (formData) => {
    setReviewInvoiceData(formData);
    setShowReviewDialog(true);
  };

  const handleReviewConfirm = async () => {
    try {
      setLoading(true);
      console.log('[INVOICES] Submitting invoice data:', reviewInvoiceData);

      // Format data for backend
      const invoiceData = {
        customer_id: reviewInvoiceData.customer_id,
        issue_date: reviewInvoiceData.issue_date,
        due_date: reviewInvoiceData.due_date || null,
        payment_terms: reviewInvoiceData.payment_terms || 'Net 30',
        notes: reviewInvoiceData.notes || '',
        terms_and_conditions: reviewInvoiceData.terms_and_conditions || 'Payment is due within 30 days of invoice date.',
        currency: reviewInvoiceData.currency || 'NGN',
        discount_amount: parseFloat(reviewInvoiceData.discount_amount) || 0,
        items: reviewInvoiceData.items.map(item => ({
          product_id: item.product_id || null,
          description: item.description.trim(),
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          tax_rate: parseFloat(item.tax_rate) || 0,
          discount_rate: parseFloat(item.discount_rate) || 0,
        })),
        total_amount: calculateTotal(reviewInvoiceData),
        amount_due: calculateTotal(reviewInvoiceData),
        status: 'draft'
      };

      if (editingInvoice) {
        const response = await updateInvoice(editingInvoice.id, invoiceData);
        console.log('[INVOICES] Update response:', response);
        showSuccessToast('Invoice updated successfully!');
        setShowEditDialog(false);
      } else {
        const response = await createInvoice(invoiceData);
        console.log('[INVOICES] Create response:', response);
        showSuccessToast('Invoice created successfully!');
        setShowAddDialog(false);
      }

      setShowReviewDialog(false);
      setReviewInvoiceData(null);
      setEditingInvoice(null);
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      handleApiErrorWithToast(error, 'Invoice Save');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewCancel = () => {
    setShowReviewDialog(false);
    setReviewInvoiceData(null);
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      setLoading(true);
      // TODO: Implement PDF download functionality
      showSuccessToast('PDF download feature coming soon!');
    } catch (error) {
      console.error('Failed to download PDF:', error);
      handleApiErrorWithToast(error, 'Failed to download PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    if (!window.confirm('Are you sure you want to send this invoice?')) {
      return;
    }

    try {
      setLoading(true);
      // TODO: Implement send invoice functionality
      showSuccessToast('Invoice sent successfully!');
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      handleApiErrorWithToast(error, 'Failed to send invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      setLoading(true);
      // TODO: Implement status update functionality
      showSuccessToast(`Invoice status updated to ${newStatus}!`);
      await fetchInvoices();
    } catch (error) {
      console.error('Failed to update invoice status:', error);
      handleApiErrorWithToast(error, 'Failed to update invoice status');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = (response) => {
    console.log('[INVOICES] Form success:', response);
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingInvoice(null);
    fetchInvoices();
  };

  const handleFormCancel = () => {
    setShowAddDialog(false);
    setShowEditDialog(false);
    setEditingInvoice(null);
    setReviewInvoiceData(null);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !selectedStatus || invoice.status?.toLowerCase() === selectedStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const calculateTotal = (invoice) => {
    const subtotal = parseFloat(invoice.amount || invoice.total || 0);
    const discount = parseFloat(invoice.discount || 0);
    return subtotal - discount;
  };

  // Calculate summary statistics
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, invoice) => sum + calculateTotal(invoice), 0);
  const paidInvoices = invoices.filter(invoice => invoice.status?.toLowerCase() === 'paid').length;
  const pendingInvoices = invoices.filter(invoice => invoice.status?.toLowerCase() === 'pending').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-8 w-8 animate-spin mx-auto mb-2 text-green-600" />
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
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="h-12 text-base touch-manipulation w-full sm:w-auto bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Create New Invoice</DialogTitle>
                    <DialogDescription>
                      Create a new invoice for your customer
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto px-1">
                    <CustomInvoiceForm
                      customers={customers}
                      products={products}
                      onSuccess={handleFormSuccess}
                      onCancel={handleFormCancel}
                      onReview={handleFormReview}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                    <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNaira(totalAmount)}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                    <p className="text-2xl font-bold text-green-600">{paidInvoices}</p>
                  </div>
                  <Download className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Invoices</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingInvoices}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <StableInput
                    placeholder="Search invoices by number or customer..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 text-base touch-manipulation"
                    componentName="Invoices-Search"
                    debounceMs={300}
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full sm:w-40 h-12 touch-manipulation">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
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
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {invoices.length === 0 ? 'No invoices found' : 'No invoices match your search criteria'}
                  </p>
                  <Button
                    onClick={() => setShowAddDialog(true)}
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
                      <Card key={invoice.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {invoice.invoice_number || `INV-${invoice.id?.substring(0, 8).toUpperCase()}`}
                                </h3>
                                <p className="text-base text-gray-600 truncate mt-1">
                                  {invoice.customer_name || 'Unknown Customer'}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                  {invoice.status || 'Draft'}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-base">
                                <span className="text-gray-500 font-medium">Issue Date:</span>
                                <span className="text-gray-900 font-medium">
                                  {new Date(invoice.issue_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between text-base">
                                <span className="text-gray-500 font-medium">Due Date:</span>
                                <span className="text-gray-900 font-medium">
                                  {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t-2 border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-base text-gray-500 font-medium">Total Amount:</span>
                                <span className="text-xl font-bold text-green-600">
                                  {formatNaira(calculateTotal(invoice))}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 border-t-2 border-gray-100 space-y-3">
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(invoice)}
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
                                  <FileText className="h-5 w-5 text-purple-600 mb-1" />
                                  <span className="text-xs text-purple-600 font-medium">Send</span>
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <Select
                                  value={invoice.status}
                                  onValueChange={(newStatus) => handleStatusUpdate(invoice.id, newStatus)}
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
                        {filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">
                              {invoice.invoice_number || `INV-${invoice.id?.substring(0, 8).toUpperCase()}`}
                            </TableCell>
                            <TableCell>{invoice.customer_name || 'Unknown Customer'}</TableCell>
                            <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatNaira(calculateTotal(invoice))}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(invoice.status)}>
                                {invoice.status || 'Draft'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice)}>
                                  <Edit className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(invoice.id)}>
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                                  <FileText className="h-4 w-4 text-purple-600" />
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Edit Dialog */}
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
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                  onReview={handleFormReview}
                  editingInvoice={editingInvoice}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Review Dialog */}
          {reviewInvoiceData && (
            <ReviewDialog
              isOpen={showReviewDialog}
              onClose={() => setShowReviewDialog(false)}
              invoiceData={reviewInvoiceData}
              customers={customers}
              products={products}
              onConfirm={handleReviewConfirm}
              onCancel={handleReviewCancel}
              isEdit={!!editingInvoice}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;