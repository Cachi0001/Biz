import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

/**
 * BulletproofInput - The definitive solution for preventing focus loss in React forms
 * 
 * This component implements multiple layers of focus protection:
 * 1. Stable refs that survive re-renders
 * 2. Cursor position preservation
 * 3. Event interception to prevent focus theft
 * 4. Z-index management for focused elements
 * 5. Debounced state updates to prevent excessive re-renders
 * 6. React.memo optimization to prevent unnecessary re-renders
 */
const BulletproofInput = React.memo(React.forwardRef(({
  value,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  className,
  type = "text",
  componentName = "BulletproofInput",
  debounceMs = 0, // Debounce onChange to prevent excessive re-renders
  ...props
}, ref) => {
  const inputRef = useRef(null);
  const finalRef = ref || inputRef;
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const cursorPositionRef = useRef(0);
  const selectionStartRef = useRef(0);
  const selectionEndRef = useRef(0);
  const isUpdatingRef = useRef(false);
  const debounceTimeoutRef = useRef(null);

  // Update internal value when prop changes (but not during user input)
  useEffect(() => {
    if (!isUpdatingRef.current) {
      setInternalValue(value || '');
    }
  }, [value]);

  // Debounced onChange handler to prevent excessive re-renders
  const debouncedOnChange = useCallback((newValue) => {
    if (onChange) {
      if (debounceMs > 0) {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          onChange({ target: { value: newValue } });
        }, debounceMs);
      } else {
        onChange({ target: { value: newValue } });
      }
    }
  }, [onChange, debounceMs]);

  // Stable change handler with cursor preservation
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Store cursor position
    cursorPositionRef.current = cursorPos;
    selectionStartRef.current = e.target.selectionStart;
    selectionEndRef.current = e.target.selectionEnd;
    
    // Update internal state immediately for responsive UI
    isUpdatingRef.current = true;
    setInternalValue(newValue);
    
    // Call debounced parent onChange
    debouncedOnChange(newValue);
    
    // Restore cursor position after state update
    requestAnimationFrame(() => {
      if (finalRef.current && isFocused && document.activeElement === finalRef.current) {
        try {
          finalRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        } catch (error) {
          // Ignore cursor restoration errors
        }
      }
      isUpdatingRef.current = false;
    });
  }, [debouncedOnChange, finalRef, isFocused]);

  // Focus handler with enhanced protection
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    
    // Store current cursor position
    if (finalRef.current) {
      cursorPositionRef.current = finalRef.current.selectionStart;
      selectionStartRef.current = finalRef.current.selectionStart;
      selectionEndRef.current = finalRef.current.selectionEnd;
    }
    
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus, finalRef]);

  // Blur handler with delay to prevent accidental blur
  const handleBlur = useCallback((e) => {
    // Delay blur to prevent accidental focus loss
    setTimeout(() => {
      if (document.activeElement !== finalRef.current) {
        setIsFocused(false);
        if (onBlur) {
          onBlur(e);
        }
      }
    }, 50);
  }, [onBlur, finalRef]);

  // Enhanced key handler
  const handleKeyDown = useCallback((e) => {
    // Store cursor position on key events
    if (finalRef.current) {
      cursorPositionRef.current = finalRef.current.selectionStart;
      selectionStartRef.current = finalRef.current.selectionStart;
      selectionEndRef.current = finalRef.current.selectionEnd;
    }
    
    // Prevent form submission on Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [onKeyDown, finalRef]);

  // Effect to restore focus and cursor position after re-renders
  useEffect(() => {
    if (isFocused && finalRef.current && document.activeElement !== finalRef.current) {
      // Attempt to re-focus the input
      finalRef.current.focus();
      
      // Restore cursor position if possible
      if (typeof finalRef.current.setSelectionRange === 'function') {
        try {
          finalRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        } catch (error) {
          // Ignore cursor restoration errors
        }
      }
    }
  }); // No dependency array to run on every re-render

  // Prevent parent elements from stealing focus
  const handleContainerMouseDown = useCallback((e) => {
    // Only prevent if the click is not directly on the input
    if (finalRef.current && !finalRef.current.contains(e.target)) {
      e.preventDefault();
      if (isFocused) {
        e.stopPropagation();
      }
    }
  }, [isFocused, finalRef]);

  const handleContainerClick = useCallback((e) => {
    // Only prevent if the click is not directly on the input
    if (finalRef.current && !finalRef.current.contains(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, [finalRef]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Memoized className to prevent unnecessary re-renders
  const inputClassName = useMemo(() => {
    return cn(
      "min-h-[44px] touch-manipulation",
      "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
      isFocused && "relative z-[1000]",
      className
    );
  }, [isFocused, className]);

  return (
    <div
      onMouseDown={handleContainerMouseDown}
      onClick={handleContainerClick}
      style={{
        position: 'relative',
        zIndex: isFocused ? 1000 : 'auto'
      }}
    >
      <Input
        ref={finalRef}
        type={type}
        value={internalValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputClassName}
        data-component={componentName}
        data-focused={isFocused}
        {...props}
      />
    </div>
  );
}));

BulletproofInput.displayName = 'BulletproofInput';

export default BulletproofInput; 