// Reusable Product Dropdown Component with Search
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, RefreshCw, Package, Search, AlertCircle, AlertTriangle } from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';

const ProductDropdown = ({
  value = null,
  onChange,
  placeholder = "Select a product",
  disabled = false,
  required = false,
  className = "",
  style = {},
  showStock = true,
  showPrice = true,
  showQuantityInInput = true,
  showSearch = true,
  searchPlaceholder = "Search products...",
  onSearchChange = null,
  debugLabel = "",
  onError = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const {
    products,
    loading,
    error,
    refresh,
    getProductById,
    retry
  } = useProducts({
    includeStock: showStock,
    onError: onError
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize selected product from value prop
  useEffect(() => {
    const initializeProduct = async () => {
      if (value && !selectedProduct) {
        // If value is an object, use it directly
        if (typeof value === 'object' && value.id !== undefined) {
          setSelectedProduct(value);
          return;
        }

        // If value is a string ID, find the product
        if (typeof value === 'string') {
          const product = await getProductById(value);
          if (product) {
            setSelectedProduct(product);
          }
        }
      } else if (!value && selectedProduct) {
        setSelectedProduct(null);
      }
    };

    initializeProduct();
  }, [value, selectedProduct, getProductById]);

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        (product.description && product.description.toLowerCase().includes(term))
      );
      setFilteredProducts(filtered);
    }
  }, [products, searchTerm]);

  // Handle product selection
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setIsOpen(false);
    setSearchTerm(''); // Clear search when product is selected
    
    if (onChange) {
      onChange(product);
    }

    if (debugLabel) {
      console.log(`[${debugLabel}] Product selected:`, product);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setIsOpen(true);
  };

  // Handle refresh
  const handleRefresh = async (e) => {
    e.stopPropagation();
    try {
      await refresh();
    } catch (err) {
      console.error('Failed to refresh products:', err);
    }
  };

  // Handle retry
  const handleRetry = async (e) => {
    e.stopPropagation();
    try {
      await retry();
    } catch (err) {
      console.error('Failed to retry product loading:', err);
    }
  };

  // Get display text for selected product
  const getDisplayText = () => {
    if (selectedProduct) {
      let displayText = selectedProduct.name;
      
      if (showQuantityInInput) {
        displayText += ` - Qty: ${selectedProduct.quantity}`;
      }
      
      return displayText;
    }
    return placeholder;
  };

  // Get product option display text
  const getProductOptionText = (product) => {
    let displayText = product.name;
    
    if (showPrice && product.price > 0) {
      displayText += ` - ₦${product.price.toLocaleString()}`;
    }
    
    if (showStock) {
      displayText += ` - Qty: ${product.quantity}`;
    }
    
    return displayText;
  };

  // Get stock status indicator
  const getStockIndicator = (product) => {
    if (!showStock) return null;

    if (product.isOutOfStock) {
      return (
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center">
          <AlertCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </span>
      );
    }

    if (product.isLowStock) {
      return (
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      );
    }

    return (
      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
        In Stock
      </span>
    );
  };

  // Get dropdown button classes
  const getButtonClasses = () => {
    const baseClasses = "w-full px-3 py-2 border rounded-md bg-white text-left flex items-center justify-between transition-colors";
    const stateClasses = disabled 
      ? "border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed"
      : error
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-500";
    
    return `${baseClasses} ${stateClasses} ${className}`;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
      // TODO: Implement keyboard navigation through options
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef} style={style}>
      {debugLabel && (
        <div className="text-xs text-gray-500 mb-1">
          Debug: {debugLabel} | Products: {products.length} | Filtered: {filteredProducts.length} | Loading: {loading.toString()}
        </div>
      )}
      
      {/* Search Input (if enabled) */}
      {showSearch && (
        <div className="relative mb-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={handleSearchFocus}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || disabled}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Refresh products"
            >
              <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={getButtonClasses()}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-required={required}
      >
        <div className="flex items-center flex-1 min-w-0">
          <Package className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <span className={`truncate ${selectedProduct ? 'text-gray-900' : 'text-gray-500'}`}>
            {getDisplayText()}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          {/* Refresh Button (if search is disabled) */}
          {!showSearch && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || disabled}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Refresh products"
            >
              <RefreshCw className={`w-3 h-3 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {/* Dropdown Arrow */}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          Failed to load products
          <button
            type="button"
            onClick={handleRetry}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
              Loading products...
            </div>
          ) : error ? (
            <div className="px-3 py-2 text-red-600 text-center">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Failed to load products
              <button
                onClick={handleRetry}
                className="block w-full mt-2 text-blue-600 hover:text-blue-800 underline"
              >
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="px-3 py-2 text-gray-500 text-center">
              {searchTerm ? `No products found matching "${searchTerm}"` : 'No products available'}
            </div>
          ) : (
            filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => handleProductSelect(product)}
                disabled={product.isOutOfStock}
                className={`w-full px-3 py-2 text-left transition-colors ${
                  product.isOutOfStock 
                    ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0">
                    <Package className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {getProductOptionText(product)}
                      </div>
                      {product.category && (
                        <div className="text-sm text-gray-500 truncate">
                          {product.category}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="ml-2 flex-shrink-0">
                    {getStockIndicator(product)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDropdown;