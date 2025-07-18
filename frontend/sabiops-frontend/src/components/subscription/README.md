# Subscription Plan Limits and Usage Tracking

This directory contains components and hooks for implementing real-time plan limit enforcement and intelligent upgrade prompts based on subscription plans and usage patterns.

## Overview

The system provides:
- Real-time usage tracking for invoices, expenses, customers, and products
- Plan-based limit enforcement with appropriate warnings and blocks
- Intelligent upgrade prompts based on usage patterns
- Team member plan inheritance
- Comprehensive testing suite

## Components

### 1. PlanLimitTestSuite.jsx
A comprehensive test suite component for verifying all plan limit functionality.

```jsx
import PlanLimitTestSuite from './components/subscription/PlanLimitTestSuite';

// Use in development/testing environments
<PlanLimitTestSuite />
```

### 2. PlanLimitGuard.jsx
A guard component that wraps actions and enforces plan limits.

```jsx
import { PlanLimitGuard } from './components/subscription/PlanLimitGuard';

// Wrap any action that should be limited
<PlanLimitGuard action="create_invoice">
  <Button onClick={createInvoice}>Create Invoice</Button>
</PlanLimitGuard>

// With custom fallback
<PlanLimitGuard 
  action="access_analytics" 
  fallback={<div>Analytics requires upgrade</div>}
>
  <AnalyticsComponent />
</PlanLimitGuard>
```

### 3. UpgradePrompt.jsx
Intelligent upgrade prompts that adapt based on user context.

```jsx
import { UpgradePrompt, SmartUpgradePrompt } from './components/subscription/UpgradePrompt';

// Specific trigger
<UpgradePrompt trigger="usage" />
<UpgradePrompt trigger="feature" feature="analytics" />

// Smart prompt that auto-determines best message
<SmartUpgradePrompt />

// Compact version
<UpgradePrompt compact={true} />
```

## Contexts and Hooks

### PlanLimitContext
Provides plan limit functionality throughout the app.

```jsx
import { PlanLimitProvider, usePlanLimits } from './contexts/PlanLimitContext';

// Wrap your app
<PlanLimitProvider>
  <App />
</PlanLimitProvider>

// Use in components
const { canPerformAction, enforceAction, incrementUsage } = usePlanLimits();
```

### usePlanLimitEnforcement Hook
Core hook for plan limit enforcement logic.

```jsx
import { usePlanLimitEnforcement } from './hooks/usePlanLimitEnforcement';

const { 
  canPerformAction, 
  enforceAction, 
  getEnforcementSummary 
} = usePlanLimitEnforcement();

// Check if action is allowed
const canCreate = canPerformAction('create_invoice');

// Enforce action with warnings/blocks
const enforcement = await enforceAction('create_invoice');
```

### useUsageTracking Hook
Hook for tracking resource usage.

```jsx
import { useUsageTracking } from './hooks/useUsageTracking';

const { 
  incrementUsage, 
  getUsageStatus, 
  isAtLimit 
} = useUsageTracking();

// Track usage
await incrementUsage('invoices');

// Check status
const usage = getUsageStatus();
const atLimit = isAtLimit('invoices');
```

## Services

### usageTrackingService.js
Service for integrating usage tracking into existing components.

```jsx
import usageTrackingService, { 
  trackInvoiceCreated, 
  wrapWithUsageTracking 
} from './services/usageTrackingService';

// Direct tracking
trackInvoiceCreated();

// Wrap existing functions
const createInvoiceWithTracking = wrapWithUsageTracking.invoice(createInvoice);
```

## Integration Guide

### 1. Setup Context Provider

Wrap your app with the PlanLimitProvider:

```jsx
// App.jsx
import { PlanLimitProvider } from './contexts/PlanLimitContext';

function App() {
  return (
    <AuthProvider>
      <PlanLimitProvider>
        {/* Your app components */}
      </PlanLimitProvider>
    </AuthProvider>
  );
}
```

### 2. Protect Actions with Guards

Wrap components that should be limited:

```jsx
// InvoiceForm.jsx
import { PlanLimitGuard } from './components/subscription/PlanLimitGuard';

const InvoiceForm = () => {
  return (
    <PlanLimitGuard action="create_invoice">
      <form onSubmit={handleSubmit}>
        {/* Invoice form fields */}
        <Button type="submit">Create Invoice</Button>
      </form>
    </PlanLimitGuard>
  );
};
```

### 3. Add Usage Tracking

Track resource creation in your existing functions:

```jsx
// api.js
import { trackInvoiceCreated } from './services/usageTrackingService';

export const createInvoice = async (invoiceData) => {
  const response = await fetch('/api/invoices', {
    method: 'POST',
    body: JSON.stringify(invoiceData)
  });
  
  if (response.ok) {
    trackInvoiceCreated(); // Track successful creation
  }
  
  return response.json();
};
```

### 4. Show Upgrade Prompts

Add upgrade prompts where appropriate:

```jsx
// Dashboard.jsx
import { SmartUpgradePrompt } from './components/subscription/UpgradePrompt';
import { usePlanLimits } from './contexts/PlanLimitContext';

const Dashboard = () => {
  const { getUsageSummary } = usePlanLimits();
  const summary = getUsageSummary();
  
  return (
    <div>
      {/* Dashboard content */}
      
      {/* Show upgrade prompt if approaching limits */}
      {(summary.warnings.length > 0 || summary.blocked.length > 0) && (
        <SmartUpgradePrompt className="mb-6" />
      )}
    </div>
  );
};
```

### 5. Handle Team Member Access

The system automatically handles team member plan inheritance:

```jsx
// The hooks automatically check user role and apply owner's plan limits
const { canPerformAction } = usePlanLimits();

// This works for both owners and team members
const canCreateInvoice = canPerformAction('create_invoice');
```

## Plan Limits Configuration

The system supports different plan types with configurable limits:

```javascript
const planLimits = {
  free: {
    invoices: 5,
    expenses: 5,
    customers: 50,
    products: 20,
    analytics: false,
    reports: false,
    team_members: 1
  },
  silver_weekly: {
    invoices: 100,
    expenses: 100,
    customers: 500,
    products: 200,
    analytics: true,
    reports: true,
    team_members: 5
  }
  // ... other plans
};
```

## Testing

Use the PlanLimitTestSuite component to test all functionality:

```jsx
// TestPage.jsx (development only)
import PlanLimitTestSuite from './components/subscription/PlanLimitTestSuite';

const TestPage = () => {
  return (
    <div className="p-6">
      <h1>Plan Limits Testing</h1>
      <PlanLimitTestSuite />
    </div>
  );
};
```

## Best Practices

1. **Always use PlanLimitGuard** for actions that consume limited resources
2. **Track usage immediately** after successful resource creation
3. **Show contextual upgrade prompts** based on user behavior
4. **Test thoroughly** using the provided test suite
5. **Handle errors gracefully** when limits are exceeded
6. **Provide clear messaging** about why actions are blocked
7. **Make upgrade paths obvious** and easy to follow

## Troubleshooting

### Common Issues

1. **Usage not tracking**: Ensure you're calling tracking functions after successful operations
2. **Limits not enforcing**: Check that PlanLimitProvider is wrapping your app
3. **Team members blocked**: Verify that team member plan inheritance is working
4. **Upgrade prompts not showing**: Check subscription status and usage levels

### Debug Tools

The test suite provides comprehensive debugging information:
- Current usage status
- Plan limits and enforcement
- Team member inheritance
- Real-time tracking verification

### Storage

Usage data is stored in localStorage with automatic monthly reset for recurring limits. The system gracefully handles storage errors and provides fallbacks.