# Design Document

## Overview

This design addresses the critical console errors and UI inconsistencies in the SabiOps dashboard. The solution focuses on fixing data handling issues, improving error management, standardizing UI components, and ensuring robust API integration.

## Architecture

### Error Handling Strategy
- **Defensive Programming**: Add null checks and data validation before array operations
- **Graceful Degradation**: Show meaningful fallback UI when data is unavailable
- **User-Friendly Messages**: Replace technical errors with actionable user messages
- **Retry Mechanisms**: Provide users with options to retry failed operations

### Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── ErrorBoundary.jsx (enhanced)
│   │   ├── LoadingState.jsx
│   │   └── EmptyState.jsx
│   ├── forms/
│   │   ├── InvoiceForm.jsx (fixed validation)
│   │   └── FormField.jsx (standardized)
│   └── ui/
│       └── Button.jsx (consistent styling)
├── pages/
│   └── Sales.jsx (fixed data handling)
└── utils/
    ├── validation.js
    └── errorHandling.js
```

## Components and Interfaces

### 1. Sales Page Data Handling
**Problem**: `i.map is not a function` error occurs when API returns non-array data
**Solution**: 
- Add data validation before rendering
- Implement proper loading and error states
- Use fallback empty arrays for map operations
- Handle API failures gracefully

### 2. Invoice Form Validation
**Problem**: Form inputs not properly validated, causing backend errors
**Solution**:
- Implement comprehensive form validation
- Add real-time field validation
- Ensure proper data formatting before API calls
- Add customer and product selection validation

### 3. Button Styling Consistency
**Problem**: Inconsistent green colors across components
**Solution**:
- Create standardized Button component
- Define consistent color palette in Tailwind config
- Apply brand colors (#10B981) consistently
- Ensure proper hover and active states

### 4. API Error Handling
**Problem**: 500 errors not handled gracefully
**Solution**:
- Implement retry logic for failed requests
- Add timeout handling
- Show user-friendly error messages
- Provide fallback data when appropriate

## Data Models

### Sales Data Structure
```javascript
// Expected API Response
{
  success: boolean,
  data: {
    dailyReport: Array<SalesRecord>,
    summary: {
      totalSales: number,
      totalRevenue: number,
      averageOrderValue: number
    }
  },
  error?: string
}

// Component State
{
  salesData: Array<SalesRecord>,
  loading: boolean,
  error: string | null,
  lastUpdated: Date
}
```

### Invoice Form Data
```javascript
// Invoice Form Structure
{
  customer_id: string (required),
  issue_date: string (required),
  due_date: string,
  payment_terms: string,
  items: Array<{
    product_id?: string,
    description: string (required),
    quantity: number (required, min: 1),
    unit_price: number (required, min: 0),
    tax_rate: number (default: 0),
    discount_rate: number (default: 0)
  }>,
  overall_discount: number (default: 0),
  notes?: string
}
```

## Error Handling

### Sales Page Error States
1. **API Failure**: Show retry button with error message
2. **No Data**: Display empty state with call-to-action
3. **Loading**: Show skeleton loading components
4. **Network Error**: Offline indicator with retry option

### Form Validation Errors
1. **Required Fields**: Highlight missing fields with clear messages
2. **Invalid Data**: Show field-specific validation errors
3. **API Errors**: Display server validation errors inline
4. **Network Issues**: Show connection error with retry option

### Global Error Handling
1. **Error Boundary**: Catch and display React errors gracefully
2. **Console Logging**: Structured error logging for debugging
3. **User Notifications**: Toast notifications for system errors
4. **Fallback UI**: Graceful degradation when components fail

## Testing Strategy

### Unit Tests
- Form validation functions
- Data transformation utilities
- Error handling helpers
- Button component variants

### Integration Tests
- Sales page data loading
- Invoice form submission
- API error scenarios
- Navigation between pages

### Manual Testing
- Console error verification
- Mobile responsiveness
- Button consistency check
- Form validation flow

### Error Scenario Testing
- Network disconnection
- API timeout handling
- Invalid data responses
- Empty data states