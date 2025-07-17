import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { CustomerCard } from '../components/customers/CustomerCard';
import { CustomerForm } from '../components/customers/CustomerForm';
import { CustomerProfile } from '../components/customers/CustomerProfile';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Edit, Trash2, User, Eye, RefreshCw } from 'lucide-react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getSales, getInvoices } from "../services/api";
import { 
  handleApiErrorWithToast, 
  showSuccessToast, 
  showErrorToast, 
  safeArray
} from '../utils/errorHandling';
import { formatNaira } from '../utils/formatting';

const Customers = () => {
  // State management
  const [customers, setCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState({});
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

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
  }, [fetchCustomers]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // API Functions with improved error handling
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCustomers();

      // Use the new backend response format - customers with stats are already included
      const customersData = safeArray(response?.data?.customers || response?.customers || response, []);
      
      setCustomers(customersData);
      
      // Extract stats from customer data if available (backend now provides this)
      const stats = {};
      customersData.forEach(customer => {
        if (customer.id) {
          stats[customer.id] = {
            totalSpent: customer.total_spent || 0,
            totalPurchases: customer.total_purchases || 0,
            lastPurchase: customer.last_purchase_date ? new Date(customer.last_purchase_date) : null
          };
        }
      });
      setCustomerStats(stats);
      
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to load customers');
      setCustomers([]);
      setCustomerStats({});
    } finally {
      setLoading(false);
    }
  }, []);



  const fetchCustomerHistory = async (customerId) => {
    try {
      const [salesResponse, invoicesResponse] = await Promise.all([
        getSales(),
        getInvoices()
      ]);

      const sales = safeArray(salesResponse?.data?.sales || salesResponse?.sales || salesResponse, []);
      const invoices = safeArray(invoicesResponse?.data?.invoices || invoicesResponse?.invoices || invoicesResponse, []);

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
      handleApiErrorWithToast(error, 'Failed to load customer history');
    }
  };

  // Event Handlers with improved error handling
  const handleCreateCustomer = async () => {
    try {
      if (!formCustomer.name.trim()) {
        showErrorToast('Customer name is required');
        return;
      }

      setLoading(true);
      const response = await createCustomer(formCustomer);

      // Handle the new backend response format
      const createdCustomer = response?.data?.customer || response?.customer || response;
      
      // Add the new customer to the list with default stats
      const customerWithStats = {
        ...createdCustomer,
        total_spent: 0,
        total_purchases: 0,
        last_purchase_date: null
      };
      
      setCustomers(prev => [customerWithStats, ...prev]);
      
      // Update stats
      setCustomerStats(prev => ({
        ...prev,
        [createdCustomer.id]: {
          totalSpent: 0,
          totalPurchases: 0,
          lastPurchase: null
        }
      }));

      setIsCreateDialogOpen(false);
      setFormCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        business_name: '',
        notes: ''
      });

      showSuccessToast("Customer created successfully!");
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async () => {
    try {
      if (!formCustomer.name.trim()) {
        showErrorToast('Customer name is required');
        return;
      }

      setLoading(true);
      const response = await updateCustomer(selectedCustomer.id, formCustomer);

      // Handle the new backend response format
      const updatedCustomer = response?.data?.customer || response?.customer || response;
      
      // Update the customer in the list while preserving stats
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === selectedCustomer.id ? { 
            ...customer, 
            ...updatedCustomer,
            // Preserve existing stats if not provided in response
            total_spent: updatedCustomer.total_spent ?? customer.total_spent,
            total_purchases: updatedCustomer.total_purchases ?? customer.total_purchases,
            last_purchase_date: updatedCustomer.last_purchase_date ?? customer.last_purchase_date
          } : customer
        )
      );

      // Update stats if provided in response
      if (updatedCustomer.total_spent !== undefined || updatedCustomer.total_purchases !== undefined) {
        setCustomerStats(prev => ({
          ...prev,
          [selectedCustomer.id]: {
            totalSpent: updatedCustomer.total_spent ?? prev[selectedCustomer.id]?.totalSpent ?? 0,
            totalPurchases: updatedCustomer.total_purchases ?? prev[selectedCustomer.id]?.totalPurchases ?? 0,
            lastPurchase: updatedCustomer.last_purchase_date ? new Date(updatedCustomer.last_purchase_date) : prev[selectedCustomer.id]?.lastPurchase
          }
        }));
      }

      setIsEditDialogOpen(false);
      setSelectedCustomer(null);

      showSuccessToast("Customer updated successfully!");
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to update customer');
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
        // Remove from stats as well
        setCustomerStats(prev => {
          const newStats = { ...prev };
          delete newStats[id];
          return newStats;
        });
        showSuccessToast("Customer deleted successfully!");
      } catch (error) {
        handleApiErrorWithToast(error, 'Failed to delete customer');
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

  // Computed values with debounced search
  const filteredCustomers = customers.filter(customer => {
    if (!debouncedSearchTerm) return true;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return (
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.business_name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  });

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
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your customer relationships ({customers.length} total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchCustomers}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={openCreateDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Customer
            </Button>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name, email, business, phone, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base touch-manipulation"
                />
              </div>
              {searchTerm && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-600">
                  <span>
                    {filteredCustomers.length} of {customers.length} customers match "{searchTerm}"
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="text-gray-500 hover:text-gray-700 h-8 touch-manipulation"
                  >
                    Clear search
                  </Button>
                </div>
              )}
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
                                {formatNaira(stats.totalSpent || customer.total_spent || 0)}
                              </span>
                            </TableCell>
                            <TableCell>{stats.totalPurchases || customer.total_purchases || 0}</TableCell>
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
          <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Add New Customer</DialogTitle>
              <DialogDescription>
                Create a new customer profile for your business
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <CustomerForm
                customer={formCustomer}
                onChange={setFormCustomer}
                onSubmit={handleCreateCustomer}
                onCancel={() => setIsCreateDialogOpen(false)}
                loading={loading}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>
                Update customer information
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              <CustomerForm
                customer={formCustomer}
                onChange={setFormCustomer}
                onSubmit={handleEditCustomer}
                onCancel={() => setIsEditDialogOpen(false)}
                isEditing={true}
                loading={loading}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="w-[95vw] max-w-4xl h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Customer Profile</DialogTitle>
              <DialogDescription>
                Detailed customer information and purchase history
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-1">
              {selectedCustomer && (
                <CustomerProfile
                  customer={selectedCustomer}
                  stats={customerStats[selectedCustomer.id]}
                  history={customerHistory}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Customers;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   