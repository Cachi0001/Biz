import React, { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CreditCard, Smartphone, Building2, Banknote, AlertCircle } from 'lucide-react';
import { paymentApi } from '../../services/enhancedApiClient';

const PaymentMethodSelector = ({ 
  value, 
  onChange, 
  onValidationChange,
  className = "",
  required = false,
  disabled = false,
  showDropdownFormat = true,
  filterType = null, // 'Cash', 'Digital', 'Credit'
  posOnly = false
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [posData, setPosData] = useState({
    pos_account_name: '',
    transaction_type: 'Sale',
    pos_reference_number: '',
    reference_number: ''
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoading(true);
        
        const params = {
          active_only: true,
          dropdown: showDropdownFormat,
          ...(filterType && { type: filterType }),
          ...(posOnly && { pos_only: true })
        };
        
        const response = await paymentApi.getPaymentMethods(params);
        const methods = response.payment_methods || response || [];
        
        setPaymentMethods(methods);
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Error toast is handled by the API client
        setPaymentMethods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentMethods();
  }, [showDropdownFormat, filterType, posOnly]);

  // Validate current selection
  useEffect(() => {
    const errors = validateSelection();
    setValidationErrors(errors);
    
    if (onValidationChange) {
      onValidationChange({
        isValid: errors.length === 0,
        errors: errors,
        selectedMethod: selectedMethod,
        posData: posData
      });
    }
  }, [selectedMethod, posData, onValidationChange]);

  const validateSelection = () => {
    const errors = [];

    if (required && !selectedMethod) {
      errors.push('Payment method is required');
      return errors;
    }

    if (!selectedMethod) return errors;

    if (selectedMethod.is_pos) {
      if (!posData.pos_account_name.trim()) {
        errors.push('POS account name is required');
      }
      if (selectedMethod.requires_reference && !posData.pos_reference_number.trim()) {
        errors.push('POS reference number is required');
      }
    } else if (selectedMethod.requires_reference && !posData.reference_number.trim()) {
      errors.push('Reference number is required');
    }

    return errors;
  };

  const handlePaymentMethodChange = (methodId) => {
    const method = paymentMethods.find(m => m.id === methodId);
    setSelectedMethod(method);
    
    // Clear POS data if switching to non-POS method
    if (!method?.is_pos) {
      setPosData(prev => ({
        ...prev,
        pos_account_name: '',
        pos_reference_number: ''
      }));
    }
    
    // Clear reference if not required
    if (!method?.requires_reference || method?.is_pos) {
      setPosData(prev => ({
        ...prev,
        reference_number: ''
      }));
    }

    // Notify parent component
    if (onChange) {
      onChange({
        payment_method_id: methodId,
        payment_method: method,
        pos_data: posData
      });
    }
  };

  const handlePosDataChange = (field, value) => {
    const newPosData = {
      ...posData,
      [field]: value
    };
    setPosData(newPosData);

    // Notify parent component
    if (onChange) {
      onChange({
        payment_method_id: selectedMethod?.id,
        payment_method: selectedMethod,
        pos_data: newPosData
      });
    }
  };

  const getPaymentMethodIcon = (method) => {
    if (method.type === 'Cash') return <Banknote className="h-4 w-4" />;
    if (method.is_pos) return <CreditCard className="h-4 w-4" />;
    if (method.name.includes('Mobile')) return <Smartphone className="h-4 w-4" />;
    return <Building2 className="h-4 w-4" />;
  };

  const getMethodBadges = (method) => {
    const badges = [];
    if (method.is_pos) {
      badges.push(
        <span key="pos" className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
          POS
        </span>
      );
    }
    if (method.requires_reference) {
      badges.push(
        <span key="ref" className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded">
          Ref Required
        </span>
      );
    }
    if (method.type === 'Credit') {
      badges.push(
        <span key="credit" className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
          Credit
        </span>
      );
    }
    return badges;
  };

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>Payment Method {required && '*'}</Label>
        <div className="flex items-center justify-center p-4 border rounded-md">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm text-gray-600">Loading payment methods...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payment Method Selection */}
      <div className="space-y-2">
        <Label htmlFor="payment_method">
          Payment Method {required && <span className="text-red-500">*</span>}
        </Label>
        <Select 
          value={selectedMethod?.id || ''} 
          onValueChange={handlePaymentMethodChange}
          disabled={disabled}
        >
          <SelectTrigger className={validationErrors.length > 0 ? 'border-red-300' : ''}>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            {paymentMethods.map((method) => (
              <SelectItem key={method.id} value={method.id}>
                <div className="flex items-center gap-2 w-full">
                  {getPaymentMethodIcon(method)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{method.name}</span>
                      <div className="flex gap-1">
                        {getMethodBadges(method)}
                      </div>
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {selectedMethod && (
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <span>{selectedMethod.description}</span>
          </p>
        )}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Payment method validation errors:</p>
            <ul className="text-xs text-red-700 mt-1 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

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
                <Label htmlFor="pos_account_name">
                  POS Account Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pos_account_name"
                  placeholder="e.g., Moniepoint POS, Opay POS"
                  value={posData.pos_account_name}
                  onChange={(e) => handlePosDataChange('pos_account_name', e.target.value)}
                  disabled={disabled}
                  className={validationErrors.some(e => e.includes('POS account name')) ? 'border-red-300' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type</Label>
                <Select 
                  value={posData.transaction_type} 
                  onValueChange={(value) => handlePosDataChange('transaction_type', value)}
                  disabled={disabled}
                >
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
                <Label htmlFor="pos_reference_number">
                  POS Reference Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pos_reference_number"
                  placeholder="Enter POS reference/receipt number"
                  value={posData.pos_reference_number}
                  onChange={(e) => handlePosDataChange('pos_reference_number', e.target.value)}
                  disabled={disabled}
                  className={validationErrors.some(e => e.includes('POS reference number')) ? 'border-red-300' : ''}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reference Number for non-POS methods */}
      {selectedMethod?.requires_reference && !selectedMethod?.is_pos && (
        <div className="space-y-2">
          <Label htmlFor="reference_number">
            Reference Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="reference_number"
            placeholder="Enter transaction reference number"
            value={posData.reference_number}
            onChange={(e) => handlePosDataChange('reference_number', e.target.value)}
            disabled={disabled}
            className={validationErrors.some(e => e.includes('Reference number')) ? 'border-red-300' : ''}
          />
          <p className="text-xs text-gray-600">
            Required for {selectedMethod.name} transactions
          </p>
        </div>
      )}

      {/* Payment Method Summary */}
      {selectedMethod && validationErrors.length === 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            {getPaymentMethodIcon(selectedMethod)}
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                {selectedMethod.name} selected
              </p>
              {selectedMethod.is_pos && posData.pos_account_name && (
                <p className="text-xs text-green-700">
                  POS Account: {posData.pos_account_name}
                </p>
              )}
              {(posData.pos_reference_number || posData.reference_number) && (
                <p className="text-xs text-green-700">
                  Reference: {posData.pos_reference_number || posData.reference_number}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              {getMethodBadges(selectedMethod)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;