import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

const SuperStableInput = React.forwardRef(({
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
  const latestValueRef = useRef(value);

  // Update latestValueRef whenever the value prop changes
  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  const handleChange = useCallback((e) => {
    // Store cursor position before state update
    cursorPositionRef.current = e.target.selectionStart;
    if (onChange) {
      onChange(e);
    }
  }, [onChange]);

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
    // Prevent form submission on Enter key
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

  // Prevent parent click events from stealing focus without interfering with input interaction
  const handleContainerMouseDown = useCallback((e) => {
    // Only stop propagation if the click is not directly on the input itself
    if (finalRef.current && !finalRef.current.contains(e.target)) {
      e.preventDefault(); // Prevent default browser focus change
      if (isFocused) {
        e.stopPropagation(); // Stop event from bubbling up if input is already focused
      }
    }
  }, [isFocused, finalRef]);

  return (
    <div
      onMouseDown={handleContainerMouseDown}
      style={{
        position: 'relative',
        zIndex: isFocused ? 1000 : 'auto' // Bring focused input to front
      }}
    >
      <Input
        ref={finalRef}
        type={type}
        value={latestValueRef.current || ''} // Use latestValueRef to prevent re-render issues
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-h-[44px] touch-manipulation",
          "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          isFocused && "relative z-[1000]",
          className
        )}
        {...props}
      />
    </div>
  );
});

SuperStableInput.displayName = 'SuperStableInput';

export default SuperStableInput;


