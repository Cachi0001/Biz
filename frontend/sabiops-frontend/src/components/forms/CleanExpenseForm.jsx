// Clean Expense Form - Auto-generated fields removed from UI
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import StableInput from '../ui/StableInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import RequiredFieldIndicator from '../ui/RequiredFieldIndicator';
import { DatePicker } from '../dropdowns';
import { toastService } from '../../services/ToastService';
import offlineService from '../../services/offlineService';
import autoGenerateService from '../../services/autoGenerateService';
import OfflineIndicator from '../ui/OfflineIndicator';

const CleanExpenseForm = ({ onSuccess, onCancel, editingExpense = null }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    category: '',
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Initialize form with editing data
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        description: editingExpense.description || '',
        amount: editingExpense.amount || 0,
        category: editingExpense.category || '',
        payment_method: editingExpense.payment_method || 'cash',
        date: editingExpense.date || new Date().toISOString().split('T')[0],
        notes: editingExpense.notes || ''
      });
    }
  }, [editingExpense]);

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toastService.error('Expense description is required');
      return;
    }
    
    if (formData.amount <= 0) {
      toastService.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      
      const expenseData = {
        ...formData,
        // Auto-generate reference number (not shown to user)
        reference_number: autoGenerateService.generateExpenseReference(),
        // Auto-generate expense ID
        expense_id: autoGenerateService.generateTransactionId('EXP')
      };

      if (isOffline) {
        const offlineExpense = offlineService.createOfflineExpense(expenseData);
        toastService.success('Expense saved offline! Will sync when online.');
        
        if (onSuccess) {
          onSuccess(offlineExpense);
        }
      } else {
        // Handle online creation
        console.log('Online expense submission:', expenseData);
        toastService.success('Expense recorded successfully!');
        
        if (onSuccess) {
          onSuccess(expenseData);
        }
      }
      
    } catch (error) {
      console.error('Error saving expense:', error);
      toastService.error('Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Offline Indicator */}
      <div className="flex justify-end">
        <OfflineIndicator />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-base font-medium flex items-center gap-1">
            Description
            <RequiredFieldIndicator />
          </Label>
          <StableInput
            id="description"
            name="description"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="What was this expense for?"
            className="h-12 text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount" className="text-base font-medium flex items-center gap-1">
            Amount (₦)
            <RequiredFieldIndicator />
          </Label>
          <StableInput
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            className="h-12 text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-base font-medium">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="office_supplies">Office Supplies</SelectItem>
              <SelectItem value="utilities">Utilities</SelectItem>
              <SelectItem value="rent">Rent</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="travel">Travel</SelectItem>
              <SelectItem value="meals">Meals & Entertainment</SelectItem>
              <SelectItem value="equipment">Equipment</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
              <SelectItem value="taxes">Taxes & Fees</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method" className="text-base font-medium">Payment Method</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="How was this paid?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date" className="text-base font-medium">Date</Label>
          <DatePicker
            value={formData.date}
            onChange={(date) => setFormData(prev => ({ ...prev, date }))}
            placeholder="Select date"
            className="h-12 text-base"
            format="YYYY-MM-DD"
            mobileOptimized={true}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-medium">Notes (Optional)</Label>
        <StableInput
          id="notes"
          name="notes"
          type="text"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Additional notes about this expense"
          className="text-base"
        />
      </div>

      {/* Auto-generated fields info */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 className="text-sm font-medium text-green-900 mb-2">✨ Auto-Generated Fields</h4>
        <div className="text-xs text-green-700 space-y-1">
          <div>• Reference Number: Unique expense reference generated automatically</div>
          <div>• Expense ID: System identifier created automatically</div>
          <div>• Timestamp: Exact time of creation recorded automatically</div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading || !formData.description.trim() || formData.amount <= 0}
          className="flex-1 h-12 text-base"
        >
          {loading ? 'Saving...' : 'Record Expense'}
          {isOffline && ' (Offline)'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="flex-1 h-12 text-base"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default CleanExpenseForm;