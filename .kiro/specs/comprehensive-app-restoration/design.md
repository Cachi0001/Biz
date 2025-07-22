# Design Document

## Overview

This design document outlines the comprehensive restoration and enhancement of the SabiOps business management application. The application currently has a solid foundation with existing components and working backend APIs, but several critical pages are non-functional and the notification system needs implementation. The design leverages existing components and patterns while ensuring consistency, mobile responsiveness, and proper error handling.

## Architecture

### Current State Analysis

**Working Components:**
- Sales page with stable input handling
- Backend APIs for all modules (invoices, expenses, sales, products, customers)
- Existing UI components: CustomInvoiceForm, ReviewDialog, InvoiceCard, ExpenseCard
- StableInput and MobileDateInput components for focus management
- Authentication and user management system

**Issues to Address:**
- Invoices page returns null (completely empty)
- Expenses page may have data display issues
- Toast notifications not working across the app
- Inconsistent error handling
- Mobile responsiveness gaps

### System Architecture

```
Frontend (React)
├── Pages Layer
│   ├── Invoices.jsx (needs complete implementation)
│   ├── Expenses.jsx (needs data display fixes)
│   ├── Sales.jsx (working - reference implementation)
│   ├── Products.jsx (needs verification)
│   └── Customers.jsx (needs verification)
├── Components Layer
│   ├── Forms (CustomInvoiceForm, existing patterns)
│   ├── Cards (InvoiceCard, ExpenseCard)
│   ├── UI (StableInput, MobileDateInput)
│   └── Notifications (ToastManager - needs implementation)
├── Services Layer
│   ├── API services (working)
│   ├── Notification service (needs enhancement)
│   └── Error handling utilities
└── Utils Layer
    ├── Formatting utilities
    ├── Validation utilities
    └── Mobile optimization utilities

Backend (Flask/Python)
├── Working APIs for all modules
├── Supabase integration
└── Error handling and validation
```

## Components and Interfaces

### 1. Page Components Restoration

#### Invoices Page Implementation
```jsx
// Biz/frontend/sabiops-frontend/src/pages/Invoices.jsx
const Invoices = () => {
  // State management for invoices, customers, products
  // Integration with existing CustomInvoiceForm
  // Use of existing ReviewDialog for invoice review
  // Display using existing InvoiceCard component
  // Proper error handling and loading states
}
```

**Key Features:**
- List view with InvoiceCard components
- Create/Edit using CustomInvoiceForm
- Review workflow using ReviewDialog
- Mobile-responsive design
- Search, filter, and pagination
- Status management (draft, sent, paid, overdue)

#### Expenses Page Enhancement
```jsx
// Enhancement of existing Expenses.jsx
const Expenses = () => {
  // Fix data display issues
  // Ensure proper API integration
  // Use existing ExpenseCard component
  // Implement proper error handling
}
```

### 2. Notification System Implementation

#### Toast Notification Manager
```jsx
// Enhanced ToastManager component
const ToastManager = () => {
  // Branded toast notifications
  // Success/error/warning/info types
  // Mobile-optimized positioning
  // Auto-dismiss with manual override
  // Queue management for multiple toasts
}
```

**Toast Types:**
- Success: Green branding color (#22c55e)
- Error: Red with user-friendly messages
- Warning: Orange for alerts
- Info: Blue for general information

#### Notification Service Enhancement
```javascript
// Enhanced notification service
const notificationService = {
  showSuccess: (message, options) => {},
  showError: (message, options) => {},
  showWarning: (message, options) => {},
  showInfo: (message, options) => {},
  // Firebase push notification integration
  initializePushNotifications: () => {},
  sendPushNotification: (data) => {}
}
```

### 3. Form Stability System

#### StableInput Component Pattern
```jsx
// Existing StableInput component usage
const StableInput = ({ 
  value, 
  onChange, 
  debounceMs = 300,
  ...props 
}) => {
  // Focus management
  // Debounced input handling
  // Mobile optimization
  // Error state handling
}
```

**Implementation Strategy:**
- Use existing StableInput for all text inputs
- Use existing MobileDateInput for date fields
- Maintain Sales page patterns as reference
- Ensure consistent behavior across all forms

### 4. Mobile Responsiveness Framework

#### Responsive Design Patterns
```css
/* Mobile-first responsive design */
.mobile-card-view {
  display: block;
}

.desktop-table-view {
  display: none;
}

@media (min-width: 768px) {
  .mobile-card-view {
    display: none;
  }
  
  .desktop-table-view {
    display: block;
  }
}
```

**Key Principles:**
- Mobile-first design approach
- Touch-friendly button sizes (minimum 44px)
- Card-based layouts for mobile
- Table layouts for desktop
- Proper viewport handling

## Data Models

### Invoice Data Model
```typescript
interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  total_amount: number;
  currency: string;
  notes?: string;
  terms_and_conditions?: string;
}

interface InvoiceItem {
  id: string;
  product_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
}
```

### Expense Data Model
```typescript
interface Expense {
  id: string;
  category: string;
  sub_category?: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  receipt_url?: string;
  notes?: string;
}
```

### Notification Data Model
```typescript
interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}
```

## Error Handling

### Error Handling Strategy

#### API Error Handling
```javascript
// Enhanced error handling utility
const handleApiError = (error, context) => {
  // Log error for debugging
  console.error(`[${context}] API Error:`, error);
  
  // Extract user-friendly message
  const message = extractUserFriendlyMessage(error);
  
  // Show appropriate toast notification
  notificationService.showError(message);
  
  // Return structured error for component handling
  return {
    hasError: true,
    message,
    canRetry: isRetryableError(error)
  };
};
```

#### User-Friendly Error Messages
```javascript
const errorMessages = {
  network: "Please check your internet connection and try again.",
  timeout: "The request took too long. Please try again.",
  validation: "Please check your input and try again.",
  permission: "You don't have permission to perform this action.",
  notFound: "The requested item was not found.",
  serverError: "Something went wrong on our end. Please try again later."
};
```

### Form Validation
```javascript
// Enhanced form validation
const validateInvoiceForm = (formData) => {
  const errors = {};
  
  if (!formData.customer_id) {
    errors.customer_id = "Please select a customer";
  }
  
  if (!formData.items || formData.items.length === 0) {
    errors.items = "Please add at least one item";
  }
  
  // Validate each item
  formData.items?.forEach((item, index) => {
    if (!item.description) {
      errors[`items.${index}.description`] = "Description is required";
    }
    if (!item.quantity || item.quantity <= 0) {
      errors[`items.${index}.quantity`] = "Quantity must be greater than 0";
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

## Testing Strategy

### Component Testing
```javascript
// Test existing components
describe('InvoiceCard', () => {
  it('should display invoice information correctly', () => {});
  it('should handle edit action', () => {});
  it('should handle delete action', () => {});
});

describe('CustomInvoiceForm', () => {
  it('should validate form data', () => {});
  it('should handle item addition/removal', () => {});
  it('should calculate totals correctly', () => {});
});
```

### Integration Testing
```javascript
// Test page functionality
describe('Invoices Page', () => {
  it('should load invoices from API', () => {});
  it('should create new invoice', () => {});
  it('should show review dialog before submission', () => {});
  it('should display success toast on creation', () => {});
});
```

### Mobile Testing
```javascript
// Test mobile responsiveness
describe('Mobile Responsiveness', () => {
  it('should display card view on mobile', () => {});
  it('should handle touch interactions', () => {});
  it('should prevent zoom on input focus', () => {});
});
```

## Implementation Phases

### Phase 1: Core Functionality Restoration
1. Implement complete Invoices page using existing components
2. Fix Expenses page data display issues
3. Verify Products and Customers pages functionality
4. Ensure all CRUD operations work properly

### Phase 2: Notification System Implementation
1. Enhance ToastManager component
2. Implement branded toast notifications
3. Add notifications to all CRUD operations
4. Implement user-friendly error messages

### Phase 3: Mobile Optimization
1. Ensure all pages are mobile-responsive
2. Optimize touch interactions
3. Implement proper mobile date inputs
4. Test across different screen sizes

### Phase 4: Push Notifications
1. Set up Firebase integration
2. Implement push notification service
3. Add push notifications for key events
4. Test notification delivery and handling

### Phase 5: Performance and Polish
1. Optimize loading states
2. Implement proper error boundaries
3. Add accessibility improvements
4. Clean up unused code and components

## Security Considerations

### Input Validation
- Client-side validation for user experience
- Server-side validation for security
- Sanitization of user inputs
- Protection against XSS attacks

### Authentication
- JWT token validation
- Role-based access control
- Session management
- Secure API communication

### Data Protection
- Sensitive data encryption
- Secure storage practices
- HTTPS enforcement
- Input sanitization

## Performance Optimizations

### Loading Optimization
```javascript
// Lazy loading for better performance
const LazyInvoices = lazy(() => import('./pages/Invoices'));
const LazyExpenses = lazy(() => import('./pages/Expenses'));
```

### Data Fetching
```javascript
// Optimized data fetching
const useInvoices = () => {
  return useQuery(['invoices'], fetchInvoices, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });
};
```

### Bundle Optimization
- Code splitting by routes
- Tree shaking for unused code
- Image optimization
- CSS optimization

This design provides a comprehensive approach to restoring and enhancing the SabiOps application while leveraging existing components and maintaining consistency across the user experience.