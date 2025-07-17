/**
 * Field Configuration System for StandardForm
 * Provides pre-configured field definitions for different entity types
 */

import { 
  getBusinessCategories, 
  getExpenseCategories, 
  getPaymentMethods,
  formatPhone 
} from '../../utils/formatting';
import { formValidation } from '../../utils/validation';

/**
 * Customer form field configuration
 */
export const customerFields = [
  {
    name: 'name',
    label: 'Customer Name',
    type: 'text',
    required: true,
    placeholder: 'Enter customer full name',
    section: 'Required Information',
    minLength: 2,
    maxLength: 100,
    helpText: 'This field is mandatory for creating a customer'
  },
  {
    name: 'business_name',
    label: 'Business Name',
    type: 'text',
    placeholder: 'Enter business name (optional)',
    section: 'Optional Information',
    maxLength: 150,
    helpText: 'Name of the customer\'s business if applicable'
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'customer@example.com',
    section: 'Optional Information',
    maxLength: 255,
    validation: (value) => {
      if (value && !formValidation.validateEmail(value)) {
        return 'Please enter a valid email address';
      }
    }
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+234...',
    section: 'Optional Information',
    validation: (value) => {
      if (value && !formValidation.validateNigerianPhone(value)) {
        return 'Please enter a valid Nigerian phone number';
      }
    },
    helpText: 'Nigerian phone number format: +234XXXXXXXXXX'
  },
  {
    name: 'address',
    label: 'Address',
    type: 'textarea',
    placeholder: 'Enter customer address (optional)',
    section: 'Optional Information',
    rows: 2,
    maxLength: 500,
    fullWidth: true
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    placeholder: 'Additional notes about the customer (optional)',
    section: 'Optional Information',
    rows: 3,
    maxLength: 1000,
    fullWidth: true,
    helpText: 'Add any additional information about this customer'
  }
];

/**
 * Product form field configuration
 */
export const productFields = [
  {
    name: 'name',
    label: 'Product Name',
    type: 'text',
    required: true,
    placeholder: 'Enter product name',
    section: 'Basic Information',
    minLength: 2,
    maxLength: 200,
    fullWidth: true
  },
  {
    name: 'description',
    label: 'Description',
    type: 'textarea',
    placeholder: 'Product description',
    section: 'Basic Information',
    rows: 3,
    maxLength: 1000,
    fullWidth: true
  },
  {
    name: 'sku',
    label: 'SKU/Product Code',
    type: 'text',
    placeholder: 'PROD-001',
    section: 'Basic Information',
    maxLength: 50,
    helpText: 'Unique product identifier'
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    placeholder: 'Select category',
    section: 'Basic Information',
    options: getBusinessCategories().map(cat => ({ value: cat, label: cat }))
  },
  {
    name: 'price',
    label: 'Selling Price (₦)',
    type: 'number',
    step: '0.01',
    min: 0,
    max: 999999999,
    required: true,
    placeholder: '0.00',
    section: 'Pricing',
    validation: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return 'Price must be a positive number';
      }
    }
  },
  {
    name: 'cost_price',
    label: 'Cost Price (₦)',
    type: 'number',
    step: '0.01',
    min: 0,
    max: 999999999,
    placeholder: '0.00',
    section: 'Pricing',
    helpText: 'Your cost to purchase/produce this item'
  },
  {
    name: 'quantity',
    label: 'Stock Quantity',
    type: 'number',
    min: 0,
    required: true,
    placeholder: '0',
    section: 'Inventory',
    validation: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 0) {
        return 'Quantity must be a positive whole number';
      }
    }
  },
  {
    name: 'low_stock_threshold',
    label: 'Low Stock Alert',
    type: 'number',
    min: 0,
    placeholder: '5',
    section: 'Inventory',
    helpText: 'Alert when stock falls below this number'
  },
  {
    name: 'image_url',
    label: 'Image URL',
    type: 'url',
    placeholder: 'https://...',
    section: 'Media',
    fullWidth: true,
    helpText: 'Link to product image'
  }
];

/**
 * Invoice form field configuration
 */
export const invoiceFields = [
  {
    name: 'customer_id',
    label: 'Customer',
    type: 'select',
    required: true,
    placeholder: 'Select customer',
    section: 'Invoice Details',
    options: [], // Will be populated dynamically
    fullWidth: true
  },
  {
    name: 'invoice_number',
    label: 'Invoice Number',
    type: 'text',
    placeholder: 'Auto-generated',
    section: 'Invoice Details',
    disabled: true,
    helpText: 'Automatically generated when saved'
  },
  {
    name: 'issue_date',
    label: 'Issue Date',
    type: 'date',
    required: true,
    section: 'Invoice Details',
    validation: (value) => {
      if (value) {
        const issueDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (issueDate > today) {
          return 'Issue date cannot be in the future';
        }
      }
    }
  },
  {
    name: 'due_date',
    label: 'Due Date',
    type: 'date',
    section: 'Invoice Details',
    validation: (value, formData) => {
      if (value && formData.issue_date) {
        const issueDate = new Date(formData.issue_date);
        const dueDate = new Date(value);
        if (dueDate < issueDate) {
          return 'Due date cannot be before issue date';
        }
      }
    }
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    section: 'Invoice Details',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
      { value: 'overdue', label: 'Overdue' },
      { value: 'cancelled', label: 'Cancelled' }
    ]
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    placeholder: 'Additional notes for this invoice',
    section: 'Additional Information',
    rows: 3,
    maxLength: 1000,
    fullWidth: true
  },
  {
    name: 'discount_amount',
    label: 'Overall Discount (₦)',
    type: 'number',
    step: '0.01',
    min: 0,
    placeholder: '0.00',
    section: 'Totals',
    helpText: 'Discount applied to entire invoice'
  }
];

/**
 * Sales form field configuration
 */
export const salesFields = [
  {
    name: 'customer_id',
    label: 'Customer',
    type: 'select',
    required: true,
    placeholder: 'Select customer',
    section: 'Sale Details',
    options: [], // Will be populated dynamically
    fullWidth: true
  },
  {
    name: 'product_id',
    label: 'Product',
    type: 'select',
    required: true,
    placeholder: 'Select product',
    section: 'Sale Details',
    options: [], // Will be populated dynamically
    fullWidth: true
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    min: 1,
    required: true,
    placeholder: '1',
    section: 'Sale Details',
    validation: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        return 'Quantity must be at least 1';
      }
    }
  },
  {
    name: 'unit_price',
    label: 'Unit Price (₦)',
    type: 'number',
    step: '0.01',
    min: 0,
    required: true,
    placeholder: '0.00',
    section: 'Sale Details'
  },
  {
    name: 'payment_method',
    label: 'Payment Method',
    type: 'select',
    required: true,
    section: 'Payment',
    options: getPaymentMethods().map(method => ({
      value: method,
      label: method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  },
  {
    name: 'date',
    label: 'Sale Date',
    type: 'datetime-local',
    required: true,
    section: 'Sale Details',
    validation: (value) => {
      if (value) {
        const saleDate = new Date(value);
        const now = new Date();
        if (saleDate > now) {
          return 'Sale date cannot be in the future';
        }
      }
    }
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    placeholder: 'Additional notes about this sale',
    section: 'Additional Information',
    rows: 2,
    maxLength: 500,
    fullWidth: true
  }
];

/**
 * Expense form field configuration
 */
export const expenseFields = [
  {
    name: 'description',
    label: 'Description',
    type: 'text',
    required: true,
    placeholder: 'Enter expense description',
    section: 'Expense Details',
    minLength: 2,
    maxLength: 200,
    fullWidth: true
  },
  {
    name: 'amount',
    label: 'Amount (₦)',
    type: 'number',
    step: '0.01',
    min: 0.01,
    required: true,
    placeholder: '0.00',
    section: 'Expense Details',
    validation: (value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Amount must be greater than 0';
      }
    }
  },
  {
    name: 'category',
    label: 'Category',
    type: 'select',
    required: true,
    placeholder: 'Select category',
    section: 'Expense Details',
    options: getExpenseCategories().map(cat => ({ value: cat, label: cat }))
  },
  {
    name: 'date',
    label: 'Expense Date',
    type: 'date',
    required: true,
    section: 'Expense Details',
    validation: (value) => {
      if (value) {
        const expenseDate = new Date(value);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (expenseDate > today) {
          return 'Expense date cannot be in the future';
        }
      }
    }
  },
  {
    name: 'payment_method',
    label: 'Payment Method',
    type: 'select',
    required: true,
    section: 'Payment',
    options: getPaymentMethods().map(method => ({
      value: method,
      label: method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }))
  },
  {
    name: 'receipt_number',
    label: 'Receipt/Reference Number',
    type: 'text',
    placeholder: 'Receipt or reference number',
    section: 'Additional Information',
    maxLength: 100
  },
  {
    name: 'notes',
    label: 'Notes',
    type: 'textarea',
    placeholder: 'Additional notes about this expense',
    section: 'Additional Information',
    rows: 3,
    maxLength: 500,
    fullWidth: true
  }
];

/**
 * User/Team member form field configuration
 */
export const userFields = [
  {
    name: 'name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'Enter full name',
    section: 'Personal Information',
    minLength: 2,
    maxLength: 100
  },
  {
    name: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'user@example.com',
    section: 'Personal Information',
    maxLength: 255,
    validation: (value) => {
      if (!formValidation.validateEmail(value)) {
        return 'Please enter a valid email address';
      }
    }
  },
  {
    name: 'phone',
    label: 'Phone Number',
    type: 'tel',
    placeholder: '+234...',
    section: 'Personal Information',
    validation: (value) => {
      if (value && !formValidation.validateNigerianPhone(value)) {
        return 'Please enter a valid Nigerian phone number';
      }
    }
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    section: 'Access Control',
    options: [
      { value: 'admin', label: 'Administrator' },
      { value: 'manager', label: 'Manager' },
      { value: 'staff', label: 'Staff' },
      { value: 'viewer', label: 'Viewer' }
    ]
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    required: true,
    placeholder: 'Enter password',
    section: 'Security',
    minLength: 8,
    validation: (value) => {
      if (value && value.length < 8) {
        return 'Password must be at least 8 characters';
      }
    }
  },
  {
    name: 'confirm_password',
    label: 'Confirm Password',
    type: 'password',
    required: true,
    placeholder: 'Confirm password',
    section: 'Security',
    validation: (value, formData) => {
      if (value !== formData.password) {
        return 'Passwords do not match';
      }
    }
  },
  {
    name: 'is_active',
    label: 'Active User',
    type: 'checkbox',
    section: 'Status',
    checkboxLabel: 'User account is active',
    helpText: 'Inactive users cannot log in'
  }
];

/**
 * Settings form field configuration
 */
export const settingsFields = [
  {
    name: 'business_name',
    label: 'Business Name',
    type: 'text',
    required: true,
    placeholder: 'Enter your business name',
    section: 'Business Information',
    maxLength: 200,
    fullWidth: true
  },
  {
    name: 'business_address',
    label: 'Business Address',
    type: 'textarea',
    placeholder: 'Enter your business address',
    section: 'Business Information',
    rows: 3,
    maxLength: 500,
    fullWidth: true
  },
  {
    name: 'business_phone',
    label: 'Business Phone',
    type: 'tel',
    placeholder: '+234...',
    section: 'Business Information',
    validation: (value) => {
      if (value && !formValidation.validateNigerianPhone(value)) {
        return 'Please enter a valid Nigerian phone number';
      }
    }
  },
  {
    name: 'business_email',
    label: 'Business Email',
    type: 'email',
    placeholder: 'business@example.com',
    section: 'Business Information',
    validation: (value) => {
      if (value && !formValidation.validateEmail(value)) {
        return 'Please enter a valid email address';
      }
    }
  },
  {
    name: 'tax_rate',
    label: 'Default Tax Rate (%)',
    type: 'number',
    step: '0.01',
    min: 0,
    max: 100,
    placeholder: '7.5',
    section: 'Tax Settings',
    helpText: 'Default VAT rate for invoices'
  },
  {
    name: 'currency',
    label: 'Currency',
    type: 'select',
    section: 'Regional Settings',
    options: [
      { value: 'NGN', label: 'Nigerian Naira (₦)' },
      { value: 'USD', label: 'US Dollar ($)' },
      { value: 'EUR', label: 'Euro (€)' },
      { value: 'GBP', label: 'British Pound (£)' }
    ]
  },
  {
    name: 'low_stock_alert',
    label: 'Low Stock Alert Threshold',
    type: 'number',
    min: 1,
    placeholder: '5',
    section: 'Inventory Settings',
    helpText: 'Alert when any product stock falls below this number'
  }
];

/**
 * Helper function to get field configuration by entity type
 */
export const getFieldConfig = (entityType) => {
  const configs = {
    customer: customerFields,
    product: productFields,
    invoice: invoiceFields,
    sale: salesFields,
    expense: expenseFields,
    user: userFields,
    settings: settingsFields
  };

  return configs[entityType] || [];
};

/**
 * Helper function to create a subset of fields
 */
export const createFieldSubset = (baseFields, fieldNames) => {
  return baseFields.filter(field => fieldNames.includes(field.name));
};

/**
 * Helper function to modify field properties
 */
export const modifyFields = (baseFields, modifications) => {
  return baseFields.map(field => {
    const modification = modifications[field.name];
    return modification ? { ...field, ...modification } : field;
  });
};

export default {
  customerFields,
  productFields,
  invoiceFields,
  salesFields,
  expenseFields,
  userFields,
  settingsFields,
  getFieldConfig,
  createFieldSubset,
  modifyFields
};