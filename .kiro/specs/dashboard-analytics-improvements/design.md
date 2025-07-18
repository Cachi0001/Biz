# Dashboard and Analytics Improvements Design

## Overview

This design document outlines the technical approach for restructuring the SabiOps dashboard and analytics system. The solution focuses on creating a clean, focused dashboard while building a comprehensive analytics page, fixing payment system integration, ensuring proper subscription plan enforcement, and achieving full mobile responsiveness.

## Architecture

### Component Hierarchy Restructuring

```
Dashboard Page
├── SubscriptionStatus (with correct plan display)
├── EssentialOverviewCards (simplified)
├── QuickActions (rebalanced layout)
├── RecentActivities (with working navigation)
└── UpgradePrompts (plan-based)

Analytics Page
├── AnalyticsHeader
├── KeyMetricsGrid
├── DetailedChartsSection (moved from dashboard)
├── TopProductsCard (moved from dashboard)
├── LowStockProductsCard (new)
├── MonthlyExpensesChart (moved from dashboard)
└── PerformanceSummary
```

### Data Flow Architecture

```
API Layer
├── getDashboardOverview() - Essential metrics only
├── getAnalyticsData() - Comprehensive analytics
├── getPayments() - Fixed response handling
├── recordPayment() - Integrated with sales
├── getSalesReport() - Linked with payments
└── getUserSubscription() - Real-time plan status

State Management
├── useDashboard() - Simplified for essential data
├── useAnalytics() - New hook for detailed analytics
├── usePayments() - Fixed error handling
├── useAuth() - Enhanced subscription checking
└── useSubscription() - Real-time plan management
```

## Components and Interfaces

### 1. Enhanced Dashboard Components

#### EssentialOverviewCards
```typescript
interface EssentialOverviewData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalCustomers: number;
  newCustomers: number;
}

const EssentialOverviewCards: React.FC<{
  data: EssentialOverviewData;
  loading: boolean;
}> = ({ data, loading }) => {
  // Simplified 4-card layout
  // Mobile-first responsive design
  // Clean, focused metrics
}
```

#### RebalancedQuickActions
```typescript
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType;
  href: string;
  isPrimary: boolean;
  requiresSubscription?: string[];
}

const RebalancedQuickActions: React.FC = () => {
  const primaryActions = [
    { id: 'invoice', title: 'New Invoice', isPrimary: true },
    { id: 'sale', title: 'Record Sale', isPrimary: true },
    { id: 'product', title: 'Add Product', isPrimary: true },
    { id: 'customer', title: 'New Customer', isPrimary: true }
  ];
  
  const secondaryActions = [
    { id: 'expense', title: 'Add Expense', isPrimary: false },
    { id: 'analytics', title: 'Analytics', isPrimary: false },
    { id: 'payments', title: 'Payments', isPrimary: false },
    { id: 'settings', title: 'Settings', isPrimary: false }
  ];
  
  // Responsive grid layout
  // Primary actions: 2x2 grid on mobile, 4x1 on desktop
  // Secondary actions: 2x2 grid on all devices
}
```

### 2. New Analytics Page Components

#### AnalyticsPageLayout
```typescript
interface AnalyticsData {
  revenue: RevenueData;
  expenses: ExpenseData;
  topProducts: ProductData[];
  lowStockProducts: ProductData[];
  customerMetrics: CustomerData;
  salesTrends: TrendData[];
}

const AnalyticsPage: React.FC = () => {
  const { user, subscription, canAccessFeature } = useAuth();
  const { analyticsData, loading } = useAnalytics();
  
  if (!canAccessFeature('analytics')) {
    return <AnalyticsUpgradePrompt />;
  }
  
  return (
    <DashboardLayout>
      <AnalyticsHeader />
      <KeyMetricsGrid data={analyticsData} />
      <DetailedChartsSection data={analyticsData} />
      <ProductAnalyticsSection data={analyticsData} />
      <PerformanceSummary data={analyticsData} />
    </DashboardLayout>
  );
}
```

#### LowStockProductsCard
```typescript
interface LowStockProduct {
  id: string;
  name: string;
  currentStock: number;
  minStockLevel: number;
  category: string;
  lastRestocked: string;
}

const LowStockProductsCard: React.FC<{
  products: LowStockProduct[];
  loading: boolean;
}> = ({ products, loading }) => {
  // Mobile-responsive card layout
  // Color-coded urgency levels
  // Quick restock actions
  // Integration with inventory management
}
```

### 3. Fixed Payment System Components

#### PaymentsPageFixed
```typescript
interface Payment {
  id: string;
  customer_name: string;
  invoice_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_date: string;
  status: PaymentStatus;
  reference_number: string;
  notes?: string;
}

const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchPayments = async () => {
    try {
      const response = await getPayments();
      // Fixed: Ensure response is always an array
      const paymentsArray = Array.isArray(response) 
        ? response 
        : response?.data || response?.payments || [];
      setPayments(paymentsArray);
    } catch (error) {
      console.error('Payment fetch error:', error);
      setError('Failed to load payments');
      setPayments([]); // Ensure payments is always an array
    }
  };
  
  // Rest of component with proper error handling
}
```

### 4. Subscription Management Components

#### SubscriptionStatusFixed
```typescript
interface SubscriptionData {
  plan: 'free' | 'silver_weekly' | 'silver_monthly' | 'silver_yearly';
  status: 'active' | 'trial' | 'expired';
  trial_days_left?: number;
  current_usage: {
    invoices: number;
    expenses: number;
  };
  plan_limits: {
    invoices: number;
    expenses: number;
  };
}

const SubscriptionStatusFixed: React.FC<{
  subscription: SubscriptionData;
  role: UserRole;
  onUpgrade: () => void;
}> = ({ subscription, role, onUpgrade }) => {
  const getPlanDisplayName = (plan: string, status: string) => {
    switch (plan) {
      case 'free':
        return 'Basic Plan - Active';
      case 'silver_weekly':
        return status === 'trial' 
          ? 'Silver Weekly Plan - Trial' 
          : 'Silver Weekly Plan - Active';
      case 'silver_monthly':
        return 'Silver Monthly Plan - Active';
      case 'silver_yearly':
        return 'Silver Yearly Plan - Active';
      default:
        return 'Basic Plan - Active';
    }
  };
  
  const shouldShowTrialInfo = (plan: string, status: string) => {
    // Only show trial info for weekly plan during trial period
    return plan === 'silver_weekly' && status === 'trial';
  };
  
  // Component renders correct plan information
  // Hides subscription details for non-owners
  // Shows appropriate upgrade prompts
}
```

## Data Models

### Enhanced Analytics Data Model
```typescript
interface AnalyticsData {
  overview: {
    totalRevenue: number;
    monthlyRevenue: number;
    totalExpenses: number;
    monthlyExpenses: number;
    netProfit: number;
    monthlyProfit: number;
  };
  
  trends: {
    revenueTrend: TrendPoint[];
    expenseTrend: TrendPoint[];
    profitTrend: TrendPoint[];
  };
  
  products: {
    topProducts: TopProduct[];
    lowStockProducts: LowStockProduct[];
    categoryBreakdown: CategoryData[];
  };
  
  customers: {
    totalCustomers: number;
    newCustomers: number;
    customerRetention: number;
    averageOrderValue: number;
  };
}
```

### Fixed Payment Data Model
```typescript
interface PaymentResponse {
  success: boolean;
  data?: Payment[];
  payments?: Payment[]; // Alternative response format
  message?: string;
  error?: string;
}

// Normalized payment handling
const normalizePaymentResponse = (response: any): Payment[] => {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (response?.payments && Array.isArray(response.payments)) return response.payments;
  return [];
};
```

## Error Handling

### Payment System Error Handling
```typescript
const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPayments();
      const normalizedPayments = normalizePaymentResponse(response);
      
      setPayments(normalizedPayments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payments';
      setError(errorMessage);
      setPayments([]); // Always ensure array
      console.error('Payment fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { payments, loading, error, fetchPayments };
};
```

### Navigation Error Handling
```typescript
const useNavigation = () => {
  const navigate = useNavigate();
  
  const navigateToUpgrade = useCallback(() => {
    // Check if upgrade page exists, fallback to pricing
    const upgradePath = '/subscription-upgrade';
    const fallbackPath = '/pricing';
    
    try {
      navigate(upgradePath);
    } catch (error) {
      console.warn('Upgrade page not found, using fallback');
      navigate(fallbackPath);
    }
  }, [navigate]);
  
  return { navigateToUpgrade };
};
```

## Testing Strategy

### Component Testing
```typescript
// Dashboard component tests
describe('Dashboard', () => {
  test('displays correct plan information for basic user', () => {
    render(<Dashboard />, {
      authContext: { subscription: { plan: 'free' } }
    });
    expect(screen.getByText('Basic Plan - Active')).toBeInTheDocument();
  });
  
  test('hides trial information for non-trial plans', () => {
    render(<Dashboard />, {
      authContext: { 
        subscription: { plan: 'silver_weekly', status: 'active' }
      }
    });
    expect(screen.queryByText('7 days free trial')).not.toBeInTheDocument();
  });
});

// Payment system tests
describe('PaymentsPage', () => {
  test('handles array response correctly', async () => {
    mockGetPayments.mockResolvedValue([mockPayment]);
    render(<PaymentsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockPayment.customer_name)).toBeInTheDocument();
    });
  });
  
  test('handles object response with data property', async () => {
    mockGetPayments.mockResolvedValue({ data: [mockPayment] });
    render(<PaymentsPage />);
    await waitFor(() => {
      expect(screen.getByText(mockPayment.customer_name)).toBeInTheDocument();
    });
  });
});
```

### Mobile Responsiveness Testing
```typescript
describe('Mobile Responsiveness', () => {
  test('dashboard adapts to mobile viewport', () => {
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));
    
    render(<Dashboard />);
    
    // Test mobile-specific layouts
    expect(screen.getByTestId('mobile-quick-actions')).toBeInTheDocument();
  });
  
  test('analytics page is scrollable on mobile', () => {
    global.innerWidth = 375;
    render(<AnalyticsPage />);
    
    const analyticsContainer = screen.getByTestId('analytics-container');
    expect(analyticsContainer).toHaveClass('overflow-x-auto');
  });
});
```

## Performance Optimizations

### Lazy Loading for Analytics
```typescript
const AnalyticsPage = lazy(() => import('./pages/Analytics'));
const LowStockProductsCard = lazy(() => import('./components/LowStockProductsCard'));

// Implement progressive loading for heavy analytics components
const useProgressiveAnalytics = () => {
  const [loadStage, setLoadStage] = useState(1);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadStage(prev => Math.min(prev + 1, 3));
    }, 500);
    
    return () => clearTimeout(timer);
  }, [loadStage]);
  
  return loadStage;
};
```

### Optimized Data Fetching
```typescript
const useOptimizedDashboard = () => {
  const { data: essentialData } = useSWR('/api/dashboard/essential', {
    refreshInterval: 30000,
    revalidateOnFocus: false
  });
  
  const { data: analyticsData } = useSWR('/api/analytics/detailed', {
    refreshInterval: 60000,
    revalidateOnFocus: false,
    // Only fetch when analytics page is accessed
    isPaused: () => !window.location.pathname.includes('/analytics')
  });
  
  return { essentialData, analyticsData };
};
```

This design provides a comprehensive solution that addresses all the identified issues while maintaining clean architecture, proper error handling, and optimal performance across all devices.