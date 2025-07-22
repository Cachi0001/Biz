/**
 * Business Categories - Canonical list from backend
 * This list is extracted from get_business_categories() function in the backend
 * and should be kept in sync with the backend implementation.
 * 
 * Source: backend/sabiops-backend/src/routes/product.py - get_business_categories()
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

// Export as default for convenience
export default BUSINESS_CATEGORIES;

// Additional utility functions for category management
export const getCategoryCount = () => BUSINESS_CATEGORIES.length;

export const isValidCategory = (category) => {
    return BUSINESS_CATEGORIES.includes(category);
};

export const getCategoriesForDropdown = () => {
    return BUSINESS_CATEGORIES.map(category => ({
        label: category,
        value: category
    }));
};
