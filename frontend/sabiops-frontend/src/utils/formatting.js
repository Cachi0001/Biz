/**
 * Nigerian SME Formatting Utilities
 * Provides formatting functions tailored for Nigerian business context
 */

/**
 * Currency symbols mapping
 */
const CURRENCY_SYMBOLS = {
  'NGN': '₦',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'ZAR': 'R',
  'GHS': '₵',
  'KES': 'KSh'
};

/**
 * Currency locale mapping for proper number formatting
 */
const CURRENCY_LOCALES = {
  'NGN': 'en-NG',
  'USD': 'en-US',
  'EUR': 'en-GB',
  'GBP': 'en-GB',
  'ZAR': 'en-ZA',
  'GHS': 'en-GH',
  'KES': 'en-KE'
};

/**
 * Format amount with currency symbol and proper formatting
 * @param {number|string} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true for consistency)
 * @param {string} currency - Currency code (default: NGN)
 * @returns {string} Formatted currency amount
 */
export const formatCurrency = (amount, showDecimals = true, currency = 'NGN') => {
  if (!amount && amount !== 0) return showDecimals ? `${CURRENCY_SYMBOLS[currency] || '₦'}0.00` : `${CURRENCY_SYMBOLS[currency] || '₦'}0`;
  
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return showDecimals ? `${CURRENCY_SYMBOLS[currency] || '₦'}0.00` : `${CURRENCY_SYMBOLS[currency] || '₦'}0`;
  
  // Ensure proper rounding to 2 decimal places
  const roundedAmount = Math.round(numAmount * 100) / 100;
  const symbol = CURRENCY_SYMBOLS[currency] || '₦';
  const locale = CURRENCY_LOCALES[currency] || 'en-NG';
  
  // Special handling for KSh which goes before the amount
  if (currency === 'KES') {
    return `${symbol} ${roundedAmount.toLocaleString(locale, {
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0
    })}`;
  }
  
  return `${symbol}${roundedAmount.toLocaleString(locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  })}`;
};

/**
 * Format amount in Nigerian Naira with consistent ₦X,XXX.XX formatting
 * @param {number|string} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: true for consistency)
 * @returns {string} Formatted Naira amount in ₦X,XXX.XX format
 */
export const formatNaira = (amount, showDecimals = true) => {
  return formatCurrency(amount, showDecimals, 'NGN');
};

/**
 * Format date for Nigerian context using DD/MM/YYYY format
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date in DD/MM/YYYY format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    // Format as DD/MM/YYYY consistently
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

/**
 * Format date and time for Nigerian context using DD/MM/YYYY format
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date and time in DD/MM/YYYY HH:MM format
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    
    // Format as DD/MM/YYYY HH:MM consistently
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'N/A';
  }
};

/**
 * Format Nigerian phone numbers
 * @param {string} phone - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhone = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different Nigerian phone number formats
  if (cleaned.startsWith('234')) {
    // Already has country code
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Local format starting with 0
    return `+234${cleaned.slice(1)}`;
  } else if (cleaned.length === 10) {
    // Local format without leading 0
    return `+234${cleaned}`;
  }
  
  // Return original if format is unclear
  return phone;
};

/**
 * Get Nigerian business categories
 * @returns {Array<string>} List of business categories
 */
export const getBusinessCategories = () => [
  'Retail/Trading',
  'Food & Beverages',
  'Fashion & Clothing',
  'Electronics & Technology',
  'Health & Beauty',
  'Home & Garden',
  'Automotive',
  'Professional Services',
  'Manufacturing',
  'Agriculture',
  'Education',
  'Entertainment',
  'Real Estate',
  'Transportation',
  'Construction',
  'Other'
];

/**
 * Get Nigerian business expense categories
 * @returns {Array<string>} List of expense categories
 */
export const getExpenseCategories = () => [
  'Inventory/Stock Purchase',
  'Rent & Utilities',
  'Staff Salaries',
  'Transportation',
  'Marketing & Advertising',
  'Equipment & Tools',
  'Professional Services',
  'Insurance',
  'Taxes & Government Fees',
  'Bank Charges',
  'Maintenance & Repairs',
  'Office Supplies',
  'Communication',
  'Training & Development',
  'Other'
];

/**
 * Get payment methods common in Nigeria
 * @returns {Array<string>} List of payment methods
 */
export const getPaymentMethods = () => [
  'cash',
  'bank_transfer',
  'pos',
  'mobile_money',
  'cheque',
  'online_payment',
  'credit'
];

/**
 * Format payment method for display
 * @param {string} method - Payment method code
 * @returns {string} Formatted payment method
 */
export const formatPaymentMethod = (method) => {
  const methods = {
    'cash': 'Cash',
    'bank_transfer': 'Bank Transfer',
    'pos': 'POS',
    'mobile_money': 'Mobile Money',
    'cheque': 'Cheque',
    'online_payment': 'Online Payment',
    'credit': 'Credit'
  };
  
  return methods[method] || method || 'Unknown';
};

/**
 * Format invoice status for display
 * @param {string} status - Invoice status
 * @returns {string} Formatted status
 */
export const formatInvoiceStatus = (status) => {
  const statuses = {
    'draft': 'Draft',
    'sent': 'Sent',
    'paid': 'Paid',
    'overdue': 'Overdue',
    'cancelled': 'Cancelled'
  };
  
  return statuses[status] || status || 'Unknown';
};

/**
 * Get status color for badges
 * @param {string} status - Status to get color for
 * @param {string} type - Type of status (invoice, payment, stock)
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status, type = 'invoice') => {
  if (type === 'invoice') {
    const colors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
  
  if (type === 'stock') {
    const colors = {
      'in_stock': 'bg-green-100 text-green-800',
      'low_stock': 'bg-yellow-100 text-yellow-800',
      'out_of_stock': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  }
  
  return 'bg-gray-100 text-gray-800';
};

/**
 * Calculate stock status based on quantity and threshold
 * @param {number} quantity - Current stock quantity
 * @param {number} threshold - Low stock threshold
 * @returns {string} Stock status
 */
export const getStockStatus = (quantity, threshold = 5) => {
  const qty = Number(quantity) || 0;
  const thresh = Number(threshold) || 5;
  
  if (qty === 0) return 'out_of_stock';
  if (qty <= thresh) return 'low_stock';
  return 'in_stock';
};

/**
 * Format stock status for display
 * @param {string} status - Stock status
 * @returns {string} Formatted status
 */
export const formatStockStatus = (status) => {
  const statuses = {
    'in_stock': 'In Stock',
    'low_stock': 'Low Stock',
    'out_of_stock': 'Out of Stock'
  };
  
  return statuses[status] || 'Unknown';
};

/**
 * Generate invoice number
 * @param {number} sequence - Invoice sequence number
 * @param {string} prefix - Invoice prefix (default: INV)
 * @returns {string} Generated invoice number
 */
export const generateInvoiceNumber = (sequence, prefix = 'INV') => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(4, '0');
  
  return `${prefix}-${year}${month}-${seq}`;
};

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
export const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Format percentage for display
 * @param {number} percentage - Percentage to format
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (percentage) => {
  return `${percentage}%`;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, length = 50) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

/**
 * Validate Nigerian phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
export const isValidNigerianPhone = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Check various Nigerian phone formats
  return (
    (cleaned.startsWith('234') && cleaned.length === 13) || // +234XXXXXXXXXX
    (cleaned.startsWith('0') && cleaned.length === 11) ||   // 0XXXXXXXXXX
    (cleaned.length === 10)                                 // XXXXXXXXXX
  );
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} dateString - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(dateString);
  } catch (error) {
    console.error('Error calculating relative time:', error);
    return 'N/A';
  }
};

export default {
  formatCurrency,
  formatNaira,
  formatDate,
  formatDateTime,
  formatPhone,
  getBusinessCategories,
  getExpenseCategories,
  getPaymentMethods,
  formatPaymentMethod,
  formatInvoiceStatus,
  getStatusColor,
  getStockStatus,
  formatStockStatus,
  generateInvoiceNumber,
  calculatePercentage,
  formatPercentage,
  truncateText,
  isValidNigerianPhone,
  isValidEmail,
  formatFileSize,
  getRelativeTime
};