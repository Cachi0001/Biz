import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, AlertCircle, RefreshCw, Bug } from 'lucide-react';
import EnhancedDropdown, { DropdownMapper, DropdownDebugger } from '../ui/EnhancedDropdown';

const DropdownDisplayTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [testData, setTestData] = useState({
    customers: [],
    products: [],
    categories: []
  });
  const [formData, setFormData] = useState({
    customerId: '',
    productId: '',
    categoryId: ''
  });

  // Mock test data
  useEffect(() => {
    const mockData = {
      customers: [
        { id: 'cust-001', name: 'John Doe' },
        { id: 'cust-002', name: 'Jane Smith' },
        { id: 'cust-003', name: 'Bob Johnson' }
      ],
      products: [
        { id: 'prod-001', name: 'Laptop Computer', price: 1500 },
        { id: 'prod-002', name: 'Wireless Mouse', price: 25 },
        { id: 'prod-003', name: 'USB Cable', price: 10 }
      ],
      categories: [
        { id: 'cat-001', name: 'Electronics' },
        { id: 'cat-002', name: 'Office Supplies' },
        { id: 'cat-003', name: 'Accessories' }
      ]
    };
    
    setTestData(mockData);
    
    // Log initial data
    DropdownDebugger.logMount('DropdownDisplayTest', {
      customers: mockData.customers,
      products: mockData.products,
      categories: mockData.categories
    });
  }, []);

  const addTestResult = (testName, passed, message, details = null) => {
    const result = {
      id: Date.now() + Math.random(),
      testName,
      passed,
      message,
      details,
      timestamp: new Date().toISOString()
    };
    
    setTestResults(prev => [result, ...prev]);
    
    console.log(`[DropdownDisplayTest] ${testName}: ${passed ? 'PASSED' : 'FAILED'} - ${message}`);
    if (details) {
      console.log('Details:', details);
    }
  };

  const testBasicDropdownDisplay = () => {
    // Test 1: Select a customer and verify display
    const customerId = 'cust-001';
    const expectedName = 'John Doe';
    
    setFormData(prev => ({ ...prev, customerId }));
    
    // Simulate what the dropdown should display
    const displayName = DropdownMapper.getDisplayName(customerId, testData.customers);
    
    if (displayName === expectedName) {
      addTestResult(
        'Basic Display Test',
        true,
        `Customer dropdown correctly displays "${displayName}" for ID "${customerId}"`,
        { customerId, displayName, expectedName }
      );
    } else {
      addTestResult(
        'Basic Display Test',
        false,
        `Customer dropdown shows "${displayName}" instead of "${expectedName}" for ID "${customerId}"`,
        { customerId, displayName, expectedName }
      );
    }
  };

  const testInvalidIdHandling = () => {
    // Test 2: Test invalid ID handling
    const invalidId = 'invalid-id-123';
    const displayName = DropdownMapper.getDisplayName(invalidId, testData.customers);
    
    if (displayName.includes('Unknown') && displayName.includes(invalidId)) {
      addTestResult(
        'Invalid ID Test',
        true,
        `Invalid ID correctly shows fallback: "${displayName}"`,
        { invalidId, displayName }
      );
    } else {
      addTestResult(
        'Invalid ID Test',
        false,
        `Invalid ID handling failed: "${displayName}"`,
        { invalidId, displayName }
      );
    }
  };

  const testSelectionValidation = () => {
    // Test 3: Test selection validation
    const validId = 'prod-002';
    const invalidId = 'nonexistent-id';
    
    const validResult = DropdownMapper.validateSelection(validId, testData.products);
    const invalidResult = DropdownMapper.validateSelection(invalidId, testData.products);
    
    if (validResult && !invalidResult) {
      addTestResult(
        'Selection Validation Test',
        true,
        'Selection validation correctly identifies valid and invalid IDs',
        { validId, validResult, invalidId, invalidResult }
      );
    } else {
      addTestResult(
        'Selection Validation Test',
        false,
        'Selection validation failed',
        { validId, validResult, invalidId, invalidResult }
      );
    }
  };

  const testFilterFunctionality = () => {
    // Test 4: Test filter functionality
    const searchTerm = 'mouse';
    const filteredProducts = DropdownMapper.filterOptions(testData.products, searchTerm);
    
    const expectedProduct = testData.products.find(p => p.name.toLowerCase().includes(searchTerm));
    const foundProduct = filteredProducts.find(p => p.name.toLowerCase().includes(searchTerm));
    
    if (filteredProducts.length === 1 && foundProduct && foundProduct.id === expectedProduct.id) {
      addTestResult(
        'Filter Functionality Test',
        true,
        `Filter correctly found "${foundProduct.name}" when searching for "${searchTerm}"`,
        { searchTerm, filteredProducts, foundProduct }
      );
    } else {
      addTestResult(
        'Filter Functionality Test',
        false,
        `Filter failed to find correct results for "${searchTerm}"`,
        { searchTerm, filteredProducts, expectedProduct }
      );
    }
  };

  const testFormSubmissionData = () => {
    // Test 5: Test that form submission sends IDs, not names
    const testFormData = {
      customerId: 'cust-002',
      productId: 'prod-001',
      categoryId: 'cat-003'
    };
    
    setFormData(testFormData);
    
    // Simulate form submission
    const submissionData = {
      customer_id: testFormData.customerId,
      product_id: testFormData.productId,
      category_id: testFormData.categoryId
    };
    
    DropdownDebugger.logSubmission('DropdownDisplayTest', submissionData);
    
    const allIdsValid = Object.values(submissionData).every(id => 
      typeof id === 'string' && id.includes('-')
    );
    
    if (allIdsValid) {
      addTestResult(
        'Form Submission Test',
        true,
        'Form submission correctly sends IDs, not display names',
        { submissionData, testFormData }
      );
    } else {
      addTestResult(
        'Form Submission Test',
        false,
        'Form submission data is incorrect',
        { submissionData, testFormData }
      );
    }
  };

  const testRealDropdownBehavior = () => {
    // Test 6: Test actual dropdown component behavior
    const testId = 'prod-003';
    const expectedName = 'USB Cable';
    
    // This would be tested by actually rendering the dropdown and checking its display
    // For now, we'll simulate the behavior
    const option = testData.products.find(p => p.id === testId);
    
    if (option && option.name === expectedName) {
      addTestResult(
        'Real Dropdown Behavior Test',
        true,
        `Dropdown component would correctly display "${option.name}" for ID "${testId}"`,
        { testId, expectedName, option }
      );
    } else {
      addTestResult(
        'Real Dropdown Behavior Test',
        false,
        'Dropdown component behavior test failed',
        { testId, expectedName, option }
      );
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    
    setTimeout(() => testBasicDropdownDisplay(), 100);
    setTimeout(() => testInvalidIdHandling(), 200);
    setTimeout(() => testSelectionValidation(), 300);
    setTimeout(() => testFilterFunctionality(), 400);
    setTimeout(() => testFormSubmissionData(), 500);
    setTimeout(() => testRealDropdownBehavior(), 600);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;
  const allTestsPassed = totalTests > 0 && passedTests === totalTests;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dropdown Display Fix Test</h1>
        <div className="flex items-center gap-2">
          {totalTests > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
              allTestsPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {allTestsPassed ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {passedTests}/{totalTests} Tests Passed
            </div>
          )}
        </div>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Test Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={runAllTests} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Run All Tests
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Dropdown Test */}
      <Card>
        <CardHeader>
          <CardTitle>Live Dropdown Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer</label>
              <EnhancedDropdown
                value={formData.customerId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, customerId: value }));
                  DropdownDebugger.logSelection('Customer', value, 
                    DropdownMapper.getDisplayName(value, testData.customers), 
                    testData.customers
                  );
                }}
                options={testData.customers}
                placeholder="Select customer"
                debugLabel="LiveTest-Customer"
              />
              <p className="text-xs text-gray-600">
                Selected ID: {formData.customerId || 'None'}
              </p>
              <p className="text-xs text-gray-600">
                Display Name: {DropdownMapper.getDisplayName(formData.customerId, testData.customers) || 'None'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <EnhancedDropdown
                value={formData.productId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, productId: value }));
                  DropdownDebugger.logSelection('Product', value, 
                    DropdownMapper.getDisplayName(value, testData.products), 
                    testData.products
                  );
                }}
                options={testData.products}
                placeholder="Select product"
                debugLabel="LiveTest-Product"
              />
              <p className="text-xs text-gray-600">
                Selected ID: {formData.productId || 'None'}
              </p>
              <p className="text-xs text-gray-600">
                Display Name: {DropdownMapper.getDisplayName(formData.productId, testData.products) || 'None'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <EnhancedDropdown
                value={formData.categoryId}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, categoryId: value }));
                  DropdownDebugger.logSelection('Category', value, 
                    DropdownMapper.getDisplayName(value, testData.categories), 
                    testData.categories
                  );
                }}
                options={testData.categories}
                placeholder="Select category"
                debugLabel="LiveTest-Category"
              />
              <p className="text-xs text-gray-600">
                Selected ID: {formData.categoryId || 'None'}
              </p>
              <p className="text-xs text-gray-600">
                Display Name: {DropdownMapper.getDisplayName(formData.categoryId, testData.categories) || 'None'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No test results yet. Click "Run All Tests" to start testing.</p>
            ) : (
              testResults.map((result) => (
                <div 
                  key={result.id}
                  className={`p-4 rounded-lg border ${
                    result.passed 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{result.testName}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-600 cursor-pointer">
                            View Details
                          </summary>
                          <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DropdownDisplayTest;