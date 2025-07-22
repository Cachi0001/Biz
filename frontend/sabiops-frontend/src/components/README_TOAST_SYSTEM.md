# Toast System Documentation

## Overview

The new Toast System for SabiOps consists of two main components:
1. **ToastService** - A singleton service for managing toast notifications
2. **ToastProvider** - A React context provider with the `useToast` hook

This implementation provides advanced features including queueing, auto-dismiss, brand colors, and comprehensive error handling.

## Features

### ✅ **Brand Integration**
- Uses SabiOps brand green (`#28a745`) for success toasts
- Consistent typography with Inter font family
- Matches brand color palette from Tailwind config

### ✅ **Queueing System**  
- Maximum 4 concurrent toasts
- Automatic queueing for excess toasts
- FIFO (First In, First Out) queue processing
- Real-time queue status monitoring

### ✅ **Auto-dismiss**
- Success: 4 seconds
- Info: 5 seconds  
- Warning: 6 seconds
- Error: 8 seconds
- Loading: Infinite (manual dismiss)

### ✅ **Advanced Features**
- Toast updating (e.g., loading → success)
- Click actions with navigation
- Custom action buttons
- Progress bars for auto-dismiss
- Mobile responsive design
- Accessibility compliant (ARIA labels)

## File Structure

```
src/
├── services/
│   └── ToastService.ts           # Singleton service
├── components/
│   ├── ToastProvider.tsx         # Context provider & components
│   ├── ToastProvider.jsx         # Legacy (replaced)
│   └── examples/
│       └── ToastExample.tsx      # Usage examples
└── App.jsx                       # Updated to use new provider
```

## Usage

### 1. Hook Usage (Recommended)

```tsx
import React from 'react';
import { useToast } from '../components/ToastProvider';

const MyComponent = () => {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!', {
      title: 'Success',
      duration: 4000,
    });
  };

  const handleError = () => {
    toast.error('Something went wrong!', {
      title: 'Error',
      action: {
        label: 'Retry',
        callback: () => retryOperation()
      }
    });
  };

  const handleLoading = () => {
    const loadingId = toast.loading('Processing...');
    
    // Later update the toast
    setTimeout(() => {
      toast.update(loadingId, {
        type: 'success',
        message: 'Process completed!',
        duration: 4000,
        dismissible: true
      });
    }, 2000);
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleLoading}>Show Loading</button>
    </div>
  );
};
```

### 2. Direct Service Usage

```tsx
import { 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast,
  toastService 
} from '../services/ToastService';

// Simple usage
showSuccessToast('Product created successfully!');
showErrorToast('Failed to save data');

// Advanced usage
toastService.success('Custom success message', {
  title: 'Success',
  duration: 6000,
  clickAction: {
    url: '/products',
    params: { newProduct: true }
  }
});
```

### 3. Navigation Toasts

```tsx
toast.warning('Your subscription expires soon', {
  title: 'Subscription Warning',
  clickAction: {
    url: '/subscription-upgrade',
    params: { source: 'expiration-warning' }
  }
});
```

## API Reference

### ToastService Methods

#### Basic Methods
```tsx
toastService.success(message, options?)    // Returns toast ID
toastService.error(message, options?)      // Returns toast ID  
toastService.warning(message, options?)    // Returns toast ID
toastService.info(message, options?)       // Returns toast ID
toastService.loading(message, options?)    // Returns toast ID
```

#### Advanced Methods
```tsx
toastService.removeToast(id)              // Remove specific toast
toastService.clearAll()                   // Clear all toasts
toastService.updateToast(id, updates)     // Update existing toast
toastService.getQueueStatus()             // Get queue status
toastService.getBrandColors()             // Get color palette
```

### useToast Hook

```tsx
const toast = useToast();

// All methods available:
toast.success(message, options?)
toast.error(message, options?)  
toast.warning(message, options?)
toast.info(message, options?)
toast.loading(message, options?)
toast.remove(id)
toast.clear()
toast.update(id, updates)
toast.toasts                    // Current toasts array
```

### Toast Options

```tsx
interface ToastOptions {
  title?: string;                          // Toast title
  duration?: number;                       // Auto-dismiss duration (ms)
  dismissible?: boolean;                   // Show dismiss button
  position?: 'top-right' | 'top-left' |   // Toast position
            'bottom-right' | 'bottom-left' |
            'top-center' | 'bottom-center';
  action?: {                              // Custom action button
    label: string;
    callback: () => void;
  };
  clickAction?: {                         // Click navigation
    url: string;
    params?: Record<string, any>;
  };
  metadata?: Record<string, any>;         // Custom metadata
}
```

## Configuration

### Brand Colors (ToastService.ts)
```tsx
private readonly BRAND_COLORS = {
  success: {
    primary: '#28a745',     // SabiOps brand green
    secondary: '#22c55e',
    background: 'hsl(142 76% 36%)',
  },
  // ... other colors
};
```

### Durations & Limits
```tsx
private readonly MAX_CONCURRENT_TOASTS = 4;
private readonly DEFAULT_DURATIONS = {
  success: 4000,
  info: 5000,
  warning: 6000,
  error: 8000,
};
```

## Migration Guide

### From Old ToastProvider

**Before:**
```tsx
import toast from 'react-hot-toast';
toast.success('Message');
```

**After:**
```tsx
import { useToast } from '../components/ToastProvider';
const toast = useToast();
toast.success('Message');
```

### From ToastManager

**Before:**
```tsx
window.showSuccessToast('Message');
```

**After:**
```tsx
import { showSuccessToast } from '../services/ToastService';
showSuccessToast('Message');
```

## Testing

### Test the ToastExample Component

Add to your route (for development):
```tsx
import ToastExample from '../components/examples/ToastExample';

<Route path="/toast-example" element={<ToastExample />} />
```

Visit `/toast-example` to test all toast functionality.

### Queue Testing

```tsx
// Test queueing by triggering multiple toasts
toast.success('Toast 1');
toast.success('Toast 2');  
toast.success('Toast 3');
toast.success('Toast 4');
toast.success('Toast 5'); // This will be queued
```

## Troubleshooting

### Common Issues

1. **"useToast must be used within a ToastProvider"**
   - Ensure ToastProvider wraps your component tree in App.jsx

2. **Toasts not showing**
   - Check console for errors
   - Verify ToastProvider is imported correctly
   - Ensure document.body is available for portals

3. **Brand colors not applied**
   - Verify Tailwind config includes custom colors
   - Check CSS custom properties are defined

### Debug Information

```tsx
const status = toastService.getQueueStatus();
console.log('Queue Status:', status);
// Output: { activeToasts: 2, queuedToasts: 1, maxConcurrent: 4, listeners: 1 }
```

## Performance Considerations

- ✅ Uses React.memo for toast components
- ✅ Efficient queue processing with intervals
- ✅ Automatic cleanup of old toasts
- ✅ Minimal re-renders with proper dependency arrays
- ✅ Portal-based rendering for optimal performance

## Accessibility

- ✅ ARIA live regions (`role="alert"`, `aria-live="polite"`)
- ✅ Descriptive aria-labels for dismiss buttons  
- ✅ Keyboard navigation support
- ✅ Screen reader friendly content structure
- ✅ Focus management for interactive elements

## Browser Support

- ✅ Modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Progressive enhancement for older browsers

---

*Generated for SabiOps SME Nigeria - Toast System v2.0*
