/**
 * API Response Normalizer - Handles inconsistent API response formats
 * Ensures consistent data structure across different API endpoints
 */

/**
 * Normalizes API responses to a consistent format
 * @param {*} response - Raw API response
 * @param {string} dataKey - Key to extract data from (default: 'data')
 * @returns {*} - Normalized data
 */
export const normalizeApiResponse = (response, dataKey = 'data') => {
  console.log('[ApiNormalizer] Normalizing response:', {
    type: typeof response,
    hasSuccess: response?.success !== undefined,
    hasData: response?.data !== undefined,
    hasDataKey: response?.[dataKey] !== undefined,
    isArray: Array.isArray(response)
  });

  // Handle standardized success response format
  if (response?.success && response?.data) {
    console.log('[ApiNormalizer] Using success.data format');
    return response.data;
  }
  
  // Handle direct data key
  if (response?.[dataKey]) {
    console.log('[ApiNormalizer] Using direct data key format');
    return response[dataKey];
  }
  
  // Handle direct array response
  if (Array.isArray(response)) {
    console.log('[ApiNormalizer] Using direct array format');
    return response;
  }
  
  // Handle direct object response
  if (response && typeof response === 'object') {
    console.log('[ApiNormalizer] Using direct object format');
    return response;
  }
  
  console.warn('[ApiNormalizer] Unexpected response format, returning empty array');
  return [];
};

/**
 * Normalizes expenses API response
 * @param {*} response - Raw expenses API response
 * @returns {Object} - Normalized expenses data
 */
export const normalizeExpensesResponse = (response) => {
  console.log('[ApiNormalizer] Normalizing expenses response');
  
  const data = normalizeApiResponse(response);
  
  // Handle different expense response formats
  if (data.expenses && data.summary) {
    // Format: { expenses: [], summary: {} }
    return {
      expenses: Array.isArray(data.expenses) ? data.expenses : [],
      summary: data.summary || getDefaultExpenseSummary()
    };
  }
  
  if (Array.isArray(data)) {
    // Format: [expense1, expense2, ...]
    return {
      expenses: data,
      summary: calculateExpenseSummary(data)
    };
  }
  
  if (data.data && Array.isArray(data.data)) {
    // Format: { data: [expense1, expense2, ...] }
    return {
      expenses: data.data,
      summary: data.summary || calculateExpenseSummary(data.data)
    };
  }
  
  console.warn('[ApiNormalizer] Could not normalize expenses response');
  return {
    expenses: [],
    summary: getDefaultExpenseSummary()
  };
};

/**
 * Normalizes products API response
 * @param {*} response - Raw products API response
 * @returns {Object} - Normalized products data
 */
export const normalizeProductsResponse = (response) => {
  console.log('[ApiNormalizer] Normalizing products response');
  
  const data = normalizeApiResponse(response);
  
  // Handle different product response formats
  if (data.products && Array.isArray(data.products)) {
    // Format: { products: [], categories: [] }
    return {
      products: data.products,
      categories: data.categories || getDefaultCategories()
    };
  }
  
  if (Array.isArray(data)) {
    // Format: [product1, product2, ...]
    return {
      products: data,
      categories: getDefaultCategories()
    };
  }
  
  if (data.data && Array.isArray(data.data)) {
    // Format: { data: [product1, product2, ...] }
    return {
      products: data.data,
      categories: data.categories || getDefaultCategories()
    };
  }
  
  console.warn('[ApiNormalizer] Could not normalize products response');
  return {
    products: [],
    categories: getDefaultCategories()
  };
};

/**
 * Normalizes customers API response
 * @param {*} response - Raw customers API response
 * @returns {Array} - Normalized customers array
 */
export const normalizeCustomersResponse = (response) => {
  console.log('[ApiNormalizer] Normalizing customers response');
  
  const data = normalizeApiResponse(response);
  
  if (data.customers && Array.isArray(data.customers)) {
    return data.customers;
  }
  
  if (Array.isArray(data)) {
    return data;
  }
  
  console.warn('[ApiNormalizer] Could not normalize customers response');
  return [];
};

/**
 * Normalizes sales API response
 * @param {*} response - Raw sales API response
 * @returns {Object} - Normalized sales data
 */
export const normalizeSalesResponse = (response) => {
  console.log('[ApiNormalizer] Normalizing sales response');
  
  const data = normalizeApiResponse(response);
  
  if (data.sales && Array.isArray(data.sales)) {
    return {
      sales: data.sales,
      summary: data.summary || getDefaultSalesSummary()
    };
  }
  
  if (Array.isArray(data)) {
    return {
      sales: data,
      summary: calculateSalesSummary(data)
    };
  }
  
  console.warn('[ApiNormalizer] Could not normalize sales response');
  return {
    sales: [],
    summary: getDefaultSalesSummary()
  };
};

/**
 * Calculates expense summary from expense array
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Calculated summary
 */
const calculateExpenseSummary = (expenses) => {
  if (!Array.isArray(expenses)) return getDefaultExpenseSummary();
  
  const total = expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayExpenses = expenses
    .filter(expense => expense.date?.startsWith(today))
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  
  return {
    total_expenses: total,
    total_count: expenses.length,
    today_expenses: todayExpenses,
    this_month_expenses: monthlyExpenses
  };
};

/**
 * Calculates sales summary from sales array
 * @param {Array} sales - Array of sale objects
 * @returns {Object} - Calculated summary
 */
const calculateSalesSummary = (sales) => {
  if (!Array.isArray(sales)) return getDefaultSalesSummary();
  
  const total = sales.reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todaySales = sales
    .filter(sale => sale.date?.startsWith(today))
    .reduce((sum, sale) => sum + (parseFloat(sale.total_amount) || 0), 0);
  
  return {
    total_sales: total,
    total_transactions: sales.length,
    today_sales: todaySales,
    average_sale: sales.length > 0 ? total / sales.length : 0
  };
};

/**
 * Default expense summary structure
 * @returns {Object} - Default summary
 */
const getDefaultExpenseSummary = () => ({
  total_expenses: 0,
  total_count: 0,
  today_expenses: 0,
  this_month_expenses: 0
});

/**
 * Default sales summary structure
 * @returns {Object} - Default summary
 */
const getDefaultSalesSummary = () => ({
  total_sales: 0,
  total_transactions: 0,
  today_sales: 0,
  average_sale: 0
});

/**
 * Default product categories
 * @returns {Array} - Default categories
 */
const getDefaultCategories = () => [
  'Electronics & Technology',
  'Fashion & Clothing',
  'Food & Beverages',
  'Health & Beauty',
  'Home & Garden',
  'Automotive',
  'Sports & Outdoors',
  'Books & Media',
  'Office Supplies',
  'Agriculture',
  'Construction Materials',
  'Jewelry & Accessories',
  'Toys & Games',
  'Art & Crafts',
  'Other'
];

export default {
  normalizeApiResponse,
  normalizeExpensesResponse,
  normalizeProductsResponse,
  normalizeCustomersResponse,
  normalizeSalesResponse
};