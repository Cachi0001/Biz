import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, DollarSign, ShoppingCart, TrendingUp, Eye } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getSales, getInvoices, getErrorMessage } from "../services/api";
import { toast } from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    business_name: '',
    notes: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchCustomerStats();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      console.log("[CUSTOMERS] Fetching customers...");
      const response = await getCustomers();
      console.log("[CUSTOMERS] Response:", response);
      
      // Handle different response formats
      if (response && Array.isArray(response)) {
        setCustomers(response);
      } else if (response && response.customers && Array.isArray(response.customers)) {
        setCustomers(response.customers);
      } else if (response && response.data && response.data.customers && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers);
      } else {
        console.warn("[CUSTOMERS] Unexpected response structure:", response);
        setCustomers([]);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error(getErrorMessage(error, 'Failed to load customers'));
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerStats = async () => {
    try {
      // Fetch sales and invoices to calculate customer statistics
      const [salesResponse, invoicesResponse] = await Promise.all([
        getSales(),
        getInvoices()
      ]);

      console.log("[CUSTOMERS] Sales response:", salesResponse);
      console.log("[CUSTOMERS] Invoices response:", invoicesResponse);

      const sales = Array.isArray(salesResponse) ? salesResponse : 
                   salesResponse?.sales || salesResponse?.data?.sales || [];
      const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : 
                      invoicesResponse?.invoices || invoicesResponse?.data?.invoices || [];

      const stats = {};
      
      // Calculate stats from sales
      sales.forEach(sale => {
        if (sale.customer_id) {
          if (!stats[sale.customer_id]) {
            stats[sale.customer_id] = {
              totalPurchases: 0,
              totalSpent: 0,
              lastPurchase: null
            };
          }
          stats[sale.customer_id].totalPurchases += 1;
          stats[sale.customer_id].totalSpent += parseFloat(sale.total_amount || sale.net_amount || 0);
          
          const purchaseDate = new Date(sale.created_at || sale.date);
          if (!stats[sale.customer_id].lastPurchase || purchaseDate > stats[sale.customer_id].lastPurchase) {
            stats[sale.customer_id].lastPurchase = purchaseDate;
          }
        }
      });

      // Calculate stats from invoices
      invoices.forEach(invoice => {
        if (invoice.customer_id) {
          if (!stats[invoice.customer_id]) {
            stats[invoice.customer_id] = {
              totalPurchases: 0,
              totalSpent: 0,
              lastPurchase: null
            };
          }
          if (invoice.status === 'paid') {
            stats[invoice.customer_id].totalSpent += parseFloat(invoice.total_amount || 0);
          }
        }
      });

      setCustomerStats(stats);
      console.log("[CUSTOMERS] Calculated stats:", stats);
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
      // Don't show error toast for stats as it's supplementary data
    }
  };

  const fetchCustomerHistory = async (customerId) => {
    try {
      setLoading(true);
      const [salesResponse, invoicesResponse] = await Promise.all([
        getSales(),
        getInvoices()
      ]);

      const sales = Array.isArray(salesResponse) ? salesResponse : 
                   salesResponse?.sales || salesResponse?.data?.sales || [];
      const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : 
                      invoicesResponse?.invoices || invoicesResponse?.data?.invoices || [];

      const customerSales = sales.filter(sale => sale.customer_id === customerId);
      const customerInvoices = invoices.filter(invoice => invoice.customer_id === customerId);

      const history = [
        ...customerSales.map(sale => ({
          ...sale,
          type: 'sale',
          date: sale.created_at || sale.date,
          amount: sale.total_amount || sale.net_amount || 0
        })),
        ...customerInvoices.map(invoice => ({
          ...invoice,
          type: 'invoice',
          date: invoice.created_at || invoice.issue_date,
          amount: invoice.total_amount || 0
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setCustomerHistory(history);
      console.log("[CUSTOMERS] Customer history:", history);
    } catch (error) {
      console.error('Failed to fetch customer history:', error);
      toast.error(getErrorMessage(error, 'Failed to load customer history'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      if (!newCustomer.name.trim()) {
        toast.error('Customer name is required');
        return;
      }

      setLoading(true);
      console.log('[CUSTOMERS] Creating customer:', newCustomer);
      
      const response = await createCustomer(newCustomer);
      console.log('[CUSTOMERS] Create response:', response);
      
      // Handle different response formats
      let createdCustomer;
      if (response && response.customer) {
        createdCustomer = response.customer;
      } else if (response && response.data && response.data.customer) {
        createdCustomer = response.data.customer;
      } else {
        createdCustomer = response;
      }
      
      // Add the new customer to the list
      setCustomers(prevCustomers => [createdCustomer, ...prevCustomers]);
      
      setIsCreateDialogOpen(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        business_name: '',
        notes: ''
      });
      
      toast.success("Customer created successfully!");
      
    } catch (error) {
      console.error('[CUSTOMERS] Create error:', error);
      toast.error(getErrorMessage(error, 'Failed to create customer'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async () => {
    try {
      if (!selectedCustomer.name.trim()) {
        toast.error('Customer name is required');
        return;
      }

      setLoading(true);
      console.log('[CUSTOMERS] Updating customer:', selectedCustomer);
      
      const response = await updateCustomer(selectedCustomer.id, selectedCustomer);
      console.log('[CUSTOMERS] Update response:', response);
      
      // Handle different response formats
      let updatedCustomer;
      if (response && response.customer) {
        updatedCustomer = response.customer;
      } else if (response && response.data && response.data.customer) {
        updatedCustomer = response.data.customer;
      } else {
        updatedCustomer = { ...selectedCustomer };
      }
      
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer.id === selectedCustomer.id ? updatedCustomer : customer
        )
      );
      
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      
      toast.success("Customer updated successfully!");
      
    } catch (error) {
      console.error('[CUSTOMERS] Update error:', error);
      toast.error(getErrorMessage(error, 'Failed to update customer'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        setLoading(true);
        console.log('[CUSTOMERS] Deleting customer:', id);
        
        await deleteCustomer(id);
        
        setCustomers(customers.filter(customer => customer.id !== id));
        toast.success("Customer deleted successfully!");
        
      } catch (error) {
        console.error('[CUSTOMERS] Delete error:', error);
        toast.error(getErrorMessage(error, 'Failed to delete customer'));
      } finally {
        setLoading(false);
      }
    }
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer({ ...customer });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
    fetchCustomerHistory(customer.id);
  };

  const formatCurrency = (amount) => {
    try {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0
      }).format(amount || 0);
    } catch (error) {
      return `₦${(amount || 0).toLocaleString()}`;
    }
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-NG');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Customers</h1>
        </div>
        <div className="text-center py-8">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customer relationships</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer profile for your business
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter customer name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input
                    id="business_name"
                    placeholder="Enter business name"
                    value={newCustomer.business_name}
                    onChange={(e) => setNewCustomer({...newCustomer, business_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="Enter phone number"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter customer address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about the customer"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} className="bg-primary hover:bg-primary/90">
                  Add Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_name">Full Name *</Label>
                  <Input
                    id="edit_name"
                    placeholder="Enter customer name"
                    value={selectedCustomer.name}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_business_name">Business Name</Label>
                  <Input
                    id="edit_business_name"
                    placeholder="Enter business name"
                    value={selectedCustomer.business_name || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, business_name: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit_email">Email</Label>
                  <Input
                    id="edit_email"
                    type="email"
                    placeholder="Enter email address"
                    value={selectedCustomer.email || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit_phone">Phone Number</Label>
                  <Input
                    id="edit_phone"
                    placeholder="Enter phone number"
                    value={selectedCustomer.phone || ''}
                    onChange={(e) => setSelectedCustomer({...selectedCustomer, phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_address">Address</Label>
                <Textarea
                  id="edit_address"
                  placeholder="Enter customer address"
                  value={selectedCustomer.address || ''}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, address: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_notes">Notes</Label>
                <Textarea
                  id="edit_notes"
                  placeholder="Additional notes about the customer"
                  value={selectedCustomer.notes || ''}
                  onChange={(e) => setSelectedCustomer({...selectedCustomer, notes: e.target.value})}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditCustomer} className="bg-primary hover:bg-primary/90">
                  Update Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
            <DialogDescription>
              Detailed customer information and purchase history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedCustomer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {selectedCustomer.business_name || 'Individual Customer'}
                          </div>
                        </div>
                      </div>
                      
                      {selectedCustomer.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedCustomer.email}</span>
                        </div>
                      )}
                      
                      {selectedCustomer.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{selectedCustomer.phone}</span>
                        </div>
                      )}
                      
                      {selectedCustomer.address && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Address</div>
                          <div className="text-sm text-muted-foreground">{selectedCustomer.address}</div>
                        </div>
                      )}
                      
                      {selectedCustomer.notes && (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Notes</div>
                          <div className="text-sm text-muted-foreground">{selectedCustomer.notes}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Spent</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(customerStats[selectedCustomer.id]?.totalSpent || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Orders</span>
                        <span className="font-medium">
                          {customerStats[selectedCustomer.id]?.totalPurchases || 0}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Purchase</span>
                        <span className="font-medium">
                          {customerStats[selectedCustomer.id]?.lastPurchase ? 
                            formatDate(customerStats[selectedCustomer.id].lastPurchase) : 
                            'No purchases yet'
                          }
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Customer Since</span>
                        <span className="font-medium">
                          {formatDate(selectedCustomer.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(customerStats[selectedCustomer.id]?.totalSpent || 0)}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                          <p className="text-2xl font-bold">
                            {customerStats[selectedCustomer.id]?.totalPurchases || 0}
                          </p>
                        </div>
                        <ShoppingCart className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                          <p className="text-2xl font-bold">
                            {formatCurrency(
                              customerStats[selectedCustomer.id]?.totalPurchases > 0 ? 
                                (customerStats[selectedCustomer.id]?.totalSpent / customerStats[selectedCustomer.id]?.totalPurchases) : 
                                0
                            )}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Purchase History</CardTitle>
                    <CardDescription>
                      Recent sales and invoices for this customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {customerHistory.length === 0 ? (
                      <div className="text-center py-8">
                        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="text-muted-foreground mt-2">No purchase history found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {customerHistory.map((transaction) => (
                          <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                transaction.type === 'sale' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                              }`}>
                                {transaction.type === 'sale' ? 
                                  <ShoppingCart className="h-4 w-4" /> : 
                                  <DollarSign className="h-4 w-4" />
                                }
                              </div>
                              <div>
                                <div className="font-medium">
                                  {transaction.type === 'sale' ? 'Sale' : 'Invoice'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDate(transaction.date)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(transaction.amount)}
                              </div>
                              {transaction.type === 'invoice' && (
                                <Badge variant={transaction.status === 'paid' ? 'default' : 'secondary'}>
                                  {transaction.status}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>
            Manage and track all your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground mt-2">No customers found</p>
              <Button 
                className="mt-4 bg-primary hover:bg-primary/90" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Add Your First Customer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="hidden md:table-cell">Statistics</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const stats = customerStats[customer.id] || {};
                    return (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{customer.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {customer.business_name || 'Individual Customer'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate max-w-[150px]">{customer.email}</span>
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span>{customer.phone}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="max-w-xs truncate text-sm text-muted-foreground">
                            {customer.address || '-'}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="font-medium">{formatCurrency(stats.totalSpent || 0)}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <ShoppingCart className="h-3 w-3" />
                              <span>{stats.totalPurchases || 0} purchases</span>
                            </div>
                            {stats.lastPurchase && (
                              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                <TrendingUp className="h-3 w-3" />
                                <span>Last: {formatDate(stats.lastPurchase)}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openViewDialog(customer)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(customer)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;


