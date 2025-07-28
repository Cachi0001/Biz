/**
 * Optimized Customers Page - Performance Enhanced Version
 * Demonstrates the implementation of all performance optimizations
 */

import React, { useState, useCallback, useMemo } from 'react';
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

// Performance optimized imports
import { 
  useOptimizedCustomers, 
  usePagination, 
  useOptimizedSearch,
  useGlobalLoading 
} from '../hooks/useOptimizedData';
import { customerAPI } from '../services/optimizedApi';
import { 
  CardGridSkeleton, 
  TableSkeleton, 
  PageHeaderSkeleton 
} from '../components/ui/SkeletonLoader';
import { ResponsivePagination } from '../components/ui/Pagination';
import { OptimizedImage } from '../components/ui/OptimizedImage';
import { createDebouncedSearch } from '../utils/performanceOptimizations';
import { 
  handleApiErrorWithToast, 
  showSuccessToast, 
  showErrorToast 
} from '../utils/errorHandling';
import { formatNaira } from '../utils/formatting';
import { preloadForPage } from '../utils/dataPreloader';

const OptimizedCustomers = () => {
  // Pagination state
  const pagination = usePagination(1, 20);
  
  // Optimized data fetching with caching and loading states
  const {
    data: customersData,
    loading,
    error,
    refetch,
    refetchSilently
  } = useOptimizedCustomers(pagination.currentPage, {
    onSuccess: (data) => {
      if (data?.pagination) {
        pagination.updatePagination(data.total || 0);
      }
    }
  });

  // Global loading states
  const { isLoading } = useGlobalLoading();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  
  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  
  // Form state
  const [formCustomer, setFormCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    business_name: '',
    notes: ''
  });

  // Optimized search with debouncing
  const searchCustomers = useCallback(async (query) => {
    if (!customersData?.customers) return [];
    
    const customers = customersData.customers;
    const searchLower = query.toLowerCase();
    
    return customers.filter(customer => 
      customer.name?.toLowerCase().includes(searchLower) ||
      customer.email?.toLowerCase().includes(searchLower) ||
      customer.business_name?.toLowerCase().includes(searchLower) ||
      customer.phone?.toLowerCase().includes(searchLower) ||
      customer.address?.toLowerCase().includes(searchLower)
    );
  }, [customersData?.customers]);

  const debouncedSearch = useMemo(
    () => createDebouncedSearch(searchCustomers, 300),
    [searchCustomers]
  );

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    loading: searchLoading
  } = useOptimizedSearch(debouncedSearch);

  // Memoized filtered customers
  const displayCustomers = useMemo(() => {
    if (searchQuery.trim()) {
      return searchResults;
    }
    return customersData?.customers || [];
  }, [searchQuery, searchResults, customersData?.customers]);

  // Preload related data when component mounts
  React.useEffect(() => {
    preloadForPage('customers');
  }, []);

  // Event Handlers with optimized API calls
  const handleCreateCustomer = useCallback(async () => {
    try {
      if (!formCustomer.name.trim()) {
        showErrorToast('Customer name is required');
        return;
      }

      const response = await customerAPI.createCustomer(formCustomer);
      
      setIsCreateDialogOpen(false);
      setFormCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        business_name: '',
        notes: ''
      });

      // Refresh data silently to show new customer
      refetchSilently();
      showSuccessToast("Customer created successfully!");
      
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to create customer');
    }
  }, [formCustomer, refetchSilently]);

  const handleEditCustomer = useCallback(async () => {
    try {
      if (!formCustomer.name.trim()) {
        showErrorToast('Customer name is required');
        return;
      }

      await customerAPI.updateCustomer(selectedCustomer.id, formCustomer);
      
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      
      // Refresh data silently to show updated customer
      refetchSilently();
      showSuccessToast("Customer updated successfully!");
      
    } catch (error) {
      handleApiErrorWithToast(error, 'Failed to update customer');
    }
  }, [formCustomer, selectedCustomer, refetchSilently]);

  const handleDeleteCustomer = useCallback(async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      try {
        await customerAPI.deleteCustomer(id);
        
        // Refresh data silently to remove deleted customer
        refetchSilently();
        showSuccessToast("Customer deleted successfully!");
        
      } catch (error) {
        handleApiErrorWithToast(error, 'Failed to delete customer');
      }
    }
  }, [refetchSilently]);

  const fetchCustomerHistory = useCallback(async (customerId) => {
    try {
      // This would be optimized with a dedicated API endpoint
      const { salesAPI, invoiceAPI } = await import('../services/optimizedApi');
      
      const [salesData, invoicesData] = await Promise.allSettled([
        salesAPI.getSales(),
        invoiceAPI.getInvoices()
      ]);

      const sales = salesData.status === 'fulfilled' ? salesData.value?.sales || [] : [];
      const invoices = invoicesData.status === 'fulfilled' ? invoicesData.value?.invoices || [] : [];

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
  }, []);

  // Dialog handlers
  const openCreateDialog = useCallback(() => {
    setFormCustomer({
      name: '',
      email: '',
      phone: '',
      address: '',
      business_name: '',
      notes: ''
    });
    setIsCreateDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((customer) => {
    setSelectedCustomer(customer);
    setFormCustomer({ ...customer });
    setIsEditDialogOpen(true);
  }, []);

  const openViewDialog = useCallback((customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
    fetchCustomerHistory(customer.id);
  }, [fetchCustomerHistory]);

  // Page change handler
  const handlePageChange = useCallback((page) => {
    if (pagination.goToPage(page)) {
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pagination]);

  // Loading state with skeleton
  if (loading && !customersData) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <PageHeaderSkeleton />
          <Card>
            <CardContent className="pt-6">
              <div className="h-12 bg-gray-200 animate-pulse rounded"></div>
            </CardContent>
          </Card>
          <div className="block md:hidden">
            <CardGridSkeleton count={6} />
          </div>
          <div className="hidden md:block">
            <TableSkeleton rows={10} columns={5} />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error && !customersData) {
    return (
      <DashboardLayout>
        <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-red-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">Failed to load customers</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={refetch} className="bg-green-600 hover:bg-green-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const customers = displayCustomers;
  const totalCustomers = customersData?.total || 0;

  return (
    <DashboardLayout>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Manage your customer relationships ({totalCustomers} total)
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={refetch}
              disabled={isLoading('customers')}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading('customers') ? 'animate-spin' : ''}`} />
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base touch-manipulation"
                />
                {searchLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              {searchQuery && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-600">
                  <span>
                    {customers.length} of {totalCustomers} customers match "{searchQuery}"
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchQuery('')}
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
        {customers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-900">No customers found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'Try adjusting your search criteria'
                  : 'Get started by adding your first customer'}
              </p>
              {!searchQuery && (
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
                {customers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    stats={{
                      totalSpent: customer.total_spent || 0,
                      totalPurchases: customer.total_purchases || 0,
                      lastPurchase: customer.last_purchase_date ? new Date(customer.last_purchase_date) : null
                    }}
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
                  {customers.length} customer{customers.length !== 1 ? 's' : ''} found
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
                      {customers.map((customer) => (
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
                              {formatNaira(customer.total_spent || 0)}
                            </span>
                          </TableCell>
                          <TableCell>{customer.total_purchases || 0}</TableCell>
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
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {!searchQuery && customersData?.pagination && (
              <ResponsivePagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                onPageChange={handlePageChange}
                showInfo={true}
                className="mt-6"
              />
            )}
          </>
        )}

        {/* Dialogs remain the same as original */}
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
                loading={isLoading('customers')}
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
                loading={isLoading('customers')}
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
                  stats={{
                    totalSpent: selectedCustomer.total_spent || 0,
                    totalPurchases: selectedCustomer.total_purchases || 0,
                    lastPurchase: selectedCustomer.last_purchase_date ? new Date(selectedCustomer.last_purchase_date) : null
                  }}
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

export default OptimizedCustomers;