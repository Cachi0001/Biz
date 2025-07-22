# API Interceptor Layer with Automatic Toast Handling

## Overview

The API Interceptor layer provides automatic toast notification handling for all API requests, intercepting both success and error responses to display appropriate user feedback.

## Key Features

### ✅ Automatic Backend Toast Handling
- Intercepts `{toast: {type, message}}` payloads from backend responses
- Supports multiple toasts: `{toasts: [{type, message}, ...]}`
- Maps backend toast types to ToastService methods

### ✅ Network Error Handling
- Shows "Request timed out – please retry" for timeout errors
- Displays "Network error. Please check your connection and try again." for connectivity issues
- Provides retry buttons for recoverable errors

### ✅ HTTP Status Code Mapping
- 400: Invalid request validation errors
- 401: Automatic logout and redirect (no toast to avoid noise)
- 403: Permission denied errors
- 404: Resource not found errors
- 422: Form validation errors
- 429: Rate limiting warnings
- 5xx: Server error messages

### ✅ Enhanced Features
- Loading toasts with automatic cleanup
- Retry mechanisms for failed requests
- Request timing tracking
- Development debugging logs

## Migration Guide

### Before (using old api.js)
```javascript
import { createCustomer, getCustomers } from '../services/api';
import { showSuccessToast, showErrorToast } from '../utils/errorHandling';

// Manual toast handling required
const handleCreateCustomer = async (customerData) => {
  try {
    const result = await createCustomer(customerData);
    showSuccessToast('Customer created successfully!');
    return result;
  } catch (error) {
    showErrorToast('Failed to create customer');
    throw error;
  }
};
```

### After (using new apiClient)
```javascript
import { customerApi } from '../services/enhancedApiClient';

// Automatic toast handling
const handleCreateCustomer = async (customerData) => {
  try {
    // Loading toast shown automatically
    // Success toast shown automatically
    // Error toasts handled automatically
    const result = await customerApi.createCustomer(customerData);
    return result;
  } catch (error) {
    // Error already displayed to user
    throw error;
  }
};
```

## Usage Examples

### 1. Basic API Calls with Automatic Toasts
```javascript
import { productApi, customerApi, salesApi } from '../services/enhancedApiClient';

// All these calls have automatic toast handling
const products = await productApi.getProducts();
const newCustomer = await customerApi.createCustomer(customerData);
const salesReport = await salesApi.getSalesReport({ date: '2024-01-15' });
```

### 2. Direct HTTP Methods
```javascript
import { get, post, put, del } from '../services/enhancedApiClient';

// Direct HTTP calls with automatic toast handling
const response = await get('/custom-endpoint');
const created = await post('/custom-endpoint', data);
const updated = await put('/custom-endpoint/123', data);
const deleted = await del('/custom-endpoint/123');
```

### 3. Retry-Enabled Requests
```javascript
import { getWithRetry, postWithRetry } from '../services/enhancedApiClient';

// Automatically retries on network errors
const data = await getWithRetry('/unstable-endpoint', {}, 3); // 3 retries
const result = await postWithRetry('/submit-data', formData, {}, 1); // 1 retry
```

### 4. Loading States with Toasts
```javascript
import { withLoadingToast, get } from '../services/enhancedApiClient';

const processLargeData = async () => {
  return await withLoadingToast(
    async () => {
      const result = await get('/process-large-dataset');
      return result.data;
    },
    'Processing data, please wait...'
  );
};
```

### 5. Manual Toast Control
```javascript
import { toastService } from '../services/enhancedApiClient';

// Manual toast when needed
toastService.success('Custom success message');
toastService.error('Custom error message');
toastService.warning('Custom warning message');
toastService.info('Custom info message');

// Loading toast with manual control
const loadingId = toastService.loading('Custom loading...');
// ... do work ...
toastService.removeToast(loadingId);
```

## Backend Integration

### Expected Backend Response Formats

#### Success Response with Toast
```json
{
  "success": true,
  "data": { "id": 123, "name": "John Doe" },
  "toast": {
    "type": "success",
    "message": "Customer created successfully!"
  }
}
```

#### Error Response with Toast
```json
{
  "success": false,
  "error": "Validation failed",
  "toast": {
    "type": "error",
    "message": "Please check the required fields"
  }
}
```

#### Multiple Toasts
```json
{
  "success": true,
  "data": {...},
  "toasts": [
    { "type": "success", "message": "Data saved successfully" },
    { "type": "warning", "message": "Some fields were auto-corrected" }
  ]
}
```

## Configuration

### Timeout Settings
```javascript
// Default timeout is 30 seconds
// Timeout errors show: "Request timed out – please retry"
```

### Retry Behavior
```javascript
// GET requests: Up to 2 retries with exponential backoff
// POST requests: Up to 1 retry (conservative for data modifications)
// Retries only on network errors, not validation errors
```

### Error Toast Duration
- Network/Timeout errors: 7-8 seconds
- Validation errors: 7 seconds  
- General errors: 5 seconds
- Authentication errors: 8 seconds

## Best Practices

### ✅ Do
- Use the enhanced API methods (`customerApi`, `productApi`, etc.) for common operations
- Let the interceptor handle standard error cases
- Use `withLoadingToast` for long-running operations
- Provide meaningful loading messages

### ❌ Don't
- Manually show toasts for standard CRUD operations (they're automatic)
- Catch errors just to show toast messages (already handled)
- Use multiple API clients in the same component
- Ignore errors completely (still handle business logic)

## Debugging

### Development Mode
```javascript
// Automatic logging in development
console.log('[ApiClient] Enhanced API client initialized with automatic toast handling');
console.log('[ApiClient] Base URL:', getBaseURL());
```

### Error Information
All errors include timing information and request metadata for debugging.

### Toast Queue Status
```javascript
import { toastService } from '../services/enhancedApiClient';

// Debug toast queue
console.log(toastService.getQueueStatus());
```

## Gradual Migration Strategy

1. **Phase 1**: Import new API clients alongside existing ones
2. **Phase 2**: Update new components to use enhanced API
3. **Phase 3**: Migrate existing components one by one
4. **Phase 4**: Remove old manual toast handling code
5. **Phase 5**: Update backend to provide toast payloads

## Fallback Behavior

- If ToastService fails: Errors logged to console
- If network is offline: Automatic offline detection and messaging
- If backend doesn't provide toast payload: Standard error messages used
- If request configuration fails: User-friendly error shown

## Testing

### Unit Tests
```javascript
import { customerApi } from '../services/enhancedApiClient';
import { toastService } from '../services/ToastService';

// Mock the toast service
jest.mock('../services/ToastService');

test('shows success toast on customer creation', async () => {
  // Test that success toasts are triggered
  await customerApi.createCustomer(testData);
  expect(toastService.success).toHaveBeenCalledWith('Customer created successfully!');
});
```

### Integration Tests
Test actual API calls with toast verification in E2E tests.

---

This API interceptor layer provides a comprehensive solution for automatic toast handling while maintaining flexibility for custom use cases.
