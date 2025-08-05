import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { 
  CreditCard, 
  Calendar, 
  User, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Plus,
  Eye,
  TrendingUp
} from 'lucide-react';
import PaymentMethodSelector from '../forms/PaymentMethodSelector';
import { salesApi, paymentApi } from '../../services/enhancedApiClient';

const CreditSalesManager = () => {
  const [outstandingSales, setOutstandingSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [summary, setSummary] = useState({
    total_outstanding_amount: 0,
    outstanding_count: 0,
    payment_status_breakdown: {}
  });

  // Partial payment form state
  const [partialPaymentData, setPartialPaymentData] = useState({
    amount: '',
    description: ''
  });

  const [paymentMethodData, setPaymentMethodData] = useState({
    payment_method_id: '',
    payment_method: null,
    pos_data: {}
  });

  const [paymentMethodValidation, setPaymentMethodValidation] = useState({
    isValid: false,
    errors: []
  });

  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    fetchOutstandingSales();
  }, []);

  const fetchOutstandingSales = async () => {
    try {
      setLoading(true);
      const response = await salesApi.getOutstandingCreditSales();
      
      if (response.outstanding_sales) {
        setOutstandingSales(response.outstanding_sales);
        setSummary({
          total_outstanding_amount: response.total_outstanding_amount || 0,
          outstanding_count: response.total_count || 0,
          payment_status_breakdown: response.payment_status_breakdown || {}
        });
      }
    } catch (error) {
      console.error('Error fetching outstanding sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (saleId) => {
    try {
      const response = await salesApi.getSalePaymentHistory(saleId);
      setPaymentHistory(response.payment_history || []);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistory([]);
    }
  };

  const handleViewHistory = async (sale) => {
    setSelectedSale(sale);
    await fetchPaymentHistory(sale.id);
    setHistoryModalOpen(true);
  };

  const handleRecordPayment = (sale) => {
    setSelectedSale(sale);
    setPartialPaymentData({
      amount: '',
      description: `Partial payment for sale ${sale.id}`
    });
    setPaymentMethodData({
      payment_method_id: '',
      payment_method: null,
      pos_data: {}
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentMethodChange = (data) => {
    setPaymentMethodData(data);
  };

  const handlePaymentMethodValidation = (validation) => {
    setPaymentMethodValidation(validation);
  };

  const validatePartialPayment = () => {
    const amount = parseFloat(partialPaymentData.amount);
    const amountDue = parseFloat(selectedSale?.amount_due || 0);

    if (!amount || amount <= 0) {
      return { isValid: false, error: 'Please enter a valid payment amount' };
    }

    if (amount > amountDue) {
      return { 
        isValid: false, 
        error: `Payment amount cannot exceed outstanding balance of ₦${amountDue.toLocaleString('en-NG', { minimumFractionDigits: 2 })}` 
      };
    }

    if (!paymentMethodValidation.isValid) {
      return { 
        isValid: false, 
        error: paymentMethodValidation.errors[0] || 'Please complete payment method selection' 
      };
    }

    return { isValid: true };
  };

  const handleSubmitPartialPayment = async () => {
    const validation = validatePartialPayment();
    if (!validation.isValid) {
      return;
    }

    try {
      setSubmittingPayment(true);

      const paymentData = {
        amount: parseFloat(partialPaymentData.amount),
        payment_method_id: paymentMethodData.payment_method_id,
        description: partialPaymentData.description,
        ...paymentMethodData.pos_data
      };

      await salesApi.recordPartialPayment(selectedSale.id, paymentData);
      
      // Refresh data
      await fetchOutstandingSales();
      
      // Close modal and reset form
      setPaymentModalOpen(false);
      setPartialPaymentData({ amount: '', description: '' });
      setPaymentMethodData({ payment_method_id: '', payment_method: null, pos_data: {} });
      
    } catch (error) {
      console.error('Error recording partial payment:', error);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Credit': { color: 'bg-orange-100 text-orange-800', icon: Clock },
      'Pending': { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      'Paid': { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig['Credit'];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysOutstanding = (dateString) => {
    const saleDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - saleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading outstanding credit sales...</p>
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(summary.total_outstanding_amount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Outstanding Sales</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary.outstanding_count}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Credit Sales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {summary.payment_status_breakdown.Credit || 0}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Sales List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Outstanding Credit Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          {outstandingSales.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600">No outstanding credit sales</p>
              <p className="text-sm text-gray-500">All sales have been paid in full</p>
            </div>
          ) : (
            <div className="space-y-4">
              {outstandingSales.map((sale) => (
                <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{sale.customer_name || 'Walk-in Customer'}</p>
                        <p className="text-sm text-gray-600">{sale.product_name}</p>
                      </div>
                    </div>
                    {getStatusBadge(sale.payment_status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Total Amount</p>
                      <p className="font-medium">{formatCurrency(sale.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount Paid</p>
                      <p className="font-medium text-green-600">{formatCurrency(sale.amount_paid)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Amount Due</p>
                      <p className="font-medium text-orange-600">{formatCurrency(sale.amount_due)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Days Outstanding</p>
                      <p className="font-medium">{getDaysOutstanding(sale.created_at)} days</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Sale Date: {formatDate(sale.created_at)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewHistory(sale)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        History
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRecordPayment(sale)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-1" />
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

      {/* Partial Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Partial Payment</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-6">
              {/* Sale Summary */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">{selectedSale.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Product</p>
                      <p className="font-medium">{selectedSale.product_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium">{formatCurrency(selectedSale.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Outstanding Balance</p>
                      <p className="font-medium text-orange-600">{formatCurrency(selectedSale.amount_due)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_amount">Payment Amount *</Label>
                  <Input
                    id="payment_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedSale.amount_due}
                    placeholder="0.00"
                    value={partialPaymentData.amount}
                    onChange={(e) => setPartialPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                    className="text-lg font-semibold"
                  />
                  <p className="text-xs text-gray-600">
                    Maximum: {formatCurrency(selectedSale.amount_due)}
                  </p>
                </div>

                <PaymentMethodSelector
                  value={paymentMethodData.payment_method_id}
                  onChange={handlePaymentMethodChange}
                  onValidationChange={handlePaymentMethodValidation}
                  required={true}
                  disabled={submittingPayment}
                />

                <div className="space-y-2">
                  <Label htmlFor="payment_description">Description</Label>
                  <Input
                    id="payment_description"
                    placeholder="Payment description"
                    value={partialPaymentData.description}
                    onChange={(e) => setPartialPaymentData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1"
                  disabled={submittingPayment}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitPartialPayment}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={submittingPayment || !paymentMethodValidation.isValid}
                >
                  {submittingPayment ? (
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

      {/* Payment History Modal */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Payment History</DialogTitle>
          </DialogHeader>
          
          {selectedSale && (
            <div className="space-y-4">
              {/* Sale Info */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Customer</p>
                      <p className="font-medium">{selectedSale.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="font-medium">{formatCurrency(selectedSale.total_amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Outstanding</p>
                      <p className="font-medium text-orange-600">{formatCurrency(selectedSale.amount_due)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <div className="space-y-3">
                <h4 className="font-medium">Payment History</h4>
                {paymentHistory.length === 0 ? (
                  <p className="text-gray-600 text-center py-4">No payments recorded yet</p>
                ) : (
                  <div className="space-y-2">
                    {paymentHistory.map((payment, index) => (
                      <div key={payment.id || index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(payment.payment_date)} • {payment.payment_method_name || 'Unknown Method'}
                            </p>
                            {payment.description && (
                              <p className="text-xs text-gray-500">{payment.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            {payment.pos_account_name && (
                              <p className="text-xs text-gray-600">POS: {payment.pos_account_name}</p>
                            )}
                            {(payment.pos_reference_number || payment.reference_number) && (
                              <p className="text-xs text-gray-600">
                                Ref: {payment.pos_reference_number || payment.reference_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreditSalesManager;