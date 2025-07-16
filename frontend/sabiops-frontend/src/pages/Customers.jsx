import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { CustomerCard } from '../components/customers/CustomerCard';
import { CustomerForm } from '../components/customers/CustomerForm';
import { CustomerProfile } from '../components/customers/CustomerProfile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Edit, Trash2, User, Eye } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getSales, getInvoices, getErrorMessage } from "../services/api";
import { toast } from 'react-hot-toast';

const Customers = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState({});
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form state
  const [formCustomer, setFormCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    business_name: '',
    notes: ''
  });

  // Effects
  useEffect(() => {
    fetchCustomers();
    fetchCustomerStats();
  }, []);

  // API Functions
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await getCustomers();

      // Handle different response formats
      if (response && Array.isArray(response)) {
        setCustomers(response);
      } else if (response?.customers && Array.isArray(response.customers)) {
        setCustomers(response.customers);
      } else if (response?.data?.customers && Array.isArray(response.data.customers)) {
        setCustomers(response.data.customers);
      } else {
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
      const [salesResponse, invoicesResponse] = await Promise.all([
        getSales(),
        getInvoices()
      ]);

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
        if (invoice.customer_id && invoice.status === 'paid') {
          if (!stats[invoice.customer_id]) {
            stats[invoice.customer_id] = {
              totalPurchases: 0,
              totalSpent: 0,
              lastPurchase: null
            };
          }
          stats[invoice.customer_id].totalSpent += parseFloat(invoice.total_amount || 0);
        }
      });

      setCustomerStats(stats);
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    }
  };

  const fetchCustomerHistory = async (customerId) => {
    try {
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
    } catch (error) {
      console.error('Failed to fetch customer history:', error);
      toast.error(getErrorMessage(error, 'Failed to load customer history'));
    }
  };

  // Event Handlers
  const handleCreateCustomer = async () => {
    try {
      if (!formCustomer.name.trim()) {
        toast.error('Customer name is required');
        return;
      }

      setLoading(true);
      const response = await createCustomer(formCustomer);

      const createdCustomer = response?.customer || response?.data?.customer || response;
      setCustomers(prev => [createdCustomer, ...prev]);

      setIsCreateDialogOpen(false);
      setFormCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        business_name: '',
        notes: ''
      });

      toast.success("Customer created successfully!");
      await fetchCustomerStats();
    } catch (error) {
      console.error('Failed to create customer:', error);
      toast.error(getErrorMessage(error, 'Failed to create customer'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async () => {
    try {
      if (!formCustomer.name.trim()) {
        toast.error('Customer name is required');
        return;
      }

      setLoading(true);
      const response = await updateCustomer(selectedCustomer.id, formCustomer);

      const updatedCustomer = response?.customer || response?.data?.customer || formCustomer;
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === selectedCustomer.id ? { ...customer, ...updatedCustomer } : customer
        )
      );

      setIsEditDialogOpen(false);
      setSelectedCustomer(null);

      toast.success("Customer updated successfully!");
      await fetchCustomerStats();
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error(getErrorMessage(error, 'Failed to update customer'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        setLoading(true);
        await deleteCustomer(id);
        setCustomers(prev => prev.filter(customer => customer.id !== id));
        toast.success("Customer deleted successfully!");
      } catch (error) {
        console.error('Failed to delete customer:', error);
        toast.error(getErrorMessage(error, 'Failed to delete customer'));
      } finally {
        setLoading(false);
      }
    }
  };

  const openCreateDialog = () => {
    setFormCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      business_name: '',
      notes: ''
    });
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer(customer);
    setFormCustomer({ ...customer });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
    fetchCustomerHistory(customer.id);
  };

  // Computed values
  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (loading && customers.length === 0) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
          </div>
          <div className="text-center py-8">
            <User className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p>Loading customers...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage your customer relationships</p>
          </div>
          <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers by name, email, or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Customers Display */}
        {filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">No customers found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first customer'}
              </p>
              {!searchTerm && (
                <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mobile Card View (2 cards per row) */}
            <div className="block md:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    stats={customerStats[customer.id]}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteCustomer}
                    onView={openViewDialog}
                  />
                ))}
              </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>Customer List</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Total Spent</TableHead>
                        <TableHead>Orders</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((customer) => {
                        const stats = customerStats[customer.id] || {};
                        return (
                          <TableRow key={customer.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{customer.name}</div>
                                {customer.business_name && (
                                  <div className="text-sm text-gray-500">{customer.business_name}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {customer.email && (
                                  <div className="text-sm">{customer.email}</div>
                                )}
                                {customer.phone && (
                                  <div className="text-sm text-gray-500">{customer.phone}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium text-green-600">
                                ₦{(stats.totalSpent || 0).toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>{stats.totalPurchases || 0}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openViewDialog(customer)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(customer)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteCustomer(customer.id)}
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
              </CardContent>
            </Card>
          </>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer profile for your business
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={formCustomer}
              onChange={setFormCustomer}
              onSubmit={handleCreateCustomer}
              onCancel={() => setIsCreateDialogOpen(false)}
              loading={loading}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={formCustomer}
              onChange={setFormCustomer}
              onSubmit={handleEditCustomer}
              onCancel={() => setIsEditDialogOpen(false)}
              isEditing={true}
              loading={loading}
            />
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Profile</DialogTitle>
              <DialogDescription>
                Detailed customer information and purchase history
              </DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <CustomerProfile
                customer={selectedCustomer}
                stats={customerStats[selectedCustomer.id]}
                history={customerHistory}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Customers;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   