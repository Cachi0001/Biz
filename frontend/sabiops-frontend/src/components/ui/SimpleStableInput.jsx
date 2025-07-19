import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

/**
 * SimpleStableInput - A simple, reliable input component that prevents focus loss
 * 
 * This component focuses on simplicity and reliability rather than complex features.
 * It maintains focus by:
 * 1. Using a stable ref
 * 2. Preventing parent elements from stealing focus
 * 3. Minimal state management
 * 4. No debouncing that could cause input clearing
 */
const SimpleStableInput = React.forwardRef(({
  value,
  onChange,
  onFocus,
  onBlur,
  className,
  type = "text",
  ...props
}, ref) => {
  const inputRef = useRef(null);
  const finalRef = ref || inputRef;
  const [isFocused, setIsFocused] = useState(false);

  // Focus handler
  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  // Blur handler
  const handleBlur = useCallback((e) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(e);
    }
  }, [onBlur]);

  // Change handler - direct pass-through to parent
  const handleChange = useCallback((e) => {
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);

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

  // Effect to restore focus if lost during re-renders
  useEffect(() => {
    if (isFocused && finalRef.current && document.activeElement !== finalRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        if (finalRef.current && document.activeElement !== finalRef.current) {
          finalRef.current.focus();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isFocused, finalRef]);

  return (
    <div
      onMouseDown={handleContainerMouseDown}
      style={{
        position: 'relative',
        zIndex: isFocused ? 1000 : 'auto'
      }}
    >
      <Input
        ref={finalRef}
        type={type}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
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

SimpleStableInput.displayName = 'SimpleStableInput';

export default SimpleStableInput; 