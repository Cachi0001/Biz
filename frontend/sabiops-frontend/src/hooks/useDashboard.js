import { useState, useEffect, useCallback } from 'react';
import { getDashboardOverview, getAccurateDashboardMetrics, getSales, getInvoices, getExpenses, validateDataConsistency, syncAllBusinessData } from '../services/api';
import { handleApiError, showToast } from '../utils/errorHandling';
import { 
  optimizedApiCall, 
  performanceMonitor, 
  globalLoadingManager,
  invalidateCache 
} from '../utils/performanceOptimizations';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchDashboardData = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
        globalLoadingManager.setLoading('dashboard', true);
      }
      setError(null);

      // Start performance monitoring
      performanceMonitor.startTimer('dashboard-fetch');

      // Use optimized API calls with caching
      const [overviewResponse, accurateMetricsResponse] = await Promise.allSettled([
        optimizedApiCall('dashboard-overview', getDashboardOverview, { 
          cacheTtl: 60000, // 1 minute cache
          useCache: true,
          showLoading: false 
        }),
        optimizedApiCall('dashboard-metrics', getAccurateDashboardMetrics, { 
          cacheTtl: 60000, // 1 minute cache
          useCache: true,
          showLoading: false 
        })
      ]);

      let dashboardOverview = {};
      let accurateMetrics = {};

      // Process overview response
      if (overviewResponse.status === 'fulfilled' && overviewResponse.value && (overviewResponse.value.success !== false)) {
        dashboardOverview = overviewResponse.value.data || overviewResponse.value;
        console.log('[DEBUG] Dashboard Overview Data:', dashboardOverview);
        console.log('[DEBUG] Overview profit fields:', {
          today_profit_from_sales: dashboardOverview.today_profit_from_sales,
          this_month_profit_from_sales: dashboardOverview.this_month_profit_from_sales,
          total_profit_from_sales: dashboardOverview.total_profit_from_sales,
          total_cogs: dashboardOverview.total_cogs
        });
      } else {
        console.log('[DEBUG] Overview response failed or empty:', overviewResponse);
      }

      // Process accurate metrics response (prioritize this for data consistency)
      if (accurateMetricsResponse.status === 'fulfilled' && accurateMetricsResponse.value) {
        accurateMetrics = accurateMetricsResponse.value;
        console.log('[DEBUG] Using accurate metrics for dashboard:', accurateMetrics);
        console.log('[DEBUG] Accurate metrics profit fields:', {
          today_profit_from_sales: accurateMetrics.today_profit_from_sales,
          this_month_profit_from_sales: accurateMetrics.this_month_profit_from_sales,
          total_profit_from_sales: accurateMetrics.total_profit_from_sales,
          total_cogs: accurateMetrics.total_cogs
        });
      } else {
        console.log('[DEBUG] Accurate metrics response failed or empty:', accurateMetricsResponse);
      }

      // Merge data with accurate metrics taking precedence
      const mergedOverview = {
        ...dashboardOverview,
        ...accurateMetrics,
        // Ensure we have proper structure and include profit fields
        revenue: {
          ...(dashboardOverview.revenue || {}),
          ...(accurateMetrics.revenue || {}),
          total: (accurateMetrics.revenue?.total || dashboardOverview.revenue?.total || 0),
          this_month: (accurateMetrics.revenue?.this_month || dashboardOverview.revenue?.this_month || 0),
          // Include profit-related fields
          today_profit_from_sales: (accurateMetrics.today_profit_from_sales || dashboardOverview.today_profit_from_sales || 0),
          this_month_profit_from_sales: (accurateMetrics.this_month_profit_from_sales || dashboardOverview.this_month_profit_from_sales || 0),
          total_profit_from_sales: (accurateMetrics.total_profit_from_sales || dashboardOverview.total_profit_from_sales || 0),
          total_cogs: (accurateMetrics.total_cogs || dashboardOverview.total_cogs || 0),
          profit_margin: (accurateMetrics.profit_margin || dashboardOverview.profit_margin || 0)
        },
        expenses: accurateMetrics.expenses || dashboardOverview.expenses || { total: 0, this_month: 0 },
        customers: accurateMetrics.customers || dashboardOverview.customers || { total: 0, new_this_month: 0 },
        products: accurateMetrics.products || dashboardOverview.products || { total: 0, low_stock: 0 },
        net_profit: accurateMetrics.net_profit || { total: 0, this_month: 0 }
      };
        
      // Fetch recent activities from sales, invoices, and expenses
      const [salesResponse, invoicesResponse, expensesResponse] = await Promise.allSettled([
        getSales(),
        getInvoices(), 
        getExpenses()
      ]);

      // Process recent activities
      const recentActivities = [];
      
      // Add recent sales
      if (salesResponse.status === 'fulfilled' && salesResponse.value?.data?.sales) {
        salesResponse.value.data.sales.slice(0, 3).forEach(sale => {
          recentActivities.push({
            type: 'sale',
            description: `Sale to ${sale.customer_name || 'Walk-in Customer'} - ${sale.product_name || 'Product'}`,
            timestamp: sale.created_at || sale.date,
            amount: `₦${Number(sale.total_amount || 0).toLocaleString()}`
          });
        });
      } else if (salesResponse.status === 'fulfilled' && salesResponse.value?.sales) {
        salesResponse.value.sales.slice(0, 3).forEach(sale => {
          recentActivities.push({
            type: 'sale',
            description: `Sale to ${sale.customer_name || 'Walk-in Customer'} - ${sale.product_name || 'Product'}`,
            timestamp: sale.created_at || sale.date,
            amount: `₦${Number(sale.total_amount || 0).toLocaleString()}`
          });
        });
      }

      // Add recent invoices
      if (invoicesResponse.status === 'fulfilled' && invoicesResponse.value?.data?.invoices) {
        invoicesResponse.value.data.invoices.slice(0, 2).forEach(invoice => {
          recentActivities.push({
            type: 'invoice',
            description: `Invoice ${invoice.invoice_number} - ${invoice.customer_name || 'Customer'}`,
            timestamp: invoice.created_at,
            amount: `₦${Number(invoice.total_amount || 0).toLocaleString()}`
          });
        });
      } else if (invoicesResponse.status === 'fulfilled' && invoicesResponse.value?.invoices) {
        invoicesResponse.value.invoices.slice(0, 2).forEach(invoice => {
          recentActivities.push({
            type: 'invoice',
            description: `Invoice ${invoice.invoice_number} - ${invoice.customer_name || 'Customer'}`,
            timestamp: invoice.created_at,
            amount: `₦${Number(invoice.total_amount || 0).toLocaleString()}`
          });
        });
      }

      // Add recent expenses
      if (expensesResponse.status === 'fulfilled' && expensesResponse.value?.data?.expenses) {
        expensesResponse.value.data.expenses.slice(0, 2).forEach(expense => {
          recentActivities.push({
            type: 'expense',
            description: `${expense.category || 'Expense'} - ${expense.description || 'Business expense'}`,
            timestamp: expense.created_at || expense.date,
            amount: `₦${Number(expense.amount || 0).toLocaleString()}`
          });
        });
      } else if (expensesResponse.status === 'fulfilled' && expensesResponse.value?.expenses) {
        expensesResponse.value.expenses.slice(0, 2).forEach(expense => {
          recentActivities.push({
            type: 'expense',
            description: `${expense.category || 'Expense'} - ${expense.description || 'Business expense'}`,
            timestamp: expense.created_at || expense.date,
            amount: `₦${Number(expense.amount || 0).toLocaleString()}`
          });
        });
      }

      // Sort activities by timestamp (most recent first)
      recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Combine overview data with recent activities
      const combinedData = {
        ...mergedOverview,
        recent_activities: recentActivities.slice(0, 5)
      };

      setDashboardData(combinedData);
      setLastRefresh(new Date());
      
      if (!showLoadingState) {
        showToast('success', 'Dashboard data refreshed with accurate metrics');
      }

      // Auto-sync data if inconsistencies are detected
      try {
        const { autoSyncDataOnInconsistency } = await import('../utils/dataIntegration');
        
        const syncApplied = await autoSyncDataOnInconsistency((result) => {
          console.log('Auto-sync completed:', result);
          
          // Refresh dashboard data to show updated metrics
          setTimeout(() => {
            fetchDashboardData(false);
          }, 1000);
        });
        
        if (syncApplied) {
          console.log('[DASHBOARD] Data auto-sync applied, dashboard will refresh');
        }
      } catch (syncError) {
        console.warn('Auto data sync failed:', syncError);
      }

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const errorMessage = handleApiError(err, 'Failed to load dashboard data');
      setError(errorMessage);
      
      if (showLoadingState) {
        showToast('error', errorMessage);
      }
    } finally {
      // End performance monitoring
      performanceMonitor.endTimer('dashboard-fetch');
      
      if (showLoadingState) {
        setLoading(false);
        globalLoadingManager.setLoading('dashboard', false);
      }
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshData = useCallback((invalidateFirst = true) => {
    if (invalidateFirst) {
      // Invalidate dashboard-related cache entries
      invalidateCache(['dashboard-overview', 'dashboard-metrics']);
    }
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    refreshData,
    lastRefresh,
  };
};