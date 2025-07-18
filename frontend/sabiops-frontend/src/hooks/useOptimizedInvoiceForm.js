/**
 * Optimized invoice form hook with performance enhancements
 * Implements all performance optimizations from requirement 11.4
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { 
  useDebounce, 
  useMemoizedCalculation, 
  useOptimizedApiLoader,
  calculateItemTotalMemoized,
  calculateInvoiceTotalMemoized,
  usePerformanceMonitor
} from '../utils/performanceOptimizations';
import { 
  getCustomersOptimized, 
  getProductsOptimized,
  loadApiDataBatch,
  invalidateCache,
  warmCache
} from '../services/optimizedApiService';
import {
  validateFieldOptimized,
  validateInvoiceItemOptimized,
  validateChangedFields,
  clearValidationCache
} from '../services/optimizedValidationService';

/**
 * Optimized invoice form hook with comprehensive performance improvements
 */
export const useOptimizedInvoiceForm = (initialData = {}) => {
  // Performance monitoring
  const { logPerformance } = usePerformanceMonitor('InvoiceForm');
  
  // Form state
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: 'Payment is due within 30 days of invoice date.',
    currency: 'NGN',
    discount_amount: 0,
    items: [{ 
      id: Date.now(), 
      product_id: '', 
      description: '', 
      quantity: 1, 
      unit_price: 0, 
      tax_rate: 0, 
      discount_rate: 0 
    }],
    ...initialData
  });
  
  // Validation state
  const [errors, setErrors] = useState({});
  const [itemErrors, setItemErrors] = useState([]);
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [isValidating, setIsValidating] = useState(false);
  
  // API data state
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Performance tracking
  const previousFormDataRef = useRef(formData);
  const validationCountRef = useRef(0);
  
  // Optimized API loader
  const { loadData, clearCache, preloadData } = useOptimizedApiLoader();
  
  // Debounced validation functions
  const debouncedValidateField = useDebounce(async (fieldName, value, formData) => {
    const startTime = Date.now();
    setIsValidating(true);
    
    try {
      const error = await validateFieldOptimized(fieldName, value, formData);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
      
      const duration = Date.now() - startTime;
      logPerformance(`validate-${fieldName}`, duration);
      validationCountRef.current += 1;
      
      return error;
    } finally {
      setIsValidating(false);
    }
  }, 300);
  
  const debouncedValidateItem = useDebounce(async (itemIndex, item) => {
    const startTime = Date.now();
    setIsValidating(true);
    
    try {
      const itemValidationErrors = await validateInvoiceItemOptimized(item, itemIndex);
      setItemErrors(prev => {
        const newItemErrors = [...prev];
        newItemErrors[itemIndex] = itemValidationErrors;
        return newItemErrors;
      });
      
      const duration = Date.now() - startTime;
      logPerformance(`validate-item-${itemIndex}`, duration);
      validationCountRef.current += 1;
      
      return itemValidationErrors;
    } finally {
      setIsValidating(false);
    }
  }, 300);
  
  // Memoized calculations
  const itemTotals = useMemo(() => {
    const startTime = Date.now();
    const totals = formData.items.map(item => calculateItemTotalMemoized(item));
    const duration = Date.now() - startTime;
    logPerformance('calculate-item-totals', duration);
    return totals;
  }, [formData.items]);
  
  const invoiceTotal = useMemoizedCalculation(() => {
    return calculateInvoiceTotalMemoized(formData.items, formData.discount_amount);
  }, [formData.items, formData.discount_amount]);
  
  // Load API data with optimization
  const loadApiData = useCallback(async (forceRefresh = false) => {
    const startTime = Date.now();
    setIsLoadingData(true);
    
    try {
      const data = await loadApiDataBatch(['customers', 'products'], forceRefresh);
      
      setCustomers(data.customers || []);
      setProducts(data.products || []);
      
      const duration = Date.now() - startTime;
      logPerformance('load-api-data', duration);
    } catch (error) {
      console.error('Failed to load API data:', error);
      setCustomers([]);
      setProducts([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [loadData, logPerformance]);
  
  // Initialize data loading with cache warming
  useEffect(() => {
    loadApiData();
    warmCache(); // Preload additional data in background
  }, [loadApiData]);
  
  // Optimized field change handler
  const handleFieldChange = useCallback(async (fieldName, value) => {
    const startTime = Date.now();
    
    // Update form data immediately for responsive UI
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldName]));
    
    // Debounced validation
    await debouncedValidateField(fieldName, value, { ...formData, [fieldName]: value });
    
    const duration = Date.now() - startTime;
    logPerformance(`field-change-${fieldName}`, duration);
  }, [formData, debouncedValidateField, logPerformance]);
  
  // Optimized item change handler
  const handleItemChange = useCallback(async (itemIndex, fieldName, value) => {
    const startTime = Date.now();
    
    // Apply field-specific processing
    let processedValue = value;
    if (fieldName === 'quantity') {
      processedValue = value === '' ? 1 : Math.max(1, parseInt(value) || 1);
    } else if (fieldName === 'unit_price') {
      processedValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    } else if (fieldName === 'tax_rate' || fieldName === 'discount_rate') {
      processedValue = value === '' ? 0 : Math.max(0, Math.min(100, parseFloat(value) || 0));
    }
    
    // Update form data
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[itemIndex] = { 
        ...updatedItems[itemIndex], 
        [fieldName]: processedValue 
      };
      
      // Auto-populate product details when product is selected
      if (fieldName === 'product_id' && value) {
        const product = products.find(p => p.id === value);
        if (product) {
          updatedItems[itemIndex].description = product.name || '';
          updatedItems[itemIndex].unit_price = product.price || product.unit_price || 0;
        }
      }
      
      return { ...prev, items: updatedItems };
    });
    
    // Mark item field as touched
    const itemFieldName = `items.${itemIndex}.${fieldName}`;
    setTouchedFields(prev => new Set([...prev, itemFieldName]));
    
    // Debounced validation
    const updatedItem = { ...formData.items[itemIndex], [fieldName]: processedValue };
    await debouncedValidateItem(itemIndex, updatedItem);
    
    const duration = Date.now() - startTime;
    logPerformance(`item-change-${itemIndex}-${fieldName}`, duration);
  }, [formData.items, products, debouncedValidateItem, logPerformance]);
  
  // Smart validation that only validates changed fields
  const validateChanges = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      const result = await validateChangedFields(formData, previousFormDataRef.current);
      
      if (result.hasChanges) {
        // Update errors for changed fields
        setErrors(prev => ({ ...prev, ...result.fieldErrors }));
        
        // Update item errors
        result.itemErrors.forEach((itemError, index) => {
          if (itemError && Object.keys(itemError).length > 0) {
            setItemErrors(prev => {
              const newItemErrors = [...prev];
              newItemErrors[index] = itemError;
              return newItemErrors;
            });
          }
        });
      }
      
      // Update previous form data reference
      previousFormDataRef.current = { ...formData };
      
      const duration = Date.now() - startTime;
      logPerformance('validate-changes', duration);
      
      return result;
    } catch (error) {
      console.error('Validation error:', error);
      return { fieldErrors: {}, itemErrors: [], hasChanges: false };
    }
  }, [formData, logPerformance]);
  
  // Add item with optimization
  const addItem = useCallback(() => {
    const startTime = Date.now();
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: Date.now() + Math.random(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }]
    }));
    
    const duration = Date.now() - startTime;
    logPerformance('add-item', duration);
  }, [logPerformance]);
  
  // Remove item with optimization
  const removeItem = useCallback((index) => {
    const startTime = Date.now();
    
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
    
    // Clear validation errors for removed item
    setItemErrors(prev => prev.filter((_, i) => i !== index));
    
    const duration = Date.now() - startTime;
    logPerformance('remove-item', duration);
  }, [logPerformance]);
  
  // Reset form with cache clearing
  const resetForm = useCallback(() => {
    const startTime = Date.now();
    
    setFormData({
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_terms: 'Net 30',
      notes: '',
      terms_and_conditions: 'Payment is due within 30 days of invoice date.',
      currency: 'NGN',
      discount_amount: 0,
      items: [{ 
        id: Date.now(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }],
    });
    
    setErrors({});
    setItemErrors([]);
    setTouchedFields(new Set());
    
    // Clear validation cache
    clearValidationCache();
    
    const duration = Date.now() - startTime;
    logPerformance('reset-form', duration);
  }, [logPerformance]);
  
  // Refresh data with cache invalidation
  const refreshData = useCallback(async (resource) => {
    const startTime = Date.now();
    
    invalidateCache(resource || 'all');
    await loadApiData(true);
    
    const duration = Date.now() - startTime;
    logPerformance('refresh-data', duration);
  }, [loadApiData, logPerformance]);
  
  // Get field error (only if touched)
  const getFieldError = useCallback((fieldName) => {
    return touchedFields.has(fieldName) ? errors[fieldName] : null;
  }, [errors, touchedFields]);
  
  // Get item field error (only if touched)
  const getItemFieldError = useCallback((itemIndex, fieldName) => {
    const itemFieldName = `items.${itemIndex}.${fieldName}`;
    const itemError = itemErrors[itemIndex];
    return touchedFields.has(itemFieldName) ? itemError?.[fieldName] : null;
  }, [itemErrors, touchedFields]);
  
  // Performance statistics
  const getPerformanceStats = useCallback(() => {
    return {
      validationCount: validationCountRef.current,
      formFields: Object.keys(formData).length,
      itemCount: formData.items.length,
      touchedFieldCount: touchedFields.size,
      errorCount: Object.keys(errors).length + itemErrors.filter(Boolean).length,
      timestamp: Date.now()
    };
  }, [formData, touchedFields, errors, itemErrors]);
  
  return {
    // Form state
    formData,
    errors,
    itemErrors,
    touchedFields,
    isValidating,
    
    // API data
    customers,
    products,
    isLoadingData,
    
    // Calculated values
    itemTotals,
    invoiceTotal,
    
    // Actions
    handleFieldChange,
    handleItemChange,
    addItem,
    removeItem,
    resetForm,
    refreshData,
    validateChanges,
    
    // Getters
    getFieldError,
    getItemFieldError,
    getPerformanceStats,
    
    // Utilities
    loadApiData
  };
};