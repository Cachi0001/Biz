#!/usr/bin/env node

/**
 * Test script to manually create a product with "Electronics & Technology" category
 * This script will test the product creation API endpoint
 */

const API_BASE_URL = 'https://sabiops-backend.vercel.app/api';

// Sample product data with Electronics & Technology category and quantity > 0
const productData = {
  name: "Test Smartphone XY",
  sku: "PHONE-XY-001", 
  description: "Test smartphone for category validation",
  category: "Electronics & Technology",
  sub_category: "Smartphones",
  price: 250000,
  cost_price: 200000,
  quantity: 15,
  low_stock_threshold: 5,
  barcode: null
};

async function createTestProduct() {
  try {
    console.log('=== Testing Product Creation ===');
    console.log('Product Data:', JSON.stringify(productData, null, 2));
    
    // Note: This script assumes you have a valid auth token
    // In a real test, you'd need to either:
    // 1. Login first to get a token
    // 2. Use a test token
    // 3. Run this from within the app context
    
    const token = process.env.TEST_AUTH_TOKEN || 'YOUR_TEST_TOKEN_HERE';
    
    if (token === 'YOUR_TEST_TOKEN_HERE') {
      console.log('⚠️  No auth token provided. This script needs a valid token.');
      console.log('   Set TEST_AUTH_TOKEN environment variable or modify the script.');
      console.log('   For now, we\'ll show what the request would look like:');
      console.log('');
      console.log('POST', API_BASE_URL + '/products/');
      console.log('Headers:', {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE'
      });
      console.log('Body:', JSON.stringify(productData, null, 2));
      return;
    }
    
    const response = await fetch(API_BASE_URL + '/products/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 201) {
      console.log('✅ Product created successfully!');
      console.log('✅ Category:', result.data?.category || result.category);
      console.log('✅ Quantity:', result.data?.quantity || result.quantity);
    } else {
      console.log('❌ Product creation failed');
      console.log('Expected status: 201, Got:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error creating product:', error.message);
  }
}

// Run the test
createTestProduct();

export { createTestProduct, productData };
