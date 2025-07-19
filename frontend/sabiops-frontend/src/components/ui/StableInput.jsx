import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

/**
 * StableInput - An ultra-stable input component that prevents focus loss
 * Uses advanced techniques to maintain focus and cursor position
 */
const StableInput = React.forwardRef(({
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
  const [isFocused, setIsFocused] = useState(false);
  const cursorPositionRef = useRef(0);
  const valueRef = useRef(value);

  // Update value ref when prop changes
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Stable change handler with cursor preservation
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Store cursor position
    cursorPositionRef.current = cursorPos;
    
    // Call parent onChange
    if (onChange) {
      onChange(e);
    }
    
    // Restore cursor position after state update
    setTimeout(() => {
      if (finalRef.current && isFocused && document.activeElement === finalRef.current) {
        try {
          finalRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        } catch (error) {
          // Ignore cursor restoration errors
        }
      }
    }, 0);
  }, [onChange, finalRef, isFocused]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur]);

  const handleKeyDown = useCallback((e) => {
    // Store cursor position on key events
    if (finalRef.current) {
      cursorPositionRef.current = finalRef.current.selectionStart;
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

  // Prevent parent click events from stealing focus
  const handleContainerMouseDown = useCallback((e) => {
    if (isFocused) {
      e.stopPropagation();
    }
  }, [isFocused]);

  const handleContainerClick = useCallback((e) => {
    if (isFocused) {
      e.stopPropagation();
    }
  }, [isFocused]);

  return (
    <div 
      onMouseDown={handleContainerMouseDown}
      onClick={handleContainerClick}
      style={{ 
        pointerEvents: 'auto',
        position: 'relative',
        zIndex: isFocused ? 10 : 'auto'
      }}
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
          isFocused && "relative z-10",
          className
        )}
        {...props}
      />
    </div>
  );
});

StableInput.displayName = 'StableInput';

export default StableInput;

