import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Input } from './input';
import { cn } from '../../lib/utils';

const MemoizedInput = React.memo(React.forwardRef(({
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
    if (finalRef.current) {
      cursorPositionRef.current = finalRef.current.selectionStart;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
    if (onKeyDown) {
      onKeyDown(e);
    }
  }, [onKeyDown, finalRef]);

  useEffect(() => {
    if (isFocused && finalRef.current && document.activeElement !== finalRef.current) {
      finalRef.current.focus();
      if (typeof finalRef.current.setSelectionRange === 'function') {
        try {
          finalRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
        } catch (error) {
          // Ignore cursor restoration errors
        }
      }
    }
  });

  const handleContainerMouseDown = useCallback((e) => {
    if (finalRef.current && !finalRef.current.contains(e.target)) {
      e.preventDefault();
      if (isFocused) {
        e.stopPropagation();
      }
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
        value={latestValueRef.current || ''}
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
}));

MemoizedInput.displayName = 'MemoizedInput';

export default MemoizedInput;


