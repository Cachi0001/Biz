import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Simple and reliable date picker component
 * Uses native HTML5 date input with enhanced styling and mobile optimization
 */
const SimpleDatePicker = ({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  className = "",
  disabled = false,
  min,
  max,
  ...props 
}) => {
  const [internalValue, setInternalValue] = useState(value || '');

  // Sync with external value changes
  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    
    console.log('[SimpleDatePicker] Date changed:', {
      oldValue: value,
      newValue: newValue,
      timestamp: new Date().toISOString()
    });
    
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = (e) => {
    console.log('[SimpleDatePicker] Date picker focused');
    // On mobile, this will open the native date picker
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e) => {
    console.log('[SimpleDatePicker] Date picker blurred, final value:', e.target.value);
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <input
          type="date"
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          min={min}
          max={max}
          className={cn(
            // Base styles
            "w-full h-12 px-3 py-2 text-base",
            "border border-gray-300 rounded-md",
            "bg-white text-gray-900",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500",
            "disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed",
            
            // Mobile optimizations
            "touch-manipulation", // Prevents zoom on iOS
            "text-[16px] sm:text-base", // Prevents zoom on iOS (16px minimum)
            
            // Center alignment on mobile
            "text-center",
            
            // Enhanced styling
            "transition-all duration-200",
            "hover:border-gray-400 focus:shadow-lg",
            
            // Custom date input styling
            "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
            "[&::-webkit-calendar-picker-indicator]:hover:bg-gray-100",
            "[&::-webkit-calendar-picker-indicator]:rounded",
            "[&::-webkit-calendar-picker-indicator]:p-1",
            
            // Mobile responsive sizing - smaller and centered
            "max-w-[240px] mx-auto sm:max-w-none sm:mx-0",
            "text-sm sm:text-base", // Smaller text on mobile
            "h-10 sm:h-12", // Smaller height on mobile
            "px-2 sm:px-3", // Less padding on mobile
            
            className
          )}
          style={{
            // Ensure proper display on all devices
            WebkitAppearance: 'none',
            MozAppearance: 'textfield',
            // Center the content
            textAlign: 'center'
          }}
          {...props}
        />
        
        {/* Calendar icon overlay for better UX */}
        <Calendar 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" 
        />
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-500 mt-1">
          Current value: {internalValue || 'None'}
        </div>
      )}
    </div>
  );
};

/**
 * Enhanced date picker with additional features
 */
export const EnhancedDatePicker = ({ 
  value, 
  onChange, 
  label,
  error,
  required = false,
  showToday = true,
  className = "",
  ...props 
}) => {
  const today = new Date().toISOString().split('T')[0];
  
  const handleTodayClick = () => {
    const todayEvent = {
      target: { value: today }
    };
    
    console.log('[EnhancedDatePicker] Today button clicked:', today);
    
    if (onChange) {
      onChange(todayEvent);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-2">
        <SimpleDatePicker
          value={value}
          onChange={onChange}
          className={error ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}
          {...props}
        />
        
        {showToday && (
          <div className="flex justify-center sm:justify-start">
            <button
              type="button"
              onClick={handleTodayClick}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Select Today
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default SimpleDatePicker;