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
  const focusTimeRef = useRef(null);

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
    focusTimeRef.current = Date.now();
    console.log(`🎯 StableInput (${name}) FOCUSED`, {
      timestamp: new Date().toISOString(),
      focusTime: focusTimeRef.current,
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
    const blurTime = Date.now();
    const focusDuration = focusTimeRef.current ? blurTime - focusTimeRef.current : 0;
    isFocusedRef.current = false;
    console.log(`👋 StableInput (${name}) BLURRED`, {
      timestamp: new Date().toISOString(),
      blurTime,
      focusDuration: `${focusDuration}ms`,
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

  // Enhanced click tracking
  const handleClick = useCallback((e) => {
    console.log(`🖱️ StableInput (${name}) CLICKED`, {
      timestamp: new Date().toISOString(),
      eventType: e.type,
      target: e.target.tagName,
      targetId: e.target.id,
      targetName: e.target.name,
      clientX: e.clientX,
      clientY: e.clientY,
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

  // Enhanced change tracking
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

  // Less aggressive focus restoration - only restore if we're still focused and lost focus unexpectedly
  useEffect(() => {
    const input = inputRef.current;
    if (input && isFocusedRef.current && document.activeElement !== input) {
      // Only restore focus if we lost it unexpectedly (not due to user action)
      const timeSinceFocus = Date.now() - (focusTimeRef.current || 0);
      if (timeSinceFocus < 100) { // Only restore if focus was lost very quickly
        console.log(`🔄 StableInput (${name}) RESTORING FOCUS`, {
          timestamp: new Date().toISOString(),
          wasFocused: isFocusedRef.current,
          currentActiveElement: document.activeElement?.tagName,
          currentActiveElementId: document.activeElement?.id,
          currentActiveElementName: document.activeElement?.name,
          inputElement: input.tagName,
          inputElementId: input.id,
          inputElementName: input.name,
          inputElementValue: input.value,
          selectionStart: input.selectionStart,
          selectionEnd: input.selectionEnd
        });

        const selectionStart = input.selectionStart;
        const selectionEnd = input.selectionEnd;
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          input.focus();
          if (selectionStart !== null && selectionEnd !== null) {
            input.setSelectionRange(selectionStart, selectionEnd);
          }
          console.log(`✅ StableInput (${name}) FOCUS RESTORED`, {
            timestamp: new Date().toISOString(),
            newActiveElement: document.activeElement?.tagName,
            newActiveElementId: document.activeElement?.id,
            newActiveElementName: document.activeElement?.name,
            selectionStart: input.selectionStart,
            selectionEnd: input.selectionEnd
          });
        });
      }
    }
  }, [value, name]);

  // Monitor DOM changes that might affect focus
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          console.log(`🔍 StableInput (${name}) DOM MUTATION DETECTED`, {
            timestamp: new Date().toISOString(),
            mutationType: mutation.type,
            target: mutation.target.tagName,
            targetId: mutation.target.id,
            targetName: mutation.target.name,
            isFocused: isFocusedRef.current,
            activeElement: document.activeElement === input
          });
        }
      });
    });

    observer.observe(input.parentElement || input, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'id']
    });

    return () => observer.disconnect();
  }, [name]);

  // Monitor parent component re-renders
  useEffect(() => {
    console.log(`👀 StableInput (${name}) monitoring parent re-renders`, {
      timestamp: new Date().toISOString(),
      isFocused: isFocusedRef.current,
      activeElement: document.activeElement === inputRef.current
    });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log(`🧹 StableInput (${name}) unmounting`, {
        timestamp: new Date().toISOString(),
        isFocused: isFocusedRef.current,
        activeElement: document.activeElement === inputRef.current
      });
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [name]);

  return (
    <Input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={debouncedOnChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onInput={handleInput}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default memo(StableInput, (prevProps, nextProps) => {
  const changed = prevProps.value !== nextProps.value || 
                  prevProps.className !== nextProps.className ||
                  prevProps.placeholder !== nextProps.placeholder;
  
  if (changed) {
    console.log(`🔄 StableInput (${nextProps.name}) props changed, re-rendering`, {
      timestamp: new Date().toISOString(),
      prevValue: prevProps.value,
      nextValue: nextProps.value,
      prevClassName: prevProps.className,
      nextClassName: nextProps.className,
      prevPlaceholder: prevProps.placeholder,
      nextPlaceholder: nextProps.placeholder
    });
  }
  
  return !changed;
}); 