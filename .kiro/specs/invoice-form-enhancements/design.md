# Design Document

## Overview

This design document outlines the comprehensive enhancements to the existing invoice form system. The enhancements focus on improving user experience through automation, better validation, mobile optimization, and professional features. The design builds upon the existing React-based invoice form in `Invoices.jsx` and extends it with modern UX patterns and robust functionality.

## Architecture

### Current System Analysis
- **Frontend**: React component in `Invoices.jsx` with form state management
- **Backend**: Flask API with Supabase database (`invoice.py`)
- **State Management**: Local React state with `useState` hooks
- **Validation**: Basic client-side validation
- **UI Components**: Shadcn/ui component library

### Enhanced Architecture
- **Auto-Generation Service**: Client-side service for invoice number generation
- **Validation Engine**: Real-time validation with error state management
- **Search Components**: Searchable dropdown components using react-select
- **Mobile-First Design**: Responsive components with touch-friendly interfaces
- **Review System**: Modal-based review workflow before submission

## Components and Interfaces

### 1. Auto-Generation Service

```typescript
interface InvoiceNumberService {
  generateNextInvoiceNumber(): Promise<string>
  getLastInvoiceNumber(): Promise<string>
  validateInvoiceNumber(number: string): boolean
}
```

**Implementation Strategy:**
- **Database-level generation**: Invoice numbers auto-generated via PostgreSQL sequence (`invoice_number_seq`)
- **Format**: "INV-XXXXXX" (6-digit padded sequence)
- **Client-side**: Remove manual invoice_number from form data (handled by database)
- **Fallback**: Database default ensures no duplicates or missing numbers

### 2. Seller Information Service

```typescript
interface SellerInfo {
  name: string
  address: string
  contact: string
  email?: string
  phone?: string
}

interface SellerInfoService {
  getSellerInfo(): Promise<SellerInfo>
  updateSellerInfo(info: SellerInfo): Promise<void>
}
```

**Implementation Strategy:**
- **Database-level pre-filling**: Seller info auto-populated via `prefill_seller_data()` trigger
- **Source**: Data from `users.business_name`, `users.business_address`, `users.business_contact`
- **User settings**: Additional defaults stored in `user_settings` table
- **Client-side**: Display as read-only fields, allow editing through settings page

### 3. Enhanced Search Components

```typescript
interface SearchableSelectProps {
  options: Array<{value: string, label: string}>
  value: string
  onChange: (value: string) => void
  placeholder: string
  isSearchable: boolean
  type: 'customer' | 'product'
}
```

**Implementation Strategy:**
- Replace existing Select components with react-select
- Add search functionality with real-time filtering
- Maintain existing data structure compatibility
- Add loading states and error handling

### 4. Real-Time Validation Engine

```typescript
interface ValidationError {
  field: string
  message: string
  type: 'required' | 'format' | 'range'
}

interface ValidationState {
  errors: Record<string, string>
  isValid: boolean
  touchedFields: Set<string>
}
```

**Implementation Strategy:**
- Validate on field change (debounced)
- Display errors immediately below fields
- Clear errors when field becomes valid
- Prevent submission when validation fails

### 5. Mobile-Optimized Components

```typescript
interface MobileFormProps {
  isMobile: boolean
  touchFriendly: boolean
}
```

**Implementation Strategy:**
- Increase input heights to 48px minimum
- Full-width buttons on mobile
- Larger touch targets (44px minimum)
- Responsive grid layouts
- Optimized spacing for mobile screens

### 6. Enhanced Calculation Engine

```typescript
interface CalculationEngine {
  calculateItemTotal(item: InvoiceItem): number
  calculateInvoiceTotal(items: InvoiceItem[], discount: number): number
  validateNumericInput(value: number, min: number, max?: number): number
}
```

**Implementation Strategy:**
- Prevent negative values with Math.max()
- Limit discount rates to 0-100%
- Round calculations to 2 decimal places
- Handle edge cases gracefully

### 7. Review Dialog System

```typescript
interface ReviewDialogProps {
  isOpen: boolean
  invoiceData: InvoiceFormData
  onConfirm: () => void
  onCancel: () => void
  customers: Customer[]
  products: Product[]
}
```

**Implementation Strategy:**
- Modal dialog with complete invoice preview
- Read-only display of all invoice details
- Confirmation workflow before submission
- Edit capability to return to form

## Data Models

### Enhanced Invoice Form Data

```typescript
interface EnhancedInvoiceFormData {
  // Auto-generated fields
  invoice_number: string
  
  // Seller information (pre-filled)
  seller_info: {
    name: string
    address: string
    contact: string
    email?: string
  }
  
  // Existing fields (enhanced)
  customer_id: string
  issue_date: string
  due_date: string
  payment_terms: string // Now dropdown-based
  currency: string // Multi-currency support
  
  // Enhanced items with validation
  items: Array<{
    id: string
    product_id?: string
    description: string
    quantity: number // Min: 1
    unit_price: number // Min: 0
    tax_rate: number // Min: 0
    discount_rate: number // Min: 0, Max: 100
  }>
  
  // Enhanced totals
  discount_amount: number
  total_amount: number
  
  // Enhanced notes
  notes: string
  notes_template?: string
  terms_and_conditions: string
}
```

### Validation Schema

```typescript
interface ValidationSchema {
  required_fields: string[]
  field_validators: Record<string, (value: any) => string | null>
  item_validators: Record<string, (item: InvoiceItem) => string | null>
}
```

## Error Handling

### Validation Error Display
- **Field-level errors**: Display below each input field
- **Form-level errors**: Display at top of form
- **Item-level errors**: Display within item cards
- **API errors**: Display with actionable suggestions

### Error Message Standards
- **Required fields**: "Customer is required to proceed"
- **Invalid values**: "Quantity must be greater than 0"
- **API failures**: "Failed to save invoice. Please try again."
- **Network issues**: "Connection error. Check your internet and retry."

### Error Recovery
- **Auto-retry**: For transient network errors
- **Fallback values**: For auto-generation failures
- **Graceful degradation**: When features are unavailable

## Testing Strategy

### Unit Testing
- **Validation functions**: Test all validation rules
- **Calculation engine**: Test edge cases and rounding
- **Auto-generation**: Test sequence generation and fallbacks
- **Search functionality**: Test filtering and selection

### Integration Testing
- **Form submission**: Test complete workflow
- **API integration**: Test all CRUD operations
- **Error scenarios**: Test error handling and recovery
- **Mobile responsiveness**: Test on various screen sizes

### User Acceptance Testing
- **Invoice creation flow**: End-to-end user journey
- **Mobile usability**: Touch interaction testing
- **Performance**: Form responsiveness and load times
- **Accessibility**: Screen reader and keyboard navigation

## Performance Considerations

### Optimization Strategies
- **Debounced validation**: Prevent excessive API calls
- **Memoized calculations**: Cache expensive computations
- **Lazy loading**: Load products/customers on demand
- **Request batching**: Combine related API calls

### Mobile Performance
- **Touch optimization**: Larger targets, reduced animations
- **Network efficiency**: Minimize API calls on mobile
- **Memory management**: Efficient state updates
- **Battery optimization**: Reduce background processing

## Security Considerations

### Input Validation
- **Server-side validation**: Duplicate all client validations
- **SQL injection prevention**: Parameterized queries
- **XSS prevention**: Sanitize all user inputs
- **CSRF protection**: Token-based request validation

### Data Protection
- **Sensitive data**: Encrypt invoice data at rest
- **Access control**: User-based data isolation
- **Audit logging**: Track all invoice modifications
- **Backup strategy**: Regular data backups

## Accessibility Features

### WCAG Compliance
- **Keyboard navigation**: Full keyboard accessibility
- **Screen reader support**: Proper ARIA labels
- **Color contrast**: Meet WCAG AA standards
- **Focus management**: Clear focus indicators

### Assistive Technology
- **Voice input**: Support for voice commands
- **High contrast**: Support for high contrast modes
- **Text scaling**: Support for text size adjustments
- **Motor accessibility**: Large touch targets

## Implementation Phases

### Phase 1: Core Enhancements
1. Auto-generation service
2. Real-time validation
3. Enhanced calculations
4. Mobile optimization

### Phase 2: Advanced Features
1. Searchable dropdowns
2. Seller information pre-fill
3. Review dialog system
4. Payment terms dropdown

### Phase 3: Professional Features
1. Multi-currency support
2. Notes templates
3. Advanced accessibility
4. Performance optimizations

## Migration Strategy

### Backward Compatibility
- **Existing data**: Support current invoice format
- **API compatibility**: Maintain existing endpoints
- **Gradual rollout**: Feature flags for new functionality
- **Fallback mechanisms**: Graceful degradation for unsupported features

### Data Migration
- **Invoice numbers**: Generate for existing invoices
- **Seller information**: Migrate from user profiles
- **Validation**: Apply to existing data
- **Testing**: Comprehensive migration testing