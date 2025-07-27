/**
 * Sales Validator - Validates sales data before sending to API
 * Ensures proper formatting and required fields
 */

/**
 * Validate sales data before sending to API
 * @param {Object} saleData - The sale data to validate
 * @returns {Object} - Object with isValid, errors, and formattedData properties
 */
export const validateSaleData = (saleData) => {
  const errors = {};
  
  // Required field validation
  if (!saleData.product_id) {
    errors.product_id = 'Please select a product';
  }
  
  if (!saleData.quantity || parseInt(saleData.quantity) <= 0) {
    errors.quantity = 'Quantity must be greater than 0';
  }
  
  if (saleData.unit_price === undefined || saleData.unit_price === null || parseFloat(saleData.unit_price) < 0) {
    errors.unit_price = 'Unit price must be non-negative';
  }
  
  if (saleData.total_amount === undefined || saleData.total_amount === null || parseFloat(saleData.total_amount) < 0) {
    errors.total_amount = 'Total amount must be non-negative';
  }
  
  // Business logic validation
  const quantity = parseInt(saleData.quantity) || 0;
  const unitPrice = parseFloat(saleData.unit_price) || 0;
  const expectedTotal = quantity * unitPrice;
  const actualTotal = parseFloat(saleData.total_amount) || 0;
  
  if (Math.abs(expectedTotal - actualTotal) > 0.01) {
    errors.total_amount = 'Total amount does not match quantity × unit price';
  }
  
  // Payment method validation
  if (saleData.payment_method && !['cash', 'card', 'bank_transfer', 'mobile_money', 'pos', 'cheque', 'online_payment', 'pending'].includes(saleData.payment_method)) {
    errors.payment_method = 'Invalid payment method';
  }
  
  // Format data for API with items array
  const formattedData = {
    customer_id: saleData.customer_id || null,
    customer_name: saleData.customer_name || 'Walk-in Customer',
    payment_method: saleData.payment_method || 'cash',
    payment_status: saleData.payment_status || 'completed',
    currency: 'NGN',
    date: saleData.date || new Date().toISOString().split('T')[0],
    salesperson_id: saleData.salesperson_id || null,
    notes: saleData.notes || '',
    discount_amount: parseFloat(saleData.discount_amount) || 0,
    total_amount: parseFloat(saleData.total_amount) || 0,
    net_amount: parseFloat(saleData.net_amount) || 0,
    total_cogs: parseFloat(saleData.total_cogs) || 0,
    profit_from_sales: parseFloat(saleData.profit_from_sales) || 0,
    sale_items: [{
      product_id: saleData.product_id,
      product_name: saleData.product_name || 'Unknown Product',
      quantity: parseInt(saleData.quantity) || 1,
      unit_price: parseFloat(saleData.unit_price) || 0,
      total_price: parseFloat(saleData.total_amount) || 0,
      cost_price: parseFloat(saleData.cost_price) || 0
    }]
  };
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    formattedData
  };
};

export default {
  validateSaleData
};