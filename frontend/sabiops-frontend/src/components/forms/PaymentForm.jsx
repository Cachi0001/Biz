import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import PaymentMethodSelector from './PaymentMethodSelector';
import { paymentApi } from '../../services/enhancedApiClient';

const PaymentForm = ({ onSuccess, onCancel, initialData = {} }) => {
  const [formData, setFormData] = useState({
    amount: initialData.amount || '',
    description: initialData.description || '',
    ...initialData
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

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePaymentMethodChange = (data) => {
    setPaymentMethodData(data);
  };

  const handlePaymentMethodValidation = (validation) => {
    setPaymentMethodValidation(validation);
  };

  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      return { isValid: false, error: 'Please enter a valid amount' };
    }

    if (!paymentMethodValidation.isValid) {
      return { 
        isValid: false, 
        error: paymentMethodValidation.errors[0] || 'Please complete payment method selection' 
      };
    }

    return { isValid: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm();
    if (!validation.isValid) {
      return;
    }

    try {
      setLoading(true);
      
      // Prepare payment data for API
      const paymentData = {
        amount: parseFloat(formData.amount),
        payment_method_id: paymentMethodData.payment_method_id,
        description: formData.description,
        ...paymentMethodData.pos_data
      };
      
      await paymentApi.recordPayment(paymentData);
      onSuccess();
    } catch (error) {
      console.error('Error recording payment:', error);
      // Error toast is handled by the API client
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          disabled={loading}
        />
      </div>

      {/* Payment Method Selector */}
      <PaymentMethodSelector
        value={paymentMethodData.payment_method_id}
        onChange={handlePaymentMethodChange}
        onValidationChange={handlePaymentMethodValidation}
        required={true}
        disabled={loading}
      />

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Optional payment description or notes"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          disabled={loading}
        />
      </div>

      {/* Payment Summary */}
      {formData.amount && paymentMethodData.payment_method && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment Summary</p>
                <p className="text-lg font-semibold text-green-800">
                  ₦{parseFloat(formData.amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">via {paymentMethodData.payment_method.name}</p>
              </div>
              <div className="text-right">
                {paymentMethodData.payment_method.is_pos && paymentMethodData.pos_data.pos_account_name && (
                  <p className="text-xs text-gray-600">POS: {paymentMethodData.pos_data.pos_account_name}</p>
                )}
                {(paymentMethodData.pos_data.pos_reference_number || paymentMethodData.pos_data.reference_number) && (
                  <p className="text-xs text-gray-600">
                    Ref: {paymentMethodData.pos_data.pos_reference_number || paymentMethodData.pos_data.reference_number}
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
          disabled={loading || !paymentMethodValidation.isValid}
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