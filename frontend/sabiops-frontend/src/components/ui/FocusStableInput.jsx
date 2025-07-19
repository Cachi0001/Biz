import React, { useRef, useCallback } from 'react';
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
  className,
  type = "text",
  ...props
}, ref) => {
  const inputRef = useRef(null);
  const finalRef = ref || inputRef;

  // Stable change handler that doesn't cause re-renders
  const handleChange = useCallback((e) => {
    // Preserve cursor position
    const cursorPosition = e.target.selectionStart;
    
    // Call the onChange handler
    onChange?.(e);
    
    // Restore cursor position after state update
    requestAnimationFrame(() => {
      if (finalRef.current && document.activeElement === finalRef.current) {
        finalRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }, [onChange, finalRef]);

  const handleFocus = useCallback((e) => {
    onFocus?.(e);
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    onBlur?.(e);
  }, [onBlur]);

  return (
    <Input
      ref={finalRef}
      type={type}
      value={value || ''}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "min-h-[44px] touch-manipulation",
        "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        className
      )}
      {...props}
    />
  );
});

FocusStableInput.displayName = 'FocusStableInput';

export default FocusStableInput;