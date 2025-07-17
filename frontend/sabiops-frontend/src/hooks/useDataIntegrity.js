import { useState, useCallback } from 'react';
import DataIntegrityService from '../services/DataIntegrityService';
import { showToast } from '../utils/errorHandling';

export const useDataIntegrity = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastResults, setLastResults] = useState(null);

  // Run all data integrity checks
  const runAllChecks = useCallback(async () => {
    setIsRunning(true);
    try {
      const results = await DataIntegrityService.runAllChecks();
      setLastResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      const totalFixed = results.reduce((sum, r) => sum + (r.fixed_count || 0), 0);
      
      if (errorCount === 0) {
        showToast('success', `All ${successCount} checks completed successfully. ${totalFixed} issues fixed.`);
      } else {
        showToast('error', `${successCount} checks passed, ${errorCount} failed. ${totalFixed} issues fixed.`);
      }
      
      return results;
    } catch (error) {
      showToast('error', error.message);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Run specific check
  const runSingleCheck = useCallback(async (checkId) => {
    setIsRunning(true);
    try {
      const result = await DataIntegrityService.runSingleCheck(checkId);
      
      if (result.status === 'success') {
        showToast('success', `${result.name} completed successfully. ${result.fixed_count || 0} issues fixed.`);
      } else {
        showToast('error', `${result.name} failed: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      showToast('error', error.message);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  // Auto-sync after sale creation
  const syncAfterSale = useCallback(async (saleData) => {
    try {
      // Update inventory automatically
      await DataIntegrityService.updateInventoryOnSale(saleData);
      
      // Ensure transaction record exists
      await DataIntegrityService.ensureTransactionRecord('sale', saleData.id, saleData);
      
      // Update customer stats if customer is specified
      if (saleData.customer_id) {
        await DataIntegrityService.runSingleCheck('customer-stats');
      }
      
      return true;
    } catch (error) {
      console.error('Auto-sync after sale failed:', error);
      return false;
    }
  }, []);

  // Auto-sync after expense creation
  const syncAfterExpense = useCallback(async (expenseData) => {
    try {
      // Ensure transaction record exists
      await DataIntegrityService.ensureTransactionRecord('expense', expenseData.id, expenseData);
      
      return true;
    } catch (error) {
      console.error('Auto-sync after expense failed:', error);
      return false;
    }
  }, []);

  // Validate data before operations
  const validateData = useCallback(async (dataType, data) => {
    try {
      const validation = await DataIntegrityService.validateDataConsistency(dataType, data);
      
      if (!validation.valid) {
        const errorMessage = `Data validation failed:\n${validation.errors.join('\n')}`;
        showToast('error', errorMessage);
        return false;
      }
      
      return true;
    } catch (error) {
      showToast('error', `Validation error: ${error.message}`);
      return false;
    }
  }, []);

  // Quick health check - runs critical checks only
  const quickHealthCheck = useCallback(async () => {
    setIsRunning(true);
    try {
      const criticalChecks = ['inventory-sync', 'transaction-integrity'];
      const results = [];
      
      for (const checkId of criticalChecks) {
        const result = await DataIntegrityService.runSingleCheck(checkId);
        results.push(result);
      }
      
      const hasErrors = results.some(r => r.status === 'error');
      const totalFixed = results.reduce((sum, r) => sum + (r.fixed_count || 0), 0);
      
      if (!hasErrors) {
        showToast('success', `Health check passed. ${totalFixed} issues fixed.`);
      } else {
        showToast('error', `Health check found issues. ${totalFixed} issues fixed.`);
      }
      
      return results;
    } catch (error) {
      showToast('error', `Health check failed: ${error.message}`);
      throw error;
    } finally {
      setIsRunning(false);
    }
  }, []);

  return {
    isRunning,
    lastResults,
    runAllChecks,
    runSingleCheck,
    syncAfterSale,
    syncAfterExpense,
    validateData,
    quickHealthCheck
  };
};

export default useDataIntegrity;