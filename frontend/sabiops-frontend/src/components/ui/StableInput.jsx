import React, { useRef, useCallback, useEffect, memo } from 'react';
import { Input } from './input';

// Simple debounce implementation without lodash
const simpleDebounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const StableInput = ({ value, onChange, type = 'text', name, className, placeholder, debounceMs = 300, ...props }) => {
  const inputRef = useRef(null);
  const isFocusedRef = useRef(false);
  const debounceTimeoutRef = useRef(null);
  const lastValueRef = useRef(value);
  const renderCountRef = useRef(0);

  // Increment render count for debugging
  renderCountRef.current += 1;

  // Debug re-renders with more detail
  useEffect(() => {
    console.log(`🔄 StableInput (${name}) rendered #${renderCountRef.current}`, {
      value,
      lastValue: lastValueRef.current,
      isFocused: isFocusedRef.current,
      activeElement: document.activeElement?.tagName,
      activeElementId: document.activeElement?.id,
      activeElementName: document.activeElement?.name,
      timestamp: new Date().toISOString()
    });
  });

  // Track value changes
  useEffect(() => {
    if (value !== lastValueRef.current) {
      console.log(`📝 StableInput (${name}) value changed:`, {
        from: lastValueRef.current,
        to: value,
        isFocused: isFocusedRef.current,
        activeElement: document.activeElement === inputRef.current,
        timestamp: new Date().toISOString()
      });
      lastValueRef.current = value;
    }
  }, [value, name]);

  // Enhanced focus tracking
  const handleFocus = useCallback((e) => {
    isFocusedRef.current = true;
    console.log(`🎯 StableInput (${name}) FOCUSED`, {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target.tagName,
      targetId: e.target.id,
      targetName: e.target.name,
      targetValue: e.target.value,
      selectionStart: e.target.selectionStart,
      selectionEnd: e.target.selectionEnd
    });
  }, [name]);

  const handleBlur = useCallback((e) => {
    isFocusedRef.current = false;
    console.log(`👋 StableInput (${name}) BLURRED`, {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target.tagName,
      targetId: e.target.id,
      targetName: e.target.name,
      targetValue: e.target.value,
      relatedTarget: e.relatedTarget?.tagName,
      relatedTargetId: e.relatedTarget?.id,
      relatedTargetName: e.relatedTarget?.name
    });
  }, [name]);

  // Enhanced input tracking
  const handleInput = useCallback((e) => {
    console.log(`✏️ StableInput (${name}) INPUT`, {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target.tagName,
      targetId: e.target.id,
      targetName: e.target.name,
      targetValue: e.target.value,
      selectionStart: e.target.selectionStart,
      selectionEnd: e.target.selectionEnd,
      isFocused: isFocusedRef.current
    });
  }, [name]);

  // Enhanced keydown tracking
  const handleKeyDown = useCallback((e) => {
    console.log(`⌨️ StableInput (${name}) KEYDOWN`, {
      timestamp: new Date().toISOString(),
      key: e.key,
      keyCode: e.keyCode,
      eventType: e.type,
      target: e.target.tagName,
      targetId: e.target.id,
      targetName: e.target.name,
      targetValue: e.target.value,
      selectionStart: e.target.selectionStart,
      selectionEnd: e.target.selectionEnd,
      isFocused: isFocusedRef.current
    });
  }, [name]);

  // Enhanced debounced onChange using simple debounce
  const debouncedOnChange = useCallback(
    simpleDebounce((e) => {
      console.log(`⏱️ StableInput (${name}) DEBOUNCED onChange`, {
        timestamp: new Date().toISOString(),
        value: e.target.value,
        isFocused: isFocusedRef.current,
        activeElement: document.activeElement === inputRef.current
      });
      // Call the original onChange with the event
      if (onChange) {
        onChange(e);
      }
    }, debounceMs),
    [onChange, name, debounceMs]
  );

  // Handle immediate input changes for better responsiveness
  const handleChange = useCallback((e) => {
    console.log(`🔄 StableInput (${name}) CHANGE`, {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target.tagName,
      targetId: e.target.id,
      targetName: e.target.name,
      targetValue: e.target.value,
      selectionStart: e.target.selectionStart,
      selectionEnd: e.target.selectionEnd,
      isFocused: isFocusedRef.current
    });
    
    // Call onChange immediately for better responsiveness
    if (onChange) {
      onChange(e);
    }
    
    // Also call debounced version for any additional processing
    debouncedOnChange(e);
  }, [onChange, name, debouncedOnChange]);

  return (
    <Input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default memo(StableInput); 