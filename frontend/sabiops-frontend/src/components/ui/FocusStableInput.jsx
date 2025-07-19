import React, { useRef, useCallback, useEffect } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

/**
 * FocusStableInput - A more stable input component that prevents focus loss
 * This component uses refs and controlled updates to maintain focus
 */
const FocusStableInput = React.forwardRef(({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  type = "text",
  ...props
}, ref) => {
  const inputRef = useRef(null);
  const finalRef = ref || inputRef;
  const lastValueRef = useRef(value);
  const isFocusedRef = useRef(false);

  // Stable change handler that doesn't cause re-renders
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Store the cursor position before calling onChange
    const restoreCursor = () => {
      if (finalRef.current && isFocusedRef.current && document.activeElement === finalRef.current) {
        try {
          finalRef.current.setSelectionRange(cursorPosition, cursorPosition);
        } catch (error) {
          // Ignore errors in case the input is not focusable
        }
      }
    };

    // Call the onChange handler
    if (onChange) {
      onChange(e);
    }
    
    // Update our ref
    lastValueRef.current = newValue;
    
    // Restore cursor position after React updates
    requestAnimationFrame(restoreCursor);
  }, [onChange, finalRef]);

  const handleFocus = useCallback((e) => {
    isFocusedRef.current = true;
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    isFocusedRef.current = false;
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur]);

  const handleKeyDown = useCallback((e) => {
    // Prevent form submission on Enter key
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [onKeyDown]);

  // Prevent parent elements from stealing focus
  const handleMouseDown = useCallback((e) => {
    // Only prevent default if the input is already focused
    if (isFocusedRef.current && document.activeElement === finalRef.current) {
      e.stopPropagation();
    }
  }, [finalRef]);

  // Effect to maintain focus stability
  useEffect(() => {
    if (finalRef.current && isFocusedRef.current && document.activeElement !== finalRef.current) {
      // Re-focus if we lost focus unexpectedly
      finalRef.current.focus();
    }
  }, [value, finalRef]);

  return (
    <div 
      onMouseDown={handleMouseDown}
      style={{ pointerEvents: isFocusedRef.current ? 'auto' : 'auto' }}
    >
      <Input
        ref={finalRef}
        type={type}
        value={value || ''}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[44px] touch-manipulation",
          "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          className
        )}
        {...props}
      />
    </div>
  );
});

FocusStableInput.displayName = 'FocusStableInput';

export default FocusStableInput;

