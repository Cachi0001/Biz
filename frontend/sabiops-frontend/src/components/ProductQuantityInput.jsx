import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input, FormControl, FormLabel, FormErrorMessage, Box, Text } from '@chakra-ui/react';

const ProductQuantityInput = ({
  productId,
  maxQuantity,
  initialValue = '',
  onChange,
  onValidation,
  isRequired = true,
  isDisabled = false,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const timeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Validate quantity with debounce
  const validateQuantity = useCallback((inputValue) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set validating state
    setIsValidating(true);
    
    // If input is empty and not required, consider it valid
    if (!inputValue && !isRequired) {
      if (onValidation) onValidation(true);
      setError('');
      setIsValidating(false);
      return true;
    }

    // Check if input is a valid number
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      if (onValidation) onValidation(false);
      setIsValidating(false);
      return false;
    }

    // Check if number is positive
    if (numValue <= 0) {
      setError('Quantity must be greater than 0');
      if (onValidation) onValidation(false);
      setIsValidating(false);
      return false;
    }

    // Check if number is an integer (if needed)
    if (Number.isInteger(parseFloat(inputValue)) && !Number.isInteger(numValue)) {
      setError('Please enter a whole number');
      if (onValidation) onValidation(false);
      setIsValidating(false);
      return false;
    }

    // Check against max quantity if provided
    if (maxQuantity !== undefined && numValue > maxQuantity) {
      setError(`Only ${maxQuantity} available in stock`);
      if (onValidation) onValidation(false);
      setIsValidating(false);
      return false;
    }

    // If we get here, validation passed
    setError('');
    if (onValidation) onValidation(true);
    setIsValidating(false);
    return true;
  }, [isRequired, maxQuantity, onValidation]);

  // Handle input change with debounced validation
  const handleChange = (e) => {
    const inputValue = e.target.value;
    setValue(inputValue);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Don't validate empty input immediately (allow typing)
    if (inputValue === '') {
      setError('');
      if (onChange) onChange('');
      return;
    }

    // Set a new timeout for validation
    timeoutRef.current = setTimeout(() => {
      const isValid = validateQuantity(inputValue);
      if (isValid && onChange) {
        const numValue = parseFloat(inputValue);
        onChange(isNaN(numValue) ? inputValue : numValue);
      }
    }, 500); // 500ms debounce
  };

  // Handle blur (immediate validation when leaving the field)
  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    validateQuantity(value);
  };

  // Show available stock if maxQuantity is provided
  const renderStockInfo = () => {
    if (maxQuantity === undefined) return null;
    
    return (
      <Text fontSize="sm" color="gray.500" mt={1}>
        Available: {maxQuantity}
      </Text>
    );
  };

  return (
    <FormControl isInvalid={!!error} isRequired={isRequired} isDisabled={isDisabled}>
      <FormLabel htmlFor={`quantity-${productId}`}>Quantity</FormLabel>
      <Input
        id={`quantity-${productId}`}
        type="number"
        min={1}
        max={maxQuantity}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="Enter quantity"
        isDisabled={isDisabled || isValidating}
        {...props}
      />
      {!error && renderStockInfo()}
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  );
};

export default ProductQuantityInput;
