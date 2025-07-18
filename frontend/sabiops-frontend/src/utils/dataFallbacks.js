/**
 * Data Fallbacks - Provides fallback data structures when API calls fail
 * Ensures UI components always have valid data to display
 */

import DebugLogger from './debugLogger';

/**
 * Provides fallback data for expenses
 * @returns {Object} - Fallback expenses data structure
 */
export const getExpensesFallback = () => {
  const fallback = {
    expenses: [],
    summary: {
      total_expenses: 0,
      total_count: 0,
      today_expenses: 0,
      this_month_expenses: 0
    }
  };
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'expenses', fallback, 'Using fallback expenses data');
  
  return fallback;
};

/**
 * Provides fallback data for products
 * @returns {Object} - Fallback products data structure
 */
export const getProductsFallback = () => {
  const fallback = {
    products: [],
    categories: [
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
    ]
  };
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'products', fallback, 'Using fallback products data');
  
  return fallback;
};

/**
 * Provides fallback data for customers
 * @returns {Array} - Fallback customers array
 */
export const getCustomersFallback = () => {
  const fallback = [
    {
      id: 'walk-in',
      name: 'Walk-in Customer',
      email: null,
      phone: null,
      address: null
    }
  ];
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'customers', fallback, 'Using fallback customers data');
  
  return fallback;
};

/**
 * Provides fallback data for sales
 * @returns {Object} - Fallback sales data structure
 */
export const getSalesFallback = () => {
  const fallback = {
    sales: [],
    summary: {
      total_sales: 0,
      total_transactions: 0,
      today_sales: 0,
      average_sale: 0
    }
  };
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'sales', fallback, 'Using fallback sales data');
  
  return fallback;
};

/**
 * Provides fallback payment methods
 * @returns {Array} - Fallback payment methods
 */
export const getPaymentMethodsFallback = () => {
  const fallback = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'pos', label: 'POS' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_payment', label: 'Online Payment' },
    { value: 'credit', label: 'Credit' }
  ];
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'payment-methods', fallback, 'Using fallback payment methods');
  
  return fallback;
};

/**
 * Provides fallback expense categories
 * @returns {Array} - Fallback expense categories
 */
export const getExpenseCategoriesFallback = () => {
  const fallback = [
    {
      name: "Inventory/Stock",
      description: "Goods purchased for resale",
      subcategories: ["Raw Materials", "Finished Goods", "Packaging Materials", "Import Duties"]
    },
    {
      name: "Rent",
      description: "Shop/office rent and related costs",
      subcategories: ["Shop Rent", "Office Rent", "Warehouse Rent", "Equipment Rent"]
    },
    {
      name: "Utilities",
      description: "Basic business utilities",
      subcategories: ["Electricity", "Water", "Internet", "Phone", "Generator Fuel"]
    },
    {
      name: "Transportation",
      description: "Business travel and logistics",
      subcategories: ["Fuel", "Vehicle Maintenance", "Public Transport", "Delivery Costs", "Logistics"]
    },
    {
      name: "Marketing",
      description: "Advertising and promotional expenses",
      subcategories: ["Social Media Ads", "Print Materials", "Radio/TV Ads", "Promotional Items", "Website"]
    },
    {
      name: "Staff Salaries",
      description: "Employee compensation and benefits",
      subcategories: ["Basic Salary", "Overtime", "Bonuses", "Allowances", "Benefits"]
    },
    {
      name: "Equipment",
      description: "Business equipment and tools",
      subcategories: ["Computers", "Machinery", "Furniture", "Tools", "Software"]
    },
    {
      name: "Professional Services",
      description: "External professional services",
      subcategories: ["Accounting", "Legal", "Consulting", "IT Support", "Training"]
    },
    {
      name: "Insurance",
      description: "Business insurance premiums",
      subcategories: ["Business Insurance", "Vehicle Insurance", "Health Insurance", "Property Insurance"]
    },
    {
      name: "Taxes",
      description: "Government taxes and levies",
      subcategories: ["VAT", "Company Tax", "PAYE", "Local Government Levy", "Import Duty"]
    },
    {
      name: "Bank Charges",
      description: "Banking and financial service fees",
      subcategories: ["Transaction Fees", "Account Maintenance", "Transfer Charges", "POS Charges"]
    },
    {
      name: "Other",
      description: "Miscellaneous business expenses",
      subcategories: ["Miscellaneous", "Emergency Repairs", "Cleaning", "Security", "Stationery"]
    }
  ];
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'expense-categories', fallback, 'Using fallback expense categories');
  
  return fallback;
};

/**
 * Provides fallback dashboard data
 * @returns {Object} - Fallback dashboard data
 */
export const getDashboardFallback = () => {
  const fallback = {
    revenue: {
      total: 0,
      today: 0,
      this_month: 0,
      growth: 0
    },
    customers: {
      total: 0,
      new_today: 0,
      new_this_month: 0,
      growth: 0
    },
    products: {
      total: 0,
      low_stock: 0,
      out_of_stock: 0
    },
    expenses: {
      total: 0,
      today: 0,
      this_month: 0
    },
    recent_activities: []
  };
  
  DebugLogger.logDisplayIssue('DataFallbacks', 'dashboard', fallback, 'Using fallback dashboard data');
  
  return fallback;
};

/**
 * Creates a safe data wrapper that provides fallbacks
 * @param {Function} dataFetcher - Function that fetches data
 * @param {Function} fallbackProvider - Function that provides fallback data
 * @param {string} dataType - Type of data being fetched
 * @returns {Function} - Safe data fetcher
 */
export const createSafeDataFetcher = (dataFetcher, fallbackProvider, dataType) => {
  return async (...args) => {
    try {
      DebugLogger.logApiCall(`safe-fetch-${dataType}`, 'Starting safe fetch', 'DataFallbacks');
      
      const result = await dataFetcher(...args);
      
      // Validate result has expected structure
      if (!result || (Array.isArray(result) && result.length === 0 && dataType !== 'customers')) {
        DebugLogger.logDisplayIssue('DataFallbacks', dataType, result, 'Empty result, considering fallback');
      }
      
      return result;
    } catch (error) {
      DebugLogger.logApiError(`safe-fetch-${dataType}`, error, 'DataFallbacks');
      
      console.warn(`Failed to fetch ${dataType}, using fallback data:`, error.message);
      
      return fallbackProvider();
    }
  };
};

/**
 * Validates data structure and provides fallback if invalid
 * @param {*} data - Data to validate
 * @param {string} dataType - Expected data type
 * @param {Function} fallbackProvider - Fallback provider function
 * @returns {*} - Valid data or fallback
 */
export const validateDataStructure = (data, dataType, fallbackProvider) => {
  try {
    switch (dataType) {
      case 'expenses':
        if (!data || !data.expenses || !Array.isArray(data.expenses)) {
          throw new Error('Invalid expenses data structure');
        }
        if (!data.summary || typeof data.summary !== 'object') {
          data.summary = getExpensesFallback().summary;
        }
        break;
        
      case 'products':
        if (!data || !data.products || !Array.isArray(data.products)) {
          throw new Error('Invalid products data structure');
        }
        if (!data.categories || !Array.isArray(data.categories)) {
          data.categories = getProductsFallback().categories;
        }
        break;
        
      case 'customers':
        if (!Array.isArray(data)) {
          throw new Error('Invalid customers data structure');
        }
        break;
        
      case 'sales':
        if (!data || !data.sales || !Array.isArray(data.sales)) {
          throw new Error('Invalid sales data structure');
        }
        if (!data.summary || typeof data.summary !== 'object') {
          data.summary = getSalesFallback().summary;
        }
        break;
        
      default:
        // For unknown types, just check if it's defined
        if (data === undefined || data === null) {
          throw new Error(`Invalid ${dataType} data structure`);
        }
    }
    
    return data;
  } catch (error) {
    DebugLogger.logDisplayIssue('DataFallbacks', dataType, data, `Data validation failed: ${error.message}`);
    
    console.warn(`Data validation failed for ${dataType}, using fallback:`, error.message);
    
    return fallbackProvider();
  }
};

/**
 * Creates a data recovery mechanism for failed operations
 * @param {*} failedData - Data that failed validation
 * @param {string} dataType - Type of data
 * @returns {*} - Recovered or fallback data
 */
export const recoverData = (failedData, dataType) => {
  DebugLogger.logDisplayIssue('DataFallbacks', dataType, failedData, 'Attempting data recovery');
  
  try {
    // Attempt to extract usable data from failed response
    if (failedData && typeof failedData === 'object') {
      // Try common data extraction patterns
      const possibleData = failedData.data || failedData.result || failedData.response;
      
      if (possibleData) {
        return validateDataStructure(possibleData, dataType, () => getFallbackByType(dataType));
      }
    }
    
    // If recovery fails, use fallback
    return getFallbackByType(dataType);
  } catch (error) {
    DebugLogger.logApiError('data-recovery', error, 'DataFallbacks');
    return getFallbackByType(dataType);
  }
};

/**
 * Gets fallback data by type
 * @param {string} dataType - Type of data needed
 * @returns {*} - Fallback data
 */
const getFallbackByType = (dataType) => {
  switch (dataType) {
    case 'expenses': return getExpensesFallback();
    case 'products': return getProductsFallback();
    case 'customers': return getCustomersFallback();
    case 'sales': return getSalesFallback();
    case 'payment-methods': return getPaymentMethodsFallback();
    case 'expense-categories': return getExpenseCategoriesFallback();
    case 'dashboard': return getDashboardFallback();
    default: return [];
  }
};

export default {
  getExpensesFallback,
  getProductsFallback,
  getCustomersFallback,
  getSalesFallback,
  getPaymentMethodsFallback,
  getExpenseCategoriesFallback,
  getDashboardFallback,
  createSafeDataFetcher,
  validateDataStructure,
  recoverData
};