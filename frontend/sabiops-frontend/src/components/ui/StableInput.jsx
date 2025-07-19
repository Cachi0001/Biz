import React, { memo, useRef, useCallback, useEffect } from 'react';

const StableInput = ({
  value,
  onChange,
  type = 'text',
  name,
  className,
  placeholder,
  ...props
}) => {
  const inputRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Debounced onChange to reduce state updates
  const debouncedOnChange = useCallback((e) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced update
    debounceTimeoutRef.current = setTimeout(() => {
      onChange(e);
    }, 300);
  }, [onChange]);

  // Handle immediate change for better UX
  const handleChange = useCallback((e) => {
    // Update the input value immediately for visual feedback
    if (inputRef.current) {
      inputRef.current.value = e.target.value;
    }
    
    // Debounce the actual state update
    debouncedOnChange(e);
  }, [debouncedOnChange]);

  // Prevent event propagation to avoid focus theft
  const handleEvent = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Restore focus if unexpectedly lost (edge case)
  useEffect(() => {
    const input = inputRef.current;
    if (input && document.activeElement === input) {
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      input.focus();
      if (selectionStart !== null && selectionEnd !== null) {
        input.setSelectionRange(selectionStart, selectionEnd);
      }
    }
  }, [value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type={type}
      value={value}
      onChange={handleChange}
      onClick={handleEvent}
      onKeyDown={handleEvent}
      onFocus={handleEvent}
      onBlur={handleEvent}
      name={name}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default memo(StableInput, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders unless value or critical props change
  return (
    prevProps.value === nextProps.value &&
    prevProps.name === nextProps.name &&
    prevProps.type === nextProps.type &&
    prevProps.className === nextProps.className &&
    prevProps.placeholder === nextProps.placeholder
  );
}); 