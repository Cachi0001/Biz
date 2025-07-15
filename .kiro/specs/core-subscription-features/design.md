# Core Subscription Features - Design Document

## Overview

This design document outlines the implementation of core subscription management features for SabiOps, based on the reference dashboard at `C:\Users\DELL\Saas\sabiops-role-render-dashboard`. The system will provide comprehensive subscription management, Paystack payment integration, role-based dashboard rendering, and trial management with notifications.

## Architecture

### High-Level Architecture
```
Frontend (React)
├── Subscription Components
│   ├── SubscriptionStatus.jsx (Owner-only display)
│   ├── UpgradeModal.jsx (Payment flow)
│   └── UsageTracker.jsx (Limits monitoring)
├── Role-Based Dashboards
│   ├── OwnerDashboard.jsx (Full access)
│   ├── AdminDashboard.jsx (Operational)
│   └── SalespersonDashboard.jsx (Sales focus)
├── Payment Integration
│   ├── PaystackService.js (Payment handling)
│   └── PaymentModal.jsx (Payment UI)
├── Firebase Notifications
│   ├── NotificationCenter.jsx (YouTube-style notification panel)
│   ├── NotificationBell.jsx (Bell icon with unread count)
│   ├── FirebaseService.js (Push notification handling)
│   └── NotificationItem.jsx (Individual notification component)
├── CRM & Inventory
│   ├── CustomerManagement.jsx (Complete CRM)
│   ├── ProductManagement.jsx (Inventory with Cloudinary)
│   ├── StockAlerts.jsx (Low stock notifications)
│   └── CustomerProfile.jsx (Purchase history & interactions)
├── Invoice & Expense System
│   ├── InvoiceGenerator.jsx (PDF generation)
│   ├── ExpenseTracker.jsx (Receipt uploads)
│   ├── OfflineSync.jsx (Offline functionality)
│   └── ReportGenerator.jsx (Monthly summaries)
├── Referral System
│   ├── ReferralDashboard.jsx (Earnings tracking)
│   ├── WithdrawalSystem.jsx (Paystack withdrawals)
│   └── ReferralTracking.jsx (Commission calculations)
└── Trial Management
    ├── TrialNotifications.jsx (In-app alerts)
    └── TrialCountdown.jsx (Days remaining)

Backend (Flask)
├── Subscription Endpoints
│   ├── /api/subscription/status
│   ├── /api/subscription/upgrade
│   └── /api/subscription/usage
├── Payment Processing
│   ├── /api/payments/initialize
│   ├── /api/payments/verify
│   └── /api/payments/webhook
└── Notification System
    ├── Email notifications
    └── Trial expiration handling

Database (Supabase)
├── Enhanced user schema
├── Payment transactions
├── Usage tracking
└── Notification logs
```

## Components and Interfaces

### 1. SubscriptionStatus Component

**Purpose**: Display current subscription status with appropriate actions for owners only.

**Props Interface**:
```javascript
SubscriptionStatus.propTypes = {
  subscription: PropTypes.shape({
    plan: PropTypes.string,
    status: PropTypes.string,
    is_trial: PropTypes.bool,
    trial_days_left: PropTypes.number,
    next_billing_date: PropTypes.string,
    current_usage: PropTypes.object
  }),
  role: PropTypes.string.isRequired,
  onUpgrade: PropTypes.func
}
```

**Visual States**:
1. **Free Plan**: Orange gradient with usage limits and upgrade button
2. **Trial Active**: Yellow gradient with crown icon and countdown
3. **Paid Plan**: Green gradient with billing information and manage button

**Reference Implementation** (from `SubscriptionStatus.tsx`):
- Conditional rendering based on plan and role
- Usage tracking display for free plans
- Trial countdown for active trials
- Billing date display for paid plans

### 2. UpgradeModal Component

**Purpose**: Handle plan selection and payment processing through Paystack.

**Props Interface**:
```javascript
UpgradeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  currentPlan: PropTypes.string,
  currentUsage: PropTypes.object
}
```

**Plan Configuration**:
```javascript
const plans = [
  {
    id: 'silver_weekly',
    name: 'Silver Weekly',
    price: 1400, // Naira in kobo for Paystack
    displayPrice: '₦1,400',
    period: '/week',
    trial: '7-day free trial',
    features: ['All features', '7-day trial', 'Team management', 'Advanced analytics']
  },
  {
    id: 'silver_monthly',
    name: 'Silver Monthly',
    price: 450000, // ₦4,500 in kobo
    displayPrice: '₦4,500',
    period: '/month',
    popular: true,
    features: ['All features', 'Advanced analytics', 'Export reports', 'Priority support']
  },
  {
    id: 'silver_yearly',
    name: 'Silver Yearly',
    price: 5000000, // ₦50,000 in kobo
    displayPrice: '₦50,000',
    period: '/year',
    savings: 'Save ₦4,000',
    features: ['All features', 'Maximum benefits', 'Priority support', 'Early access']
  }
];
```

### 3. PaystackService

**Purpose**: Handle all Paystack payment operations.

**Methods**:
```javascript
class PaystackService {
  static initializePayment(planId, userEmail, amount) {
    // Initialize Paystack payment
    // Return payment reference
  }
  
  static verifyPayment(reference) {
    // Verify payment with Paystack
    // Return verification status
  }
  
  static handleWebhook(payload) {
    // Process Paystack webhook
    // Update subscription status
  }
}
```

### 4. Role-Based Dashboard Components

**OwnerDashboard.jsx**:
- Full business overview with all metrics
- Subscription status prominently displayed
- Team management access
- Referral system access
- Complete analytics and reports

**AdminDashboard.jsx**:
- Operational metrics focus
- No subscription/billing information
- Team member management (limited)
- Inventory and customer management
- Operational reports only

**SalespersonDashboard.jsx**:
- Sales-focused metrics
- Customer interaction tools
- Sales performance tracking
- Limited business overview
- No financial/billing access

### 5. Firebase Notification System

**NotificationCenter.jsx** (YouTube-style notification panel):
```javascript
const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        <button onClick={markAllAsRead}>Mark all as read</button>
      </div>
      <div className="notification-list">
        {notifications.map(notification => (
          <NotificationItem 
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>
    </div>
  );
};
```

**NotificationBell.jsx** (Bell icon with unread count):
```javascript
const NotificationBell = ({ unreadCount, onClick }) => {
  return (
    <button className="notification-bell" onClick={onClick}>
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </button>
  );
};
```

**FirebaseService.js** (Push notification handling):
```javascript
class FirebaseService {
  static async requestPermission() {
    // Request notification permission
    // Get FCM token
    // Store token in database
  }
  
  static async sendNotification(userId, title, body, data) {
    // Send push notification via Firebase
    // Store notification in database
    // Update unread count
  }
  
  static onMessageReceived(callback) {
    // Handle foreground messages
    // Show in-app notifications
    // Update notification center
  }
}
```

### 6. Complete CRM & Inventory System

**CustomerManagement.jsx**:
```javascript
const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  return (
    <div className="customer-management">
      <CustomerList 
        customers={customers}
        onSelect={setSelectedCustomer}
      />
      {selectedCustomer && (
        <CustomerProfile 
          customer={selectedCustomer}
          onUpdate={handleCustomerUpdate}
        />
      )}
    </div>
  );
};
```

**ProductManagement.jsx** (Inventory with Cloudinary):
```javascript
const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  
  const handleImageUpload = async (file) => {
    // Upload to Cloudinary
    // Return optimized image URL
  };
  
  const checkStockLevels = () => {
    // Monitor stock levels
    // Trigger low stock alerts
    // Send Firebase notifications
  };
  
  return (
    <div className="product-management">
      <ProductForm onSubmit={handleProductSubmit} />
      <ProductList products={products} />
      <StockAlerts alerts={lowStockAlerts} />
    </div>
  );
};
```

### 7. Invoice & Expense System

**InvoiceGenerator.jsx** (PDF generation):
```javascript
const InvoiceGenerator = () => {
  const generatePDF = async (invoiceData) => {
    // Generate professional PDF
    // Include business branding
    // Return PDF blob for download/email
  };
  
  const sendInvoice = async (invoice, customerEmail) => {
    // Send invoice via email
    // Update invoice status to 'Sent'
    // Track delivery status
  };
  
  return (
    <div className="invoice-generator">
      <InvoiceForm onSubmit={handleInvoiceSubmit} />
      <InvoicePreview invoice={currentInvoice} />
      <InvoiceActions 
        onGeneratePDF={generatePDF}
        onSendEmail={sendInvoice}
      />
    </div>
  );
};
```

**OfflineSync.jsx** (Offline functionality):
```javascript
const OfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState([]);
  
  const syncOfflineData = async () => {
    // Sync all offline data
    // Resolve conflicts using timestamps
    // Update UI with sync status
  };
  
  useEffect(() => {
    // Monitor online/offline status
    // Auto-sync when connection restored
    // Handle sync conflicts
  }, [isOnline]);
  
  return (
    <div className="offline-sync">
      <SyncStatus isOnline={isOnline} pendingCount={pendingSync.length} />
      <SyncButton onClick={syncOfflineData} />
    </div>
  );
};
```

### 8. Advanced Referral System

**ReferralDashboard.jsx** (Earnings tracking):
```javascript
const ReferralDashboard = () => {
  const [referralStats, setReferralStats] = useState({
    totalEarnings: 0,
    pendingWithdrawals: 0,
    referralCount: 0,
    conversionRate: 0
  });
  
  const calculateCommission = (planType, amount) => {
    // Calculate 10% commission for monthly/yearly
    // Exclude weekly plans
    // Return commission amount
  };
  
  return (
    <div className="referral-dashboard">
      <ReferralStats stats={referralStats} />
      <ReferralCode code={user.referralCode} />
      <EarningsHistory earnings={referralEarnings} />
      <WithdrawalSystem minAmount={3000} />
    </div>
  );
};
```

### 9. Trial Management System

**TrialCountdown.jsx**:
```javascript
const TrialCountdown = ({ trialEndsAt, onUpgrade }) => {
  const [daysLeft, setDaysLeft] = useState(0);
  const [urgencyLevel, setUrgencyLevel] = useState('normal');
  
  useEffect(() => {
    // Calculate days remaining
    // Update countdown in real-time
    // Trigger notifications at key thresholds
    // Set urgency level (normal/warning/critical)
  }, [trialEndsAt]);
  
  const getUrgencyColor = () => {
    switch(urgencyLevel) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };
  
  return (
    <div className={`trial-countdown ${getUrgencyColor()}`}>
      <Crown className="h-4 w-4" />
      <span>{daysLeft} days remaining</span>
      {urgencyLevel !== 'normal' && (
        <Button onClick={onUpgrade}>Upgrade Now</Button>
      )}
    </div>
  );
};
```

## Data Models

### Enhanced User Model (EXISTING - Already in Database)
```javascript
const UserModel = {
  id: 'uuid',
  email: 'string',
  phone: 'string',
  full_name: 'string',
  business_name: 'string',
  role: 'Owner|Admin|Salesperson',
  owner_id: 'uuid', // Links team members to owner
  subscription_plan: 'free|weekly|monthly|yearly', // Note: weekly not silver_weekly
  subscription_status: 'trial|active|expired|cancelled',
  trial_ends_at: 'timestamp',
  referral_code: 'string',
  referred_by: 'uuid',
  current_month_invoices: 'integer', // Usage tracking
  current_month_expenses: 'integer', // Usage tracking
  usage_reset_date: 'date',
  dashboard_preferences: 'jsonb',
  password_hash: 'string',
  created_by: 'uuid',
  is_deactivated: 'boolean',
  email_confirmed: 'boolean',
  active: 'boolean',
  last_login: 'timestamp',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};
```

### Payment Transaction Model
```javascript
const PaymentModel = {
  id: 'uuid',
  user_id: 'uuid',
  plan_id: 'string',
  amount: 'number', // in kobo
  currency: 'NGN',
  paystack_reference: 'string',
  paystack_transaction_id: 'string',
  status: 'pending|success|failed|cancelled',
  payment_method: 'string',
  created_at: 'timestamp',
  verified_at: 'timestamp'
};
```

### Usage Tracking Model
```javascript
const UsageModel = {
  id: 'uuid',
  user_id: 'uuid',
  feature: 'invoices|expenses|customers|products',
  count: 'number',
  period_start: 'timestamp',
  period_end: 'timestamp',
  created_at: 'timestamp'
};
```

### Notification Model
```javascript
const NotificationModel = {
  id: 'uuid',
  user_id: 'uuid',
  title: 'string',
  body: 'string',
  type: 'low_stock|payment_received|invoice_overdue|trial_expiring|referral_earned',
  data: 'jsonb', // Additional data for navigation
  read: 'boolean',
  read_at: 'timestamp',
  action_url: 'string', // URL to navigate when clicked
  created_at: 'timestamp'
};
```

### Customer Model (Enhanced)
```javascript
const CustomerModel = {
  id: 'uuid',
  user_id: 'uuid',
  name: 'string',
  email: 'string',
  phone: 'string',
  address: 'text',
  purchase_history: 'jsonb',
  interactions: 'jsonb',
  total_purchases: 'number',
  last_purchase_date: 'timestamp',
  customer_segment: 'frequent|regular|new|inactive',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};
```

### Product Model (Enhanced)
```javascript
const ProductModel = {
  id: 'uuid',
  user_id: 'uuid',
  name: 'string',
  description: 'text',
  price: 'decimal',
  stock: 'integer',
  low_stock_threshold: 'integer',
  image_url: 'string', // Cloudinary URL
  category: 'string',
  sku: 'string',
  cost_price: 'decimal',
  profit_margin: 'decimal',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};
```

### Invoice Model (Enhanced)
```javascript
const InvoiceModel = {
  id: 'uuid',
  user_id: 'uuid',
  customer_id: 'uuid',
  invoice_number: 'string',
  status: 'draft|sent|paid|overdue|cancelled',
  items: 'jsonb',
  subtotal: 'decimal',
  tax: 'decimal',
  total: 'decimal',
  due_date: 'timestamp',
  paid_date: 'timestamp',
  pdf_url: 'string',
  notes: 'text',
  created_at: 'timestamp',
  updated_at: 'timestamp'
};
```

### Referral Model (Enhanced)
```javascript
const ReferralModel = {
  id: 'uuid',
  referrer_id: 'uuid',
  referred_user_id: 'uuid',
  referral_code: 'string',
  status: 'pending|converted|paid',
  commission_rate: 'decimal',
  commission_amount: 'decimal',
  plan_upgraded_to: 'string',
  converted_at: 'timestamp',
  commission_paid_at: 'timestamp',
  created_at: 'timestamp'
};
```

## Error Handling

### Payment Error Scenarios
1. **Network Failures**: Retry mechanism with exponential backoff
2. **Payment Declined**: Clear error messages with retry options
3. **Webhook Failures**: Queue system with retry logic
4. **Verification Failures**: Manual verification fallback

### Subscription Error Scenarios
1. **Trial Expiration**: Graceful downgrade to free plan
2. **Payment Failures**: Grace period with notifications
3. **Plan Changes**: Prorated billing calculations
4. **Access Revocation**: Immediate feature restriction

### Error Response Format
```javascript
const ErrorResponse = {
  success: false,
  error: {
    code: 'PAYMENT_FAILED',
    message: 'Payment could not be processed',
    details: 'Card was declined by your bank',
    retry_allowed: true
  }
};
```

## Testing Strategy

### Unit Tests
- **Component Testing**: All subscription components with different states
- **Service Testing**: PaystackService methods with mocked responses
- **Utility Testing**: Date calculations, currency formatting, usage tracking

### Integration Tests
- **Payment Flow**: End-to-end payment process with Paystack sandbox
- **Subscription Updates**: Database updates after successful payments
- **Role-Based Access**: Feature access based on subscription and role
- **Trial Management**: Countdown calculations and expiration handling

### E2E Tests
- **Complete Upgrade Flow**: From free plan to paid subscription
- **Trial Experience**: Full trial lifecycle from signup to expiration
- **Role-Based Dashboards**: Different user roles seeing appropriate content
- **Payment Verification**: Webhook processing and subscription activation

## Security Considerations

### Payment Security
- **PCI Compliance**: All payment data handled by Paystack
- **Webhook Verification**: Verify webhook signatures from Paystack
- **Reference Validation**: Validate payment references before processing
- **Amount Verification**: Verify payment amounts match plan prices

### Access Control
- **Role-Based Permissions**: Strict role checking for sensitive features
- **Subscription Validation**: Real-time subscription status checking
- **Feature Gating**: Server-side validation of feature access
- **Session Management**: Secure token handling and validation

### Data Protection
- **Sensitive Data**: No payment card data stored locally
- **User Privacy**: Subscription data only visible to account owners
- **Audit Logging**: Track all subscription and payment changes
- **Data Encryption**: Encrypt sensitive subscription information

## Performance Considerations

### Frontend Optimization
- **Lazy Loading**: Load subscription components only when needed
- **Caching**: Cache subscription status to reduce API calls
- **Optimistic Updates**: Update UI immediately, sync with backend
- **Bundle Splitting**: Separate payment components from main bundle

### Backend Optimization
- **Database Indexing**: Index subscription and payment queries
- **Caching Strategy**: Cache subscription status and usage data
- **Webhook Processing**: Async processing of payment webhooks
- **Rate Limiting**: Protect payment endpoints from abuse

### Mobile Performance
- **Responsive Design**: Optimize for mobile payment flows
- **Touch Interactions**: Large buttons for payment actions
- **Loading States**: Clear feedback during payment processing
- **Offline Handling**: Graceful degradation when offline

## Implementation Phases

### Phase 1: Core Subscription Display
1. Create SubscriptionStatus component
2. Implement trial countdown logic
3. Add subscription status to owner dashboard
4. Test with different subscription states

### Phase 2: Payment Integration
1. Set up PaystackService
2. Create UpgradeModal component
3. Implement payment initialization
4. Add payment verification

### Phase 3: Role-Based Dashboards
1. Create role-specific dashboard components
2. Implement feature access control
3. Add role-based navigation
4. Test with different user roles

### Phase 4: Trial Management
1. Implement trial notifications
2. Add usage tracking
3. Create expiration handling
4. Test complete trial lifecycle

This design provides a comprehensive foundation for implementing all core subscription features while maintaining the mobile-first approach and ensuring proper integration with the existing SabiOps architecture.