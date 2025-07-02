import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Search, Edit, Trash2, User, Phone, Mail } from 'lucide-react';
import apiService from '../lib/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

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
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await apiService.getCustomers();
      setCustomers(response.customers || []);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    try {
      await apiService.createCustomer(newCustomer);
      setIsCreateDialogOpen(false);
      setNewCustomer({
        name: '',
        email: '',
        phone: '',
        address: '',
        business_name: '',
        notes: ''
      });
      fetchCustomers();
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  const handleEditCustomer = async () => {
    try {
      await apiService.updateCustomer(selectedCustomer.id, selectedCustomer);
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await apiService.deleteCustomer(id);
        fetchCustomers();
      } catch (error) {
        console.error('Failed to delete customer:', error);
      }
    }
  };

  const openEditDialog = (customer) => {
    setSelectedCustomer({ ...customer });
    setIsEditDialogOpen(true);
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
              <div className="grid grid-cols-2 gap-4">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span>{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.business_name || '-'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {customer.address || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Customers;

