import React, { useRef, useEffect } from 'react';
import { Input } from './input';

/**
 * Simple input component that maintains focus without complex focus management
 * Uses React's built-in mechanisms to prevent focus loss
 */
const SimpleFocusInput = React.forwardRef(({ 
  onChange, 
  value, 
  onFocus,
  onBlur,
  ...props 
}, ref) => {
  const inputRef = useRef(null);
  const lastValueRef = useRef(value);
  const selectionRef = useRef({ start: 0, end: 0 });

  // Use the forwarded ref or our internal ref
  const actualRef = ref || inputRef;

  // Store cursor position before value changes
  const handleFocus = (e) => {
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    if (onBlur) onBlur(e);
  };

  // Handle change with minimal re-rendering
  const handleChange = (e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Store cursor position
    selectionRef.current = {
      start: cursorPos,
      end: e.target.selectionEnd
    };
    
    lastValueRef.current = newValue;
    
    if (onChange) {
      onChange(e);
    }
  };

  // Restore cursor position after render if needed
  useEffect(() => {
    if (actualRef.current && document.activeElement === actualRef.current) {
      const { start, end } = selectionRef.current;
      if (start !== undefined && end !== undefined) {
        try {
          actualRef.current.setSelectionRange(start, end);
        } catch (error) {
          // Ignore errors - element might not support selection
        }
      }
    }
  });

  return (
    <Input
      ref={actualRef}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
});

SimpleFocusInput.displayName = 'SimpleFocusInput';

export default SimpleFocusInput;