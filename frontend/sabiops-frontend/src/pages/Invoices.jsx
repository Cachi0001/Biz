import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Edit, Trash2, Eye, Download, Send } from 'lucide-react';
import { getInvoices, getCustomers, getProducts, updateInvoice, createInvoice, getInvoice, deleteInvoice, downloadInvoicePdf, sendInvoice } from "../services/api";
import toast from 'react-hot-toast';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: '',
    amount: 0,
    tax_amount: 0,
    total_amount: 0,
    due_date: '',
    notes: '',
    items: [{ description: '', quantity: 1, unit_price: 0 }],
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
      setInvoices(response.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices.",
        variant: "destructive",
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers.",
        variant: "destructive",
      });
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({
        title: "Error",
        description: "Failed to load products.",
        variant: "destructive",
      });
      setProducts([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].description = product.name;
        updatedItems[index].unit_price = product.price;
      }
    }
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }]
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.customer_id) {
        toast({
          title: "Error",
          description: "Please select a customer.",
          variant: "destructive",
        });
        return;
      }
      if (formData.items.length === 0 || formData.items.some(item => !item.description || item.quantity <= 0 || item.unit_price <= 0)) {
        toast({
          title: "Error",
          description: "Please add valid invoice items with description, quantity, and unit price.",
          variant: "destructive",
        });
        return;
      }

      const invoiceData = {
        ...formData,
        total_amount: calculateInvoiceTotal(),
        amount_due: calculateInvoiceTotal(),
      };

      if (selectedInvoice) {
        await updateInvoice(selectedInvoice.id, invoiceData);
        toast({
          title: "Success",
          description: "Invoice updated successfully!",
        });
        setIsEditDialogOpen(false);
      } else {
        await createInvoice(invoiceData);
        toast({
          title: "Success",
          description: "Invoice created successfully!",
        });
        setIsCreateDialogOpen(false);
      }
      resetForm();
      fetchInvoices();
    } catch (error) {
      console.error('Failed to save invoice:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to save invoice';
      toast({
        title: "Error",
        description: `Failed to save invoice: ${errorMessage}`,
        variant: "destructive",
      });
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
      items: [{ product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
    });
    setSelectedInvoice(null);
  };

  const handleEdit = async (invoiceId) => {
    try {
      const response = await getInvoice(invoiceId);
      const invoice = response.invoice;
      setSelectedInvoice(invoice);
      setFormData({
        customer_id: invoice.customer_id,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        payment_terms: invoice.payment_terms,
        notes: invoice.notes,
        terms_and_conditions: invoice.terms_and_conditions,
        currency: invoice.currency,
        discount_amount: invoice.discount_amount,
        items: invoice.items.map(item => ({
          product_id: item.product_id || '',
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate,
          discount_rate: item.discount_rate,
        })),
      });
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Failed to fetch invoice for edit:', error);
      toast({
        title: "Error",
        description: "Failed to load invoice for editing.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await deleteInvoice(invoiceId);
        toast({
          title: "Success",
          description: "Invoice deleted successfully!",
        });
        fetchInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to delete invoice';
        toast({
          title: "Error",
          description: `Failed to delete invoice: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleDownloadPdf = async (invoiceId) => {
    try {
      const response = await downloadInvoicePdf(invoiceId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({
        title: "Success",
        description: "Invoice PDF downloaded successfully!",
      });
    } catch (error) {
      console.error('Failed to download PDF:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to download PDF';
      toast({
        title: "Error",
        description: `Failed to download PDF: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = async (invoiceId) => {
    if (window.confirm('Are you sure you want to send this invoice?')) {
      try {
        await sendInvoice(invoiceId);
        toast({
          title: "Success",
          description: "Invoice sent successfully!",
        });
        fetchInvoices();
      } catch (error) {
        console.error('Failed to send invoice:', error);
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to send invoice';
        toast({
          title: "Error",
          description: `Failed to send invoice: ${errorMessage}`,
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const customer = customers.find(c => c.id === invoice.customer_id);
    const customerName = customer ? customer.name : 'Unknown Customer';
    return invoice.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
          <Card key={index} className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="col-span-2 space-y-2">
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
              <div className="col-span-4 space-y-2">
                <Label htmlFor={`description-${index}`}>Description *</Label>
                <Input
                  id={`description-${index}`}
                  name="description"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Item description"
                  required
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor={`quantity-${index}`}>Qty *</Label>
                <Input
                  id={`quantity-${index}`}
                  name="quantity"
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                  required
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor={`unit_price-${index}`}>Unit Price (₦) *</Label>
                <Input
                  id={`unit_price-${index}`}
                  name="unit_price"
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                  required
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor={`tax_rate-${index}`}>Tax (%)</Label>
                <Input
                  id={`tax_rate-${index}`}
                  name="tax_rate"
                  type="number"
                  step="0.01"
                  value={item.tax_rate}
                  onChange={(e) => handleItemChange(index, 'tax_rate', parseFloat(e.target.value))}
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label htmlFor={`discount_rate-${index}`}>Discount (%)</Label>
                <Input
                  id={`discount_rate-${index}`}
                  name="discount_rate"
                  type="number"
                  step="0.01"
                  value={item.discount_rate}
                  onChange={(e) => handleItemChange(index, 'discount_rate', parseFloat(e.target.value))}
                />
              </div>
              <div className="col-span-1 space-y-2">
                <Label>Total</Label>
                <div className="text-sm font-medium py-2">
                  ₦{calculateItemTotal(item).toFixed(2)}
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                {formData.items.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeItem(index)}>
                    <Trash2 className="h-4 w-4" />
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
            Grand Total: ₦{calculateInvoiceTotal().toFixed(2)}
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
        <Button type="submit">
          {isEdit ? 'Update Invoice' : 'Create Invoice'}
        </Button>
      </div>
    </form>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Plus className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage your invoices and billing</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            Manage and track all your invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No invoices found</p>
              <Button
                className="mt-4"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create Your First Invoice
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.id?.substring(0, 8).toUpperCase()}</TableCell>
                    <TableCell>{customers.find(c => c.id === invoice.customer_id)?.name || 'Unknown'}</TableCell>
                    <TableCell>{new Date(invoice.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>₦{parseFloat(invoice.total_amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(invoice.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadPdf(invoice.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSendInvoice(invoice.id)}>
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(invoice.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
  );
};

export default Invoices;


