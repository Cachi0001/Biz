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
  StandardForm: StandardForm,
  FormModal: FormModal,
  FormBuilder: FormBuilder
};

export const FieldConfigs = {
  customer: customerFields,
  product: productFields,
  invoice: invoiceFields,
  sale: salesFields,
  expense: expenseFields,
  user: userFields,
  settings: settingsFields
};

export default {
  StandardForm: StandardForm,
  FormModal: FormModal,
  FormBuilder: FormBuilder,
  useFormBuilder: useFormBuilder,
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