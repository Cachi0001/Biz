# API Error Handler Import Fix

## Problem
The build was failing because `apiErrorHandler.js` was trying to import functions that don't exist in `errorHandling.js`:

```
"showWarningToast" is not exported by "src/utils/errorHandling.js", imported by "src/services/apiErrorHandler.js"
```

## Root Cause
The `apiErrorHandler.js` file was importing:
- `showWarningToast` - This function doesn't exist in errorHandling.js
- `retryApiCall` - This function doesn't exist in errorHandling.js

## Available Functions in errorHandling.js
The following functions are actually exported from `errorHandling.js`:
- `showToast(message, type = 'success')`
- `showSuccessToast(message)`
- `showErrorToast(message)`
- `handleApiError(error, defaultMessage, showToastNotification)`
- `handleApiErrorWithToast(error, defaultMessage)`
- And various other error handling functions

## Solution Applied

### 1. Fixed Import Statement
**File**: `frontend/sabiops-frontend/src/services/apiErrorHandler.js`

**Before**:
```javascript
import { showErrorToast, showWarningToast, retryApiCall } from '../utils/errorHandling';
```

**After**:
```javascript
import { showErrorToast, showSuccessToast, showToast } from '../utils/errorHandling';
```

### 2. Updated Function Usage
**Before**:
```javascript
showWarningToast(`${message} Click to retry.`, {
  ...notificationOptions,
  onClick: onRetry
});
```

**After**:
```javascript
showToast(`${message} Click to retry.`, {
  ...notificationOptions,
  onClick: onRetry
});
```

## Changes Made

### Import Statement
- ✅ Removed `showWarningToast` (doesn't exist)
- ✅ Removed `retryApiCall` (doesn't exist)
- ✅ Added `showSuccessToast` (exists)
- ✅ Added `showToast` (exists)
- ✅ Kept `showErrorToast` (exists)

### Function Usage
- ✅ Replaced `showWarningToast` calls with `showToast`
- ✅ `retryApiCall` was only used as a method name in the class, not as an imported function

## Verification
- ✅ All imports now reference existing functions
- ✅ All function calls use available functions
- ✅ Build should now succeed without import errors

## Result
The build error is now fixed. The `apiErrorHandler.js` file now only imports functions that actually exist in the `errorHandling.js` module. 