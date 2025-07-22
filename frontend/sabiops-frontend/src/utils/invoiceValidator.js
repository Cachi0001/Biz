/**
 * Invoice Validator - Validates invoice data before sending to API
 * Ensures proper formatting and required fields
 */

/**
 * Validate invoice data before sending to API
 * @param {Object} invoiceData - The invoice data to validate
 * @returns {Object} - Object with isValid and errors properties
 */
export const validateInvoiceData = (invoiceData) => {
  if (!invoiceData) {
    return {
      isValid: false,
      errors: { general: 'No invoice data provided' },
      formattedData: {}
    };
  }
  
  const errors = {};
  
  // Required field validation
  if (!invoiceData.customer_id) {
    errors.customer_id = 'Customer is required';
  }
  
  if (!invoiceData.issue_date) {
    errors.issue_date = 'Issue date is required';
  }
  
  if (invoiceData.due_date && new Date(invoiceData.due_date) < new Date(invoiceData.issue_date)) {
    errors.due_date = 'Due date cannot be before issue date';
  }
  
  if (!invoiceData.items || !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
    errors.items = 'At least one item is required';
  } else {
    // Validate each item
    const itemErrors = [];
    let hasItemErrors = false;
    
    invoiceData.items.forEach((item, index) => {
      if (!item) {
        itemErrors[index] = { general: 'Invalid item' };
        hasItemErrors = true;
        return;
      }
      
      const itemError = {};
      
      if (!item.description || !item.description.trim()) {
        itemError.description = 'Description is required';
        hasItemErrors = true;
      }
      
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        itemError.quantity = 'Quantity must be greater than 0';
        hasItemErrors = true;
      }
      
      if (item.unit_price === undefined || item.unit_price === null || parseFloat(item.unit_price) < 0) {
        itemError.unit_price = 'Unit price must be 0 or greater';
        hasItemErrors = true;
      }
      
      const taxRate = parseFloat(item.tax_rate || 0);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        itemError.tax_rate = 'Tax rate must be between 0 and 100';
        hasItemErrors = true;
      }
      
      const discountRate = parseFloat(item.discount_rate || 0);
      if (isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
        itemError.discount_rate = 'Discount rate must be between 0 and 100';
        hasItemErrors = true;
      }
      
      itemErrors[index] = itemError;
    });
    
    if (hasItemErrors) {
      errors.itemErrors = itemErrors;
    }
  }
  
  // Format data for API
  const formattedItems = Array.isArray(invoiceData.items) ? invoiceData.items.map(item => {
    if (!item) return null;
    
    return {
      product_id: item.product_id || null,
      description: item.description?.trim() || '',
      quantity: parseInt(item.quantity) || 1,
      unit_price: parseFloat(item.unit_price) || 0,
      tax_rate: parseFloat(item.tax_rate) || 0,
      discount_rate: parseFloat(item.discount_rate) || 0,
      total: calculateItemTotal(item)
    };
  }).filter(Boolean) : [];
  
  const formattedData = {
    customer_id: invoiceData.customer_id || null,
    issue_date: invoiceData.issue_date || new Date().toISOString().split('T')[0],
    due_date: invoiceData.due_date || null,
    payment_terms: invoiceData.payment_terms || 'Net 30',
    notes: invoiceData.notes?.trim() || '',
    terms_and_conditions: invoiceData.terms_and_conditions?.trim() || 'Payment is due within 30 days of invoice date.',
    currency: invoiceData.currency || 'NGN',
    discount_amount: parseFloat(invoiceData.discount_amount) || 0,
    items: formattedItems,
    status: invoiceData.status || 'draft',
    total_amount: calculateInvoiceTotal(invoiceData)
  };
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    formattedData
  };
};

/**
 * Calculate item total
 * @param {Object} item - The invoice item
 * @returns {number} - The item total
 */
const calculateItemTotal = (item) => {
  if (!item) return 0;
  
  const quantity = Math.max(0, parseFloat(item.quantity) || 0);
  const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
  const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
  const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

  let total = quantity * unitPrice;
  total -= total * (discountRate / 100);
  total += total * (taxRate / 100);

  return Math.round(total * 100) / 100;
};

/**
 * Calculate invoice total
 * @param {Object} invoiceData - The invoice data
 * @returns {number} - The invoice total
 */
const calculateInvoiceTotal = (invoiceData) => {
  if (!invoiceData || !invoiceData.items || !Array.isArray(invoiceData.items)) return 0;
  const itemsTotal = invoiceData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const discount = Math.max(0, parseFloat(invoiceData.discount_amount) || 0);
  const total = itemsTotal - discount;
  
  return Math.round(Math.max(0, total) * 100) / 100;
};

export default {
  validateInvoiceData,
  calculateItemTotal,
  calculateInvoiceTotal
};