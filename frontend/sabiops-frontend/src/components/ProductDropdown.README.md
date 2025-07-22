# ProductDropdown Component

A reusable, feature-rich dropdown component for selecting products in React applications. Built with TypeScript, Radix UI, and Tailwind CSS.

## Features

✅ **Rich Product Display**: Shows product name, price, stock quantity, and SKU  
✅ **Stock Status Indicators**: Color-coded badges for in-stock, low-stock, and out-of-stock items  
✅ **Smart Label Formatting**: Automatic text truncation with full names in tooltips  
✅ **Flexible Configuration**: Customizable display options for different use cases  
✅ **Accessibility First**: Proper ARIA labels, keyboard navigation, and screen reader support  
✅ **Type Safety**: Full TypeScript support with comprehensive interfaces  
✅ **Alphabetical Sorting**: Products automatically sorted by name for better UX  
✅ **Empty State Handling**: Graceful handling of empty product lists  
✅ **ID Type Flexibility**: Supports both string and numeric product IDs  

## Installation

The component is already integrated into the project. Simply import it:

```tsx
import ProductDropdown, { Product } from './components/ProductDropdown';
```

## Basic Usage

```tsx
import React, { useState } from 'react';
import ProductDropdown, { Product } from './components/ProductDropdown';

const MyComponent = () => {
  const [selectedProduct, setSelectedProduct] = useState<string | number | null>(null);
  
  const products: Product[] = [
    {
      id: '1',
      name: 'MacBook Pro',
      price: 500000,
      quantity: 10,
      low_stock_threshold: 5,
      sku: 'MBP-001'
    },
    // ... more products
  ];

  return (
    <ProductDropdown
      products={products}
      selectedProduct={selectedProduct}
      onChange={setSelectedProduct}
      placeholder="Select a product..."
    />
  );
};
```

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `products` | `Product[]` | Array of products to display in the dropdown |
| `onChange` | `(productId: string \| number \| null) => void` | Callback when selection changes |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `selectedProduct` | `string \| number \| undefined` | `undefined` | Currently selected product ID |
| `showLowStockColor` | `boolean` | `false` | Whether to show color-coded stock status badges |
| `placeholder` | `string` | `"Select a product..."` | Placeholder text when no selection |
| `disabled` | `boolean` | `false` | Whether the dropdown is disabled |
| `className` | `string` | `undefined` | Custom CSS class name for the trigger |
| `showPrice` | `boolean` | `true` | Whether to show price in option labels |
| `showStock` | `boolean` | `true` | Whether to show stock quantity in option labels |
| `maxNameLength` | `number` | `30` | Maximum characters for product name display |

## Product Interface

```typescript
interface Product {
  id: string | number;           // Unique identifier
  name: string;                  // Product name (required)
  price: number;                 // Product price in minor currency units
  quantity?: number;             // Current stock quantity (optional)
  low_stock_threshold?: number;  // When to show low stock warning (optional)
  category?: string;             // Product category (optional)
  sku?: string;                 // Stock keeping unit (optional)
  cost_price?: number;          // Cost price for margin calculations (optional)
}
```

## Usage Examples

### Basic Product Selection
```tsx
<ProductDropdown
  products={products}
  selectedProduct={selectedId}
  onChange={setSelectedId}
/>
```

### With Stock Status Indicators
```tsx
<ProductDropdown
  products={products}
  selectedProduct={selectedId}
  onChange={setSelectedId}
  showLowStockColor={true}
/>
```

### Minimal Display (Name Only)
```tsx
<ProductDropdown
  products={products}
  selectedProduct={selectedId}
  onChange={setSelectedId}
  showPrice={false}
  showStock={false}
/>
```

### Custom Styling
```tsx
<ProductDropdown
  products={products}
  selectedProduct={selectedId}
  onChange={setSelectedId}
  className="w-80 border-2 border-blue-300"
  placeholder="Choose your product..."
/>
```

### Form Integration
```tsx
<form>
  <label htmlFor="product-select">Product *</label>
  <ProductDropdown
    products={products}
    selectedProduct={formData.productId}
    onChange={(id) => setFormData({...formData, productId: id})}
    showLowStockColor={true}
    placeholder="Select a product..."
    className="w-full"
  />
</form>
```

## Stock Status System

The component automatically calculates stock status based on `quantity` and `low_stock_threshold`:

- **In Stock** 🟢: `quantity > low_stock_threshold`
- **Low Stock** 🟡: `0 < quantity <= low_stock_threshold`  
- **Out of Stock** 🔴: `quantity === 0`
- **No Tracking**: When `quantity` is undefined (for services, etc.)

## Accessibility Features

- **Keyboard Navigation**: Full support for Tab, Enter, Escape, and Arrow keys
- **Screen Readers**: Proper ARIA labels and descriptions
- **High Contrast**: Color-coded status indicators with icons
- **Focus Management**: Clear focus indicators and logical tab order
- **Semantic HTML**: Uses proper combobox and listbox roles

## Testing

The component includes comprehensive unit tests covering:

- Basic rendering and prop handling
- User interactions and selections
- Keyboard navigation
- Stock status display
- Edge cases and error states
- Accessibility compliance

Run tests with:
```bash
npm test src/components/__tests__/ProductDropdown.test.tsx
```

## Storybook Stories

Interactive examples are available in Storybook:

- Default usage
- With stock colors
- Custom configurations
- Empty states
- Accessibility features
- Form integration

## Performance Considerations

- **Memoization**: Consider using `useMemo` for large product lists
- **Debouncing**: For real-time filtering, debounce search queries
- **Virtualization**: For 1000+ products, consider implementing virtual scrolling

```tsx
// Example with memoization
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.name.localeCompare(b.name)),
  [products]
);
```

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Dependencies

- React 18+
- TypeScript 4.5+
- Radix UI Select
- Tailwind CSS 3+
- Lucide React (icons)

## Contributing

When contributing to this component:

1. Maintain TypeScript strict mode compliance
2. Add tests for new features
3. Update Storybook stories
4. Follow existing code patterns
5. Ensure accessibility standards

## Related Components

- `SearchableSelect`: For searchable product selection
- `ProductCard`: For displaying product information
- `InventoryTable`: For managing product inventory

## Migration Guide

### From v1 to v2
- `onSelect` prop renamed to `onChange`
- Stock status calculation now automatic
- Added support for numeric IDs

### Common Patterns

```tsx
// Multi-select (requires custom implementation)
// Invoice line item selection
// Inventory management
// Product catalog browsing
```

## License

This component is part of the SabiOps Frontend project and follows the project's licensing terms.
