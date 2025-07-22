/**
 * Expense Validator - Validates expense data before sending to API
 * Ensures proper formatting and required fields
 */

/**
 * Validate expense data before sending to API
 * @param {Object} expenseData - The expense data to validate
 * @returns {Object} - Object with isValid and errors properties
 */
export const validateExpenseData = (expenseData) => {
  const errors = {};
  
  // Required field validation
  if (!expenseData.category) {
    errors.category = 'Category is required';
  }
  
  if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
    errors.amount = 'Valid amount is required';
  }
  
  if (!expenseData.date) {
    errors.date = 'Date is required';
  }
  
  // Format data for API
  const formattedData = {
    category: expenseData.category || '',
    subcategory: expenseData.subcategory || '',
    amount: parseFloat(expenseData.amount) || 0,
    date: expenseData.date || new Date().toISOString().split('T')[0],
    vendor: expenseData.vendor || '',
    payment_method: expenseData.payment_method || 'cash',
    reference: expenseData.reference || '',
    notes: expenseData.notes || '',
    receipt_url: expenseData.receipt_url || '',
    tax_deductible: expenseData.tax_deductible || false,
    description: expenseData.description || expenseData.category || 'Expense'
  };
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    formattedData
  };
};

export default {
  validateExpenseData
};