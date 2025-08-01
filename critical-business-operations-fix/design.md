# Design Document

## Overview

This design addresses critical business-breaking issues in the SabiOps application across multiple systems including invoice creation, payment processing, subscription management, and dashboard functionality. The solution focuses on fixing immediate errors while implementing robust error handling and recovery mechanisms.

## Architecture

The fix involves modifications across three main layers:

1. **Backend Services Layer**: Fix missing methods, import errors, and API endpoints
2. **Frontend Components Layer**: Improve error handling and data loading for dashboard cards
3. **Database Layer**: Ensure proper trial period calculation and subscription status management

## Components and Interfaces

### 1. Invoice Creation System

**Problem**: Missing `validate_stock_availability` method in `InvoiceInventoryManager`

**Solution**: 
- Add the missing method as an alias to the existing `validate_inventory_availability` method
- Implement proper error handling for stock validation failures
- Ensure consistent method naming across the codebase

**Interface Changes**:
```python
class InvoiceInventoryManager:
    def validate_stock_availability(self, invoice_items: List[Dict], owner_id: str) -> Dict:
        """Alias for validate_inventory_availability for backward compatibility"""
        return self.validate_inventory_availability(invoice_items, owner_id)
```

### 2. Payment Processing System

**Problem**: Missing `timezone` import causing subscription upgrade failures

**Solution**:
- Add proper timezone import in subscription service
- Implement timezone-aware datetime handling
- Add error recovery for payment verification failures

**Interface Changes**:
```python
from datetime import datetime, timedelta, timezone

class SubscriptionService:
    def upgrade_subscription(self, user_id: str, plan_id: str, payment_reference: str, 
                           paystack_data: Dict[str, Any]) -> Dict[str, Any]:
        # Use timezone.utc instead of undefined timezone
        now = datetime.now(timezone.utc)
```

### 3. Trial Period Management

**Problem**: New users showing 0 days instead of 7 days trial period

**Solution**:
- Fix trial period calculation logic
- Ensure proper trial activation for new users
- Implement consistent trial status display

**Components**:
- `SubscriptionService.activate_trial()` - Enhanced trial activation
- `SubscriptionService._calculate_remaining_days()` - Fixed trial calculation
- Frontend crown display component - Proper trial days rendering

### 4. Dashboard Data Loading

**Problem**: Dashboard cards showing "Not found" errors for subscription and usage data

**Solution**:
- Implement proper error handling in API endpoints
- Add fallback data structures for missing information
- Implement retry mechanisms for failed requests

**Components**:
- `AccurateUsageCards` - Enhanced error handling and retry logic
- `ModernOverviewCards` - Improved data validation and fallback values
- API endpoints - Better error responses and status codes

## Data Models

### Subscription Status Model
```typescript
interface SubscriptionStatus {
  user_id: string;
  subscription_plan: string;
  subscription_status: string;
  unified_status: string;
  remaining_days: number;
  trial_days_left: number;
  is_trial: boolean;
  is_active: boolean;
  is_expired: boolean;
  display_message: string;
}
```

### Usage Data Model
```typescript
interface UsageData {
  current_usage: {
    [feature_type: string]: {
      current: number;
      limit: number;
      percentage: number;
      period_start: string;
      period_end: string;
    }
  };
  subscription: {
    plan: string;
    status: string;
    days_remaining: number;
    is_trial: boolean;
    is_active: boolean;
  };
}
```

### Error Response Model
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  toast?: {
    type: "error";
    message: string;
    timeout: number;
  };
}
```

## Error Handling

### 1. Invoice Creation Errors
- **Missing Method Error**: Add the missing method with proper implementation
- **Stock Validation Error**: Return detailed error messages with specific stock shortages
- **Database Error**: Implement transaction rollback and proper error logging

### 2. Payment Processing Errors
- **Import Error**: Fix missing timezone import
- **API Error**: Implement proper error responses with meaningful messages
- **Database Error**: Add transaction safety and rollback mechanisms

### 3. Dashboard Loading Errors
- **API Failure**: Implement retry mechanisms with exponential backoff
- **Data Missing**: Provide fallback values and loading states
- **Network Error**: Show user-friendly error messages with retry options

### 4. Trial Period Errors
- **Calculation Error**: Fix timezone-aware date calculations
- **Display Error**: Ensure consistent trial period display across components
- **Activation Error**: Implement proper trial activation with error recovery

## Testing Strategy

### 1. Unit Tests
- Test `InvoiceInventoryManager.validate_stock_availability()` method
- Test `SubscriptionService.upgrade_subscription()` with timezone handling
- Test trial period calculation logic
- Test dashboard component error handling

### 2. Integration Tests
- Test complete invoice creation flow with stock validation
- Test payment verification and subscription upgrade flow
- Test dashboard data loading with API failures
- Test trial activation for new users

### 3. Error Scenario Tests
- Test invoice creation with insufficient stock
- Test payment processing with network failures
- Test dashboard loading with API errors
- Test trial period display with various user states

### 4. User Acceptance Tests
- Verify invoice creation works without errors
- Verify payment processing completes successfully
- Verify dashboard shows correct subscription and usage data
- Verify new users see 7-day trial period

## Implementation Approach

### Phase 1: Critical Error Fixes
1. Add missing `validate_stock_availability` method
2. Fix timezone import in subscription service
3. Fix trial period calculation logic
4. Add basic error handling to dashboard components

### Phase 2: Enhanced Error Handling
1. Implement comprehensive error responses
2. Add retry mechanisms for failed requests
3. Implement fallback data structures
4. Add proper logging and monitoring

### Phase 3: User Experience Improvements
1. Add loading states and progress indicators
2. Implement user-friendly error messages
3. Add toast notifications for success/error states
4. Implement automatic error recovery where possible

## Security Considerations

1. **Input Validation**: Ensure all user inputs are properly validated
2. **Error Information**: Avoid exposing sensitive information in error messages
3. **Authentication**: Maintain proper JWT token handling during error scenarios
4. **Authorization**: Ensure error handling doesn't bypass authorization checks

## Performance Considerations

1. **Database Queries**: Optimize queries for subscription and usage data
2. **Error Recovery**: Implement efficient retry mechanisms without overwhelming the server
3. **Caching**: Cache subscription status to reduce database load
4. **Frontend Performance**: Minimize re-renders during error states and recovery