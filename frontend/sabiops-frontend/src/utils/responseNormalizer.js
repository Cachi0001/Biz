/**
 * Utility functions to normalize API responses and prevent common errors
 */

/**
 * Normalizes API response to ensure it returns an array
 * Handles different response formats from the backend
 */
export const normalizeArrayResponse = (response, fallback = []) => {
  // If response is already an array
  if (Array.isArray(response)) {
    return response;
  }
  
  // If response has a data property that's an array
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  
  // If response has a specific property that's an array (e.g., payments, customers, etc.)
  const arrayProperties = ['payments', 'customers', 'products', 'invoices', 'expenses', 'sales'];
  for (const prop of arrayProperties) {
    if (response?.[prop] && Array.isArray(response[prop])) {
      return response[prop];
    }
  }
  
  // If response is an object but not an array, log warning and return fallback
  if (response && typeof response === 'object') {
    console.warn('[RESPONSE_NORMALIZER] Expected array but got object:', response);
    return fallback;
  }
  
  // Return fallback for any other case
  return fallback;
};

/**
 * Normalizes payment response specifically
 */
export const normalizePaymentResponse = (response) => {
  return normalizeArrayResponse(response, []);
};

/**
 * Safely filters an array, ensuring the input is actually an array
 */
export const safeFilter = (array, filterFn) => {
  if (!Array.isArray(array)) {
    console.warn('[RESPONSE_NORMALIZER] safeFilter called with non-array:', array);
    return [];
  }
  
  try {
    return array.filter(filterFn);
  } catch (error) {
    console.error('[RESPONSE_NORMALIZER] Error in safeFilter:', error);
    return [];
  }
};

/**
 * Safely reduces an array, ensuring the input is actually an array
 */
export const safeReduce = (array, reduceFn, initialValue = 0) => {
  if (!Array.isArray(array)) {
    console.warn('[RESPONSE_NORMALIZER] safeReduce called with non-array:', array);
    return initialValue;
  }
  
  try {
    return array.reduce(reduceFn, initialValue);
  } catch (error) {
    console.error('[RESPONSE_NORMALIZER] Error in safeReduce:', error);
    return initialValue;
  }
};

/**
 * Safely maps an array, ensuring the input is actually an array
 */
export const safeMap = (array, mapFn) => {
  if (!Array.isArray(array)) {
    console.warn('[RESPONSE_NORMALIZER] safeMap called with non-array:', array);
    return [];
  }
  
  try {
    return array.map(mapFn);
  } catch (error) {
    console.error('[RESPONSE_NORMALIZER] Error in safeMap:', error);
    return [];
  }
};

/**
 * Validates that an object has required properties
 */
export const validateObject = (obj, requiredProps = []) => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  
  return requiredProps.every(prop => obj.hasOwnProperty(prop));
};

/**
 * Safely gets a nested property from an object
 */
export const safeGet = (obj, path, defaultValue = null) => {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) {
        return defaultValue;
      }
      result = result[key];
    }
    
    return result !== undefined ? result : defaultValue;
  } catch (error) {
    console.warn('[RESPONSE_NORMALIZER] Error in safeGet:', error);
    return defaultValue;
  }
};

/**
 * Normalizes a single payment object
 */
export const normalizePaymentObject = (payment) => {
  if (!payment || typeof payment !== 'object') {
    return null;
  }
  
  return {
    id: payment.id || Date.now(),
    customer_name: payment.customer_name || payment.customerName || 'Unknown Customer',
    invoice_id: payment.invoice_id || payment.invoiceId || payment.invoice_number || null,
    amount: Number(payment.amount) || 0,
    payment_method: payment.payment_method || payment.paymentMethod || 'cash',
    payment_date: payment.payment_date || payment.paymentDate || payment.date || new Date().toISOString().split('T')[0],
    status: payment.status || 'completed',
    reference_number: payment.reference_number || payment.referenceNumber || payment.reference || '',
    notes: payment.notes || payment.description || ''
  };
};