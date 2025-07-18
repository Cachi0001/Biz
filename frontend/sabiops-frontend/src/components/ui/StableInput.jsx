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
  ...props
}, ref) => {
  const internalRef = useRef(null);
  const inputRef = ref || internalRef;

  // Stable onChange handler that preserves focus
  const handleChange = useCallback((e) => {
    if (logEvents) {
      DebugLogger.logFocusEvent(componentName, 'change', e.target, {
        value: e.target.value,
        selectionStart: e.target.selectionStart,
        selectionEnd: e.target.selectionEnd
      });
    }

    if (preserveFocus) {
      FocusManager.preserveFocus(() => {
        onChange?.(e);
      });
    } else {
      onChange?.(e);
    }
  }, [onChange, preserveFocus, logEvents, componentName]);

  // Enhanced focus handler with logging
  const handleFocus = useCallback((e) => {
    if (logEvents) {
      DebugLogger.logFocusEvent(componentName, 'focus', e.target);
    }
    onFocus?.(e);
  }, [onFocus, logEvents, componentName]);

  // Enhanced blur handler with logging
  const handleBlur = useCallback((e) => {
    if (logEvents) {
      DebugLogger.logFocusEvent(componentName, 'blur', e.target);
    }
    onBlur?.(e);
  }, [onBlur, logEvents, componentName]);

  // Log component mount/unmount
  useEffect(() => {
    if (logEvents) {
      DebugLogger.logLifecycle(componentName, 'mount');
    }
    
    return () => {
      if (logEvents) {
        DebugLogger.logLifecycle(componentName, 'unmount');
      }
    };
  }, [componentName, logEvents]);

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