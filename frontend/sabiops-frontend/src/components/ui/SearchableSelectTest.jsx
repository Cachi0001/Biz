import React, { useState, useEffect } from 'react';
import SearchableSelect from './SearchableSelect';
import { getCustomers, getProducts } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './card';

const SearchableSelectTest = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch customers
        const customersResponse = await getCustomers();
        const customersData = customersResponse?.data?.customers || customersResponse?.customers || customersResponse || [];
        setCustomers(customersData);
        
        // Fetch products
        const productsResponse = await getProducts();
        const productsData = productsResponse?.data?.products || productsResponse?.products || productsResponse || [];
        setProducts(productsData);
        
      } catch (error) {
        console.error('Failed to fetch data for SearchableSelect test:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>SearchableSelect Test - Loading...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">Loading test data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>SearchableSelect Component Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Customer Selection Test</label>
          <SearchableSelect
            options={customers}
            value={selectedCustomer}
            onChange={setSelectedCustomer}
            placeholder="Search and select a customer..."
            type="customer"
          />
          {selectedCustomer && (
            <div className="text-sm text-green-600">
              Selected Customer ID: {selectedCustomer}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Available customers: {customers.length}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Product Selection Test</label>
          <SearchableSelect
            options={products}
            value={selectedProduct}
            onChange={setSelectedProduct}
            placeholder="Search and select a product..."
            type="product"
          />
          {selectedProduct && (
            <div className="text-sm text-green-600">
              Selected Product ID: {selectedProduct}
            </div>
          )}
          <div className="text-xs text-gray-500">
            Available products: {products.length}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Test Results</label>
          <div className="p-3 bg-gray-50 rounded text-sm">
            <div>Customer: {selectedCustomer || 'None selected'}</div>
            <div>Product: {selectedProduct || 'None selected'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchableSelectTest;