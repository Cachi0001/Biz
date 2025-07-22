# Invoice Review Dialog Component

## Overview

The `ReviewDialog` component provides a comprehensive invoice preview interface that allows users to review all invoice details before finalizing the creation or update of an invoice. This component implements the review workflow as specified in the invoice form enhancements requirements.

## Features

### Core Functionality
- **Complete Invoice Preview**: Displays all invoice details in a read-only format
- **Seller Information Display**: Automatically fetches and displays seller/business information from user profile
- **Customer Information**: Shows selected customer details with fallback for missing data
- **Invoice Items Review**: Comprehensive display of all invoice items with calculations
- **Real-time Calculations**: Shows item totals, subtotals, discounts, and grand total
- **Mobile-Responsive Design**: Optimized for both desktop and mobile viewing

### User Experience
- **Confirmation Workflow**: Requires explicit user confirmation before proceeding
- **Edit Capability**: Allows users to go back and edit the invoice
- **Error Handling**: Graceful handling of missing data with appropriate fallbacks
- **Loading States**: Shows loading indicators while fetching seller information

## Component Props

```typescript
interface ReviewDialogProps {
  isOpen: boolean;              // Controls dialog visibility
  onClose: () => void;          // Called when dialog should close
  invoiceData: InvoiceFormData; // Complete invoice form data
  customers: Customer[];        // Array of available customers
  products: Product[];          // Array of available products
  onConfirm: () => void;        // Called when user confirms the invoice
  onCancel: () => void;         // Called when user cancels/goes back
  isEdit?: boolean;             // Whether this is editing an existing invoice
}
```

## Integration

The component is integrated into the main `Invoices.jsx` component and is triggered when users submit the invoice form. Instead of directly submitting, the form now shows the review dialog first.

### Workflow
1. User fills out invoice form
2. User clicks "Create Invoice" or "Update Invoice"
3. Form validation runs
4. If validation passes, ReviewDialog opens
5. User reviews all details
6. User can either:
   - Confirm: Proceeds with invoice creation/update
   - Cancel: Returns to editable form

## Data Sources

### Seller Information
- Fetched from user profile via `getProfile()` API call
- Uses business information fields: `business_name`, `business_address`, `business_contact`
- Falls back to personal information if business fields are empty
- Provides default placeholders if no information is available

### Customer Information
- Retrieved from the customers array using `customer_id`
- Displays name, email, phone, and address
- Shows "Customer not selected" message if no customer is chosen

### Product Information
- Used to enhance invoice item display
- Shows product names alongside item descriptions
- Helps users verify correct products were selected

## Calculations

The component performs the same calculations as the main form:

### Item Total Calculation
```javascript
const calculateItemTotal = (item) => {
  const quantity = Math.max(0, parseFloat(item.quantity) || 0);
  const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
  const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
  const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

  let total = quantity * unitPrice;
  total -= total * (discountRate / 100);
  total += total * (taxRate / 100);
  
  return Math.round(total * 100) / 100;
};
```

### Invoice Total Calculation
```javascript
const calculateInvoiceTotal = () => {
  const itemsTotal = invoiceData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const discount = Math.max(0, parseFloat(invoiceData.discount_amount) || 0);
  const total = itemsTotal - discount;
  
  return Math.round(Math.max(0, total) * 100) / 100;
};
```

## Responsive Design

### Desktop View
- Two-column layout for seller/customer information
- Table format for invoice items
- Horizontal layout for action buttons

### Mobile View
- Single-column layout
- Card-based display for invoice items
- Stacked layout for better touch interaction
- Full-width buttons for easy tapping

## Error Handling

### Missing Data Scenarios
- **No Seller Info**: Shows loading state, then fallback message
- **No Customer Selected**: Shows clear error message
- **Empty Items**: Shows "No items added" message
- **API Failures**: Shows error toast and uses fallback data

### Graceful Degradation
- Component continues to function even if seller info fetch fails
- Uses placeholder values when data is missing
- Maintains functionality with partial data

## Accessibility

### ARIA Support
- Proper dialog role and labeling
- Screen reader friendly content structure
- Keyboard navigation support

### Visual Design
- High contrast colors for readability
- Clear visual hierarchy
- Consistent spacing and typography
- Touch-friendly button sizes (minimum 48px)

## Usage Example

```jsx
<ReviewDialog
  isOpen={isReviewDialogOpen}
  onClose={() => setIsReviewDialogOpen(false)}
  invoiceData={formData}
  customers={customers}
  products={products}
  onConfirm={handleReviewConfirm}
  onCancel={handleReviewCancel}
  isEdit={!!selectedInvoice}
/>
```

## Requirements Fulfilled

This component fulfills the following requirements from the specification:

- **9.1**: Shows review dialog before invoice submission
- **9.2**: Displays all invoice details clearly
- **9.3**: Provides confirmation workflow
- **9.4**: Allows cancellation to return to form
- **9.5**: Handles errors and edge cases gracefully

The component also supports the seller information pre-filling requirement (2.1-2.4) by fetching and displaying business information from the user profile.
