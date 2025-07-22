/**
 * Product Validator - Validates product data before sending to API
 * Ensures proper formatting and required fields
 */

/**
 * Validate product data before sending to API
 * @param {Object} productData - The product data to validate
 * @returns {Object} - Object with isValid and errors properties
 */
export const validateProductData = (productData) => {
  const errors = {};
  
  // Required field validation
  if (!productData.name?.trim()) {
    errors.name = 'Product name is required';
  }
  
  if (!productData.category?.trim()) {
    errors.category = 'Category is required';
  }
  
  if (productData.price === undefined || productData.price === null || parseFloat(productData.price) <= 0) {
    errors.price = 'Valid price is required (must be greater than 0)';
  }
  
  if (productData.quantity !== undefined && productData.quantity !== null && parseInt(productData.quantity) < 0) {
    errors.quantity = 'Quantity cannot be negative';
  }
  
  if (productData.low_stock_threshold !== undefined && productData.low_stock_threshold !== null && parseInt(productData.low_stock_threshold) < 0) {
    errors.low_stock_threshold = 'Low stock threshold cannot be negative';
  }
  
  if (productData.cost_price !== undefined && productData.cost_price !== null && parseFloat(productData.cost_price) < 0) {
    errors.cost_price = 'Cost price cannot be negative';
  }
  
  // Format data for API
  const formattedData = {
    name: productData.name?.trim() || '',
    sku: productData.sku?.trim() || '',
    description: productData.description?.trim() || '',
    category: productData.category?.trim() || '',
    sub_category: productData.subcategory?.trim() || productData.sub_category?.trim() || '',
    price: parseFloat(productData.price) || 0,
    cost_price: parseFloat(productData.cost_price) || 0,
    quantity: parseInt(productData.quantity) || 0,
    low_stock_threshold: parseInt(productData.low_stock_threshold) || 5,
    barcode: productData.barcode?.trim() || null
  };
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    formattedData
  };
};

export default {
  validateProductData
};