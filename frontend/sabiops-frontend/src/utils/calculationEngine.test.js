/**
 * Test file for enhanced calculation engine with edge case handling
 * Tests the calculateItemTotal and calculateInvoiceTotal functions
 */

// Mock the calculation functions from Invoices.jsx
const calculateItemTotal = (item) => {
  // Prevent negative values using Math.max()
  const quantity = Math.max(0, parseFloat(item.quantity) || 0);
  const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
  const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
  
  // Limit discount rates to 0-100% range
  const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

  let total = quantity * unitPrice;
  total -= total * (discountRate / 100);
  total += total * (taxRate / 100);
  
  // Add proper rounding to 2 decimal places using Math.round()
  return Math.round(total * 100) / 100;
};

const calculateInvoiceTotal = (items, discountAmount = 0) => {
  const itemsTotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  // Prevent negative discount amounts
  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const total = itemsTotal - discount;
  
  // Add proper rounding to 2 decimal places using Math.round()
  return Math.round(Math.max(0, total) * 100) / 100;
};

// Test suite - Simple test runner without Jest dependencies

// Run the tests if this file is executed directly
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calculateItemTotal,
    calculateInvoiceTotal
  };
}

console.log('Running Enhanced Calculation Engine Tests...');

// Simple test runner for browser environment
const runTests = () => {
  let passed = 0;
  let failed = 0;
  
  const test = (name, fn) => {
    try {
      fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}: ${error.message}`);
      failed++;
    }
  };
  
  const expect = (actual) => ({
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, but got ${actual}`);
      }
    }
  });
  
  // Run key tests
  test('Basic calculation', () => {
    const item = { quantity: 2, unit_price: 100, tax_rate: 10, discount_rate: 5 };
    expect(calculateItemTotal(item)).toBe(209);
  });
  
  test('Negative quantity prevention', () => {
    const item = { quantity: -5, unit_price: 100, tax_rate: 0, discount_rate: 0 };
    expect(calculateItemTotal(item)).toBe(0);
  });
  
  test('Negative price prevention', () => {
    const item = { quantity: 2, unit_price: -50, tax_rate: 0, discount_rate: 0 };
    expect(calculateItemTotal(item)).toBe(0);
  });
  
  test('Discount rate clamping (negative)', () => {
    const item = { quantity: 2, unit_price: 100, tax_rate: 0, discount_rate: -10 };
    expect(calculateItemTotal(item)).toBe(200);
  });
  
  test('Discount rate clamping (over 100%)', () => {
    const item = { quantity: 2, unit_price: 100, tax_rate: 0, discount_rate: 150 };
    expect(calculateItemTotal(item)).toBe(0);
  });
  
  test('Invoice total with discount', () => {
    const items = [{ quantity: 2, unit_price: 100, tax_rate: 0, discount_rate: 0 }];
    expect(calculateInvoiceTotal(items, 50)).toBe(150);
  });
  
  test('Negative invoice total prevention', () => {
    const items = [{ quantity: 1, unit_price: 100, tax_rate: 0, discount_rate: 0 }];
    expect(calculateInvoiceTotal(items, 150)).toBe(0);
  });
  
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! The enhanced calculation engine is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
  }
};

// Run the tests
runTests();