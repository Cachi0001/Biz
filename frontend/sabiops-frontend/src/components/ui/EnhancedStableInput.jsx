import React, { forwardRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { FocusManager } from '../../utils/focusManager';

/**
 * Enhanced StableInput component with comprehensive focus management
 * Prevents focus loss during re-renders and state updates
 */
const EnhancedStableInput = forwardRef(({ 
  onChange, 
  onFocus, 
  onBlur, 
  componentName = 'StableInput',
  preserveFocus = true,
  mobileOptimized = true,
  ...props 
}, ref) => {
  
  const handleChange = useCallback((e) => {
    if (!onChange) return;
    
    if (preserveFocus) {
      FocusManager.preserveFocus(() => {
        onChange(e);
      });
    } else {
      onChange(e);
    }
  }, [onChange, preserveFocus]);

  const handleFocus = useCallback((e) => {
    e.target.dataset.focused = 'true';
    e.target.dataset.focusTime = Date.now().toString();
    
    FocusManager.logFocusEvent(componentName, 'focus', e.target);
    
    onFocus?.(e);
  }, [onFocus, componentName]);

  const handleBlur = useCallback((e) => {
    const focusTime = parseInt(e.target.dataset.focusTime || '0');
    const now = Date.now();
    
    // Only blur if focus was held for more than 100ms (prevents accidental blur)
    if (now - focusTime > 100) {
      setTimeout(() => {
        if (e.target.dataset.focused === 'true') {
          e.target.dataset.focused = 'false';
          FocusManager.logFocusEvent(componentName, 'blur', e.target);
          onBlur?.(e);
        }
      }, 50);
    }
  }, [onBlur, componentName]);

  const handleMouseDown = useCallback((e) => {
    // Prevent focus loss on mouse interactions
    if (e.target.focus && e.target.dataset.focused !== 'true') {
      e.target.focus();
    }
    props.onMouseDown?.(e);
  }, [props.onMouseDown]);

  const handleTouchStart = useCallback((e) => {
    if (mobileOptimized && e.target.tagName === 'INPUT' && e.target.type !== 'range') {
      // Prevent iOS zoom on input focus
      const originalFontSize = e.target.style.fontSize;
      e.target.style.fontSize = '16px';
      e.target.dataset.originalFontSize = originalFontSize;
    }
    props.onTouchStart?.(e);
  }, [mobileOptimized, props.onTouchStart]);

  const handleTouchEnd = useCallback((e) => {
    if (mobileOptimized && e.target.dataset.originalFontSize !== undefined) {
      // Restore original font size
      e.target.style.fontSize = e.target.dataset.originalFontSize;
      delete e.target.dataset.originalFontSize;
    }
    props.onTouchEnd?.(e);
  }, [mobileOptimized, props.onTouchEnd]);

  return (
    <Input
      ref={ref}
      {...props}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-component={componentName}
      data-stable-input="true"
    />
  );
});

EnhancedStableInput.displayName = 'EnhancedStableInput';

export default EnhancedStableInput;