/**
 * Test utilities to verify performance optimizations are working correctly
 * This file can be used for manual testing and verification
 */

import { 
  calculateItemTotalMemoized, 
  calculateInvoiceTotalMemoized,
  clearAllCaches 
} from './performanceOptimizations';
import { 
  getCustomersOptimized, 
  getProductsOptimized,
  getPerformanceStats,
  invalidateCache 
} from '../services/optimizedApiService';
import { 
  validateFieldOptimized,
  getValidationStats,
  clearValidationCache 
} from '../services/optimizedValidationService';

/**
 * Test memoized calculations
 */
export const testMemoizedCalculations = () => {
  console.log('=== Testing Memoized Calculations ===');
  
  const testItem = {
    quantity: 2,
    unit_price: 100,
    tax_rate: 10,
    discount_rate: 5
  };
  
  // First calculation
  console.time('First calculation');
  const result1 = calculateItemTotalMemoized(testItem);
  console.timeEnd('First calculation');
  
  // Second calculation (should be cached)
  console.time('Cached calculation');
  const result2 = calculateItemTotalMemoized(testItem);
  console.timeEnd('Cached calculation');
  
  console.log('Results match:', result1 === result2);
  console.log('Result:', result1);
  
  // Test invoice total
  const testItems = [testItem, { ...testItem, quantity: 3 }];
  
  console.time('Invoice total calculation');
  const invoiceTotal = calculateInvoiceTotalMemoized(testItems, 10);
  console.timeEnd('Invoice total calculation');
  
  console.log('Invoice total:', invoiceTotal);
  
  // Clear caches
  clearAllCaches();
  console.log('Caches cleared');
};

/**
 * Test API caching and deduplication
 */
export const testApiOptimizations = async () => {
  console.log('=== Testing API Optimizations ===');
  
  // Clear cache first
  invalidateCache('all');
  
  // First API call
  console.time('First API call');
  try {
    const customers1 = await getCustomersOptimized();
    console.timeEnd('First API call');
    console.log('Customers loaded:', customers1.length);
  } catch (error) {
    console.timeEnd('First API call');
    console.log('First API call failed (expected in test):', error.message);
  }
  
  // Second API call (should be cached or deduplicated)
  console.time('Cached API call');
  try {
    const customers2 = await getCustomersOptimized();
    console.timeEnd('Cached API call');
    console.log('Customers loaded from cache:', customers2.length);
  } catch (error) {
    console.timeEnd('Cached API call');
    console.log('Cached API call failed (expected in test):', error.message);
  }
  
  // Test parallel calls (should be deduplicated)
  console.time('Parallel API calls');
  try {
    const [customers, products] = await Promise.all([
      getCustomersOptimized(),
      getProductsOptimized()
    ]);
    console.timeEnd('Parallel API calls');
    console.log('Parallel results:', customers.length, products.length);
  } catch (error) {
    console.timeEnd('Parallel API calls');
    console.log('Parallel API calls failed (expected in test):', error.message);
  }
  
  // Show performance stats
  const stats = getPerformanceStats();
  console.log('API Performance Stats:', stats);
};

/**
 * Test validation optimizations
 */
export const testValidationOptimizations = async () => {
  console.log('=== Testing Validation Optimizations ===');
  
  // Clear validation cache
  clearValidationCache();
  
  const testValue = 'test@example.com';
  const formData = { customer_id: '123' };
  
  // First validation
  console.time('First validation');
  const result1 = await validateFieldOptimized('customer_id', testValue, formData);
  console.timeEnd('First validation');
  console.log('Validation result 1:', result1);
  
  // Second validation (should be cached)
  console.time('Cached validation');
  const result2 = await validateFieldOptimized('customer_id', testValue, formData);
  console.timeEnd('Cached validation');
  console.log('Validation result 2:', result2);
  
  console.log('Results match:', result1 === result2);
  
  // Test different value (should not be cached)
  console.time('Different value validation');
  const result3 = await validateFieldOptimized('customer_id', 'different-value', formData);
  console.timeEnd('Different value validation');
  console.log('Validation result 3:', result3);
  
  // Show validation stats
  const stats = getValidationStats();
  console.log('Validation Performance Stats:', stats);
};

/**
 * Test debouncing behavior
 */
export const testDebouncing = () => {
  console.log('=== Testing Debouncing ===');
  
  let callCount = 0;
  const debouncedFunction = (callback, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        callCount++;
        callback(...args);
      }, delay);
    };
  };
  
  const testCallback = (value) => {
    console.log('Debounced function called with:', value, 'Call count:', callCount);
  };
  
  const debounced = debouncedFunction(testCallback, 100);
  
  // Rapid calls (should be debounced)
  console.log('Making rapid calls...');
  debounced('call1');
  debounced('call2');
  debounced('call3');
  debounced('call4');
  debounced('call5');
  
  // Wait for debounce to complete
  setTimeout(() => {
    console.log('Final call count after debouncing:', callCount);
    console.log('Expected: 1 (only last call should execute)');
  }, 200);
};

/**
 * Performance benchmark test
 */
export const runPerformanceBenchmark = async () => {
  console.log('=== Running Performance Benchmark ===');
  
  // Test calculation performance
  const testItems = Array.from({ length: 100 }, (_, i) => ({
    quantity: i + 1,
    unit_price: Math.random() * 1000,
    tax_rate: Math.random() * 20,
    discount_rate: Math.random() * 10
  }));
  
  // Without memoization (simulate)
  console.time('Calculations without memoization');
  let total1 = 0;
  for (let i = 0; i < 1000; i++) {
    testItems.forEach(item => {
      const quantity = Math.max(0, parseFloat(item.quantity) || 0);
      const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
      const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
      const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));
      
      let itemTotal = quantity * unitPrice;
      itemTotal -= itemTotal * (discountRate / 100);
      itemTotal += itemTotal * (taxRate / 100);
      total1 += Math.round(itemTotal * 100) / 100;
    });
  }
  console.timeEnd('Calculations without memoization');
  
  // With memoization
  console.time('Calculations with memoization');
  let total2 = 0;
  for (let i = 0; i < 1000; i++) {
    testItems.forEach(item => {
      total2 += calculateItemTotalMemoized(item);
    });
  }
  console.timeEnd('Calculations with memoization');
  
  console.log('Results match:', Math.abs(total1 - total2) < 0.01);
  console.log('Memoization should be significantly faster on repeated calculations');
  
  // Clear caches for clean state
  clearAllCaches();
};

/**
 * Run all tests
 */
export const runAllPerformanceTests = async () => {
  console.log('🚀 Starting Performance Optimization Tests');
  console.log('==========================================');
  
  try {
    testMemoizedCalculations();
    
    setTimeout(() => {
      testDebouncing();
    }, 100);
    
    setTimeout(async () => {
      await testValidationOptimizations();
      await testApiOptimizations();
      await runPerformanceBenchmark();
      
      console.log('==========================================');
      console.log('✅ All Performance Tests Completed');
    }, 500);
    
  } catch (error) {
    console.error('❌ Performance tests failed:', error);
  }
};

/**
 * Simple integration test
 */
export const testIntegration = () => {
  console.log('=== Integration Test ===');
  
  // Test that all modules can be imported and basic functions work
  try {
    // Test calculations
    const testItem = { quantity: 1, unit_price: 100, tax_rate: 0, discount_rate: 0 };
    const result = calculateItemTotalMemoized(testItem);
    console.log('✅ Calculation test passed:', result === 100);
    
    // Test validation (will fail gracefully without API)
    validateFieldOptimized('customer_id', 'test').catch(() => {
      console.log('✅ Validation test completed (expected to fail without API)');
    });
    
    console.log('✅ Integration test completed successfully');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
};

// Export test runner for easy access
export default {
  testMemoizedCalculations,
  testApiOptimizations,
  testValidationOptimizations,
  testDebouncing,
  runPerformanceBenchmark,
  runAllPerformanceTests,
  testIntegration
};