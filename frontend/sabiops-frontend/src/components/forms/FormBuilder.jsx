import React, { useState, useCallback } from 'react';
import StandardForm from './StandardForm';
import FormModal from './FormModal';
import { getFieldConfig } from './fieldConfigs';

/**
 * FormBuilder - High-level component for building forms with entity types
 * Provides common form patterns and state management
 */
const FormBuilder = ({
  entityType,
  mode = 'create', // 'create' | 'edit' | 'view'
  initialData = {},
  onSubmit,
  onCancel,
  isModal = false,
  modalOpen = false,
  onModalOpenChange,
  title,
  description,
  customFields,
  fieldModifications = {},
  loading = false,
  className = "",
  layout = "default",
  showCancel = true,
  submitText,
  cancelText = "Cancel",
  disabled = false
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Get field configuration
  const baseFields = customFields || getFieldConfig(entityType);
  
  // Apply field modifications
  const fields = baseFields.map(field => {
    const modification = fieldModifications[field.name];
    return modification ? { ...field, ...modification } : field;
  });

  // Handle form data changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldName, value) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  // Handle field focus
  const handleFieldFocus = useCallback((fieldName) => {
    // Clear error when user focuses on field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (onSubmit) {
      onSubmit(formData, {
        setErrors,
        setTouched,
        resetForm: () => {
          setFormData(initialData);
          setErrors({});
          setTouched({});
        }
      });
    }
  }, [formData, initialData, onSubmit]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    }
    
    // Reset form if modal
    if (isModal) {
      setFormData(initialData);
      setErrors({});
      setTouched({});
    }
  }, [onCancel, isModal, initialData]);

  // Generate default title if not provided
  const defaultTitle = title || `${mode === 'create' ? 'Add' : mode === 'edit' ? 'Edit' : 'View'} ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;
  
  // Generate default submit text if not provided
  const defaultSubmitText = submitText || (mode === 'create' ? `Add ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}` : `Update ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`);

  const formProps = {
    fields,
    data: formData,
    onChange: handleChange,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    loading,
    submitText: defaultSubmitText,
    cancelText,
    showCancel,
    className,
    errors,
    touched,
    onFieldBlur: handleFieldBlur,
    onFieldFocus: handleFieldFocus,
    disabled: disabled || mode === 'view',
    layout
  };

  if (isModal) {
    return (
      <FormModal
        open={modalOpen}
        onOpenChange={onModalOpenChange}
        title={defaultTitle}
        description={description}
        {...formProps}
      />
    );
  }

  return <StandardForm {...formProps} />;
};

/**
 * Hook for managing form state
 */
export const useFormBuilder = (entityType, initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const updateData = useCallback((newData) => {
    setData(prev => ({ ...prev, ...newData }));
  }, []);

  const updateField = useCallback((fieldName, value) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearTouched = useCallback(() => {
    setTouched({});
  }, []);

  const resetForm = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  return {
    data,
    errors,
    touched,
    loading,
    setData,
    updateData,
    updateField,
    setErrors,
    clearErrors,
    setTouched,
    clearTouched,
    resetForm,
    setLoading,
    setFieldError,
    clearFieldError
  };
};

export default FormBuilder;