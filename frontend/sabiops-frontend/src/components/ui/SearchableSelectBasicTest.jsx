import React, { useState } from 'react';
import SearchableSelect from './SearchableSelect';

const SearchableSelectBasicTest = () => {
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');

  // Mock data for testing
  const mockCustomers = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    { id: '4', name: 'Alice Brown', email: 'alice@example.com' },
    { id: '5', name: 'Charlie Wilson', email: 'charlie@example.com' },
  ];

  const mockProducts = [
    { id: '1', name: 'Laptop Computer', price: 150000 },
    { id: '2', name: 'Wireless Mouse', price: 5000 },
    { id: '3', name: 'Keyboard', price: 8000 },
    { id: '4', name: 'Monitor', price: 45000 },
    { id: '5', name: 'Webcam', price: 12000 },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-bold">SearchableSelect Basic Test</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Selection</label>
          <SearchableSelect
            options={mockCustomers}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Search and select a customer..."
            isClearable={true}
          />
          {selectedCustomer && (
            <div className="text-sm text-green-600">
              Selected Customer ID: {selectedCustomer}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Product Selection</label>
          <SearchableSelect
            options={mockProducts}
            value={selectedProduct}
            onChange={setSelectedProduct}
            placeholder="Search and select a product..."
            isClearable={true}
          />
          {selectedProduct && (
            <div className="text-sm text-green-600">
              Selected Product ID: {selectedProduct}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Test Results:</h3>
          <div className="text-sm space-y-1">
            <div>Customer: {selectedCustomer || 'None selected'}</div>
            <div>Product: {selectedProduct || 'None selected'}</div>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          <p>Test features:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Type to search options</li>
            <li>Click to open dropdown</li>
            <li>Use arrow keys to navigate</li>
            <li>Press Enter to select</li>
            <li>Press Escape to close</li>
            <li>Click X to clear selection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SearchableSelectBasicTest;