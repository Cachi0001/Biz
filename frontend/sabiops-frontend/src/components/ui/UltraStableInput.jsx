import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

/**
 * UltraStableInput - An ultra-stable input component that prevents focus loss
 * Uses advanced techniques to maintain focus and cursor position
 */
const UltraStableInput = React.forwardRef(({
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
  const isTypingRef = useRef(false);

  // Stable change handler with cursor preservation
  const handleChange = useCallback((e) => {
    isTypingRef.current = true;
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // Store cursor position
    cursorPositionRef.current = cursorPos;
    
    // Call parent onChange
    if (onChange) {
      onChange(e);
    }
    
    // Reset typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false;
    }, 50);
  }, [onChange]);

  const handleFocus = useCallback((e) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(e);
    }
  }, [onFocus]);

  const handleBlur = useCallback((e) => {
    // Only blur if we're not actively typing
    if (!isTypingRef.current) {
      setIsFocused(false);
      if (onBlur) {
        onBlur(e);
      }
    } else {
      // Prevent blur during typing
      e.preventDefault();
      e.target.focus();
    }
  }, [onBlur]);

  const handleKeyDown = useCallback((e) => {
    isTypingRef.current = true;
    
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
    
    // Reset typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false;
    }, 50);
  }, [onKeyDown, finalRef]);

  // Effect to maintain focus during re-renders
  useEffect(() => {
    if (isFocused && finalRef.current && document.activeElement !== finalRef.current) {
      // Re-focus if we lost focus unexpectedly
      finalRef.current.focus();
      
      // Restore cursor position
      if (typeof finalRef.current.setSelectionRange === 'function') {
        try {
          finalRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        } catch (error) {
          // Ignore cursor restoration errors
        }
      }
    }
  });

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
        position: 'relative',
        zIndex: isFocused ? 1000 : 'auto'
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
          isFocused && "relative z-[1000]",
          className
        )}
        {...props}
      />
    </div>
  );
});

UltraStableInput.displayName = 'UltraStableInput';

export default UltraStableInput;

