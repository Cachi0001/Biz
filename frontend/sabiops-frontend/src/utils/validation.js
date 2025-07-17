/**
 * Comprehensive validation utilities for SabiOps
 * Provides form validation, data validation, and business logic validation
 */

/**
 * Invoice validation rules and functions
 */
export const invoiceValidation = {
  /**
   * Validate complete invoice form data
   */
  validateInvoiceForm: (formData) => {
    const errors = [];
    
    // Customer validation
    if (!formData.customer_id || formData.customer_id === '') {
      errors.push('Please select a customer');
    }
    
    // Issue date validation
    if (!formData.issue_date) {
      errors.push('Please select an issue date');
    } else {
      const issueDate = new Date(formData.issue_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (issueDate > today) {
        errors.push('Issue date cannot be in the future');
      }
    }
    
    // Due date validation (if provided)
    if (formData.due_date && formData.issue_date) {
      const issueDate = new Date(formData.issue_date);
      const dueDate = new Date(formData.due_date);
      
      if (dueDate < issueDate) {
        errors.push('Due date cannot be before issue date');
      }
    }
    
    // Items validation
    if (!formData.items || formData.items.length === 0) {
      errors.push('Please add at least one invoice item');
    } else {
      formData.items.forEach((item, index) => {
        const itemErrors = invoiceValidation.validateInvoiceItem(item, index + 1);
        errors.push(...itemErrors);
      });
    }
    
    // Discount validation
    if (formData.discount_amount && formData.discount_amount < 0) {
      errors.push('Discount amount cannot be negative');
    }
    
    return errors;
  },

  /**
   * Validate individual invoice item
   */
  validateInvoiceItem: (item, itemNumber) => {
    const errors = [];
    const prefix = `Item ${itemNumber}:`;
    
    // Description validation
    if (!item.description || item.description.trim() === '') {
      errors.push(`${prefix} Description is required`);
    } else if (item.description.trim().length < 2) {
      errors.push(`${prefix} Description must be at least 2 characters`);
    } else if (item.description.trim().length > 500) {
      errors.push(`${prefix} Description must not exceed 500 characters`);
    }
    
    // Quantity validation
    if (!item.quantity || item.quantity <= 0) {
      errors.push(`${prefix} Quantity must be greater than 0`);
    } else if (!Number.isInteger(Number(item.quantity))) {
      errors.push(`${prefix} Quantity must be a whole number`);
    } else if (item.quantity > 999999) {
      errors.push(`${prefix} Quantity cannot exceed 999,999`);
    }
    
    // Unit price validation
    if (item.unit_price === undefined || item.unit_price === null || item.unit_price < 0) {
      errors.push(`${prefix} Unit price must be 0 or greater`);
    } else if (item.unit_price > 999999999) {
      errors.push(`${prefix} Unit price cannot exceed ₦999,999,999`);
    }
    
    // Tax rate validation
    if (item.tax_rate < 0 || item.tax_rate > 100) {
      errors.push(`${prefix} Tax rate must be between 0% and 100%`);
    }
    
    // Discount rate validation
    if (item.discount_rate < 0 || item.discount_rate > 100) {
      errors.push(`${prefix} Discount rate must be between 0% and 100%`);
    }
    
    return errors;
  },

  /**
   * Validate invoice totals and calculations
   */
  validateInvoiceTotals: (formData) => {
    const errors = [];
    
    try {
      const total = invoiceValidation.calculateInvoiceTotal(formData);
      
      if (total < 0) {
        errors.push('Invoice total cannot be negative');
      }
      
      if (total > 999999999) {
        errors.push('Invoice total cannot exceed ₦999,999,999');
      }
      
      // Check if discount is larger than subtotal
      const subtotal = formData.items.reduce((sum, item) => {
        const quantity = parseFloat(item.quantity) || 0;
        const unitPrice = parseFloat(item.unit_price) || 0;
        return sum + (quantity * unitPrice);
      }, 0);
      
      const discount = parseFloat(formData.discount_amount) || 0;
      if (discount > subtotal) {
        errors.push('Overall discount cannot be greater than subtotal');
      }
      
    } catch (error) {
      errors.push('Error calculating invoice totals');
    }
    
    return errors;
  },

  /**
   * Calculate invoice total (helper function)
   */
  calculateInvoiceTotal: (formData) => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      const discountRate = parseFloat(item.discount_rate) || 0;

      let itemTotal = quantity * unitPrice;
      itemTotal -= itemTotal * (discountRate / 100);
      itemTotal += itemTotal * (taxRate / 100);
      
      return sum + itemTotal;
    }, 0);
    
    const overallDiscount = parseFloat(formData.discount_amount) || 0;
    return itemsTotal - overallDiscount;
  }
};

/**
 * Customer validation rules
 */
export const customerValidation = {
  validateCustomerForm: (formData) => {
    const errors = [];
    
    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      errors.push('Customer name is required');
    } else if (formData.name.trim().length < 2) {
      errors.push('Customer name must be at least 2 characters');
    } else if (formData.name.trim().length > 100) {
      errors.push('Customer name must not exceed 100 characters');
    }
    
    // Email validation (if provided)
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.push('Please enter a valid email address');
      }
    }
    
    // Phone validation (if provided)
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
      const cleanPhone = formData.phone.replace(/\s+/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Please enter a valid Nigerian phone number');
      }
    }
    
    return errors;
  }
};

/**
 * Product validation rules
 */
export const productValidation = {
  validateProductForm: (formData) => {
    const errors = [];
    
    // Name validation
    if (!formData.name || formData.name.trim() === '') {
      errors.push('Product name is required');
    } else if (formData.name.trim().length < 2) {
      errors.push('Product name must be at least 2 characters');
    } else if (formData.name.trim().length > 200) {
      errors.push('Product name must not exceed 200 characters');
    }
    
    // Price validation
    if (formData.price === undefined || formData.price === null || formData.price < 0) {
      errors.push('Product price must be 0 or greater');
    } else if (formData.price > 999999999) {
      errors.push('Product price cannot exceed ₦999,999,999');
    }
    
    // Quantity validation (if provided)
    if (formData.quantity !== undefined && formData.quantity !== null) {
      if (formData.quantity < 0) {
        errors.push('Product quantity cannot be negative');
      } else if (!Number.isInteger(Number(formData.quantity))) {
        errors.push('Product quantity must be a whole number');
      }
    }
    
    return errors;
  }
};

/**
 * General form validation utilities
 */
export const formValidation = {
  /**
   * Validate required fields
   */
  validateRequired: (data, requiredFields) => {
    const errors = [];
    
    requiredFields.forEach(field => {
      const value = data[field];
      if (value === undefined || value === null || value === '') {
        const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        errors.push(`${fieldName} is required`);
      }
    });
    
    return errors;
  },

  /**
   * Validate email format
   */
  validateEmail: (email) => {
    if (!email) return true; // Allow empty emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Validate Nigerian phone number
   */
  validateNigerianPhone: (phone) => {
    if (!phone) return true; // Allow empty phones
    const phoneRegex = /^(\+234|0)[789][01]\d{8}$/;
    const cleanPhone = phone.replace(/\s+/g, '');
    return phoneRegex.test(cleanPhone);
  },

  /**
   * Validate positive number
   */
  validatePositiveNumber: (value, allowZero = true) => {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    return allowZero ? num >= 0 : num > 0;
  },

  /**
   * Validate integer
   */
  validateInteger: (value) => {
    const num = Number(value);
    return Number.isInteger(num) && num >= 0;
  },

  /**
   * Validate date range
   */
  validateDateRange: (startDate, endDate) => {
    if (!startDate || !endDate) return true;
    return new Date(startDate) <= new Date(endDate);
  },

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  /**
   * Validate string length
   */
  validateLength: (value, min = 0, max = Infinity) => {
    if (!value) return min === 0;
    const length = value.toString().length;
    return length >= min && length <= max;
  }
};

/**
 * Business-specific validation rules
 */
export const businessValidation = {
  /**
   * Validate Nigerian business registration number
   */
  validateBusinessRegNumber: (regNumber) => {
    if (!regNumber) return true; // Allow empty
    // Nigerian business registration numbers are typically 7-8 digits
    const regRegex = /^\d{7,8}$/;
    return regRegex.test(regNumber.replace(/\s+/g, ''));
  },

  /**
   * Validate Nigerian Tax Identification Number (TIN)
   */
  validateTIN: (tin) => {
    if (!tin) return true; // Allow empty
    // Nigerian TIN format: 8-10 digits
    const tinRegex = /^\d{8,11}$/;
    return tinRegex.test(tin.replace(/\s+/g, ''));
  },

  /**
   * Validate Nigerian bank account number
   */
  validateBankAccount: (accountNumber) => {
    if (!accountNumber) return true; // Allow empty
    // Nigerian bank account numbers are typically 10 digits
    const accountRegex = /^\d{10}$/;
    return accountRegex.test(accountNumber.replace(/\s+/g, ''));
  }
};

/**
 * Real-time validation helpers
 */
export const realtimeValidation = {
  /**
   * Debounced validation function
   */
  createDebouncedValidator: (validationFn, delay = 300) => {
    let timeoutId;
    return (value, callback) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const result = validationFn(value);
        callback(result);
      }, delay);
    };
  },

  /**
   * Validate field on blur
   */
  validateOnBlur: (value, validationRules) => {
    const errors = [];
    
    validationRules.forEach(rule => {
      if (rule.required && (!value || value.toString().trim() === '')) {
        errors.push(rule.message || 'This field is required');
      } else if (value && rule.validator && !rule.validator(value)) {
        errors.push(rule.message || 'Invalid value');
      }
    });
    
    return errors;
  }
};

/**
 * Export all validation functions
 */
export default {
  invoiceValidation,
  customerValidation,
  productValidation,
  formValidation,
  businessValidation,
  realtimeValidation
};