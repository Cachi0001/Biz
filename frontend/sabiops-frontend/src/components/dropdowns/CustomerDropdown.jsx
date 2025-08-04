// Reusable Customer Dropdown Component
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RefreshCw, User, AlertCircle } from 'lucide-react';
import { useCustomers } from '../../hooks/useCustomers';

const CustomerDropdown = ({
  value = null,
  onChange,
  placeholder = "Select a customer",
  disabled = false,
  required = false,
  className = "",
  style = {},
  allowWalkIn = true,
  debugLabel = "",
  onError = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const dropdownRef = useRef(null);

  const {
    customers,
    loading,
    error,
    refresh,
    getCustomerById,
    retry
  } = useCustomers({
    includeWalkIn: allowWalkIn,
    onError: onError
  });

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

  // Initialize selected customer from value prop
  useEffect(() => {
    const initializeCustomer = async () => {
      if (value && !selectedCustomer) {
        // If value is an object, use it directly
        if (typeof value === 'object' && value.id !== undefined) {
          setSelectedCustomer(value);
          return;
        }

        // If value is a string ID, find the customer
        if (typeof value === 'string') {
          const customer = await getCustomerById(value);
          if (customer) {
            setSelectedCustomer(customer);
          }
        }
      } else if (!value && selectedCustomer) {
        setSelectedCustomer(null);
      }
    };

    initializeCustomer();
  }, [value, selectedCustomer, getCustomerById]);

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    setIsOpen(false);
    
    if (onChange) {
      onChange(customer);
    }

    if (debugLabel) {
      console.log(`[${debugLabel}] Customer selected:`, customer);
    }
  };

  // Handle refresh
  const handleRefresh = async (e) => {
    e.stopPropagation();
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh customers:', err);
    }
  };

  // Handle retry
  const handleRetry = async (e) => {
    e.stopPropagation();
    try {
      await retry();
    } catch (err) {
      console.error('Failed to retry customer loading:', err);
    }
  };

  // Get display text for selected customer
  const getDisplayText = () => {
    if (selectedCustomer) {
      return selectedCustomer.isWalkIn ? 'Walk-in Customer' : selectedCustomer.name;
    }
    return placeholder;
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
    <div className="relative" ref={dropdownRef} style={style}>
      {debugLabel && (
        <div className="text-xs text-gray-500 mb-1">
          Debug: {debugLabel} | Customers: {customers.length} | Loading: {loading.toString()}
        </div>
      )}
      
      {/* Dropdown Button */}
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
          <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className={`truncate ${selectedCustomer ? 'text-gray-900' : 'text-gray-500'}`}>
            {getDisplayText()}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || disabled}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Refresh customers"
          >
            <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Dropdown Arrow */}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          Failed to load customers
          <button
            type="button"
            onClick={handleRetry}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
              Loading customers...
            </div>
          ) : error ? (
            <div className="px-3 py-2 text-red-600 text-center">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Failed to load customers
              <button
                onClick={handleRetry}
                className="block w-full mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          ) : customers.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              No customers available
            </div>
          ) : (
            customers.map((customer) => (
              <button
                key={customer.id || 'walk-in'}
                type="button"
                onClick={() => handleCustomerSelect(customer)}
                className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
              >
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {customer.isWalkIn ? 'Walk-in Customer' : customer.name}
                    </div>
                    {!customer.isWalkIn && (customer.email || customer.phone) && (
                      <div className="text-sm text-gray-500 truncate">
                        {customer.email || customer.phone}
                      </div>
                    )}
                  </div>
                  {customer.isWalkIn && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Walk-in
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerDropdown;