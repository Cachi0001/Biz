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
  const isFocusedRef = useRef(false);
  const cursorPositionRef = useRef(0);

  const handleChange = useCallback((e) => {
    // Store cursor position before state update
    cursorPositionRef.current = e.target.selectionStart;
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);

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

  // Effect to restore focus and cursor position after re-renders
  useEffect(() => {
    if (isFocusedRef.current && finalRef.current && document.activeElement !== finalRef.current) {
      // Attempt to re-focus the input
      finalRef.current.focus();
      // Restore cursor position if possible
      if (typeof finalRef.current.setSelectionRange === 'function') {
        finalRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
      }
    }
  }); // No dependency array to run on every re-render

  return (
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
  );
});

FocusStableInput.displayName = 'FocusStableInput';

export default FocusStableInput;

