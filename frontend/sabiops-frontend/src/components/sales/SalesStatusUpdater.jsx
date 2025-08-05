import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AlertTriangle, CheckCircle, Clock, CreditCard, XCircle } from 'lucide-react';
import PaymentMethodSelector from '../forms/PaymentMethodSelector';
import { toast } from 'react-hot-toast';

const SalesStatusUpdater = ({ sale, onStatusUpdate, onCancel }) => {
  const [newStatus, setNewStatus] = useState('');
  const [paymentData, setPaymentData] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const statusOptions = [
    { value: 'Paid', label: 'Paid', icon: CheckCircle, color: 'text-green-600', description: 'Mark as fully paid' },
    { value: 'Credit', label: 'Credit', icon: Clock, color: 'text-orange-600', description: 'Customer will pay later' },
    { value: 'Pending', label: 'Pending', icon: Clock, color: 'text-yellow-600', description: 'Payment pending' },
    { value: 'Cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-600', description: 'Cancel this sale' }
  ];

  const getCurrentStatusBadge = (status) => {
    const variants = {
      'Paid': 'bg-green-100 text-green-800',
      'Credit': 'bg-orange-100 text-orange-800',
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  const getValidTransitions = (currentStatus) => {
    const transitions = {
      'Credit': ['Paid', 'Cancelled'],
      'Pending': ['Paid', 'Credit', 'Cancelled'],
      'Paid': ['Credit', 'Cancelled'], // Allow reversal if needed
      'Cancelled': ['Credit', 'Pending'] // Allow reactivation
    };
    
    return statusOptions.filter(option => 
      transitions[currentStatus]?.includes(option.value) || option.value === currentStatus
    );
  };

  const handleStatusChange = (status) => {
    setNewStatus(status);
    
    // Clear payment data if not marking as paid
    if (status !== 'Paid') {
      setPaymentData({});
    }
  };

  const handleSubmit = () => {
    if (!newStatus) {
      toast.error('Please select a new status');
      return;
    }

    if (newStatus === sale.payment_status) {
      toast.error('Please select a different status');
      return;
    }

    // Validate payment method if marking as paid
    if (newStatus === 'Paid' && !paymentData.payment_method_id) {
      toast.error('Please select a payment method when marking as paid');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmStatusUpdate = async () => {
    try {
      setSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const updateData = {
        payment_status: newStatus,
        payment_method_id: newStatus === 'Paid' ? paymentData.payment_method_id : null,
        pos_data: newStatus === 'Paid' ? paymentData.pos_data : null
      };
      
      // Calculate new amounts based on status
      let updatedSale = { ...sale };
      if (newStatus === 'Paid') {
        updatedSale.amount_paid = sale.total_amount;
        updatedSale.amount_due = 0;
        updatedSale.payment_method_id = paymentData.payment_method_id;
      } else if (newStatus === 'Credit' || newStatus === 'Pending') {
        updatedSale.amount_due = sale.total_amount - (sale.amount_paid || 0);
      } else if (newStatus === 'Cancelled') {
        updatedSale.amount_due = 0;
      }
      updatedSale.payment_status = newStatus;
      
      toast.success(`Sale status updated to ${newStatus}`);
      onStatusUpdate(updatedSale);
      
    } catch (error) {
      console.error('Error updating sale status:', error);
      toast.error('Failed to update sale status. Please try again.');
    } finally {
      setSubmitting(false);
      setShowConfirmation(false);
    }
  };

  const getStatusChangeImpact = () => {
    const currentStatus = sale.payment_status;
    
    if (currentStatus === 'Paid' && newStatus !== 'Paid') {
      return {
        type: 'warning',
        message: 'This will remove the sale from recognized revenue and move it to accounts receivable.',
        icon: AlertTriangle,
        color: 'text-orange-600'
      };
    } else if (currentStatus !== 'Paid' && newStatus === 'Paid') {
      return {
        type: 'success',
        message: 'This will recognize the full sale amount as revenue.',
        icon: CheckCircle,
        color: 'text-green-600'
      };
    } else if (newStatus === 'Cancelled') {
      return {
        type: 'error',
        message: 'This will cancel the sale and remove it from all revenue calculations.',
        icon: XCircle,
        color: 'text-red-600'
      };
    }
    
    return null;
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const validTransitions = getValidTransitions(sale.payment_status);
  const impact = getStatusChangeImpact();

  return (
    <>
      <div className="space-y-6">
        {/* Current Sale Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-semibold">{sale.customer_name || 'Walk-in Customer'}</p>
                <p className="text-sm text-gray-600 mt-2">Product</p>
                <p className="font-semibold">{sale.product_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold">{formatCurrency(sale.total_amount)}</p>
                <p className="text-sm text-gray-600 mt-2">Current Status</p>
                <div className="flex items-center gap-2">
                  {getCurrentStatusBadge(sale.payment_status)}
                </div>
              </div>
            </div>
            
            {sale.amount_due > 0 && (
              <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                <p className="text-sm font-medium text-orange-800">
                  Outstanding Balance: {formatCurrency(sale.amount_due)}
                </p>
                <p className="text-xs text-orange-700">
                  Paid: {formatCurrency(sale.amount_paid || 0)} of {formatCurrency(sale.total_amount)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Selection */}
        <div className="space-y-2">
          <Label htmlFor="new_status">New Payment Status</Label>
          <Select value={newStatus} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {validTransitions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${option.color}`} />
                      <div>
                        <span className="font-medium">{option.label}</span>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method Selection (only for Paid status) */}
        {newStatus === 'Paid' && (
          <div className="space-y-4">
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3">Payment Method Required</h3>
              <PaymentMethodSelector
                value={paymentData}
                onChange={setPaymentData}
                required={true}
              />
            </div>
          </div>
        )}

        {/* Impact Warning */}
        {impact && (
          <Card className={`border-2 ${
            impact.type === 'warning' ? 'border-orange-200 bg-orange-50' :
            impact.type === 'success' ? 'border-green-200 bg-green-50' :
            'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <impact.icon className={`h-5 w-5 ${impact.color} mt-0.5`} />
                <div>
                  <p className="font-medium text-gray-900">Revenue Recognition Impact</p>
                  <p className="text-sm text-gray-700 mt-1">{impact.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1"
            disabled={!newStatus || newStatus === sale.payment_status || submitting}
          >
            Update Status
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the payment status from {sale.payment_status} to {newStatus}?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Current Status:</span>
                {getCurrentStatusBadge(sale.payment_status)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Status:</span>
                {getCurrentStatusBadge(newStatus)}
              </div>
            </div>

            {/* Payment Method Info */}
            {newStatus === 'Paid' && paymentData.payment_method && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">Payment Method</p>
                <p className="text-sm text-green-700">{paymentData.payment_method.name}</p>
                {paymentData.pos_data?.pos_account_name && (
                  <p className="text-xs text-green-600">
                    POS Account: {paymentData.pos_data.pos_account_name}
                  </p>
                )}
              </div>
            )}

            {/* Impact Warning */}
            {impact && (
              <div className={`p-4 rounded-lg ${
                impact.type === 'warning' ? 'bg-orange-50' :
                impact.type === 'success' ? 'bg-green-50' :
                'bg-red-50'
              }`}>
                <div className="flex items-start gap-2">
                  <impact.icon className={`h-4 w-4 ${impact.color} mt-0.5`} />
                  <p className="text-sm">{impact.message}</p>
                </div>
              </div>
            )}

            {/* Confirmation Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmStatusUpdate}
                className="flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  'Confirm Update'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SalesStatusUpdater;