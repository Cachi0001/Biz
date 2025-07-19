import React, { useState } from 'react';
import { Button } from './button';
import { enhancedCreateExpense } from '../../services/enhancedApi';

/**
 * Test component to verify expense creation functionality
 */
const ExpenseTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testExpenseCreation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const testExpense = {
        category: 'Other',
        sub_category: 'Test',
        description: 'Test expense from component',
        amount: '100.00',
        payment_method: 'cash',
        date: new Date().toISOString().split('T')[0]
      };

      console.log('[ExpenseTest] Creating test expense:', testExpense);
      
      const response = await enhancedCreateExpense(testExpense);
      
      console.log('[ExpenseTest] Success response:', response);
      setResult(response);
    } catch (err) {
      console.error('[ExpenseTest] Error:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Expense Creation Test</h3>
      
      <Button 
        onClick={testExpenseCreation} 
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating...' : 'Test Create Expense'}
      </Button>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <strong>Success!</strong> Expense created with ID: {result.id || 'Unknown'}
        </div>
      )}
    </div>
  );
};

export default ExpenseTest; 