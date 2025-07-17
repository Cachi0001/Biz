/**
 * Data Integration and Consistency Utilities
 * Ensures data consistency across all business operations
 */

import { syncAllBusinessData, validateDataConsistency, ensureDataConsistency } from '../services/api';
import { showToast } from './errorHandling';

/**
 * Validate and sync data across all business entities
 * @param {boolean} showNotifications - Whether to show toast notifications
 * @returns {Promise<Object>} Sync results
 */
export const validateAndSyncBusinessData = async (showNotifications = true) => {
  try {
    console.log('[DATA INTEGRATION] Starting comprehensive data validation and sync');
    
    // First validate data consistency
    const validationResult = await validateDataConsistency();
    
    if (!validationResult) {
      throw new Error('Data validation failed');
    }
    
    const hasIssues = !validationResult.is_consistent && validationResult.total_issues > 0;
    
    if (hasIssues) {
      console.warn(`[DATA INTEGRATION] Found ${validationResult.total_issues} data consistency issues`);
      
      if (showNotifications) {
        showToast('warning', `Found ${validationResult.total_issues} data consistency issues. Fixing...`);
      }
      
      // Sync data to fix issues
      const syncResult = await syncAllBusinessData();
      
      if (syncResult && syncResult.sync_report) {
        const report = syncResult.sync_report;
        const totalFixes = (report.transaction_records_created || 0) + 
                          (report.data_inconsistencies_fixed || 0) + 
                          (report.customer_statistics_updated || 0) +
                          (report.inventory_updates || 0);
        
        console.log(`[DATA INTEGRATION] Sync completed: ${totalFixes} fixes applied`);
        
        if (showNotifications && totalFixes > 0) {
          showToast('success', `Data synchronized: ${totalFixes} issues resolved`);
        }
        
        return {
          success: true,
          hadIssues: true,
          issuesFound: validationResult.total_issues,
          fixesApplied: totalFixes,
          syncReport: report
        };
      }
    } else {
      console.log('[DATA INTEGRATION] Data is consistent, no sync needed');
      
      if (showNotifications) {
        showToast('success', 'All data is consistent');
      }
      
      return {
        success: true,
        hadIssues: false,
        issuesFound: 0,
        fixesApplied: 0
      };
    }
    
  } catch (error) {
    console.error('[DATA INTEGRATION] Validation and sync failed:', error);
    
    if (showNotifications) {
      showToast('error', 'Data validation failed. Please try again.');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Ensure complete data consistency across all business operations
 * @param {boolean} showNotifications - Whether to show toast notifications
 * @returns {Promise<Object>} Consistency results
 */
export const ensureCompleteDataConsistency = async (showNotifications = true) => {
  try {
    console.log('[DATA INTEGRATION] Ensuring complete data consistency');
    
    const consistencyResult = await ensureDataConsistency();
    
    if (consistencyResult && consistencyResult.consistency_report) {
      const report = consistencyResult.consistency_report;
      
      const totalUpdates = (report.customer_updates || 0) + 
                          (report.transaction_fixes || 0) + 
                          (report.inventory_fixes || 0) +
                          (report.data_validation_issues || 0);
      
      console.log(`[DATA INTEGRATION] Consistency check completed: ${totalUpdates} updates made`);
      
      if (showNotifications) {
        if (totalUpdates > 0) {
          showToast('success', `Data consistency ensured: ${totalUpdates} updates applied`);
        } else {
          showToast('success', 'All data is already consistent');
        }
      }
      
      return {
        success: true,
        updatesApplied: totalUpdates,
        consistencyReport: report
      };
    }
    
    return { success: false, error: 'No consistency report received' };
    
  } catch (error) {
    console.error('[DATA INTEGRATION] Consistency check failed:', error);
    
    if (showNotifications) {
      showToast('error', 'Data consistency check failed. Please try again.');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Validate inventory consistency across products and sales
 * @param {Array} products - Array of product objects
 * @param {Array} sales - Array of sales objects
 * @returns {Object} Validation results
 */
export const validateInventoryConsistency = (products, sales) => {
  const issues = [];
  
  if (!products || !sales) {
    return { isValid: true, issues: [] };
  }
  
  products.forEach(product => {
    const productSales = sales.filter(sale => sale.product_id === product.id);
    const totalSold = productSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
    
    // Check for negative inventory
    if (product.quantity < 0) {
      issues.push({
        type: 'negative_inventory',
        productId: product.id,
        productName: product.name,
        currentQuantity: product.quantity,
        message: `Product "${product.name}" has negative inventory: ${product.quantity}`
      });
    }
    
    // Check for low stock
    const threshold = product.low_stock_threshold || 5;
    if (product.quantity <= threshold && product.quantity > 0) {
      issues.push({
        type: 'low_stock',
        productId: product.id,
        productName: product.name,
        currentQuantity: product.quantity,
        threshold: threshold,
        message: `Product "${product.name}" is low on stock: ${product.quantity} (threshold: ${threshold})`
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    totalIssues: issues.length
  };
};

/**
 * Validate customer statistics consistency
 * @param {Array} customers - Array of customer objects
 * @param {Array} sales - Array of sales objects
 * @returns {Object} Validation results
 */
export const validateCustomerStatistics = (customers, sales) => {
  const issues = [];
  
  if (!customers || !sales) {
    return { isValid: true, issues: [] };
  }
  
  customers.forEach(customer => {
    const customerSales = sales.filter(sale => sale.customer_id === customer.id);
    const actualTotalSpent = customerSales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
    const actualPurchaseCount = customerSales.length;
    
    // Check total spent consistency
    const recordedTotalSpent = customer.total_spent || 0;
    if (Math.abs(actualTotalSpent - recordedTotalSpent) > 0.01) {
      issues.push({
        type: 'customer_total_spent_mismatch',
        customerId: customer.id,
        customerName: customer.name,
        recorded: recordedTotalSpent,
        actual: actualTotalSpent,
        message: `Customer "${customer.name}" total spent mismatch: recorded ₦${recordedTotalSpent}, actual ₦${actualTotalSpent}`
      });
    }
    
    // Check purchase count consistency
    const recordedPurchaseCount = customer.purchase_count || 0;
    if (actualPurchaseCount !== recordedPurchaseCount) {
      issues.push({
        type: 'customer_purchase_count_mismatch',
        customerId: customer.id,
        customerName: customer.name,
        recorded: recordedPurchaseCount,
        actual: actualPurchaseCount,
        message: `Customer "${customer.name}" purchase count mismatch: recorded ${recordedPurchaseCount}, actual ${actualPurchaseCount}`
      });
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    totalIssues: issues.length
  };
};

/**
 * Validate transaction records consistency
 * @param {Array} sales - Array of sales objects
 * @param {Array} expenses - Array of expense objects
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Validation results
 */
export const validateTransactionConsistency = (sales, expenses, transactions) => {
  const issues = [];
  
  if (!sales || !expenses || !transactions) {
    return { isValid: true, issues: [] };
  }
  
  // Check sales without transaction records
  sales.forEach(sale => {
    const saleTransaction = transactions.find(t => 
      t.reference_id === sale.id && t.reference_type === 'sale'
    );
    
    if (!saleTransaction) {
      issues.push({
        type: 'missing_sale_transaction',
        saleId: sale.id,
        amount: sale.total_amount,
        message: `Sale ${sale.id} missing transaction record (₦${sale.total_amount})`
      });
    } else {
      // Check amount consistency
      if (Math.abs(saleTransaction.amount - sale.total_amount) > 0.01) {
        issues.push({
          type: 'sale_transaction_amount_mismatch',
          saleId: sale.id,
          transactionId: saleTransaction.id,
          saleAmount: sale.total_amount,
          transactionAmount: saleTransaction.amount,
          message: `Sale ${sale.id} transaction amount mismatch: sale ₦${sale.total_amount}, transaction ₦${saleTransaction.amount}`
        });
      }
    }
  });
  
  // Check expenses without transaction records
  expenses.forEach(expense => {
    const expenseTransaction = transactions.find(t => 
      t.reference_id === expense.id && t.reference_type === 'expense'
    );
    
    if (!expenseTransaction) {
      issues.push({
        type: 'missing_expense_transaction',
        expenseId: expense.id,
        amount: expense.amount,
        message: `Expense ${expense.id} missing transaction record (₦${expense.amount})`
      });
    } else {
      // Check amount consistency
      if (Math.abs(expenseTransaction.amount - expense.amount) > 0.01) {
        issues.push({
          type: 'expense_transaction_amount_mismatch',
          expenseId: expense.id,
          transactionId: expenseTransaction.id,
          expenseAmount: expense.amount,
          transactionAmount: expenseTransaction.amount,
          message: `Expense ${expense.id} transaction amount mismatch: expense ₦${expense.amount}, transaction ₦${expenseTransaction.amount}`
        });
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues: issues,
    totalIssues: issues.length
  };
};

/**
 * Calculate accurate dashboard metrics from actual data
 * @param {Object} data - Object containing sales, expenses, customers, products arrays
 * @returns {Object} Calculated metrics
 */
export const calculateAccurateDashboardMetrics = (data) => {
  const { sales = [], expenses = [], customers = [], products = [] } = data;
  
  // Calculate current month start
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Revenue calculations
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  const thisMonthRevenue = sales
    .filter(sale => new Date(sale.date || sale.created_at) >= monthStart)
    .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
  
  // Expense calculations
  const totalExpenses = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  const thisMonthExpenses = expenses
    .filter(expense => new Date(expense.date || expense.created_at) >= monthStart)
    .reduce((sum, expense) => sum + (expense.amount || 0), 0);
  
  // Customer calculations
  const totalCustomers = customers.length;
  const newThisMonthCustomers = customers
    .filter(customer => new Date(customer.created_at) >= monthStart)
    .length;
  
  // Product calculations
  const totalProducts = products.filter(product => product.active !== false).length;
  const lowStockProducts = products
    .filter(product => 
      product.active !== false && 
      (product.quantity || 0) <= (product.low_stock_threshold || 5)
    ).length;
  
  // Net profit calculations
  const totalNetProfit = totalRevenue - totalExpenses;
  const thisMonthNetProfit = thisMonthRevenue - thisMonthExpenses;
  
  return {
    revenue: {
      total: totalRevenue,
      this_month: thisMonthRevenue
    },
    expenses: {
      total: totalExpenses,
      this_month: thisMonthExpenses
    },
    customers: {
      total: totalCustomers,
      new_this_month: newThisMonthCustomers
    },
    products: {
      total: totalProducts,
      low_stock: lowStockProducts
    },
    net_profit: {
      total: totalNetProfit,
      this_month: thisMonthNetProfit
    }
  };
};

/**
 * Auto-sync data when inconsistencies are detected
 * @param {Function} onSyncComplete - Callback function called after sync
 * @returns {Promise<boolean>} Success status
 */
export const autoSyncDataOnInconsistency = async (onSyncComplete = null) => {
  try {
    const result = await validateAndSyncBusinessData(false);
    
    if (result.success && result.hadIssues && result.fixesApplied > 0) {
      console.log(`[AUTO SYNC] Applied ${result.fixesApplied} fixes automatically`);
      
      if (onSyncComplete) {
        onSyncComplete(result);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[AUTO SYNC] Failed:', error);
    return false;
  }
};

export default {
  validateAndSyncBusinessData,
  ensureCompleteDataConsistency,
  validateInventoryConsistency,
  validateCustomerStatistics,
  validateTransactionConsistency,
  calculateAccurateDashboardMetrics,
  autoSyncDataOnInconsistency
};