/**
 * Forms Module - Standardized form components and utilities
 * 
 * This module provides a comprehensive form system with:
 * - StandardForm: Core reusable form component
 * - FormModal: Responsive modal/drawer for forms
 * - FormBuilder: High-level form builder with entity types
 * - Field configurations for different entity types
 * - Form validation and error handling
 * - Mobile-friendly layouts and interactions
 */

// Core form components
export { default as StandardForm } from './StandardForm';
export { default as FormModal } from './FormModal';
export { default as FormBuilder, useFormBuilder } from './FormBuilder';

// Field configurations
export {
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
} from './fieldConfigs';

// Re-export commonly used form patterns
export const FormComponents = {
  StandardForm: require('./StandardForm').default,
  FormModal: require('./FormModal').default,
  FormBuilder: require('./FormBuilder').default
};

export const FieldConfigs = {
  customer: require('./fieldConfigs').customerFields,
  product: require('./fieldConfigs').productFields,
  invoice: require('./fieldConfigs').invoiceFields,
  sale: require('./fieldConfigs').salesFields,
  expense: require('./fieldConfigs').expenseFields,
  user: require('./fieldConfigs').userFields,
  settings: require('./fieldConfigs').settingsFields
};

export default {
  StandardForm: require('./StandardForm').default,
  FormModal: require('./FormModal').default,
  FormBuilder: require('./FormBuilder').default,
  useFormBuilder: require('./FormBuilder').useFormBuilder,
  ...require('./fieldConfigs')
};