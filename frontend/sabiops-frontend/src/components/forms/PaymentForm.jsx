import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PaymentForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method_id: '',
    description: '',
    reference_number: '',
    is_pos_transaction: false,
    pos_account_name: '',
    transaction_type: 'Sale',
    pos_reference_number: ''
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);

  // Mock payment methods - in real app, fetch from API
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingMethods(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockMethods = [
          {
            id: '1',
            name: 'Cash',
            type: 'Cash',
            is_pos: false,
            requires_reference: false,
            description: 'Physical cash payments'
          },
          {
            id: '2',
            name: 'POS - Card',
            type: 'Digital',
            is_pos: true,
            requires_reference: true,
            description: 'Card payments via POS terminal'
          },
          {
            id: '3',
            name: 'Mobile Money',
            type: 'Digital',
            is_pos: false,
            requires_reference: true,
            description: 'Mobile money transfers'
          },
          {
            id: '4',
            name: 'Bank Transfer',
            type: 'Digital',
            is_pos: false,
            requires_reference: true,
            description: 'Direct bank transfers'
          }
        ];
        
        setPaymentMethods(mockMethods);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        toast.error('Failed to load payment methods');
      } finally {
        setLoadingMethods(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentMethodChange = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    setSelectedMethod(method);
    
    setFormData(prev => ({
      ...prev,
      payment_method_id: methodId,
      is_pos_transaction: method?.is_pos || false,
      // Clear POS fields if not POS method
      pos_account_name: method?.is_pos ? prev.pos_account_name : '',
      pos_reference_number: method?.is_pos ? prev.pos_reference_number : '',
      // Clear reference if not required
      reference_number: method?.requires_reference && !method?.is_pos ? prev.reference_number : ''
    }));
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }

    if (!formData.payment_method_id) {
      toast.error('Please select a payment method');
      return false;
    }

    if (selectedMethod?.is_pos) {
      if (!formData.pos_account_name.trim()) {
        toast.error('POS account name is required');
        return false;
      }
      if (selectedMethod.requires_reference && !formData.pos_reference_number.trim()) {
        toast.error('POS reference number is required');
        return false;
      }
    } else if (selectedMethod?.requires_reference && !formData.reference_number.trim()) {
      toast.error('Reference number is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In real app, make API call to record payment
      console.log('Recording payment:', formData);
      
      toast.success('Payment recorded successfully!');
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method) => {
    if (method.type === 'Cash') return <Banknote className="h-4 w-4" />;
    if (method.is_pos) return <CreditCard className="h-4 w-4" />;
    if (method.name.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  if (loadingMethods) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            className="text-lg font-semibold"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method *</Label>
          <Select value={formData.payment_method_id} onValueChange={handlePaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method.id} value={method.id}>
                  <div className="flex items-center gap-2">
                    {getPaymentMethodIcon(method)}
                    <span>{method.name}</span>
                    {method.is_pos && <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">POS</span>}
                    {method.requires_reference && <span className="text-xs bg-orange-100 text-orange-800 px-1 rounded">Ref</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedMethod && (
            <p className="text-xs text-gray-600">{selectedMethod.description}</p>
          )}
        </div>
      </div>

      {/* POS Fields */}
      {selectedMethod?.is_pos && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              POS Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pos_account_name">POS Account Name *</Label>
                <Input
                  id="pos_account_name"
                  placeholder="e.g., Moniepoint POS, Opay POS"
                  value={formData.pos_account_name}
                  onChange={(e) => handleInputChange('pos_account_name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type</Label>
                <Select value={formData.transaction_type} onValueChange={(value) => handleInputChange('transaction_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Refund">Refund</SelectItem>
                    <SelectItem value="Deposit">Deposit</SelectItem>
                    <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedMethod.requires_reference && (
              <div className="space-y-2">
                <Label htmlFor="pos_reference_number">POS Reference Number *</Label>
                <Input
                  id="pos_reference_number"
                  placeholder="Enter POS reference/receipt number"
                  value={formData.pos_reference_number}
                  onChange={(e) => handleInputChange('pos_reference_number', e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reference Number for non-POS methods */}
      {selectedMethod?.requires_reference && !selectedMethod?.is_pos && (
        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference Number *</Label>
          <Input
            id="reference_number"
            placeholder="Enter transaction reference number"
            value={formData.reference_number}
            onChange={(e) => handleInputChange('reference_number', e.target.value)}
          />
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional payment description or notes"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
        />
      </div>

      {/* Payment Summary */}
      {formData.amount && selectedMethod && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Summary</p>
                <p className="text-lg font-semibold text-green-800">
                  ₦{parseFloat(formData.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">via {selectedMethod.name}</p>
              </div>
              <div className="text-right">
                {selectedMethod.is_pos && formData.pos_account_name && (
                  <p className="text-xs text-gray-600">POS: {formData.pos_account_name}</p>
                )}
                {(formData.pos_reference_number || formData.reference_number) && (
                  <p className="text-xs text-gray-600">
                    Ref: {formData.pos_reference_number || formData.reference_number}
                  </p>
                )}
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
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Recording...
            </div>
          ) : (
            'Record Payment'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;