import { useState, useCallback } from 'react';

export const useFormValidation = (initialData) => {
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [isValidating, setIsValidating] = useState(false);

  const touchField = useCallback((fieldName) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  }, []);

  const touchItemField = useCallback((index, fieldName) => {
    setItemErrors(prev => {
      const newErrors = [...prev];
      if (!newErrors[index]) newErrors[index] = {};
      newErrors[index] = { ...newErrors[index], touched: true };
      return newErrors;
    });
  }, []);

  const validateSingleField = useCallback(async (fieldName, value, formData) => {
    const fieldErrors = {};
    
    switch (fieldName) {
      case 'customer_id':
        if (!value) fieldErrors[fieldName] = 'Customer is required';
        break;
      case 'issue_date':
        if (!value) fieldErrors[fieldName] = 'Issue date is required';
        break;
      case 'due_date':
        if (value && new Date(value) < new Date(formData.issue_date)) {
          fieldErrors[fieldName] = 'Due date cannot be before issue date';
        }
        break;
      case 'discount_amount':
        if (value < 0) fieldErrors[fieldName] = 'Discount cannot be negative';
        break;
    }

    setErrors(prev => ({ ...prev, ...fieldErrors }));
    return Object.keys(fieldErrors).length === 0;
  }, []);

  const validateItemField = useCallback(async (index, fieldName, item) => {
    const fieldErrors = {};
    
    switch (fieldName) {
      case 'description':
        if (!item.description || !item.description.trim()) {
          fieldErrors[fieldName] = 'Description is required';
        }
        break;
      case 'quantity':
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          fieldErrors[fieldName] = 'Quantity must be greater than 0';
        }
        break;
      case 'unit_price':
        if (!item.unit_price || parseFloat(item.unit_price) < 0) {
          fieldErrors[fieldName] = 'Unit price must be 0 or greater';
        }
        break;
      case 'tax_rate':
        if (item.tax_rate < 0 || item.tax_rate > 100) {
          fieldErrors[fieldName] = 'Tax rate must be between 0 and 100';
        }
        break;
      case 'discount_rate':
        if (item.discount_rate < 0 || item.discount_rate > 100) {
          fieldErrors[fieldName] = 'Discount rate must be between 0 and 100';
        }
        break;
    }

    setItemErrors(prev => {
      const newErrors = [...prev];
      if (!newErrors[index]) newErrors[index] = {};
      newErrors[index] = { ...newErrors[index], ...fieldErrors };
      return newErrors;
    });
    
    return Object.keys(fieldErrors).length === 0;
  }, []);

  const validateForm = useCallback((formData) => {
    const formErrors = {};
    const itemErrorsArray = [];

    // Validate main form fields
    if (!formData.customer_id) {
      formErrors.customer_id = 'Customer is required';
    }
    if (!formData.issue_date) {
      formErrors.issue_date = 'Issue date is required';
    }
    if (formData.due_date && new Date(formData.due_date) < new Date(formData.issue_date)) {
      formErrors.due_date = 'Due date cannot be before issue date';
    }
    if (formData.discount_amount < 0) {
      formErrors.discount_amount = 'Discount cannot be negative';
    }

    // Validate items
    if (!formData.items || formData.items.length === 0) {
      formErrors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, index) => {
        const itemError = {};
        if (!item.description || !item.description.trim()) {
          itemError.description = 'Description is required';
        }
        if (!item.quantity || parseFloat(item.quantity) <= 0) {
          itemError.quantity = 'Quantity must be greater than 0';
        }
        if (!item.unit_price || parseFloat(item.unit_price) < 0) {
          itemError.unit_price = 'Unit price must be 0 or greater';
        }
        if (item.tax_rate < 0 || item.tax_rate > 100) {
          itemError.tax_rate = 'Tax rate must be between 0 and 100';
        }
        if (item.discount_rate < 0 || item.discount_rate > 100) {
          itemError.discount_rate = 'Discount rate must be between 0 and 100';
        }
        itemErrorsArray[index] = itemError;
      });
    }

    setErrors(formErrors);
    setItemErrors(itemErrorsArray);

    const hasFormErrors = Object.keys(formErrors).length > 0;
    const hasItemErrors = itemErrorsArray.some(item => Object.keys(item).length > 0);

    return {
      hasErrors: hasFormErrors || hasItemErrors,
      formErrors,
      itemErrors: itemErrorsArray
    };
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setItemErrors([]);
    setTouchedFields(new Set());
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName];
  }, [errors]);

  const getItemFieldError = useCallback((index, fieldName) => {
    return itemErrors[index]?.[fieldName];
  }, [itemErrors]);

  const hasFieldError = useCallback((fieldName) => {
    return !!errors[fieldName];
  }, [errors]);

  const hasItemFieldError = useCallback((index, fieldName) => {
    return !!itemErrors[index]?.[fieldName];
  }, [itemErrors]);

  const getAllErrors = useCallback(() => {
    const allErrors = [];
    Object.values(errors).forEach(error => allErrors.push(error));
    itemErrors.forEach((itemError, index) => {
      if (itemError) {
        Object.values(itemError).forEach(error => {
          allErrors.push(`Item ${index + 1}: ${error}`);
        });
      }
    });
    return allErrors;
  }, [errors, itemErrors]);

  const setExternalErrors = useCallback((newErrors) => {
    setErrors(newErrors);
  }, []);

  const isValid = Object.keys(errors).length === 0 && 
    itemErrors.every(item => !item || Object.keys(item).length === 0);

  return {
    errors,
    itemErrors,
    touchedFields,
    isValidating,
    isValid,
    touchField,
    touchItemField,
    validateSingleField,
    validateItemField,
    validateForm,
    clearErrors,
    getFieldError,
    getItemFieldError,
    hasFieldError,
    hasItemFieldError,
    getAllErrors,
    setExternalErrors
  };
};