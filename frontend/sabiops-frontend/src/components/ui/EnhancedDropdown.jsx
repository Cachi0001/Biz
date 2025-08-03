import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

/**
 * Enhanced Dropdown Component
 * Properly separates ID values from display names with comprehensive debugging
 */
const EnhancedDropdown = ({
  value,                    // ID value for form submission
  onValueChange,           // Callback with ID
  options = [],            // Array of {id, name, ...} objects
  placeholder = "Select option",
  loading = false,
  error = null,
  disabled = false,
  debugLabel = null,       // For debugging purposes
  className = "",
  children,                // Custom SelectItem content
  ...props
}) => {
  const [displayValue, setDisplayValue] = useState('');

  // Debug logger
  const debugLog = (message, data = {}) => {
    if (debugLabel) {
      console.log(`[EnhancedDropdown:${debugLabel}] ${message}`, {
        timestamp: new Date().toISOString(),
        ...data
      });
    }
  };

  // Compute display value from ID
  useEffect(() => {
    debugLog('Computing display value', {
      selectedId: value,
      optionsCount: options.length,
      options: options.slice(0, 3) // Log first 3 options for debugging
    });

    if (!value) {
      setDisplayValue('');
      return;
    }

    // Find the option that matches the selected ID
    const selectedOption = options.find(option => String(option.id) === String(value));
    
    if (selectedOption) {
      const newDisplayValue = selectedOption.name || selectedOption.title || selectedOption.label || String(selectedOption.id);
      setDisplayValue(newDisplayValue);
      
      debugLog('Display value found', {
        selectedId: value,
        displayName: newDisplayValue,
        selectedOption
      });
    } else {
      // Fallback: show ID with warning
      const fallbackValue = `Unknown (${value})`;
      setDisplayValue(fallbackValue);
      
      debugLog('Display value NOT found - using fallback', {
        selectedId: value,
        fallbackValue,
        availableIds: options.map(opt => opt.id)
      });
    }
  }, [value, options, debugLabel]);

  // Handle selection
  const handleSelect = (selectedId) => {
    const selectedOption = options.find(option => String(option.id) === String(selectedId));
    
    debugLog('Selection made', {
      selectedId,
      displayName: selectedOption?.name || selectedOption?.title || selectedOption?.label,
      selectedOption
    });

    onValueChange(selectedId);
  };

  // Handle component mount
  useEffect(() => {
    debugLog('Component mounted', {
      initialValue: value,
      optionsCount: options.length,
      hasOptions: options.length > 0,
      firstOption: options[0]
    });
  }, []); // Only run on mount

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue>Loading...</SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger className={`${className} border-red-300`}>
          <SelectValue>{error}</SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select 
      value={value || ''} 
      onValueChange={handleSelect}
      disabled={disabled}
      {...props}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          {displayValue || placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <SelectItem value="__no_options__" disabled>
            No options available
          </SelectItem>
        ) : children ? (
          children
        ) : (
          options.map((option) => (
            <SelectItem 
              key={option.id} 
              value={String(option.id)}
              disabled={option.disabled}
            >
              {option.name || option.title || option.label || String(option.id)}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

/**
 * Dropdown Mapper Utility
 * Helper functions for ID/name mapping and validation
 */
export const DropdownMapper = {
  /**
   * Get display name for an ID
   */
  getDisplayName: (id, options) => {
    if (!id) return '';
    
    const option = options.find(opt => String(opt.id) === String(id));
    if (option) {
      return option.name || option.title || option.label || String(option.id);
    }
    
    console.warn(`[DropdownMapper] No display name found for ID: ${id}`);
    return `Unknown (${id})`;
  },

  /**
   * Validate that an ID exists in options
   */
  validateSelection: (id, options) => {
    if (!id) return true; // Empty selection is valid
    return options.some(opt => String(opt.id) === String(id));
  },

  /**
   * Get option by ID
   */
  getOptionById: (id, options) => {
    return options.find(opt => String(opt.id) === String(id)) || null;
  },

  /**
   * Filter options by search term (searches in name/title/label)
   */
  filterOptions: (options, searchTerm) => {
    if (!searchTerm) return options;
    
    const term = searchTerm.toLowerCase();
    return options.filter(option => {
      const searchableText = [
        option.name,
        option.title, 
        option.label,
        String(option.id)
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(term);
    });
  }
};

/**
 * Debug Logger for Dropdown Issues
 */
export const DropdownDebugger = {
  logMount: (componentName, initialData) => {
    console.group(`[DropdownDebugger] ${componentName} - Component Mount`);
    console.log('Initial Value:', initialData.value);
    console.log('Options Count:', initialData.options?.length || 0);
    console.log('First 3 Options:', initialData.options?.slice(0, 3));
    console.log('Has Valid Selection:', DropdownMapper.validateSelection(initialData.value, initialData.options || []));
    console.groupEnd();
  },

  logSelection: (componentName, selectedId, displayName, allOptions) => {
    console.group(`[DropdownDebugger] ${componentName} - Selection Made`);
    console.log('Selected ID:', selectedId);
    console.log('Display Name:', displayName);
    console.log('Is Valid Selection:', DropdownMapper.validateSelection(selectedId, allOptions));
    console.log('Selected Option:', DropdownMapper.getOptionById(selectedId, allOptions));
    console.groupEnd();
  },

  logDataFetch: (componentName, data, errors) => {
    console.group(`[DropdownDebugger] ${componentName} - Data Fetch`);
    console.log('Data Count:', data?.length || 0);
    console.log('Has Errors:', !!errors);
    if (errors) console.error('Errors:', errors);
    console.log('Sample Data:', data?.slice(0, 2));
    console.groupEnd();
  },

  logMismatch: (componentName, id, expectedName, actualOptions) => {
    console.group(`[DropdownDebugger] ${componentName} - ID/Name Mismatch`);
    console.warn('ID with no matching option:', id);
    console.log('Expected Name:', expectedName);
    console.log('Available IDs:', actualOptions.map(opt => opt.id));
    console.log('Available Names:', actualOptions.map(opt => opt.name || opt.title || opt.label));
    console.groupEnd();
  },

  logSubmission: (componentName, formData) => {
    console.group(`[DropdownDebugger] ${componentName} - Form Submission`);
    console.log('Form Data:', formData);
    console.log('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
};

export default EnhancedDropdown;