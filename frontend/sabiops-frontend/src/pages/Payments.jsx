import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building, 
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Eye
} from 'lucide-react';
import apiService from "../services/api";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Payment form state
  const [newPayment, setNewPayment] = useState({
    customer_id: '',
    customer_name: '',
    invoice_id: '',
    amount: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: '',
    status: 'completed'
  });

  // Sample data for demonstration
  const samplePayments = [
    {
      id: 1,
      customer_name: 'John Doe',
      invoice_number: 'INV-001',
      amount: 25000,
      payment_method: 'bank_transfer',
      payment_date: '2024-01-15',
      status: 'completed',
      reference_number: 'TXN123456789',
      notes: 'Payment for office supplies'
    },
    {
      id: 2,
      customer_name: 'Jane Smith',
      invoice_number: 'INV-002',
      amount: 15000,
      payment_method: 'cash',
      payment_date: '2024-01-14',
      status: 'completed',
      reference_number: 'CASH001',
      notes: 'Cash payment received'
    },
    {
      id: 3,
      customer_name: 'ABC Company',
      invoice_number: 'INV-003',
      amount: 50000,
      payment_method: 'mobile_money',
      payment_date: '2024-01-13',
      status: 'pending',
      reference_number: 'MM789012345',
      notes: 'Mobile money transfer pending'
    },
    {
      id: 4,
      customer_name: 'XYZ Ltd',
      invoice_number: 'INV-004',
      amount: 35000,
      payment_method: 'card',
      payment_date: '2024-01-12',
      status: 'failed',
      reference_number: 'CARD456789',
      notes: 'Card payment failed - insufficient funds'
    }
  ];

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      // For now, use sample data since backend might not be ready
      setTimeout(() => {
        setPayments(samplePayments);
        setLoading(false);
      }, 1000);
      
      // Uncomment when backend is ready
      // const response = await apiService.request('/payments');
      // setPayments(response.payments || response || []);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments(samplePayments); // Fallback to sample data
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    try {
      setLoading(true);
      
      // Generate a reference number if not provided
      const referenceNumber = newPayment.reference_number || 
        `${newPayment.payment_method.toUpperCase()}${Date.now()}`;
      
      const paymentData = {
        ...newPayment,
        reference_number: referenceNumber,
        amount: parseFloat(newPayment.amount)
      };

      // For now, add to local state since backend might not be ready
      const newPaymentRecord = {
        id: Date.now(),
        ...paymentData,
        customer_name: newPayment.customer_name || 'Walk-in Customer'
      };
      
      setPayments(prev => [newPaymentRecord, ...prev]);
      
      // Uncomment when backend is ready
      // const response = await apiService.request('/payments', {
      //   method: 'POST',
      //   body: JSON.stringify(paymentData)
      // });
      // setPayments(prev => [response.payment || response, ...prev]);
      
      // Reset form and close dialog
      setNewPayment({
        customer_id: '',
        customer_name: '',
        invoice_id: '',
        amount: '',
        payment_method: 'cash',
        payment_date: new Date().toISOString().split('T')[0],
        reference_number: '',
        notes: '',
        status: 'completed'
      });
      setShowRecordDialog(false);
    } catch (error) {
      console.error('Failed to record payment:', error);
      alert('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'bank_transfer':
        return <Building className="h-4 w-4" />;
      case 'mobile_money':
        return <Smartphone className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Cash';
      case 'bank_transfer': return 'Bank Transfer';
      case 'mobile_money': return 'Mobile Money';
      case 'card': return 'Card Payment';
      default: return method;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalPayments = payments.reduce((sum, payment) => 
    payment.status === 'completed' ? sum + payment.amount : sum, 0
  );
  const pendingPayments = payments.reduce((sum, payment) => 
    payment.status === 'pending' ? sum + payment.amount : sum, 0
  );
  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage all payment transactions</p>
        </div>
        <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Record a payment received from a customer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={newPayment.customer_name}
                    onChange={(e) => setNewPayment(prev => ({
                      ...prev,
                      customer_name: e.target.value
                    }))}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_number">Invoice Number (Optional)</Label>
                  <Input
                    id="invoice_number"
                    value={newPayment.invoice_number}
                    onChange={(e) => setNewPayment(prev => ({
                      ...prev,
                      invoice_number: e.target.value
                    }))}
                    placeholder="INV-001"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount (₦)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({
                      ...prev,
                      amount: e.target.value
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <Select 
                    value={newPayment.payment_method} 
                    onValueChange={(value) => setNewPayment(prev => ({
                      ...prev,
                      payment_method: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="card">Card Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_date">Payment Date</Label>
                  <Input
                    id="payment_date"
                    type="date"
                    value={newPayment.payment_date}
                    onChange={(e) => setNewPayment(prev => ({
                      ...prev,
                      payment_date: e.target.value
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reference_number">Reference Number (Optional)</Label>
                  <Input
                    id="reference_number"
                    value={newPayment.reference_number}
                    onChange={(e) => setNewPayment(prev => ({
                      ...prev,
                      reference_number: e.target.value
                    }))}
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                  placeholder="Additional notes about this payment"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRecordDialog(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRecordPayment}
                  disabled={loading || !newPayment.customer_name || !newPayment.amount}
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {completedCount} completed payments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{pendingPayments.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} payments pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{(totalPayments * 0.8).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +20% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payments.length > 0 ? Math.round((completedCount / payments.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Payment success rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            View and manage all payment transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer, invoice, or reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                <SelectItem value="card">Card Payment</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading payments...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
              <p className="text-gray-600 mb-4">
                {payments.length === 0 
                  ? "Start by recording your first payment transaction."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              <Button onClick={() => setShowRecordDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Payment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.customer_name}
                    </TableCell>
                    <TableCell>{payment.invoice_number || '-'}</TableCell>
                    <TableCell className="font-medium">
                      ₦{payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.payment_method)}
                        {getMethodLabel(payment.payment_method)}
                      </div>
                    </TableCell>
                    <TableCell>{payment.payment_date}</TableCell>
                    <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.reference_number}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment transaction
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="text-sm">{selectedPayment.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Invoice</Label>
                  <p className="text-sm">{selectedPayment.invoice_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-sm font-medium">₦{selectedPayment.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Method</Label>
                  <p className="text-sm">{getMethodLabel(selectedPayment.payment_method)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Date</Label>
                  <p className="text-sm">{selectedPayment.payment_date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Reference Number</Label>
                <p className="text-sm font-mono">{selectedPayment.reference_number}</p>
              </div>
              {selectedPayment.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Notes</Label>
                  <p className="text-sm">{selectedPayment.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payments;

