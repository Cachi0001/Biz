/**
 * Optimized validation service with enhanced debouncing and performance improvements
 * Implements requirement 11.4 for debounced validation requests
 */

import { 
  validateField as validateFieldOriginal,
  validateInvoiceItem as validateInvoiceItemOriginal,
  validateInvoiceForm as validateInvoiceFormOriginal,
  ERROR_MESSAGES,
  VALIDATION_RULES,
  ITEM_VALIDATION_RULES
} from './validationService';

/**
 * Enhanced debouncing with immediate validation for critical fields
 */
class OptimizedDebouncer {
  constructor() {
    this.timeouts = new Map();
    this.immediateFields = new Set(['customer_id', 'issue_date']); // Critical fields validate immediately
  }
  
  /**
   * Debounce validation with field-specific delays
   */
  debounce(key, fn, delay = 300) {
    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    
    // Check if field should validate immediately
    const fieldName = key.split('.')[0];
    if (this.immediateFields.has(fieldName)) {
      return Promise.resolve(fn());
    }
    
    // Return promise that resolves after debounce delay
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.timeouts.delete(key);
        resolve(fn());
      }, delay);
      
      this.timeouts.set(key, timeoutId);
    });
  }
  
  /**
   * Cancel all pending validations
   */
  cancelAll() {
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId);
    }
    this.timeouts.clear();
  }
  
  /**
   * Cancel specific validation
   */
  cancel(key) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }
}

// Global debouncer instance
const debouncer = new OptimizedDebouncer();

/**
 * Validation result cache to prevent redundant validations
 */
class ValidationCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100; // Prevent memory leaks
  }
  
  /**
   * Generate cache key from field and value
   */
  generateKey(field, value, context = {}) {
    const contextKey = Object.keys(context).sort().map(k => `${k}:${context[k]}`).join('|');
    return `${field}:${JSON.stringify(value)}:${contextKey}`;
  }
  
  /**
   * Get cached validation result
   */
  get(field, value, context = {}) {
    const key = this.generateKey(field, value, context);
    return this.cache.get(key);
  }
  
  /**
   * Set validation result in cache
   */
  set(field, value, result, context = {}) {
    const key = this.generateKey(field, value, context);
    
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
  }
  
  /**
   * Clear cache for specific field or all
   */
  clear(field) {
    if (field) {
      // Clear all entries for specific field
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${field}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// Global validation cache
const validationCache = new ValidationCache();

/**
 * Optimized field validation with caching and debouncing
 */
export const validateFieldOptimized = async (fieldName, value, formData = {}, delay = 300) => {
  const startTime = Date.now();
  
  // Check cache first
  const cached = validationCache.get(fieldName, value, formData);
  if (cached !== undefined) {
    console.log(`[PERF] Validation cache hit for ${fieldName}`);
    return cached;
  }
  
  // Debounce validation
  const result = await debouncer.debounce(
    fieldName,
    () => {
      const validationResult = validateFieldOriginal(fieldName, value, VALIDATION_RULES);
      const duration = Date.now() - startTime;
      console.log(`[PERF] Field validation ${fieldName} completed in ${duration}ms`);
      return validationResult;
    },
    delay
  );
  
  // Cache the result
  validationCache.set(fieldName, value, result, formData);
  
  return result;
};

/**
 * Optimized item validation with caching and debouncing
 */
export const validateInvoiceItemOptimized = async (item, index, delay = 300) => {
  const startTime = Date.now();
  const itemKey = `item_${index}`;
  
  // Check cache first
  const cached = validationCache.get(itemKey, item);
  if (cached !== undefined) {
    console.log(`[PERF] Item validation cache hit for item ${index}`);
    return cached;
  }
  
  // Debounce validation
  const result = await debouncer.debounce(
    itemKey,
    () => {
      const validationResult = validateInvoiceItemOriginal(item, index);
      const duration = Date.now() - startTime;
      console.log(`[PERF] Item validation ${index} completed in ${duration}ms`);
      return validationResult;
    },
    delay
  );
  
  // Cache the result
  validationCache.set(itemKey, item, result);
  
  return result;
};

/**
 * Batch validation for multiple fields with optimized performance
 */
export const validateFieldsBatch = async (fields, formData, delay = 300) => {
  const startTime = Date.now();
  
  // Group validations by priority
  const immediateFields = [];
  const deferredFields = [];
  
  fields.forEach(({ fieldName, value }) => {
    if (debouncer.immediateFields.has(fieldName)) {
      immediateFields.push({ fieldName, value });
    } else {
      deferredFields.push({ fieldName, value });
    }
  });
  
  // Validate immediate fields first
  const immediateResults = await Promise.all(
    immediateFields.map(({ fieldName, value }) => 
      validateFieldOptimized(fieldName, value, formData, 0)
    )
  );
  
  // Validate deferred fields with debouncing
  const deferredResults = await Promise.all(
    deferredFields.map(({ fieldName, value }) => 
      validateFieldOptimized(fieldName, value, formData, delay)
    )
  );
  
  const duration = Date.now() - startTime;
  console.log(`[PERF] Batch validation completed in ${duration}ms`);
  
  // Combine results
  const results = {};
  immediateFields.forEach(({ fieldName }, index) => {
    results[fieldName] = immediateResults[index];
  });
  deferredFields.forEach(({ fieldName }, index) => {
    results[fieldName] = deferredResults[index];
  });
  
  return results;
};

/**
 * Optimized form validation with intelligent caching
 */
export const validateInvoiceFormOptimized = (formData) => {
  const startTime = Date.now();
  
  // Use original validation but with performance monitoring
  const result = validateInvoiceFormOriginal(formData);
  
  const duration = Date.now() - startTime;
  console.log(`[PERF] Full form validation completed in ${duration}ms`);
  
  return result;
};

/**
 * Smart validation that only validates changed fields
 */
export const validateChangedFields = async (currentData, previousData, delay = 300) => {
  const changedFields = [];
  
  // Find changed form fields
  Object.keys(VALIDATION_RULES).forEach(fieldName => {
    if (currentData[fieldName] !== previousData[fieldName]) {
      changedFields.push({
        fieldName,
        value: currentData[fieldName]
      });
    }
  });
  
  // Find changed items
  const changedItems = [];
  if (currentData.items && previousData.items) {
    currentData.items.forEach((item, index) => {
      const prevItem = previousData.items[index];
      if (!prevItem || JSON.stringify(item) !== JSON.stringify(prevItem)) {
        changedItems.push({ item, index });
      }
    });
  }
  
  // Validate only changed fields
  const fieldResults = changedFields.length > 0 
    ? await validateFieldsBatch(changedFields, currentData, delay)
    : {};
  
  // Validate only changed items
  const itemResults = await Promise.all(
    changedItems.map(({ item, index }) => 
      validateInvoiceItemOptimized(item, index, delay)
    )
  );
  
  return {
    fieldErrors: fieldResults,
    itemErrors: itemResults,
    hasChanges: changedFields.length > 0 || changedItems.length > 0
  };
};

/**
 * Validation scheduler for background validation
 */
export const scheduleValidation = (validationFn, priority = 'normal') => {
  const priorities = {
    immediate: 0,
    high: 50,
    normal: 100,
    low: 200
  };
  
  const delay = priorities[priority] || priorities.normal;
  
  if ('scheduler' in window && window.scheduler.postTask) {
    // Use modern scheduler API if available
    return window.scheduler.postTask(validationFn, { priority });
  } else if ('requestIdleCallback' in window) {
    // Fallback to requestIdleCallback
    return new Promise((resolve) => {
      window.requestIdleCallback(() => {
        resolve(validationFn());
      });
    });
  } else {
    // Fallback to setTimeout
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(validationFn());
      }, delay);
    });
  }
};

/**
 * Validation performance monitor
 */
export const getValidationStats = () => {
  return {
    cacheSize: validationCache.cache.size,
    pendingValidations: debouncer.timeouts.size,
    timestamp: Date.now()
  };
};

/**
 * Clear validation caches and cancel pending validations
 */
export const clearValidationCache = (field) => {
  validationCache.clear(field);
  if (field) {
    debouncer.cancel(field);
  } else {
    debouncer.cancelAll();
  }
};

/**
 * Precompute validation rules for better performance
 */
const precomputedRules = new Map();

export const precomputeValidationRules = () => {
  // Precompute common validation patterns
  Object.entries(VALIDATION_RULES).forEach(([field, rule]) => {
    precomputedRules.set(field, {
      ...rule,
      isRequired: rule.required,
      hasMinLength: rule.minLength !== undefined,
      hasMaxLength: rule.maxLength !== undefined,
      hasMinValue: rule.min !== undefined,
      hasMaxValue: rule.max !== undefined
    });
  });
  
  Object.entries(ITEM_VALIDATION_RULES).forEach(([field, rule]) => {
    precomputedRules.set(`item_${field}`, {
      ...rule,
      isRequired: rule.required,
      hasMinLength: rule.minLength !== undefined,
      hasMaxLength: rule.maxLength !== undefined,
      hasMinValue: rule.min !== undefined,
      hasMaxValue: rule.max !== undefined
    });
  });
  
  console.log('[PERF] Validation rules precomputed');
};

// Initialize precomputed rules
precomputeValidationRules();

/**
 * Export optimized validation functions
 */
export {
  debouncer,
  validationCache,
  ERROR_MESSAGES,
  VALIDATION_RULES,
  ITEM_VALIDATION_RULES
};