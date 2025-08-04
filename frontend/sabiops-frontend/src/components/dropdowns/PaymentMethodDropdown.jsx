// Enhanced Payment Method Dropdown - Integrates with Supabase and Enhanced Payment System
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RefreshCw, CreditCard, Smartphone, Building2, Banknote, AlertCircle, History, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import posDetailsCache from '../../services/posDetailsCache';

const PaymentMethodDropdown = ({
  value = null,
  onChange,
  placeholder = "Select payment method",
  disabled = false,
  required = false,
  className = "",
  style = {},
  showPOSDetails = true,
  showCreditOptions = true,
  debugLabel = "",
  onError = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [posData, setPosData] = useState({
    pos_account_name: '',
    transaction_type: 'Sale',
    pos_reference_number: '',
    reference_number: ''
  });
  const [validationErrors, setValidationErrors] = useState([]);
  
  const dropdownRef = useRef(null);

  // Enhanced payment methods that match your Supabase setup
  const standardPaymentMethods = [
    {
      id: 'cash',
      name: 'Cash',
      type: 'Cash',
      is_pos: false,
      requires_reference: false,
      description: 'Physical cash payments',
      display_name: 'Cash',
      icon: Banknote,
      color: 'text-green-600'
    },
    {
      id: 'pos_card',
      name: 'POS - Card',
      type: 'Digital',
      is_pos: true,
      requires_reference: true,
      description: 'Card payments via POS terminal',
      display_name: 'POS - Card',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      id: 'pos_transfer',
      name: 'POS - Transfer',
      type: 'Digital',
      is_pos: true,
      requires_reference: true,
      description: 'Bank transfer via POS terminal',
      display_name: 'POS - Transfer',
      icon: Smartphone,
      color: 'text-purple-600'
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      type: 'Digital',
      is_pos: false,
      requires_reference: true,
      description: 'Direct bank transfer',
      display_name: 'Bank Transfer',
      icon: Building2,
      color: 'text-indigo-600'
    },
    {
      id: 'credit',
      name: 'Credit',
      type: 'Credit',
      is_pos: false,
      requires_reference: false,
      description: 'Credit sale - payment due later',
      display_name: 'Credit Sale',
      icon: AlertCircle,
      color: 'text-orange-600'
    },
    {
      id: 'online_payment',
      name: 'Online Payment',
      type: 'Digital',
      is_pos: false,
      requires_reference: true,
      description: 'Online payment platforms',
      display_name: 'Online Payment',
      icon: Smartphone,
      color: 'text-cyan-600'
    }
  ];

  // Initialize payment methods
  useEffect(() => {
    const loadPaymentMethods = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real implementation, fetch from your Supabase payment_methods table
        // For now, use the standardized methods
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
        setPaymentMethods(standardPaymentMethods);
        
        if (debugLabel) {
          console.log(`[${debugLabel}] Payment methods loaded:`, standardPaymentMethods.length);
        }
      } catch (err) {
        setError(err);
        if (onError) {
          onError(err);
        }
        console.error('Failed to load payment methods:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPaymentMethods();
  }, [debugLabel, onError]);

  // Initialize selected method from value prop
  useEffect(() => {
    if (value && paymentMethods.length > 0) {
      const method = paymentMethods.find(m => m.id === value || m.name === value);
      if (method) {
        setSelectedMethod(method);
      }
    } else if (!value && selectedMethod) {
      setSelectedMethod(null);
    }
  }, [value, paymentMethods, selectedMethod]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Validate current selection
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

  // Handle method selection
  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    setIsOpen(false);
    
    // Clear POS data if switching to non-POS method
    if (!method.is_pos) {
      setPosData(prev => ({
        ...prev,
        pos_account_name: '',
        pos_reference_number: ''
      }));
    } else {
      // Try to load last used POS details for this method
      const lastUsedDetails = posDetailsCache.getLastUsedPOSDetails(method.id);
      
      if (lastUsedDetails) {
        if (debugLabel) {
          console.log(`[${debugLabel}] Auto-filling POS details from cache:`, lastUsedDetails);
        }
        
        setPosData(prev => ({
          ...prev,
          pos_account_name: lastUsedDetails.pos_account_name || '',
          pos_reference_number: '', // Don't auto-fill reference number (unique per transaction)
          transaction_type: lastUsedDetails.transaction_type || 'Sale'
        }));
      }
    }

    // Prepare payment data for parent component
    const paymentData = {
      method: method.id,
      method_name: method.name,
      method_type: method.type,
      is_pos: method.is_pos,
      requires_reference: method.requires_reference,
      details: {
        ...posData,
        method_details: method
      },
      pos_account: method.is_pos ? posData.pos_account_name : '',
      pos_reference: method.is_pos ? posData.pos_reference_number : posData.reference_number,
      transaction_type: posData.transaction_type
    };

    if (onChange) {
      onChange(paymentData);
    }

    if (debugLabel) {
      console.log(`[${debugLabel}] Payment method selected:`, paymentData);
    }
  };

  // Handle POS data changes
  const handlePosDataChange = (field, value) => {
    setPosData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Update parent with new data
      if (selectedMethod && onChange) {
        const paymentData = {
          method: selectedMethod.id,
          method_name: selectedMethod.name,
          method_type: selectedMethod.type,
          is_pos: selectedMethod.is_pos,
          requires_reference: selectedMethod.requires_reference,
          details: {
            ...newData,
            method_details: selectedMethod
          },
          pos_account: selectedMethod.is_pos ? newData.pos_account_name : '',
          pos_reference: selectedMethod.is_pos ? newData.pos_reference_number : newData.reference_number,
          transaction_type: newData.transaction_type
        };
        
        onChange(paymentData);
        
        // Save POS details to cache when account name is entered
        if (field === 'pos_account_name' && value.trim() !== '') {
          posDetailsCache.savePOSDetails(selectedMethod.id, newData);
          if (debugLabel) {
            console.log(`[${debugLabel}] Saved POS details to cache:`, newData);
          }
        }
      }
      
      return newData;
    });
  };

  // Get display text for selected method
  const getDisplayText = () => {
    if (selectedMethod) {
      return selectedMethod.display_name;
    }
    return placeholder;
  };

  // Get method icon
  const getMethodIcon = (method) => {
    const IconComponent = method.icon;
    return <IconComponent className={`w-4 h-4 ${method.color}`} />;
  };

  // Get dropdown button classes
  const getButtonClasses = () => {
    const baseClasses = "w-full px-3 py-2 border rounded-md bg-white text-left flex items-center justify-between transition-colors";
    const stateClasses = disabled 
      ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
      : error
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500";
    
    return `${baseClasses} ${stateClasses} ${className}`;
  };

  return (
    <div className="space-y-3" ref={dropdownRef} style={style}>
      {debugLabel && (
        <div className="text-xs text-gray-500">
          Debug: {debugLabel} | Methods: {paymentMethods.length} | Loading: {loading.toString()}
        </div>
      )}
      
      {/* Payment Method Dropdown */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={getButtonClasses()}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <div className="flex items-center flex-1 min-w-0">
          {selectedMethod && getMethodIcon(selectedMethod)}
          <span className={`ml-2 truncate ${selectedMethod ? 'text-gray-900' : 'text-gray-500'}`}>
            {getDisplayText()}
          </span>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          Failed to load payment methods
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
              Loading payment methods...
            </div>
          ) : error ? (
            <div className="px-3 py-2 text-red-600 text-center">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Failed to load payment methods
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              No payment methods available
            </div>
          ) : (
            paymentMethods.map((method) => (
              <button
                key={method.id}
                type="button"
                onClick={() => handleMethodSelect(method)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                <div className="flex items-center">
                  {getMethodIcon(method)}
                  <div className="ml-2 flex-1">
                    <div className="font-medium text-gray-900">
                      {method.display_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {method.description}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* POS Details Section */}
      {selectedMethod && selectedMethod.is_pos && showPOSDetails && (
        <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-blue-900">POS Transaction Details</h4>
            <RecentPOSTerminals 
              onSelect={(terminal) => {
                setPosData(prev => ({
                  ...prev,
                  pos_account_name: terminal.pos_account_name,
                  transaction_type: terminal.transaction_type || prev.transaction_type
                }));
                
                // Notify parent component
                if (selectedMethod && onChange) {
                  const paymentData = {
                    method: selectedMethod.id,
                    method_name: selectedMethod.name,
                    method_type: selectedMethod.type,
                    is_pos: selectedMethod.is_pos,
                    requires_reference: selectedMethod.requires_reference,
                    details: {
                      ...posData,
                      pos_account_name: terminal.pos_account_name,
                      transaction_type: terminal.transaction_type || posData.transaction_type,
                      method_details: selectedMethod
                    },
                    pos_account: terminal.pos_account_name,
                    pos_reference: posData.pos_reference_number,
                    transaction_type: terminal.transaction_type || posData.transaction_type
                  };
                  
                  onChange(paymentData);
                }
              }}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="pos_account" className="text-xs font-medium text-blue-800">
                POS Account Name *
              </Label>
              <Input
                id="pos_account"
                value={posData.pos_account_name}
                onChange={(e) => handlePosDataChange('pos_account_name', e.target.value)}
                placeholder="Enter POS account name"
                className="mt-1"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="transaction_type" className="text-xs font-medium text-blue-800">
                Transaction Type
              </Label>
              <Select
                value={posData.transaction_type}
                onValueChange={(value) => handlePosDataChange('transaction_type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Deposit">Deposit</SelectItem>
                  <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedMethod.requires_reference && (
              <div>
                <Label htmlFor="pos_reference" className="text-xs font-medium text-blue-800">
                  POS Reference Number *
                </Label>
                <Input
                  id="pos_reference"
                  value={posData.pos_reference_number}
                  onChange={(e) => handlePosDataChange('pos_reference_number', e.target.value)}
                  placeholder="Enter POS reference number"
                  className="mt-1"
                  required
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Non-POS Reference Number */}
      {selectedMethod && !selectedMethod.is_pos && selectedMethod.requires_reference && (
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <Label htmlFor="reference_number" className="text-sm font-medium text-gray-700">
            Reference Number *
          </Label>
          <Input
            id="reference_number"
            value={posData.reference_number}
            onChange={(e) => handlePosDataChange('reference_number', e.target.value)}
            placeholder="Enter reference number"
            className="mt-1"
            required
          />
        </div>
      )}

      {/* Credit Sale Information */}
      {selectedMethod && selectedMethod.id === 'credit' && showCreditOptions && (
        <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
          <div className="flex items-center">
            <AlertCircle className="w-4 h-4 text-orange-600 mr-2" />
            <span className="text-sm font-medium text-orange-800">Credit Sale</span>
          </div>
          <p className="text-xs text-orange-700 mt-1">
            This sale will be recorded as credit. Payment can be collected later and the status updated to 'Paid'.
          </p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 p-2 rounded-md border border-red-200">
          {validationErrors.map((error, index) => (
            <div key={index} className="text-sm text-red-600 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              {error}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Recent POS Terminals Component
const RecentPOSTerminals = ({ onSelect }) => {
  const [terminals, setTerminals] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setTerminals(posDetailsCache.getAllPOSTerminals());
    
    // Handle click outside to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (terminals.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs flex items-center text-blue-700 hover:text-blue-900 transition-colors"
      >
        <History className="w-3 h-3 mr-1" />
        Recent
      </button>
      
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="py-1 text-sm">
            <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b">
              Recent POS Terminals
            </div>
            {terminals.map((terminal, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                onClick={() => {
                  onSelect(terminal);
                  setIsOpen(false);
                }}
              >
                <div>
                  <div className="font-medium text-gray-900">{terminal.pos_account_name}</div>
                  <div className="text-xs text-gray-500">
                    {terminal.transaction_type || 'Sale'}
                  </div>
                </div>
                <Check className="w-4 h-4 text-blue-600" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodDropdown;