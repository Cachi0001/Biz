/**
 * Shared category constants for consistent category usage across the application
 * This file contains all category-related constants to avoid duplication and ensure consistency
 */

/**
 * Business categories for product categorization
 * Based on common Nigerian business sectors
 */
export const BUSINESS_CATEGORIES = [
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

/**
 * Subcategories mapped to each main business category
 */
export const BUSINESS_SUBCATEGORIES = {
  'Electronics & Technology': ['Smartphones', 'Laptops', 'Tablets', 'Accessories', 'Audio Equipment'],
  'Fashion & Clothing': ['Men\'s Wear', 'Women\'s Wear', 'Children\'s Wear', 'Shoes', 'Accessories'],
  'Food & Beverages': ['Snacks', 'Beverages', 'Dairy Products', 'Frozen Foods', 'Fresh Produce'],
  'Home & Garden': ['Furniture', 'Appliances', 'Decor', 'Garden Tools', 'Cleaning Supplies'],
  'Health & Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Personal Care', 'Supplements'],
  'Sports & Outdoors': ['Exercise Equipment', 'Outdoor Gear', 'Sports Apparel', 'Team Sports', 'Water Sports'],
  'Books & Media': ['Fiction', 'Non-Fiction', 'Educational', 'Magazines', 'Digital Media'],
  'Automotive': ['Car Parts', 'Accessories', 'Tools', 'Maintenance', 'Electronics'],
  'Office Supplies': ['Stationery', 'Technology', 'Furniture', 'Organization', 'Printing'],
  'Toys & Games': ['Educational Toys', 'Action Figures', 'Board Games', 'Video Games', 'Outdoor Toys'],
  'Agriculture': ['Seeds', 'Fertilizers', 'Tools', 'Equipment', 'Livestock'],
  'Construction Materials': ['Building Materials', 'Tools', 'Hardware', 'Safety Equipment'],
  'Jewelry & Accessories': ['Rings', 'Necklaces', 'Bracelets', 'Watches', 'Custom Jewelry'],
  'Art & Crafts': ['Art Supplies', 'Craft Materials', 'DIY Kits', 'Decorative Items'],
  'Other': ['Miscellaneous', 'Unique Items', 'Custom Products']
};

/**
 * Expense categories for business expense tracking
 * Based on common Nigerian business expense types - MUST MATCH BACKEND
 */
export const EXPENSE_CATEGORIES = [
  'Inventory/Stock',
  'Rent',
  'Utilities',
  'Rent & Utilities',
  'Transportation',
  'Marketing',
  'Staff Salaries',
  'Equipment',
  'Professional Services',
  'Insurance',
  'Taxes',
  'Bank Charges',
  'Other'
];

/**
 * Helper function to get subcategories for a given business category
 * @param {string} category - The main business category
 * @returns {Array<string>} Array of subcategories for the given category
 */
export const getSubcategories = (category) => {
  return BUSINESS_SUBCATEGORIES[category] || [];
};

/**
 * Helper function to validate if a category exists
 * @param {string} category - Category to validate
 * @returns {boolean} True if category is valid
 */
export const isValidBusinessCategory = (category) => {
  return BUSINESS_CATEGORIES.includes(category);
};

/**
 * Helper function to validate if an expense category exists
 * @param {string} category - Expense category to validate
 * @returns {boolean} True if expense category is valid
 */
export const isValidExpenseCategory = (category) => {
  return EXPENSE_CATEGORIES.includes(category);
};
