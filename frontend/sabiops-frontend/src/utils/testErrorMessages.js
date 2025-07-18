/**
 * Test utilities for validating error messaging system
 * This file contains test scenarios to verify error message clarity and actionability
 */

import { 
  validateInvoiceForm, 
  validateField, 
  validateInvoiceItem,
  getApiErrorMessage,
  ERROR_MESSAGES 
} from '../services/validationService';

/**
 * Test data for validation scenarios
 */
export const TEST_SCENARIOS = {
  // Valid form data
  validForm: {
    customer_id: '1',
    issue_date: '2025-01-15',
    due_date: '2025-02-15',
    payment_terms: 'Net 30',
    currency: 'NGN',
    discount_amount: 0,
    notes: 'Test invoice',
    terms_and_conditions: 'Standard terms',
    items: [
      {
        description: 'Test product',
        quantity: 2,
        unit_price: 100,
        tax_rate: 7.5,
        discount_rate: 0
      }
    ]
  },

  // Invalid form data scenarios
  invalidForms: {
    missingCustomer: {
      customer_id: '',
      issue_date: '2025-01-15',
      items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
    },
    
    missingIssueDate: {
      customer_id: '1',
      issue_date: '',
      items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
    },
    
    futureDateIssue: {
      customer_id: '1',
      issue_date: '2026-01-15', // Future date
      items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
    },
    
    dueDateBeforeIssue: {
      customer_id: '1',
      issue_date: '2025-02-15',
      due_date: '2025-01-15', // Due before issue
      items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
    },
    
    noItems: {
      customer_id: '1',
      issue_date: '2025-01-15',
      items: []
    },
    
    invalidDiscount: {
      customer_id: '1',
      issue_date: '2025-01-15',
      discount_amount: 1000, // Exceeds total
      items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
    },
    
    longNotes: {
      customer_id: '1',
      issue_date: '2025-01-15',
      notes: 'x'.repeat(1001), // Exceeds limit
      items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
    }
  },

  // Invalid item scenarios
  invalidItems: {
    missingDescription: {
      description: '',
      quantity: 1,
      unit_price: 100
    },
    
    shortDescription: {
      description: 'ab', // Too short
      quantity: 1,
      unit_price: 100
    },
    
    longDescription: {
      description: 'x'.repeat(201), // Too long
      quantity: 1,
      unit_price: 100
    },
    
    zeroQuantity: {
      description: 'Test product',
      quantity: 0,
      unit_price: 100
    },
    
    negativeQuantity: {
      description: 'Test product',
      quantity: -1,
      unit_price: 100
    },
    
    excessiveQuantity: {
      description: 'Test product',
      quantity: 10001, // Exceeds limit
      unit_price: 100
    },
    
    negativePrice: {
      description: 'Test product',
      quantity: 1,
      unit_price: -10
    },
    
    excessivePrice: {
      description: 'Test product',
      quantity: 1,
      unit_price: 10000001 // Exceeds limit
    },
    
    invalidTaxRate: {
      description: 'Test product',
      quantity: 1,
      unit_price: 100,
      tax_rate: 150 // Exceeds 100%
    },
    
    invalidDiscountRate: {
      description: 'Test product',
      quantity: 1,
      unit_price: 100,
      discount_rate: 150 // Exceeds 100%
    }
  },

  // API error scenarios
  apiErrors: {
    networkError: {
      code: 'ERR_NETWORK',
      message: 'Network Error'
    },
    
    timeoutError: {
      code: 'ECONNABORTED',
      message: 'timeout of 5000ms exceeded'
    },
    
    validationError: {
      response: {
        status: 400,
        data: {
          message: 'Validation failed',
          errors: ['Customer is required', 'Invalid date format']
        }
      }
    },
    
    unauthorizedError: {
      response: {
        status: 401,
        data: {
          message: 'Authentication required'
        }
      }
    },
    
    forbiddenError: {
      response: {
        status: 403,
        data: {
          message: 'Access denied'
        }
      }
    },
    
    notFoundError: {
      response: {
        status: 404,
        data: {
          message: 'Invoice not found'
        }
      }
    },
    
    conflictError: {
      response: {
        status: 409,
        data: {
          message: 'Invoice has been modified'
        }
      }
    },
    
    serverError: {
      response: {
        status: 500,
        data: {
          message: 'Internal server error'
        }
      }
    }
  }
};

/**
 * Test validation error messages
 */
export const testValidationErrors = () => {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  console.group('🧪 Testing Validation Error Messages');

  // Test form validation
  Object.entries(TEST_SCENARIOS.invalidForms).forEach(([scenario, formData]) => {
    try {
      const validation = validateInvoiceForm(formData);
      
      if (validation.hasErrors) {
        console.log(`✅ ${scenario}: Correctly identified errors`);
        console.log('   Errors:', Object.values(validation.formErrors));
        results.passed++;
      } else {
        console.error(`❌ ${scenario}: Should have validation errors`);
        results.failed++;
        results.errors.push(`${scenario}: No validation errors detected`);
      }
    } catch (error) {
      console.error(`❌ ${scenario}: Validation threw error:`, error);
      results.failed++;
      results.errors.push(`${scenario}: ${error.message}`);
    }
  });

  // Test item validation
  Object.entries(TEST_SCENARIOS.invalidItems).forEach(([scenario, itemData]) => {
    try {
      const errors = validateInvoiceItem(itemData, 0);
      
      if (Object.keys(errors).length > 0) {
        console.log(`✅ ${scenario}: Correctly identified item errors`);
        console.log('   Errors:', Object.values(errors));
        results.passed++;
      } else {
        console.error(`❌ ${scenario}: Should have item validation errors`);
        results.failed++;
        results.errors.push(`${scenario}: No item validation errors detected`);
      }
    } catch (error) {
      console.error(`❌ ${scenario}: Item validation threw error:`, error);
      results.failed++;
      results.errors.push(`${scenario}: ${error.message}`);
    }
  });

  console.groupEnd();
  return results;
};

/**
 * Test API error messages
 */
export const testApiErrorMessages = () => {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  console.group('🧪 Testing API Error Messages');

  Object.entries(TEST_SCENARIOS.apiErrors).forEach(([scenario, errorData]) => {
    try {
      const message = getApiErrorMessage(errorData);
      
      if (message && message !== 'An unexpected error occurred') {
        console.log(`✅ ${scenario}: Got specific error message`);
        console.log(`   Message: "${message}"`);
        results.passed++;
      } else {
        console.error(`❌ ${scenario}: Got generic error message`);
        results.failed++;
        results.errors.push(`${scenario}: Generic error message returned`);
      }
    } catch (error) {
      console.error(`❌ ${scenario}: Error message generation failed:`, error);
      results.failed++;
      results.errors.push(`${scenario}: ${error.message}`);
    }
  });

  console.groupEnd();
  return results;
};

/**
 * Test error message clarity and actionability
 */
export const testErrorMessageClarity = () => {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  console.group('🧪 Testing Error Message Clarity');

  // Test that error messages are specific and actionable
  const errorMessages = Object.values(ERROR_MESSAGES);
  
  errorMessages.forEach((message, index) => {
    try {
      // Check if message is specific (not generic)
      const isSpecific = !message.toLowerCase().includes('error occurred') || 
                        message.includes('Please') || 
                        message.includes('must') ||
                        message.includes('cannot') ||
                        message.includes('required');
      
      // Check if message is actionable (tells user what to do)
      const isActionable = message.toLowerCase().includes('please') ||
                          message.toLowerCase().includes('try') ||
                          message.toLowerCase().includes('check') ||
                          message.toLowerCase().includes('select') ||
                          message.toLowerCase().includes('enter') ||
                          message.toLowerCase().includes('must');
      
      if (isSpecific && isActionable) {
        console.log(`✅ Message ${index + 1}: Specific and actionable`);
        results.passed++;
      } else {
        console.warn(`⚠️ Message ${index + 1}: Could be more specific/actionable`);
        console.log(`   Message: "${message}"`);
        console.log(`   Specific: ${isSpecific}, Actionable: ${isActionable}`);
        results.failed++;
        results.errors.push(`Message ${index + 1}: Clarity issues`);
      }
    } catch (error) {
      console.error(`❌ Message ${index + 1}: Analysis failed:`, error);
      results.failed++;
      results.errors.push(`Message ${index + 1}: ${error.message}`);
    }
  });

  console.groupEnd();
  return results;
};

/**
 * Run all error message tests
 */
export const runAllErrorTests = () => {
  console.group('🚀 Running All Error Message Tests');
  
  const validationResults = testValidationErrors();
  const apiResults = testApiErrorMessages();
  const clarityResults = testErrorMessageClarity();
  
  const totalResults = {
    passed: validationResults.passed + apiResults.passed + clarityResults.passed,
    failed: validationResults.failed + apiResults.failed + clarityResults.failed,
    errors: [
      ...validationResults.errors,
      ...apiResults.errors,
      ...clarityResults.errors
    ]
  };
  
  console.log('\n📊 Test Summary:');
  console.log(`✅ Passed: ${totalResults.passed}`);
  console.log(`❌ Failed: ${totalResults.failed}`);
  console.log(`📈 Success Rate: ${((totalResults.passed / (totalResults.passed + totalResults.failed)) * 100).toFixed(1)}%`);
  
  if (totalResults.errors.length > 0) {
    console.log('\n🔍 Issues Found:');
    totalResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  console.groupEnd();
  return totalResults;
};

/**
 * Test error message display in different scenarios
 */
export const testErrorMessageDisplay = () => {
  console.group('🧪 Testing Error Message Display Scenarios');
  
  // Test scenarios that users commonly encounter
  const commonScenarios = [
    {
      name: 'Empty form submission',
      data: { customer_id: '', issue_date: '', items: [] },
      expectedErrors: ['customer', 'issue_date', 'items']
    },
    {
      name: 'Invalid item data',
      data: {
        customer_id: '1',
        issue_date: '2025-01-15',
        items: [{ description: '', quantity: 0, unit_price: -10 }]
      },
      expectedErrors: ['description', 'quantity', 'unit_price']
    },
    {
      name: 'Date validation',
      data: {
        customer_id: '1',
        issue_date: '2026-01-15', // Future
        due_date: '2025-01-15', // Before issue
        items: [{ description: 'Test', quantity: 1, unit_price: 100 }]
      },
      expectedErrors: ['issue_date', 'due_date']
    }
  ];
  
  commonScenarios.forEach(scenario => {
    console.log(`\n📝 Testing: ${scenario.name}`);
    const validation = validateInvoiceForm(scenario.data);
    
    if (validation.hasErrors) {
      console.log('✅ Errors detected correctly');
      console.log('Form errors:', validation.formErrors);
      console.log('Item errors:', validation.itemErrors);
    } else {
      console.log('❌ No errors detected (unexpected)');
    }
  });
  
  console.groupEnd();
};

// Export test runner for use in development
if (import.meta.env.DEV) {
  window.testErrorMessages = {
    runAll: runAllErrorTests,
    testValidation: testValidationErrors,
    testApi: testApiErrorMessages,
    testClarity: testErrorMessageClarity,
    testDisplay: testErrorMessageDisplay
  };
}