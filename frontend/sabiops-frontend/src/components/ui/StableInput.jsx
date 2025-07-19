/**
 * StableInput - Input component that preserves focus during re-renders
 * Addresses the issue where input fields lose focus after typing single characters
 */

import React, { useCallback, useRef, useEffect } from 'react';
import { Input } from './input';
import FocusManager from '../../utils/focusManager';
import DebugLogger from '../../utils/debugLogger';
import { cn } from '../../lib/utils';

const StableInput = React.forwardRef(({
  onChange,
  onFocus,
  onBlur,
  className,
  componentName = 'StableInput',
  preserveFocus = true,
  logEvents = true,
  debounceMs = 0,
  component = 'input',
  ...props
}, ref) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;
  const debounceTimeoutRef = useRef(null);

  // Stable onChange handler that preserves focus
  const handleChange = useCallback((e) => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const executeChange = () => {
      try {
        if (logEvents && DebugLogger?.logFocusEvent) {
          DebugLogger.logFocusEvent(componentName, 'change', e.target, {
            value: e.target.value,
            selectionStart: e.target.selectionStart,
            selectionEnd: e.target.selectionEnd
          });
        }

        if (preserveFocus && FocusManager?.preserveFocus) {
          FocusManager.preserveFocus(() => {
            onChange?.(e);
          });
        } else {
          onChange?.(e);
        }
      } catch (error) {
        console.error(`[${componentName}] Change handler error:`, error);
        // Fallback to direct onChange call
        onChange?.(e);
      }
    };

    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(executeChange, debounceMs);
    } else {
      executeChange();
    }
  }, [onChange, preserveFocus, logEvents, componentName, debounceMs]);

  // Enhanced focus handler with logging
  const handleFocus = useCallback((e) => {
    if (logEvents && DebugLogger?.logFocusEvent) {
      DebugLogger.logFocusEvent(componentName, 'focus', e.target);
    }
    onFocus?.(e);
  }, [onFocus, logEvents, componentName]);

  // Enhanced blur handler with logging
  const handleBlur = useCallback((e) => {
    if (logEvents && DebugLogger?.logFocusEvent) {
      DebugLogger.logFocusEvent(componentName, 'blur', e.target);
    }
    onBlur?.(e);
  }, [onBlur, logEvents, componentName]);

  // Log component mount/unmount
  useEffect(() => {
    if (logEvents && DebugLogger?.logLifecycle) {
      DebugLogger.logLifecycle(componentName, 'mount');
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (logEvents && DebugLogger?.logLifecycle) {
        DebugLogger.logLifecycle(componentName, 'unmount');
      }
    };
  }, [componentName, logEvents]);

  // Handle different component types
  if (component === 'textarea') {
    return (
      <textarea
        ref={inputRef}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          // Ensure minimum touch target size for mobile
          "min-h-[44px] touch-manipulation",
          // Enhanced focus styles
          "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          // Textarea specific styles
          "w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }

  return (
    <Input
      ref={inputRef}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        // Ensure minimum touch target size for mobile
        "min-h-[44px] touch-manipulation",
        // Enhanced focus styles
        "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        className
      )}
      {...props}
    />
  );
});

StableInput.displayName = 'StableInput';

export default StableInput;