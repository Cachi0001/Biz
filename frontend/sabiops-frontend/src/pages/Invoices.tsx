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
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

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
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'paid').length;
  const pendingInvoices = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'pending').length;
  const overdueInvoices = filteredInvoices.filter(inv => inv.status?.toLowerCase() === 'overdue').length;
  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + calculateTotal(inv), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 animate-spin mx-auto mb-2" />
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
                onClick={() => {
                  setShowAddDialog(true);
                  setEditingInvoice(null); // Ensure editingInvoice is null when opening add dialog
                }}
                className="h-12 text-base touch-manipulation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {/* The original error state was removed, so this block is removed. */}

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
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="h-12 text-base touch-manipulation">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
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
                  <Card key={invoice.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{invoice.invoice_number || invoice.id.substring(0, 8).toUpperCase()}</h3>
                            <p className="text-sm text-gray-600">{invoice.customer_name || 'Unknown Customer'}</p>
                          </div>
                          <div className="flex gap-1">
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
                            <span>{invoice.issue_date}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Due Date</span>
                            <span>{invoice.due_date || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Amount</span>
                            <span className="font-semibold text-green-600">
                              {formatNaira(calculateTotal(invoice), true)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant={getStatusBadgeVariant(invoice.status)}>
                            {invoice.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* handleDownloadPdf(invoice.id) */}}
                              className="h-8 w-8 p-0 hover:bg-green-100"
                            >
                              <Download className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {/* handleSendInvoice(invoice.id) */}}
                              className="h-8 w-8 p-0 hover:bg-purple-100"
                            >
                              {/* <Send className="h-4 w-4 text-purple-600" /> */}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                            <TableCell>{invoice.issue_date}</TableCell>
                            <TableCell>
                              {invoice.due_date || 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatNaira(calculateTotal(invoice), true)}
                            </TableCell>
                            <TableCell>{getStatusBadgeVariant(invoice.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
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
                                  onClick={() => handleDelete(invoice.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-100"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {/* handleDownloadPdf(invoice.id) */}}
                                  className="h-8 w-8 p-0 hover:bg-green-100"
                                >
                                  <Download className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {/* handleSendInvoice(invoice.id) */}}
                                  className="h-8 w-8 p-0 hover:bg-purple-100"
                                >
                                  {/* <Send className="h-4 w-4 text-purple-600" /> */}
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
                <CustomInvoiceForm
                  invoice={editingInvoice}
                  customers={customers}
                  products={products}
                  onSuccess={handleFormSuccess}
                  onCancel={handleFormCancel}
                />
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Dialog */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
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
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default memo(Invoices);