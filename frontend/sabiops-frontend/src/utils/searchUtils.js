/**
 * Search Utility Functions
 * Helper functions for search operations including sanitization, highlighting, and sorting
 */

/**
 * Sanitize and validate search queries
 * @param {string} query - Raw search query
 * @returns {string} Sanitized query
 */
export const sanitizeQuery = (query) => {
  if (!query || typeof query !== 'string') return '';
  
  return query
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/['"]/g, '') // Remove quotes that might break queries
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
};

/**
 * Highlight matching text in search results
 * @param {string} text - Text to highlight
 * @param {string} query - Search query
 * @returns {string} Text with highlighted matches
 */
export const highlightMatches = (text, query) => {
  if (!text || !query) return text;
  
  const sanitizedQuery = sanitizeQuery(query);
  if (!sanitizedQuery) return text;
  
  // Escape special regex characters
  const escapedQuery = sanitizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex for case-insensitive matching
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  // Replace matches with highlighted version
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
};

/**
 * Categorize search results by type
 * @param {Object} results - Raw search results
 * @returns {Object} Categorized results
 */
export const categorizeResults = (results) => {
  if (!results || typeof results !== 'object') {
    return {
      products: [],
      customers: [],
      invoices: [],
      expenses: []
    };
  }

  return {
    products: results.products || [],
    customers: results.customers || [],
    invoices: results.invoices || [],
    expenses: results.expenses || []
  };
};

/**
 * Sort search results by various criteria
 * @param {Array} results - Array of search results
 * @param {string} sortBy - Sort criteria (relevance, date, name, amount)
 * @param {string} order - Sort order (asc, desc)
 * @returns {Array} Sorted results
 */
export const sortResults = (results, sortBy = 'relevance', order = 'desc') => {
  if (!Array.isArray(results)) return [];
  
  const sortedResults = [...results];
  
  sortedResults.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = (a.name || a.description || a.invoice_number || '').toLowerCase();
        bValue = (b.name || b.description || b.invoice_number || '').toLowerCase();
        break;
        
      case 'date':
        aValue = new Date(a.created_at || a.date || 0);
        bValue = new Date(b.created_at || b.date || 0);
        break;
        
      case 'amount':
        aValue = parseFloat(a.price || a.total_amount || a.amount || 0);
        bValue = parseFloat(b.price || b.total_amount || b.amount || 0);
        break;
        
      case 'relevance':
      default:
        // For relevance, we'll use a simple scoring system
        aValue = calculateRelevanceScore(a);
        bValue = calculateRelevanceScore(b);
        break;
    }
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1;
    if (aValue > bValue) return order === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sortedResults;
};

/**
 * Calculate relevance score for search results
 * @param {Object} item - Search result item
 * @returns {number} Relevance score
 */
const calculateRelevanceScore = (item) => {
  let score = 0;
  
  // Higher score for exact matches in name/title
  if (item.name) score += 10;
  if (item.invoice_number) score += 8;
  if (item.description) score += 5;
  
  // Boost recent items
  const itemDate = new Date(item.created_at || item.date || 0);
  const daysSinceCreated = (Date.now() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreated < 30) score += 3;
  if (daysSinceCreated < 7) score += 2;
  
  return score;
};

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Filter results by type
 * @param {Object} results - Search results
 * @param {string} type - Type to filter by
 * @returns {Array} Filtered results
 */
export const filterResultsByType = (results, type) => {
  if (!results || type === 'all') return results;
  
  const filtered = {
    products: [],
    customers: [],
    invoices: [],
    expenses: []
  };
  
  if (results[type]) {
    filtered[type] = results[type];
  }
  
  return filtered;
};

/**
 * Get total count of all results
 * @param {Object} results - Search results
 * @returns {number} Total count
 */
export const getTotalResultsCount = (results) => {
  if (!results || typeof results !== 'object') return 0;
  
  return Object.values(results).reduce((total, items) => {
    return total + (Array.isArray(items) ? items.length : 0);
  }, 0);
};

/**
 * Format result for display
 * @param {Object} item - Search result item
 * @param {string} query - Search query for highlighting
 * @returns {Object} Formatted result
 */
export const formatResultForDisplay = (item, query) => {
  if (!item) return null;
  
  const formatted = { ...item };
  
  // Add highlighted text
  if (query) {
    formatted.highlightedName = highlightMatches(item.name || item.description || item.invoice_number || '', query);
    formatted.highlightedDescription = highlightMatches(item.description || '', query);
  }
  
  // Add display-friendly formatting
  if (item.price || item.total_amount || item.amount) {
    const amount = item.price || item.total_amount || item.amount;
    formatted.formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  }
  
  if (item.created_at || item.date) {
    const date = new Date(item.created_at || item.date);
    formatted.formattedDate = date.toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  return formatted;
};

/**
 * Generate search result URL for navigation
 * @param {Object} item - Search result item
 * @returns {string} Navigation URL
 */
export const getResultNavigationUrl = (item) => {
  if (!item || !item.type) return '/';
  
  switch (item.type) {
    case 'product':
      return `/products?highlight=${item.id}`;
    case 'customer':
      return `/customers?highlight=${item.id}`;
    case 'invoice':
      return `/invoices?highlight=${item.id}`;
    case 'expense':
      return `/expenses?highlight=${item.id}`;
    default:
      return '/';
  }
};

/**
 * Validate search query
 * @param {string} query - Search query
 * @returns {Object} Validation result
 */
export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return {
      isValid: false,
      error: 'Search query is required'
    };
  }
  
  const trimmed = query.trim();
  
  if (trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Search query must be at least 2 characters'
    };
  }
  
  if (trimmed.length > 100) {
    return {
      isValid: false,
      error: 'Search query is too long'
    };
  }
  
  return {
    isValid: true,
    sanitized: sanitizeQuery(trimmed)
  };
};

/**
 * Get search result icon based on type
 * @param {string} type - Result type
 * @returns {string} Icon class or emoji
 */
export const getResultIcon = (type) => {
  const icons = {
    product: '📦',
    customer: '👤',
    invoice: '📄',
    expense: '💰'
  };
  
  return icons[type] || '📋';
};

/**
 * Group results by category with counts
 * @param {Object} results - Search results
 * @returns {Array} Grouped results with metadata
 */
export const groupResultsWithCounts = (results) => {
  const categories = [];
  
  if (results.products && results.products.length > 0) {
    categories.push({
      type: 'products',
      label: 'Products',
      count: results.products.length,
      items: results.products,
      icon: '📦'
    });
  }
  
  if (results.customers && results.customers.length > 0) {
    categories.push({
      type: 'customers',
      label: 'Customers',
      count: results.customers.length,
      items: results.customers,
      icon: '👤'
    });
  }
  
  if (results.invoices && results.invoices.length > 0) {
    categories.push({
      type: 'invoices',
      label: 'Invoices',
      count: results.invoices.length,
      items: results.invoices,
      icon: '📄'
    });
  }
  
  if (results.expenses && results.expenses.length > 0) {
    categories.push({
      type: 'expenses',
      label: 'Expenses',
      count: results.expenses.length,
      items: results.expenses,
      icon: '💰'
    });
  }
  
  return categories;
};