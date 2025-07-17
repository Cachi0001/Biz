# SabiOps Comprehensive Fix - Design Document

## Overview

This design document outlines the comprehensive solution to fix all critical functionality gaps in the SabiOps project. The solution focuses on backend API completion, frontend-backend integration, mobile responsiveness, and Nigerian SME-specific features.

## Architecture

### Backend Architecture Improvements

```
Backend Structure:
├── src/routes/
│   ├── customer.py (✅ EXISTS - NEEDS COMPLETION)
│   ├── product.py (✅ EXISTS - NEEDS COMPLETION)  
│   ├── invoice.py (✅ EXISTS - NEEDS COMPLETION)
│   ├── sales.py (✅ EXISTS - NEEDS COMPLETION)
│   ├── expense.py (✅ EXISTS - NEEDS COMPLETION)
│   └── dashboard.py (✅ EXISTS - WORKING)
├── src/services/
│   ├── supabase_service.py (✅ EXISTS)
│   ├── paystack_service.py (✅ EXISTS)
│   └── email_service.py (✅ EXISTS)
└── Database Schema (✅ COMPLETE)
```

### Frontend Architecture Improvements

```
Frontend Structure:
├── src/pages/ (✅ ALL MODERNIZED)
├── src/components/
│   ├── dashboard/ (✅ COMPLETE)
│   ├── customers/ (✅ EXISTS - NEEDS DATA FIXES)
│   ├── ui/ (✅ COMPLETE)
│   └── forms/ (NEW - STANDARDIZED FORMS)
├── src/services/
│   └── api.js (✅ EXISTS - NEEDS RESPONSE HANDLING)
└── src/utils/
    └── formatting.js (NEW - NIGERIAN FORMATTING)
```

## Components and Interfaces

### 1. Backend API Standardization

#### Standard Response Format
```python
# Success Response
{
    "success": True,
    "message": "Operation successful",
    "data": {
        # Actual data here
    }
}

# Error Response  
{
    "success": False,
    "message": "User-friendly error message",
    "error": "Technical error details"
}
```

#### Customer Management API
```python
# GET /customers/
Response: {
    "success": True,
    "data": {
        "customers": [
            {
                "id": "uuid",
                "name": "Customer Name",
                "email": "email@example.com", 
                "phone": "+234...",
                "address": "Address",
                "business_name": "Business Name",
                "total_purchases": 150000.00,
                "last_purchase_date": "2025-01-15T10:30:00Z",
                "created_at": "2025-01-01T00:00:00Z"
            }
        ],
        "total_count": 25
    }
}

# POST /customers/
Request: {
    "name": "Customer Name",
    "email": "email@example.com",
    "phone": "+234...",
    "address": "Address", 
    "business_name": "Business Name"
}
```

#### Product Management API
```python
# GET /products/
Response: {
    "success": True,
    "data": {
        "products": [
            {
                "id": "uuid",
                "name": "Product Name",
                "description": "Description",
                "price": 25000.00,
                "cost_price": 15000.00,
                "quantity": 50,
                "low_stock_threshold": 10,
                "category": "Electronics",
                "sku": "PROD-001",
                "image_url": "https://...",
                "is_low_stock": False,
                "created_at": "2025-01-01T00:00:00Z"
            }
        ],
        "categories": ["Electronics", "Clothing", "Food"],
        "low_stock_count": 3
    }
}
```

#### Sales Management API
```python
# GET /sales/
Response: {
    "success": True,
    "data": {
        "sales": [
            {
                "id": "uuid",
                "customer_id": "uuid",
                "customer_name": "Customer Name",
                "product_id": "uuid", 
                "product_name": "Product Name",
                "quantity": 2,
                "unit_price": 25000.00,
                "total_amount": 50000.00,
                "payment_method": "cash",
                "date": "2025-01-15T10:30:00Z",
                "salesperson_id": "uuid"
            }
        ],
        "summary": {
            "total_sales": 500000.00,
            "total_transactions": 25,
            "today_sales": 50000.00
        }
    }
}
```

### 2. Frontend Component Standardization

#### Standardized Card Component
```jsx
// CustomerCard.jsx
const CustomerCard = ({ customer, stats, onEdit, onDelete, onView }) => {
  return (
    <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with name and actions */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {customer.name}
              </h3>
              {customer.business_name && (
                <p className="text-sm text-gray-600 truncate">
                  {customer.business_name}
                </p>
              )}
            </div>
            <div className="flex gap-1 ml-2">
              <Button variant="ghost" size="sm" onClick={() => onView(customer)}>
                <Eye className="h-4 w-4 text-blue-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(customer)}>
                <Edit className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(customer.id)}>
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-1">
            {customer.email && (
              <p className="text-sm text-gray-600 truncate">{customer.email}</p>
            )}
            {customer.phone && (
              <p className="text-sm text-gray-600">{customer.phone}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-semibold text-green-600">
                ₦{(stats?.totalSpent || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Total Spent</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-blue-600">
                {stats?.totalPurchases || 0}
              </p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

#### Standardized Form Component
```jsx
// StandardForm.jsx
const StandardForm = ({ 
  fields, 
  data, 
  onChange, 
  onSubmit, 
  onCancel, 
  loading, 
  submitText = "Save",
  cancelText = "Cancel" 
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          
          {field.type === 'textarea' ? (
            <Textarea
              id={field.name}
              name={field.name}
              value={data[field.name] || ''}
              onChange={onChange}
              placeholder={field.placeholder}
              required={field.required}
              rows={field.rows || 3}
            />
          ) : field.type === 'select' ? (
            <Select 
              value={data[field.name] || ''} 
              onValueChange={(value) => onChange({ target: { name: field.name, value } })}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              id={field.name}
              name={field.name}
              type={field.type || 'text'}
              value={data[field.name] || ''}
              onChange={onChange}
              placeholder={field.placeholder}
              required={field.required}
              step={field.step}
            />
          )}
        </div>
      ))}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelText}
        </Button>
        <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? 'Saving...' : submitText}
        </Button>
      </div>
    </form>
  );
};
```

### 3. Nigerian SME Formatting Utilities

```javascript
// utils/formatting.js
export const formatNaira = (amount) => {
  if (!amount && amount !== 0) return '₦0';
  return `₦${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPhone = (phone) => {
  if (!phone) return '';
  // Format Nigerian phone numbers
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  }
  return phone;
};

export const getBusinessCategories = () => [
  'Retail/Trading',
  'Food & Beverages', 
  'Fashion & Clothing',
  'Electronics',
  'Health & Beauty',
  'Home & Garden',
  'Automotive',
  'Services',
  'Manufacturing',
  'Agriculture',
  'Other'
];

export const getExpenseCategories = () => [
  'Inventory/Stock',
  'Rent',
  'Utilities',
  'Transportation',
  'Marketing',
  'Staff Salaries',
  'Equipment',
  'Professional Services',
  'Insurance',
  'Taxes',
  'Other'
];
```

## Data Models

### Enhanced Customer Model
```javascript
const customerFields = [
  { name: 'name', label: 'Customer Name', type: 'text', required: true, placeholder: 'Enter customer name' },
  { name: 'email', label: 'Email Address', type: 'email', placeholder: 'customer@example.com' },
  { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+234...' },
  { name: 'business_name', label: 'Business Name', type: 'text', placeholder: 'Customer business name' },
  { name: 'address', label: 'Address', type: 'textarea', rows: 2, placeholder: 'Customer address' },
  { name: 'notes', label: 'Notes', type: 'textarea', rows: 3, placeholder: 'Additional notes about customer' }
];
```

### Enhanced Product Model
```javascript
const productFields = [
  { name: 'name', label: 'Product Name', type: 'text', required: true, placeholder: 'Enter product name' },
  { name: 'description', label: 'Description', type: 'textarea', rows: 3, placeholder: 'Product description' },
  { name: 'sku', label: 'SKU/Product Code', type: 'text', placeholder: 'PROD-001' },
  { 
    name: 'category', 
    label: 'Category', 
    type: 'select', 
    options: getBusinessCategories().map(cat => ({ value: cat, label: cat })),
    placeholder: 'Select category'
  },
  { name: 'price', label: 'Selling Price (₦)', type: 'number', step: '0.01', required: true, placeholder: '0.00' },
  { name: 'cost_price', label: 'Cost Price (₦)', type: 'number', step: '0.01', placeholder: '0.00' },
  { name: 'quantity', label: 'Stock Quantity', type: 'number', required: true, placeholder: '0' },
  { name: 'low_stock_threshold', label: 'Low Stock Alert', type: 'number', placeholder: '5' },
  { name: 'image_url', label: 'Image URL', type: 'url', placeholder: 'https://...' }
];
```

## Error Handling

### Standardized Error Handler
```javascript
// utils/errorHandling.js
export const handleApiError = (error, fallbackMessage = 'An error occurred') => {
  console.error('API Error:', error);
  
  let message = fallbackMessage;
  
  if (!navigator.onLine) {
    message = 'No internet connection. Please check your connection and try again.';
  } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    message = 'Request timed out. Please try again.';
  } else if (error.response?.status === 401) {
    message = 'Session expired. Please log in again.';
    // Redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    message = 'You do not have permission to perform this action.';
  } else if (error.response?.status === 404) {
    message = 'The requested resource was not found.';
  } else if (error.response?.status >= 500) {
    message = 'Server error. Please try again later.';
  } else if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.message) {
    message = error.message;
  }
  
  return message;
};

export const showToast = (type, message) => {
  const toastConfig = {
    style: {
      background: type === 'success' ? '#10b981' : '#ef4444',
      color: '#ffffff',
      fontWeight: '500',
    },
    iconTheme: {
      primary: '#ffffff',
      secondary: type === 'success' ? '#10b981' : '#ef4444',
    },
  };
  
  if (type === 'success') {
    toast.success(message, toastConfig);
  } else {
    toast.error(message, toastConfig);
  }
};
```

## Testing Strategy

### Backend API Testing
```python
# Test each endpoint with:
1. Valid data scenarios
2. Invalid data scenarios  
3. Authentication scenarios
4. Error handling scenarios
5. Response format validation
```

### Frontend Component Testing
```javascript
// Test each component with:
1. Data loading states
2. Error states
3. Empty states
4. Mobile responsiveness
5. User interactions
```

### Integration Testing
```javascript
// Test complete user flows:
1. Customer creation → viewing → editing
2. Product creation → inventory updates
3. Sale creation → inventory reduction → transaction creation
4. Invoice creation → payment tracking
5. Dashboard data accuracy
```

## Mobile Responsiveness Strategy

### Breakpoint Strategy
```css
/* Mobile First Approach */
.container {
  /* Mobile: Full width with padding */
  @apply w-full px-3;
}

@media (min-width: 640px) {
  .container {
    /* Small tablets: 2 columns */
    @apply px-4;
  }
}

@media (min-width: 768px) {
  .container {
    /* Tablets: Switch to table view */
    @apply px-6;
  }
}

@media (min-width: 1024px) {
  .container {
    /* Desktop: Full layout */
    @apply px-8 max-w-7xl mx-auto;
  }
}
```

### Card Layout Strategy
```jsx
// Mobile: 2 cards per row
<div className="grid grid-cols-2 gap-3 md:hidden">
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</div>

// Desktop: Table view
<div className="hidden md:block">
  <Table>
    {/* Table content */}
  </Table>
</div>
```

This design provides a comprehensive solution to fix all identified issues while maintaining the modern UI and ensuring proper mobile responsiveness for Nigerian SME users.