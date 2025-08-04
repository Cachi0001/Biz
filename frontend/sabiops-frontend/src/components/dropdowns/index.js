// Reusable Dropdown Components Export Index
// Version: 1.0.0
// Created for centralized dropdown management across the application

import CustomerDropdown from './CustomerDropdown.jsx';
import ProductDropdown from './ProductDropdown.jsx';
import DatePicker from './DatePicker.jsx';
import VirtualizedDropdown from './VirtualizedDropdown.jsx';
import PaymentMethodDropdown from './PaymentMethodDropdown.jsx';

export { CustomerDropdown, ProductDropdown, DatePicker, VirtualizedDropdown, PaymentMethodDropdown };

export default {
  CustomerDropdown,
  ProductDropdown,
  DatePicker,
  VirtualizedDropdown,
  PaymentMethodDropdown
};

export const USAGE_EXAMPLES = {
  CustomerDropdown: `
    import { CustomerDropdown } from '../components/dropdowns';
    
    <CustomerDropdown
      value={selectedCustomer}
      onChange={(customer) => setSelectedCustomer(customer)}
      placeholder="Select a customer"
      allowWalkIn={true}
      debugLabel="SalesForm"
    />
  `,
  
  ProductDropdown: `
    import { ProductDropdown } from '../components/dropdowns';
    
    <ProductDropdown
      value={selectedProduct}
      onChange={(product) => setSelectedProduct(product)}
      placeholder="Select a product"
      showStock={true}
      showPrice={true}
      showSearch={true}
      debugLabel="InvoiceForm"
    />
  `,
  
  DatePicker: `
    import { DatePicker } from '../components/dropdowns';
    
    <DatePicker
      value={selectedDate}
      onChange={(date) => setSelectedDate(date)}
      placeholder="Select date"
      format="YYYY-MM-DD"
      mobileOptimized={true}
    />
  `
};

// Component version information
export const COMPONENT_VERSION = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  components: {
    CustomerDropdown: '1.0.0',
    ProductDropdown: '1.0.0',
    DatePicker: '1.0.0'
  },
  features: [
    'Unified caching system',
    'Real-time search functionality',
    'Mobile-optimized date picker',
    'Error handling and retry mechanisms',
    'Subscription-based data updates',
    'Consistent component interfaces',
    'Debug logging support'
  ]
};