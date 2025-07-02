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
import apiService from '../lib/api';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);

  const [newInvoice, setNewInvoice] = useState({
    customer_id: '',
    due_date: '',
    notes: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await apiService.getInvoices();
      setInvoices(response.invoices || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiService.getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiService.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const invoiceData = {
        ...newInvoice,
        items: invoiceItems.filter(item => item.product_id && item.quantity > 0)
      };
      
      await apiService.createInvoice(invoiceData);
      setIsCreateDialogOpen(false);
      setNewInvoice({
        customer_id: '',
        due_date: '',
        notes: '',
        status: 'draft'
      });
      setInvoiceItems([{ product_id: '', quantity: 1, unit_price: 0 }]);
      fetchInvoices();
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await apiService.deleteInvoice(id);
        fetchInvoices();
      } catch (error) {
        console.error('Failed to delete invoice:', error);
      }
    }
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { product_id: '', quantity: 1, unit_price: 0 }]);
  };

  const removeInvoiceItem = (index) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateInvoiceItem = (index, field, value) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updatedItems[index].unit_price = product.selling_price;
      }
    }
    
    setInvoiceItems(updatedItems);
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={statusColors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => {
      return total + (item.quantity * item.unit_price);
    }, 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Invoices</h1>
        </div>
        <div className="text-center py-8">Loading invoices...</div>
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
            <Button className="bg-primary hover:bg-primary/90">
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
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">Customer</Label>
                  <Select value={newInvoice.customer_id} onValueChange={(value) => setNewInvoice({...newInvoice, customer_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={newInvoice.due_date}
                    onChange={(e) => setNewInvoice({...newInvoice, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Invoice Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
                
                {invoiceItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <Label>Product</Label>
                      <Select 
                        value={item.product_id.toString()} 
                        onValueChange={(value) => updateInvoiceItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
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
                        onChange={(e) => updateInvoiceItem(index, 'quantity', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Unit Price (₦)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateInvoiceItem(index, 'unit_price', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="col-span-1">
                      <Label>Total</Label>
                      <div className="text-sm font-medium py-2">
                        ₦{(item.quantity * item.unit_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      {invoiceItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeInvoiceItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="text-right">
                  <div className="text-lg font-bold">
                    Total: ₦{calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for the invoice"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({...newInvoice, notes: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice} className="bg-primary hover:bg-primary/90">
                  Create Invoice
                </Button>
              </div>
            </div>
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
                className="mt-4 bg-primary hover:bg-primary/90" 
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
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{new Date(invoice.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>₦{parseFloat(invoice.total_amount).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
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
    </div>
  );
};

export default Invoices;

