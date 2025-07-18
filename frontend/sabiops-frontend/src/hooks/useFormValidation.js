import { useState, useCallback, useRef } from 'react';
import { 
  validateInvoiceForm, 
  validateField, 
  validateInvoiceItem,
  debounceValidation,
  shouldShowFieldError 
} from '../services/validationService';

/**
 * Enhanced form validation hook with real-time validation and error state management
 */
export const useFormValidation = (initialData = {}) => {
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(true);
  
  // Debounced validation to prevent excessive calls
  const debouncedValidateField = useRef(
    debounceValidation((fieldName, value, formData) => {
      const error = validateField(fieldName, value);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
      return error;
    }, 300)
  ).current;

  const debouncedValidateItem = useRef(
    debounceValidation((itemIndex, item) => {
      const itemValidationErrors = validateInvoiceItem(item, itemIndex);
      setItemErrors(prev => {
        const newItemErrors = [...prev];
        newItemErrors[itemIndex] = itemValidationErrors;
        return newItemErrors;
      });
      return itemValidationErrors;
    }, 300)
  ).current;

  /**
   * Mark a field as touched
   */
  const touchField = useCallback((fieldName) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  }, []);

  /**
   * Mark an item field as touched
   */
  const touchItemField = useCallback((itemIndex, fieldName) => {
    const itemFieldName = `items.${itemIndex}.${fieldName}`;
    setTouchedFields(prev => new Set([...prev, itemFieldName]));
  }, []);

  /**
   * Validate a single field
   */
  const validateSingleField = useCallback(async (fieldName, value, formData = {}) => {
    setIsValidating(true);
    try {
      const error = await debouncedValidateField(fieldName, value, formData);
      return error;
    } finally {
      setIsValidating(false);
    }
  }, [debouncedValidateField]);

  /**
   * Validate a single item field
   */
  const validateItemField = useCallback(async (itemIndex, fieldName, item) => {
    setIsValidating(true);
    try {
      const itemErrors = await debouncedValidateItem(itemIndex, item);
      return itemErrors[fieldName] || null;
    } finally {
      setIsValidating(false);
    }
  }, [debouncedValidateItem]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((formData) => {
    setIsValidating(true);
    
    const validationResult = validateInvoiceForm(formData);
    
    setErrors(validationResult.formErrors);
    setItemErrors(validationResult.itemErrors);
    setIsValid(!validationResult.hasErrors);
    setIsValidating(false);
    
    return validationResult;
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
    setItemErrors([]);
    setTouchedFields(new Set());
    setIsValid(true);
  }, []);

  /**
   * Clear errors for a specific field
   */
  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  /**
   * Clear errors for a specific item field
   */
  const clearItemFieldError = useCallback((itemIndex, fieldName) => {
    setItemErrors(prev => {
      const newItemErrors = [...prev];
      if (newItemErrors[itemIndex]) {
        const updatedItemErrors = { ...newItemErrors[itemIndex] };
        delete updatedItemErrors[fieldName];
        newItemErrors[itemIndex] = updatedItemErrors;
      }
      return newItemErrors;
    });
  }, []);

  /**
   * Get error for a specific field (only if touched)
   */
  const getFieldError = useCallback((fieldName) => {
    return shouldShowFieldError(fieldName, touchedFields, errors) ? errors[fieldName] : null;
  }, [errors, touchedFields]);

  /**
   * Get error for a specific item field (only if touched)
   */
  const getItemFieldError = useCallback((itemIndex, fieldName) => {
    const itemFieldName = `items.${itemIndex}.${fieldName}`;
    const itemError = itemErrors[itemIndex];
    return shouldShowFieldError(itemFieldName, touchedFields, itemError || {}) 
      ? itemError?.[fieldName] 
      : null;
  }, [itemErrors, touchedFields]);

  /**
   * Check if a field has an error (regardless of touched state)
   */
  const hasFieldError = useCallback((fieldName) => {
    return Boolean(errors[fieldName]);
  }, [errors]);

  /**
   * Check if an item field has an error (regardless of touched state)
   */
  const hasItemFieldError = useCallback((itemIndex, fieldName) => {
    return Boolean(itemErrors[itemIndex]?.[fieldName]);
  }, [itemErrors]);

  /**
   * Get all visible errors (only touched fields)
   */
  const getVisibleErrors = useCallback(() => {
    const visibleErrors = {};
    
    // Form field errors
    Object.keys(errors).forEach(fieldName => {
      if (shouldShowFieldError(fieldName, touchedFields, errors)) {
        visibleErrors[fieldName] = errors[fieldName];
      }
    });
    
    // Item field errors
    const visibleItemErrors = [];
    itemErrors.forEach((itemError, index) => {
      if (itemError) {
        const visibleItemError = {};
        Object.keys(itemError).forEach(fieldName => {
          const itemFieldName = `items.${index}.${fieldName}`;
          if (shouldShowFieldError(itemFieldName, touchedFields, itemError)) {
            visibleItemError[fieldName] = itemError[fieldName];
          }
        });
        if (Object.keys(visibleItemError).length > 0) {
          visibleItemErrors[index] = visibleItemError;
        }
      }
    });
    
    return {
      formErrors: visibleErrors,
      itemErrors: visibleItemErrors,
      hasVisibleErrors: Object.keys(visibleErrors).length > 0 || visibleItemErrors.length > 0
    };
  }, [errors, itemErrors, touchedFields]);

  /**
   * Get all errors (including untouched fields) - useful for form submission
   */
  const getAllErrors = useCallback(() => {
    return {
      formErrors: errors,
      itemErrors: itemErrors,
      hasErrors: Object.keys(errors).length > 0 || itemErrors.some(item => item && Object.keys(item).length > 0)
    };
  }, [errors, itemErrors]);

  /**
   * Set external errors (e.g., from API responses)
   */
  const setExternalErrors = useCallback((externalErrors) => {
    if (externalErrors.formErrors) {
      setErrors(prev => ({ ...prev, ...externalErrors.formErrors }));
    }
    if (externalErrors.itemErrors) {
      setItemErrors(prev => {
        const newItemErrors = [...prev];
        externalErrors.itemErrors.forEach((itemError, index) => {
          if (itemError) {
            newItemErrors[index] = { ...newItemErrors[index], ...itemError };
          }
        });
        return newItemErrors;
      });
    }
  }, []);

  return {
    // State
    errors,
    itemErrors,
    touchedFields,
    isValidating,
    isValid,
    
    // Actions
    touchField,
    touchItemField,
    validateSingleField,
    validateItemField,
    validateForm,
    clearErrors,
    clearFieldError,
    clearItemFieldError,
    setExternalErrors,
    
    // Getters
    getFieldError,
    getItemFieldError,
    hasFieldError,
    hasItemFieldError,
    getVisibleErrors,
    getAllErrors
  };
};