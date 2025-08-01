import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { formatNaira } from '../utils/formatting';

export interface Product {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}

export interface ProductDropdownProps {
  /** Currently selected product ID */
  selectedProduct?: string | number;
  /** Products list to display in dropdown */
  products: Product[];
  /** Callback when selection changes */
  onChange: (productId: string | number | null) => void;
  /** Whether to show low stock color indicators */
  showLowStockColor?: boolean;
  /** Placeholder text when no selection */
  placeholder?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Custom class name for styling */
  className?: string;
}

/**
 * Reusable ProductDropdown component that encapsulates dropdown logic and label formatting
 * 
 * Features:
 * - Displays product name, price, and quantity
 * - Shows low stock color indicators when enabled
 * - Fully accessible with proper ARIA attributes
 */
export const ProductDropdown: React.FC<ProductDropdownProps> = ({
  selectedProduct,
  products = [],
  onChange,
  showLowStockColor = false,
  placeholder = "Select a product...",
  disabled = false,
  className,
}) => {
  /**
   * Format product label for display in dropdown options
   */
  const formatProductLabel = (product: Product): string => {
    let label = product.name;
    label += ` - ${formatNaira(product.price)}`;
    label += ` (Qty: ${product.quantity})`;
    
    if (showLowStockColor && product.quantity <= 5) {
      label += " ⚠️";
    }
    
    return label;
  };

  /**
   * Format the selected value display
   */
  const formatSelectedValue = (productId: string | number): string => {
    const product = products.find(p => p.id.toString() === productId.toString());
    if (!product) return '';
    
    return formatProductLabel(product);
  };

  /**
   * Handle selection change
   */
  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onChange(null);
    } else {
      // Find the original product to get the correct ID type
      const product = products.find(p => p.id.toString() === value);
      onChange(product ? product.id : value);
    }
  };

  // Sort products by name for better UX
  const sortedProducts = [...products].sort((a, b) => 
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  );

  return (
    <Select
      value={selectedProduct?.toString() || ''}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className} aria-label="Select product">
        <SelectValue 
          placeholder={placeholder}
          aria-label={selectedProduct ? formatSelectedValue(selectedProduct) : placeholder}
        >
          {selectedProduct ? formatSelectedValue(selectedProduct) : placeholder}
        </SelectValue>
      </SelectTrigger>
      
      <SelectContent>
        {/* Option to clear selection */}
        <SelectItem value="none">
          <span className="text-gray-500 italic">None selected</span>
        </SelectItem>
        
        {sortedProducts.length > 0 ? (
          sortedProducts.map((product) => (
            <SelectItem
              key={product.id}
              value={product.id.toString()}
              className="cursor-pointer hover:bg-gray-50"
            >
              {formatProductLabel(product)}
            </SelectItem>
          ))
        ) : (
          <SelectItem value="no-products" disabled>
            <span className="text-gray-500 italic">No products available</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default ProductDropdown;
