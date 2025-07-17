import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { formValidation } from '../../utils/validation';

/**
 * StandardForm - Reusable form component with field configuration system
 * Supports various field types, validation, and mobile-friendly layouts
 */
const StandardForm = ({
  fields = [],
  data = {},
  onChange,
  onSubmit,
  onCancel,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  showCancel = true,
  className = "",
  errors = {},
  touched = {},
  onFieldBlur,
  onFieldFocus,
  disabled = false,
  layout = "default" // "default", "compact", "mobile"
}) => {
  const [showPasswords, setShowPasswords] = useState({});
  const [localErrors, setLocalErrors] = useState({});

  // Handle input changes
  const handleInputChange = (fieldName, value) => {
    if (disabled) return;
    
    // Call parent onChange
    if (onChange) {
      onChange({ target: { name: fieldName, value } });
    }

    // Clear local error for this field
    if (localErrors[fieldName]) {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || loading) return;

    // Validate all fields
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    if (onSubmit) {
      onSubmit(e);
    }
  };

  // Handle field blur
  const handleFieldBlur = (fieldName, value) => {
    if (onFieldBlur) {
      onFieldBlur(fieldName, value);
    }

    // Validate single field
    const field = fields.find(f => f.name === fieldName);
    if (field && field.validation) {
      const fieldErrors = validateField(field, value);
      if (fieldErrors.length > 0) {
        setLocalErrors(prev => ({
          ...prev,
          [fieldName]: fieldErrors[0]
        }));
      }
    }
  };

  // Handle field focus
  const handleFieldFocus = (fieldName) => {
    if (onFieldFocus) {
      onFieldFocus(fieldName);
    }
  };

  // Validate entire form
  const validateForm = () => {
    const validationErrors = {};

    fields.forEach(field => {
      const value = data[field.name];
      const fieldErrors = validateField(field, value);
      if (fieldErrors.length > 0) {
        validationErrors[field.name] = fieldErrors[0];
      }
    });

    return validationErrors;
  };

  // Validate single field
  const validateField = (field, value) => {
    const fieldErrors = [];

    // Required validation
    if (field.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${field.label} is required`);
      return fieldErrors;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.toString().trim() === '') {
      return fieldErrors;
    }

    // Type-specific validation
    if (field.type === 'email' && !formValidation.validateEmail(value)) {
      fieldErrors.push('Please enter a valid email address');
    }

    if (field.type === 'tel' && !formValidation.validateNigerianPhone(value)) {
      fieldErrors.push('Please enter a valid Nigerian phone number');
    }

    if (field.type === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        fieldErrors.push('Please enter a valid number');
      } else {
        if (field.min !== undefined && num < field.min) {
          fieldErrors.push(`Value must be at least ${field.min}`);
        }
        if (field.max !== undefined && num > field.max) {
          fieldErrors.push(`Value must not exceed ${field.max}`);
        }
      }
    }

    // Length validation
    if (field.minLength && value.length < field.minLength) {
      fieldErrors.push(`Must be at least ${field.minLength} characters`);
    }

    if (field.maxLength && value.length > field.maxLength) {
      fieldErrors.push(`Must not exceed ${field.maxLength} characters`);
    }

    // Custom validation
    if (field.validation && typeof field.validation === 'function') {
      const customError = field.validation(value, data);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    return fieldErrors;
  };

  // Toggle password visibility
  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Get field error
  const getFieldError = (fieldName) => {
    return errors[fieldName] || localErrors[fieldName];
  };

  // Get field classes
  const getFieldClasses = (fieldName, baseClasses = "") => {
    const hasError = getFieldError(fieldName);
    const errorClasses = hasError 
      ? "border-red-300 focus:border-red-500 focus:ring-red-500" 
      : "border-gray-200 focus:border-green-500 focus:ring-green-500";
    
    return `${baseClasses} ${errorClasses}`;
  };

  // Render field based on type
  const renderField = (field) => {
    const fieldValue = data[field.name] || '';
    const fieldError = getFieldError(field.name);
    const isDisabled = disabled || field.disabled;

    const commonProps = {
      id: field.name,
      name: field.name,
      value: fieldValue,
      onChange: (e) => handleInputChange(field.name, e.target.value),
      onBlur: (e) => handleFieldBlur(field.name, e.target.value),
      onFocus: () => handleFieldFocus(field.name),
      placeholder: field.placeholder,
      required: field.required,
      disabled: isDisabled,
      className: getFieldClasses(field.name)
    };

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            rows={field.rows || 3}
          />
        );

      case 'select':
        return (
          <Select
            value={fieldValue}
            onValueChange={(value) => handleInputChange(field.name, value)}
            disabled={isDisabled}
          >
            <SelectTrigger className={getFieldClasses(field.name)}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={fieldValue === true || fieldValue === 'true'}
              onCheckedChange={(checked) => handleInputChange(field.name, checked)}
              disabled={isDisabled}
            />
            <Label htmlFor={field.name} className="text-sm font-normal">
              {field.checkboxLabel || field.label}
            </Label>
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <Input
              {...commonProps}
              type={showPasswords[field.name] ? 'text' : 'password'}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => togglePasswordVisibility(field.name)}
              disabled={isDisabled}
            >
              {showPasswords[field.name] ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        );

      default:
        return (
          <Input
            {...commonProps}
            type={field.type || 'text'}
            step={field.step}
            min={field.min}
            max={field.max}
          />
        );
    }
  };

  // Get layout classes
  const getLayoutClasses = () => {
    switch (layout) {
      case 'compact':
        return 'space-y-3';
      case 'mobile':
        return 'space-y-4';
      default:
        return 'space-y-4';
    }
  };

  // Group fields by section
  const groupedFields = fields.reduce((groups, field) => {
    const section = field.section || 'default';
    if (!groups[section]) {
      groups[section] = [];
    }
    groups[section].push(field);
    return groups;
  }, {});

  return (
    <form onSubmit={handleSubmit} className={`${getLayoutClasses()} ${className}`}>
      {Object.entries(groupedFields).map(([sectionName, sectionFields]) => (
        <div key={sectionName} className="space-y-4">
          {sectionName !== 'default' && (
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="text-sm font-semibold text-green-700 mb-2">
                {sectionName}
              </h3>
            </div>
          )}
          
          <div className={`grid gap-4 ${
            layout === 'mobile' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 sm:grid-cols-2'
          }`}>
            {sectionFields.map((field) => (
              <div 
                key={field.name} 
                className={`space-y-2 ${
                  field.fullWidth ? 'sm:col-span-2' : ''
                } ${
                  field.type === 'checkbox' ? 'flex items-center' : ''
                }`}
              >
                {field.type !== 'checkbox' && (
                  <Label htmlFor={field.name} className="text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                )}
                
                {renderField(field)}
                
                {field.helpText && (
                  <p className="text-xs text-gray-500">{field.helpText}</p>
                )}
                
                {getFieldError(field.name) && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{getFieldError(field.name)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end space-x-2 pt-4 border-t">
        {showCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </Button>
        )}
        <Button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={loading || disabled}
        >
          {loading ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  );
};

export default StandardForm;