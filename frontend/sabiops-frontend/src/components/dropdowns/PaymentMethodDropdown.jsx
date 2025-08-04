import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { ChevronDown } from 'lucide-react';

const PaymentMethodDropdown = ({
  value = null,
  onChange,
  options, // if not provided, we will load via hook
  placeholder = 'Select payment method',
  disabled = false,
  required = false,
  className = '',
  style = {},
  debugLabel = '',
  onError = null
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Load payment methods via hook if options not provided
  const {
    paymentMethods,
    loading,
    error,
    refresh,
    retry
  } = usePaymentMethods({ autoLoad: !options, onError });

  const resolvedOptions = options || paymentMethods;
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selected = resolvedOptions.find((opt) => String(opt.id) === String(value)) || null;

  const handleSelect = (method) => {
    setIsOpen(false);
    if (onChange) {
      onChange(method.id);
    }
    if (debugLabel) {
      console.log(`[${debugLabel}] PaymentMethod selected:`, method);
    }
  };

  const getButtonClasses = () => {
    const base =
      'w-full px-3 py-2 border rounded-md bg-white text-left flex items-center justify-between transition-colors';
    const stateClasses = disabled
      ? 'border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed'
      : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500';
    return `${base} ${stateClasses} ${className}`;
  };

  return (
    <div className="relative" ref={dropdownRef} style={style}>
      {debugLabel && (
        <div className="text-xs text-gray-500 mb-1">Debug: {debugLabel}</div>
      )}

      {/* Trigger button */}
      <button
        type="button"
        className={getButtonClasses()}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-required={required}
        onClick={() => !disabled && setIsOpen((o) => !o)}
      >
        <span className={`truncate ${selected ? 'text-gray-900' : 'text-gray-500'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-center text-sm">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />Loading methods...
            </div>
          ) : error ? (
            <div className="px-3 py-2 text-red-600 text-sm text-center">
              <AlertCircle className="w-4 h-4 inline mr-1" />Failed to load
              <button onClick={retry} className="ml-2 text-blue-600 hover:text-blue-800 underline">
                Retry
              </button>
            </div>
          ) : (
            resolvedOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 ${
                  value === opt.id ? 'bg-gray-50 font-medium' : ''
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
          {(!loading && resolvedOptions.length === 0) && (
            <div className="px-3 py-2 text-gray-500 text-sm">No payment methods available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentMethodDropdown;
