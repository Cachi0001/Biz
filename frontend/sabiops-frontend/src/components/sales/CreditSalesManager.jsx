import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { CreditCard, Clock, DollarSign, User, Calendar, Receipt } from 'lucide-react';
import PaymentMethodSelector from '../forms/PaymentMethodSelector';
import { toast } from 'react-hot-toast';

const CreditSalesManager = ({ userId }) => {
  const [outstandingSales, setOutstandingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentData, setPaymentData] = useState({});
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOutstandingSales();
  }, [userId]);

  const fetchOutstandingSales = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockSales = [
        {
          id: '1',
          customer_name: 'John Doe',
          customer_id: 'cust_1',
          product_name: 'Rice 50kg',
          total_amount: 25000,
          amount_paid: 10000,
          amount_due: 15000,
          payment_status: 'Credit',
          date: '2025-01-10',
          created_at: '2025-01-10T10:00:00Z'
        },
        {
          id: '2',
          customer_name: 'Jane Smith',
          customer_id: 'cust_2',
          product_name: 'Cooking Oil 5L',
          total_amount: 8000,
          amount_paid: 3000,
          amount_due: 5000,
          payment_status: 'Credit',
          date: '2025-01-12',
          created_at: '2025-01-12T14:30:00Z'
        },
        {
          id: '3',
          customer_name: 'Mike Johnson',
          customer_id: 'cust_3',
          product_name: 'Bread Loaves x10',
          total_amount: 3000,
          amount_paid: 0,
          amount_due: 3000,
          payment_status: 'Pending',
          date: '2025-01-14',
          created_at: '2025-01-14T09:15:00Z'
        }
      ];
      
      setOutstandingSales(mockSales);
    } catch (error) {
      console.error('Error fetching outstanding sales:', error);
      toast.error('Failed to load outstanding sales');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (saleId) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockHistory = [
        {
          id: '1',
          amount: 10000,
          payment_method: 'Cash',
          payment_date: '2025-01-11T10:00:00Z',
          description: 'Partial payment',
          pos_account_name: null,
          reference_number: null
        },
        {
          id: '2',
          amount: 3000,
          payment_method: 'POS - Card',
          payment_date: '2025-01-13T15:30:00Z',
          description: 'Partial payment via POS',
          pos_account_name: 'Moniepoint POS',
          reference_number: 'REF123456'
        }
      ];
      
      setPaymentHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast.error('Failed to load payment history');
    }
  };

  const handleRecordPayment = async (sale) => {
    setSelectedSale(sale);
    setPaymentAmount('');
    setPaymentData({});
    await fetchPaymentHistory(sale.id);
    setPaymentModal(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount > selectedSale.amount_due) {
      toast.error(`Payment amount cannot exceed outstanding balance of ₦${selectedSale.amount_due.toLocaleString()}`);
      return;
    }

    if (!paymentData.payment_method_id) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the sale in the list
      const newAmountPaid = selectedSale.amount_paid + amount;
      const newAmountDue = selectedSale.amount_due - amount;
      const newStatus = newAmountDue === 0 ? 'Paid' : selectedSale.payment_status;
      
      setOutstandingSales(prev => 
        prev.map(sale => 
          sale.id === selectedSale.id 
            ? {
                ...sale,
                amount_paid: newAmountPaid,
                amount_due: newAmountDue,
                payment_status: newStatus
              }
            : sale
        ).filter(sale => sale.amount_due > 0) // Remove fully paid sales
      );
      
      toast.success(`Payment of ₦${amount.toLocaleString()} recorded successfully!`);
      setPaymentModal(false);
      
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Credit': 'bg-orange-100 text-orange-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Paid': 'bg-green-100 text-green-800'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const calculateTotalOutstanding = () => {
    return outstandingSales.reduce((total, sale) => total + sale.amount_due, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading outstanding sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Outstanding Sales</p>
                <p className="text-xl font-bold text-gray-900">{outstandingSales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(calculateTotalOutstanding())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Days Outstanding</p>
                <p className="text-xl font-bold text-gray-900">
                  {Math.round(outstandingSales.reduce((sum, sale) => {
                    const days = Math.floor((new Date() - new Date(sale.created_at)) / (1000 * 60 * 60 * 24));
                    return sum + days;
                  }, 0) / outstandingSales.length) || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Sales List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Outstanding Credit Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outstandingSales.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No outstanding credit sales</p>
              <p className="text-sm text-gray-500">All sales have been fully paid</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outstandingSales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">{sale.customer_name}</h3>
                        {getStatusBadge(sale.payment_status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p><span className="font-medium">Product:</span> {sale.product_name}</p>
                          <p><span className="font-medium">Sale Date:</span> {formatDate(sale.date)}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Total Amount:</span> {formatCurrency(sale.total_amount)}</p>
                          <p><span className="font-medium">Amount Paid:</span> {formatCurrency(sale.amount_paid)}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-red-800">Outstanding Balance:</span>
                          <span className="text-lg font-bold text-red-900">
                            {formatCurrency(sale.amount_due)}
                          </span>
                        </div>
                        <div className="mt-2 bg-red-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(sale.amount_paid / sale.total_amount) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-red-700 mt-1">
                          {((sale.amount_paid / sale.total_amount) * 100).toFixed(1)}% paid
                        </p>
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        onClick={() => handleRecordPayment(sale)}
                        className="bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        Record Payment
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Partial Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedSale?.customer_name}'s outstanding balance
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-6">
              {/* Sale Summary */}
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Customer:</span> {selectedSale.customer_name}</p>
                      <p><span className="font-medium">Product:</span> {selectedSale.product_name}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Total Amount:</span> {formatCurrency(selectedSale.total_amount)}</p>
                      <p><span className="font-medium">Outstanding:</span> <span className="font-bold text-red-600">{formatCurrency(selectedSale.amount_due)}</span></p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Amount */}
              <div className="space-y-2">
                <Label htmlFor="payment_amount">Payment Amount *</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedSale.amount_due}
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="text-lg font-semibold"
                />
                <p className="text-xs text-gray-600">
                  Maximum: {formatCurrency(selectedSale.amount_due)}
                </p>
              </div>

              {/* Payment Method Selector */}
              <PaymentMethodSelector
                value={paymentData}
                onChange={setPaymentData}
                required={true}
              />

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional payment description"
                  rows={2}
                />
              </div>

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Payment History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {paymentHistory.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-gray-600">{formatDate(payment.payment_date)}</p>
                          </div>
                          <div className="text-right">
                            <p>{payment.payment_method}</p>
                            {payment.pos_account_name && (
                              <p className="text-xs text-gray-500">{payment.pos_account_name}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPaymentModal(false)}
                  className="flex-1"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePaymentSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Recording...
                    </div>
                  ) : (
                    'Record Payment'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditSalesManager;