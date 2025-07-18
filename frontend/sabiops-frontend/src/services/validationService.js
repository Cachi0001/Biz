/**
 * Enhanced validation service for invoice forms
 * Provides specific, actionable error messages for all validation scenarios
 */

/**
 * Validation error messages with specific, actionable guidance
 */
export const ERROR_MESSAGES = {
  // Customer validation
  CUSTOMER_REQUIRED: 'Please select a customer to proceed with the invoice',
  CUSTOMER_INVALID: 'Selected customer is not valid. Please choose from the dropdown',
  
  // Date validation
  ISSUE_DATE_REQUIRED: 'Issue date is required to create the invoice',
  ISSUE_DATE_INVALID: 'Please enter a valid issue date',
  ISSUE_DATE_FUTURE: 'Issue date cannot be in the future',
  DUE_DATE_INVALID: 'Please enter a valid due date',
  DUE_DATE_BEFORE_ISSUE: 'Due date cannot be before the issue date',
  
  // Items validation
  ITEMS_REQUIRED: 'At least one invoice item is required',
  ITEM_DESCRIPTION_REQUIRED: 'Item description is required',
  ITEM_DESCRIPTION_TOO_SHORT: 'Item description must be at least 3 characters',
  ITEM_DESCRIPTION_TOO_LONG: 'Item description cannot exceed 200 characters',
  ITEM_QUANTITY_REQUIRED: 'Item quantity is required',
  ITEM_QUANTITY_INVALID: 'Quantity must be a positive number',
  ITEM_QUANTITY_MIN: 'Quantity must be at least 1',
  ITEM_QUANTITY_MAX: 'Quantity cannot exceed 10,000',
  ITEM_PRICE_REQUIRED: 'Unit price is required',
  ITEM_PRICE_INVALID: 'Unit price must be a valid number',
  ITEM_PRICE_NEGATIVE: 'Unit price cannot be negative',
  ITEM_PRICE_MAX: 'Unit price cannot exceed ₦10,000,000',
  ITEM_TAX_INVALID: 'Tax rate must be between 0% and 100%',
  ITEM_DISCOUNT_INVALID: 'Discount rate must be between 0% and 100%',
  
  // Payment terms validation
  PAYMENT_TERMS_INVALID: 'Please select valid payment terms',
  
  // Discount validation
  DISCOUNT_INVALID: 'Discount amount must be a valid number',
  DISCOUNT_NEGATIVE: 'Discount amount cannot be negative',
  DISCOUNT_EXCEEDS_TOTAL: 'Discount cannot exceed the invoice total',
  
  // Currency validation
  CURRENCY_REQUIRED: 'Currency selection is required',
  CURRENCY_INVALID: 'Please select a valid currency',
  
  // Notes validation
  NOTES_TOO_LONG: 'Notes cannot exceed 1000 characters',
  TERMS_TOO_LONG: 'Terms and conditions cannot exceed 2000 characters',
  
  // API error messages
  API_NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  API_SERVER_ERROR: 'Server error occurred. Please try again in a few moments.',
  API_VALIDATION_ERROR: 'The submitted data is invalid. Please check your entries and try again.',
  API_UNAUTHORIZED: 'Your session has expired. Please log in again.',
  API_FORBIDDEN: 'You do not have permission to perform this action.',
  API_NOT_FOUND: 'The requested invoice was not found.',
  API_CONFLICT: 'This invoice conflicts with existing data. Please refresh and try again.',
  API_TIMEOUT: 'Request timed out. Please try again.',
  API_GENERIC_ERROR: 'An unexpected error occurred. Please try again.',
  
  // Form submission errors
  FORM_INVALID: 'Please fix the errors below before submitting',
  FORM_SUBMISSION_FAILED: 'Failed to save invoice. Please try again.',
  FORM_NETWORK_ISSUE: 'Network error. Please check your connection and retry.',
};

/**
 * Validation rules for invoice form fields
 */
export const VALIDATION_RULES = {
  customer_id: {
    required: true,
    type: 'string',
    label: 'Customer'
  },
  issue_date: {
    required: true,
    type: 'date',
    label: 'Issue Date'
  },
  due_date: {
    required: false,
    type: 'date',
    label: 'Due Date'
  },
  payment_terms: {
    required: false,
    type: 'string',
    maxLength: 100,
    label: 'Payment Terms'
  },
  currency: {
    required: true,
    type: 'string',
    label: 'Currency'
  },
  discount_amount: {
    required: false,
    type: 'number',
    min: 0,
    label: 'Discount Amount'
  },
  notes: {
    required: false,
    type: 'string',
    maxLength: 1000,
    label: 'Notes'
  },
  terms_and_conditions: {
    required: false,
    type: 'string',
    maxLength: 2000,
    label: 'Terms and Conditions'
  }
};

/**
 * Validation rules for invoice items
 */
export const ITEM_VALIDATION_RULES = {
  description: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 200,
    label: 'Description'
  },
  quantity: {
    required: true,
    type: 'number',
    min: 1,
    max: 10000,
    label: 'Quantity'
  },
  unit_price: {
    required: true,
    type: 'number',
    min: 0,
    max: 10000000,
    label: 'Unit Price'
  },
  tax_rate: {
    required: false,
    type: 'number',
    min: 0,
    max: 100,
    label: 'Tax Rate'
  },
  discount_rate: {
    required: false,
    type: 'number',
    min: 0,
    max: 100,
    label: 'Discount Rate'
  }
};

/**
 * Validate a single field value
 */
export const validateField = (fieldName, value, rules = VALIDATION_RULES) => {
  const rule = rules[fieldName];
  if (!rule) return null;

  // Required field validation
  if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
    switch (fieldName) {
      case 'customer_id':
        return ERROR_MESSAGES.CUSTOMER_REQUIRED;
      case 'issue_date':
        return ERROR_MESSAGES.ISSUE_DATE_REQUIRED;
      case 'currency':
        return ERROR_MESSAGES.CURRENCY_REQUIRED;
      default:
        return `${rule.label} is required`;
    }
  }

  // Skip other validations if field is empty and not required
  if (!value && !rule.required) return null;

  // Date validation
  if (rule.type === 'date' && value) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return fieldName === 'issue_date' ? ERROR_MESSAGES.ISSUE_DATE_INVALID : ERROR_MESSAGES.DUE_DATE_INVALID;
    }
    
    if (fieldName === 'issue_date' && date > new Date()) {
      return ERROR_MESSAGES.ISSUE_DATE_FUTURE;
    }
  }

  // Number validation
  if (rule.type === 'number' && value !== '') {
    const num = Number(value);
    if (isNaN(num)) {
      if (fieldName === 'discount_amount') return ERROR_MESSAGES.DISCOUNT_INVALID;
      return `${rule.label} must be a valid number`;
    }
    
    if (rule.min !== undefined && num < rule.min) {
      if (fieldName === 'discount_amount') return ERROR_MESSAGES.DISCOUNT_NEGATIVE;
      return `${rule.label} must be at least ${rule.min}`;
    }
    
    if (rule.max !== undefined && num > rule.max) {
      return `${rule.label} cannot exceed ${rule.max}`;
    }
  }

  // String length validation
  if (rule.type === 'string' && value) {
    if (rule.minLength && value.length < rule.minLength) {
      return `${rule.label} must be at least ${rule.minLength} characters`;
    }
    
    if (rule.maxLength && value.length > rule.maxLength) {
      if (fieldName === 'notes') return ERROR_MESSAGES.NOTES_TOO_LONG;
      if (fieldName === 'terms_and_conditions') return ERROR_MESSAGES.TERMS_TOO_LONG;
      return `${rule.label} cannot exceed ${rule.maxLength} characters`;
    }
  }

  return null;
};

/**
 * Validate an invoice item
 */
export const validateInvoiceItem = (item, index) => {
  const errors = {};
  
  Object.keys(ITEM_VALIDATION_RULES).forEach(field => {
    const rule = ITEM_VALIDATION_RULES[field];
    const value = item[field];
    
    // Required field validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      switch (field) {
        case 'description':
          errors[field] = ERROR_MESSAGES.ITEM_DESCRIPTION_REQUIRED;
          break;
        case 'quantity':
          errors[field] = ERROR_MESSAGES.ITEM_QUANTITY_REQUIRED;
          break;
        case 'unit_price':
          errors[field] = ERROR_MESSAGES.ITEM_PRICE_REQUIRED;
          break;
        default:
          errors[field] = `${rule.label} is required`;
      }
      return;
    }
    
    // Skip other validations if field is empty and not required
    if (!value && !rule.required) return;
    
    // String validation
    if (rule.type === 'string' && value) {
      if (rule.minLength && value.length < rule.minLength) {
        errors[field] = ERROR_MESSAGES.ITEM_DESCRIPTION_TOO_SHORT;
      } else if (rule.maxLength && value.length > rule.maxLength) {
        errors[field] = ERROR_MESSAGES.ITEM_DESCRIPTION_TOO_LONG;
      }
    }
    
    // Number validation
    if (rule.type === 'number' && value !== '') {
      const num = Number(value);
      if (isNaN(num)) {
        switch (field) {
          case 'quantity':
            errors[field] = ERROR_MESSAGES.ITEM_QUANTITY_INVALID;
            break;
          case 'unit_price':
            errors[field] = ERROR_MESSAGES.ITEM_PRICE_INVALID;
            break;
          case 'tax_rate':
            errors[field] = ERROR_MESSAGES.ITEM_TAX_INVALID;
            break;
          case 'discount_rate':
            errors[field] = ERROR_MESSAGES.ITEM_DISCOUNT_INVALID;
            break;
          default:
            errors[field] = `${rule.label} must be a valid number`;
        }
      } else {
        if (rule.min !== undefined && num < rule.min) {
          switch (field) {
            case 'quantity':
              errors[field] = ERROR_MESSAGES.ITEM_QUANTITY_MIN;
              break;
            case 'unit_price':
              errors[field] = ERROR_MESSAGES.ITEM_PRICE_NEGATIVE;
              break;
            case 'tax_rate':
            case 'discount_rate':
              errors[field] = field === 'tax_rate' ? ERROR_MESSAGES.ITEM_TAX_INVALID : ERROR_MESSAGES.ITEM_DISCOUNT_INVALID;
              break;
            default:
              errors[field] = `${rule.label} must be at least ${rule.min}`;
          }
        }
        
        if (rule.max !== undefined && num > rule.max) {
          switch (field) {
            case 'quantity':
              errors[field] = ERROR_MESSAGES.ITEM_QUANTITY_MAX;
              break;
            case 'unit_price':
              errors[field] = ERROR_MESSAGES.ITEM_PRICE_MAX;
              break;
            case 'tax_rate':
            case 'discount_rate':
              errors[field] = field === 'tax_rate' ? ERROR_MESSAGES.ITEM_TAX_INVALID : ERROR_MESSAGES.ITEM_DISCOUNT_INVALID;
              break;
            default:
              errors[field] = `${rule.label} cannot exceed ${rule.max}`;
          }
        }
      }
    }
  });
  
  return errors;
};

/**
 * Validate entire invoice form
 */
export const validateInvoiceForm = (formData) => {
  const errors = {};
  const itemErrors = [];
  
  // Validate main form fields
  Object.keys(VALIDATION_RULES).forEach(field => {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  // Special validation for due date vs issue date
  if (formData.due_date && formData.issue_date) {
    const issueDate = new Date(formData.issue_date);
    const dueDate = new Date(formData.due_date);
    if (dueDate < issueDate) {
      errors.due_date = ERROR_MESSAGES.DUE_DATE_BEFORE_ISSUE;
    }
  }
  
  // Validate items
  if (!formData.items || formData.items.length === 0) {
    errors.items = ERROR_MESSAGES.ITEMS_REQUIRED;
  } else {
    formData.items.forEach((item, index) => {
      const itemValidationErrors = validateInvoiceItem(item, index);
      if (Object.keys(itemValidationErrors).length > 0) {
        itemErrors[index] = itemValidationErrors;
      }
    });
  }
  
  // Validate discount against total
  if (formData.discount_amount && formData.items) {
    const itemsTotal = formData.items.reduce((sum, item) => {
      const quantity = Math.max(0, parseFloat(item.quantity) || 0);
      const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
      return sum + (quantity * unitPrice);
    }, 0);
    
    if (parseFloat(formData.discount_amount) > itemsTotal) {
      errors.discount_amount = ERROR_MESSAGES.DISCOUNT_EXCEEDS_TOTAL;
    }
  }
  
  return {
    formErrors: errors,
    itemErrors: itemErrors,
    hasErrors: Object.keys(errors).length > 0 || itemErrors.some(item => item && Object.keys(item).length > 0)
  };
};

/**
 * Get API error message with actionable suggestions
 */
export const getApiErrorMessage = (error) => {
  // Network errors
  if (!navigator.onLine) {
    return ERROR_MESSAGES.API_NETWORK_ERROR;
  }
  
  if (error?.code === 'ERR_NETWORK' || error?.message?.toLowerCase().includes('network')) {
    return ERROR_MESSAGES.API_NETWORK_ERROR;
  }
  
  if (error?.code === 'ECONNABORTED' || error?.message?.toLowerCase().includes('timeout')) {
    return ERROR_MESSAGES.API_TIMEOUT;
  }
  
  // HTTP status codes
  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        return ERROR_MESSAGES.API_VALIDATION_ERROR;
      case 401:
        return ERROR_MESSAGES.API_UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.API_FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.API_NOT_FOUND;
      case 409:
        return ERROR_MESSAGES.API_CONFLICT;
      case 422:
        return ERROR_MESSAGES.API_VALIDATION_ERROR;
      case 500:
      case 502:
      case 503:
      case 504:
        return ERROR_MESSAGES.API_SERVER_ERROR;
      default:
        return ERROR_MESSAGES.API_GENERIC_ERROR;
    }
  }
  
  // Extract specific error message from response
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error?.response?.data?.error) {
    return error.response.data.error;
  }
  
  return error?.message || ERROR_MESSAGES.API_GENERIC_ERROR;
};

/**
 * Format validation errors for display
 */
export const formatValidationErrors = (validationResult) => {
  const { formErrors, itemErrors } = validationResult;
  const allErrors = [];
  
  // Add form errors
  Object.values(formErrors).forEach(error => {
    allErrors.push(error);
  });
  
  // Add item errors
  itemErrors.forEach((itemError, index) => {
    if (itemError) {
      Object.values(itemError).forEach(error => {
        allErrors.push(`Item ${index + 1}: ${error}`);
      });
    }
  });
  
  return allErrors;
};

/**
 * Check if a field has been touched (for showing validation errors)
 */
export const shouldShowFieldError = (fieldName, touchedFields, errors) => {
  return touchedFields.has(fieldName) && errors[fieldName];
};

/**
 * Debounce validation to prevent excessive calls
 */
export const debounceValidation = (validationFn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        resolve(validationFn(...args));
      }, delay);
    });
  };
};