import React from 'react';
import { Label } from './label';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { FieldError } from './ErrorMessage';
import { cn } from '@/lib/utils';

/**
 * Enhanced form field component with error highlighting and validation feedback
 */
const FormField = ({
  type = 'input',
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  onKeyDown,
  error,
  touched,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  inputClassName = '',
  labelClassName = '',
  children,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'aria-required': ariaRequired,
  'aria-invalid': ariaInvalid,
  ...props
}) => {
  const hasError = Boolean(error && touched);
  const fieldId = props.id || `field-${name}`;
  const helpId = `${fieldId}-help`;
  const errorId = `${fieldId}-error`;

  const getInputClassName = () => {
    const baseClasses = 'h-12 min-h-[48px] text-base sm:text-sm touch-manipulation transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
    const errorClasses = hasError 
      ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500/20' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    
    return cn(baseClasses, errorClasses, disabledClasses, inputClassName);
  };

  const getLabelClassName = () => {
    const baseClasses = 'text-sm font-medium';
    const errorClasses = hasError ? 'text-red-700' : 'text-gray-700';
    const requiredClasses = required ? 'after:content-["*"] after:ml-1 after:text-red-500' : '';
    
    return cn(baseClasses, errorClasses, requiredClasses, labelClassName);
  };

  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  const handleBlur = (e) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  const handleFocus = (e) => {
    if (onFocus) {
      onFocus(e);
    }
  };

  const renderInput = () => {
    // Build aria-describedby string
    const describedByIds = [];
    if (hasError) describedByIds.push(errorId);
    if (ariaDescribedBy) describedByIds.push(ariaDescribedBy);
    
    const commonProps = {
      id: fieldId,
      name,
      value: value || '',
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus,
      onKeyDown,
      placeholder,
      disabled,
      className: getInputClassName(),
      'aria-label': ariaLabel || (label ? undefined : placeholder),
      'aria-describedby': describedByIds.length > 0 ? describedByIds.join(' ') : undefined,
      'aria-required': ariaRequired !== undefined ? ariaRequired : required,
      'aria-invalid': ariaInvalid !== undefined ? ariaInvalid : hasError,
      ...props
    };

    switch (type) {
      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            className={cn(getInputClassName(), 'min-h-[96px] resize-vertical')}
          />
        );
      
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => {
              const syntheticEvent = {
                target: { name, value: newValue }
              };
              handleChange(syntheticEvent);
            }}
            disabled={disabled}
          >
            <SelectTrigger 
              className={getInputClassName()}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${fieldId}-error` : undefined}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {children}
            </SelectContent>
          </Select>
        );
      
      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            step={props.step || '0.01'}
            min={props.min}
            max={props.max}
          />
        );
      
      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
          />
        );
      
      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
          />
        );
      
      case 'tel':
        return (
          <Input
            {...commonProps}
            type="tel"
          />
        );
      
      default:
        return (
          <Input
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label 
          htmlFor={fieldId} 
          className={getLabelClassName()}
        >
          {label}
        </Label>
      )}
      
      <div className="relative">
        {renderInput()}
        
        {/* Error indicator icon */}
        {hasError && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              className="h-5 w-5 text-red-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Error message */}
      {hasError && (
        <FieldError 
          error={error} 
          id={`${fieldId}-error`}
          className="mt-1"
        />
      )}
    </div>
  );
};

/**
 * Form field group component for related fields
 */
export const FormFieldGroup = ({ 
  title, 
  description, 
  children, 
  className = '',
  error = null 
}) => {
  return (
    <fieldset className={cn('space-y-4', className)}>
      {title && (
        <legend className="text-base font-semibold text-gray-900 mb-4">
          {title}
        </legend>
      )}
      
      {description && (
        <p className="text-sm text-gray-600 mb-4">
          {description}
        </p>
      )}
      
      {error && (
        <FieldError error={error} className="mb-4" />
      )}
      
      <div className="space-y-4">
        {children}
      </div>
    </fieldset>
  );
};

/**
 * Form row component for side-by-side fields
 */
export const FormRow = ({ 
  children, 
  className = '',
  columns = 2 
}) => {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
  };

  return (
    <div className={cn(
      'grid gap-4 sm:gap-6',
      gridClasses[columns] || gridClasses[2],
      className
    )}>
      {children}
    </div>
  );
};

export default FormField;