import React, { useEffect, useRef, useState } from 'react';
import { handleApiErrorWithToast } from '../../utils/errorHandling';
import { formatNaira } from '../../utils/formatting';
import { Calendar, Receipt, RefreshCw, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const ExpenseForm = ({ 
  onSubmit, 
  onCancel,
  editingExpense = null
}) => {
  const formRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    vendor: '',
    payment_method: 'cash',
    reference: '',
    notes: '',
    receipt_url: '',
    tax_deductible: false
  });

  // Form validation
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Define expense categories and subcategories
  const expenseCategories = [
    { id: 'Inventory/Stock Purchase', name: 'Inventory/Stock Purchase' },
    { id: 'Rent & Utilities', name: 'Rent & Utilities' },
    { id: 'Staff Salaries', name: 'Staff Salaries' },
    { id: 'Transportation', name: 'Transportation' },
    { id: 'Marketing & Advertising', name: 'Marketing & Advertising' },
    { id: 'Equipment & Tools', name: 'Equipment & Tools' },
    { id: 'Professional Services', name: 'Professional Services' },
    { id: 'Insurance', name: 'Insurance' },
    { id: 'Taxes & Government Fees', name: 'Taxes & Government Fees' },
    { id: 'Bank Charges', name: 'Bank Charges' },
    { id: 'Maintenance & Repairs', name: 'Maintenance & Repairs' },
    { id: 'Office Supplies', name: 'Office Supplies' },
    { id: 'Communication', name: 'Communication' },
    { id: 'Training & Development', name: 'Training & Development' },
    { id: 'Other', name: 'Other' }
  ];

  const subcategories = {
    'Inventory/Stock Purchase': ['Raw Materials', 'Finished Goods', 'Packaging Materials'],
    'Rent & Utilities': ['Rent', 'Electricity', 'Water', 'Internet', 'Gas'],
    'Staff Salaries': ['Full-time Staff', 'Part-time Staff', 'Contract Workers', 'Bonuses'],
    'Transportation': ['Fuel', 'Vehicle Maintenance', 'Public Transport', 'Delivery Fees'],
    'Marketing & Advertising': ['Online Ads', 'Print Media', 'Signage', 'Promotions'],
    'Equipment & Tools': ['Purchase', 'Rental', 'Maintenance', 'Repairs'],
    'Professional Services': ['Accounting', 'Legal', 'Consulting', 'IT Services'],
    'Insurance': ['Business Insurance', 'Health Insurance', 'Vehicle Insurance'],
    'Taxes & Government Fees': ['VAT', 'Income Tax', 'Business Registration', 'Permits'],
    'Bank Charges': ['Transaction Fees', 'Loan Interest', 'Account Maintenance'],
    'Maintenance & Repairs': ['Building Maintenance', 'Equipment Repairs'],
    'Office Supplies': ['Stationery', 'Printing', 'Furniture', 'Electronics'],
    'Communication': ['Phone Bills', 'Internet', 'Postage'],
    'Training & Development': ['Workshops', 'Courses', 'Books', 'Conferences'],
    'Other': ['Miscellaneous']
  };

  // Payment methods
  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'card', name: 'Card Payment' },
    { id: 'mobile_money', name: 'Mobile Money' },
    { id: 'cheque', name: 'Cheque' }
  ];

  // Initialize form with editing data
  useEffect(() => {
    if (editingExpense) {
      setFormData({
        category: editingExpense.category || '',
        subcategory: editingExpense.subcategory || '',
        amount: editingExpense.amount?.toString() || '',
        date: editingExpense.date || new Date().toISOString().split('T')[0],
        vendor: editingExpense.vendor || '',
        payment_method: editingExpense.payment_method || 'cash',
        reference: editingExpense.reference || '',
        notes: editingExpense.notes || '',
        receipt_url: editingExpense.receipt_url || '',
        tax_deductible: editingExpense.tax_deductible || false
      });
    }
  }, [editingExpense]);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle select change
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset subcategory when category changes
      ...(name === 'category' ? { subcategory: '' } : {})
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format data for API
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount) || 0
      };
      
      await onSubmit(submitData);
      
      // Reset form if not editing
      if (!editingExpense) {
        resetForm();
      }
    } catch (error) {
      console.error('Error submitting expense:', error);
      handleApiErrorWithToast(error, 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      category: '',
      subcategory: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      payment_method: 'cash',
      reference: '',
      notes: '',
      receipt_url: '',
      tax_deductible: false
    });
    setErrors({});
    
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  return (
    <div className="expense-form">
      <style jsx>{`
        .expense-form {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .expense-form form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        
        .form-input {
          height: 3rem;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          background-color: white;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          touch-action: manipulation;
        }
        
        .form-input:focus {
          outline: none;
          border-color: hsl(142 76% 36%);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }
        
        .form-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .form-textarea {
          min-height: 6rem;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          background-color: white;
          resize: vertical;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          touch-action: manipulation;
        }
        
        .form-textarea:focus {
          outline: none;
          border-color: hsl(142 76% 36%);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }
        
        .form-textarea.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .form-select {
          height: 3rem;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          background-color: white;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          touch-action: manipulation;
        }
        
        .form-select:focus {
          outline: none;
          border-color: hsl(142 76% 36%);
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }
        
        .form-select.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        .form-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .form-checkbox input {
          width: 1.25rem;
          height: 1.25rem;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          accent-color: hsl(142 76% 36%);
        }
        
        .form-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.15s ease-in-out;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-height: 3rem;
          touch-action: manipulation;
        }
        
        .btn-primary {
          background-color: hsl(142 76% 36%);
          color: white;
        }
        
        .btn-primary:hover {
          background-color: hsl(142 76% 28%);
        }
        
        .btn-secondary {
          background-color: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover {
          background-color: #4b5563;
        }
        
        .btn-outline {
          background-color: transparent;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }
        
        .btn-outline:hover {
          background-color: #f9fafb;
          border-color: #9ca3af;
        }
        
        .error-message {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (max-width: 639px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .form-input,
          .form-select,
          .form-textarea {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 0.75rem;
            height: auto;
            min-height: 3rem;
          }
          
          .form-buttons {
            flex-direction: column;
            gap: 0.75rem;
          }
          
          .btn {
            width: 100%;
          }
        }
      `}</style>

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* Category and Subcategory */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger className={`form-select ${errors.category ? 'error' : ''}`}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <div className="error-message">{errors.category}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <Select 
              value={formData.subcategory} 
              onValueChange={(value) => handleSelectChange('subcategory', value)}
              disabled={!formData.category}
            >
              <SelectTrigger className="form-select">
                <SelectValue placeholder={formData.category ? "Select a subcategory" : "Select category first"} />
              </SelectTrigger>
              <SelectContent>
                {formData.category && subcategories[formData.category]?.map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Amount and Date */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (₦) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`form-input ${errors.amount ? 'error' : ''}`}
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
            {errors.amount && (
              <div className="error-message">{errors.amount}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                className={`form-input pl-10 ${errors.date ? 'error' : ''}`}
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            {errors.date && (
              <div className="error-message">{errors.date}</div>
            )}
          </div>
        </div>

        {/* Vendor and Payment Method */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vendor/Supplier</label>
            <input
              type="text"
              className="form-input"
              name="vendor"
              value={formData.vendor}
              onChange={handleInputChange}
              placeholder="Enter vendor name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value) => handleSelectChange('payment_method', value)}
            >
              <SelectTrigger className="form-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reference */}
        <div className="form-group">
          <label className="form-label">Reference/Receipt Number</label>
          <input
            type="text"
            className="form-input"
            name="reference"
            value={formData.reference}
            onChange={handleInputChange}
            placeholder="Enter reference or receipt number"
          />
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className="form-textarea"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Additional notes about this expense..."
            rows="3"
          />
        </div>

        {/* Receipt URL */}
        <div className="form-group">
          <label className="form-label">Receipt URL</label>
          <input
            type="text"
            className="form-input"
            name="receipt_url"
            value={formData.receipt_url}
            onChange={handleInputChange}
            placeholder="Link to receipt image (optional)"
          />
        </div>

        {/* Tax Deductible */}
        <div className="form-checkbox">
          <input
            type="checkbox"
            name="tax_deductible"
            checked={formData.tax_deductible}
            onChange={handleInputChange}
            id="tax_deductible"
          />
          <label htmlFor="tax_deductible" className="text-sm text-gray-700">
            This expense is tax deductible
          </label>
        </div>

        {/* Form Buttons */}
        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={resetForm}
          >
            Reset Form
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save style={{ width: '1rem', height: '1rem' }} />
                {editingExpense ? 'Update Expense' : 'Save Expense'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;