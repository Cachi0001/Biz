import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { createInvoice, updateInvoice } from '../../services/api';
import { handleApiErrorWithToast, showSuccessToast } from '../../utils/errorHandling';
import { useFormValidation } from '../../hooks/useFormValidation';
import { formatNaira } from '../../utils/formatting';
import { Plus, Trash2, RefreshCw, Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const CustomInvoiceForm = ({ 
  customers = [], 
  products = [], 
  onSuccess, 
  onCancel,
  editingInvoice = null,
  onReview
}) => {
  const formRef = useRef(null);
  
  // Enhanced form state with multiple items
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: 'Payment is due within 30 days of invoice date.',
    currency: 'NGN',
    discount_amount: 0,
    items: [{ 
      id: Date.now(), 
      product_id: '', 
      description: '', 
      quantity: 1, 
      unit_price: 0, 
      tax_rate: 0, 
      discount_rate: 0 
    }],
  });

  // Form validation
  const {
    errors,
    itemErrors,
    touchedFields,
    isValidating,
    isValid,
    touchField,
    touchItemField,
    validateSingleField,
    validateItemField,
    validateForm,
    clearErrors,
    getFieldError,
    getItemFieldError,
    hasFieldError,
    hasItemFieldError,
    getAllErrors
  } = useFormValidation(formData);

  // Initialize form with editing data
  useEffect(() => {
    if (editingInvoice) {
      setFormData({
        customer_id: editingInvoice.customer_id || '',
        issue_date: editingInvoice.issue_date || new Date().toISOString().split('T')[0],
        due_date: editingInvoice.due_date || '',
        payment_terms: editingInvoice.payment_terms || 'Net 30',
        notes: editingInvoice.notes || '',
        terms_and_conditions: editingInvoice.terms_and_conditions || 'Payment is due within 30 days of invoice date.',
        currency: editingInvoice.currency || 'NGN',
        discount_amount: editingInvoice.discount_amount || 0,
        items: editingInvoice.items && editingInvoice.items.length > 0
          ? editingInvoice.items.map((item, index) => ({
            id: item.id || Date.now() + index,
            product_id: item.product_id || '',
            description: item.description || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            tax_rate: item.tax_rate || 0,
            discount_rate: item.discount_rate || 0,
          }))
          : [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
      });
    }
  }, [editingInvoice]);

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    if (name === 'discount_amount') {
      processedValue = value === '' ? '0' : Math.max(0, parseFloat(value) || 0).toString();
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));

    touchField(name);
    await validateSingleField(name, processedValue, { ...formData, [name]: processedValue });
  };

  const handleItemChange = async (index, field, value) => {
    let processedValue = value;
    if (field === 'quantity') {
      processedValue = value === '' ? 1 : Math.max(1, parseInt(value) || 1);
    } else if (field === 'unit_price') {
      processedValue = value === '' ? 0 : Math.max(0, parseFloat(value) || 0);
    } else if (field === 'tax_rate' || field === 'discount_rate') {
      processedValue = value === '' ? 0 : Math.max(0, Math.min(100, parseFloat(value) || 0));
    }

    setFormData(prev => {
      const updatedItems = [...prev.items];
      if (updatedItems[index]) {
        updatedItems[index] = { ...updatedItems[index], [field]: processedValue };

        // Auto-populate product details when product is selected
        if (field === 'product_id' && value) {
          const product = products.find(p => p.id === value);
          if (product && updatedItems[index]) {
            updatedItems[index].description = product.name || '';
            updatedItems[index].unit_price = product.price || product.unit_price || 0;
          }
        }
      }
      return { ...prev, items: updatedItems };
    });

    touchItemField(index, field);
    const updatedItem = { ...formData.items[index], [field]: processedValue };
    await validateItemField(index, field, updatedItem);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        id: Date.now() + Math.random(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const calculateItemTotal = (item) => {
    const quantity = Math.max(0, parseFloat(item.quantity) || 0);
    const unitPrice = Math.max(0, parseFloat(item.unit_price) || 0);
    const taxRate = Math.max(0, parseFloat(item.tax_rate) || 0);
    const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);
    total += total * (taxRate / 100);

    return Math.round(total * 100) / 100;
  };

  const calculateInvoiceTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const discount = Math.max(0, parseFloat(formData.discount_amount) || 0);
    const total = itemsTotal - discount;

    return Math.round(Math.max(0, total) * 100) / 100;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 CustomInvoiceForm: Form submitted');

    const validationResult = validateForm(formData);

    if (validationResult.hasErrors) {
      const allErrors = getAllErrors();
      if (allErrors.length === 1) {
        handleApiErrorWithToast(new Error(allErrors[0]));
      } else {
        handleApiErrorWithToast(new Error(`Please fix ${allErrors.length} errors before submitting`));
      }
      return;
    }

    // Show review dialog instead of directly submitting
    if (onReview) {
      onReview(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_terms: 'Net 30',
      notes: '',
      terms_and_conditions: 'Payment is due within 30 days of invoice date.',
      currency: 'NGN',
      discount_amount: 0,
      items: [{ id: Date.now(), product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0, discount_rate: 0 }],
    });
    clearErrors();
  };

  return (
    <div className="custom-invoice-form">
      <style jsx>{`
        .custom-invoice-form {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .custom-invoice-form form {
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
        
        .item-card {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          background-color: #f9fafb;
        }
        
        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .item-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .item-total {
          font-weight: 600;
          color: hsl(142 76% 36%);
          font-size: 1.125rem;
        }
        
        .invoice-total {
          background-color: #f0fdf4;
          border: 2px solid hsl(142 76% 36%);
          border-radius: 0.5rem;
          padding: 1rem;
          text-align: center;
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(142 76% 36%);
        }
        
        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
          
          .item-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        
        @media (min-width: 768px) {
          .item-grid {
            grid-template-columns: 1fr 1fr 1fr 1fr;
          }
        }
      `}</style>

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <Select 
              value={formData.customer_id} 
              onValueChange={(value) => {
                const event = { target: { name: 'customer_id', value } };
                handleInputChange(event);
              }}
            >
              <SelectTrigger className={`form-select ${hasFieldError('customer_id') ? 'error' : ''}`}>
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('customer_id') && (
              <div className="error-message">{getFieldError('customer_id')}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Issue Date *</label>
            <input
              type="date"
              className={`form-input ${hasFieldError('issue_date') ? 'error' : ''}`}
              value={formData.issue_date}
              onChange={handleInputChange}
              name="issue_date"
              required
            />
            {getFieldError('issue_date') && (
              <div className="error-message">{getFieldError('issue_date')}</div>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className={`form-input ${hasFieldError('due_date') ? 'error' : ''}`}
              value={formData.due_date}
              onChange={handleInputChange}
              name="due_date"
            />
            {getFieldError('due_date') && (
              <div className="error-message">{getFieldError('due_date')}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Payment Terms</label>
            <input
              type="text"
              className={`form-input ${hasFieldError('payment_terms') ? 'error' : ''}`}
              value={formData.payment_terms}
              onChange={handleInputChange}
              name="payment_terms"
              placeholder="e.g., Net 30"
            />
            {getFieldError('payment_terms') && (
              <div className="error-message">{getFieldError('payment_terms')}</div>
            )}
          </div>
        </div>

        {/* Invoice Items */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <label className="form-label">Invoice Items *</label>
            <button
              type="button"
              className="btn btn-outline"
              onClick={addItem}
            >
              <Plus style={{ width: '1rem', height: '1rem' }} />
              Add Item
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={item.id} className="item-card">
              <div className="item-header">
                <h4 style={{ margin: 0, fontWeight: 600 }}>Item {index + 1}</h4>
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => removeItem(index)}
                    style={{ color: '#ef4444', borderColor: '#ef4444' }}
                  >
                    <Trash2 style={{ width: '1rem', height: '1rem' }} />
                    Remove
                  </button>
                )}
              </div>

              <div className="item-grid">
                <div className="form-group">
                  <label className="form-label">Product</label>
                  <Select 
                    value={item.product_id} 
                    onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                  >
                    <SelectTrigger className={`form-select ${hasItemFieldError(index, 'product_id') ? 'error' : ''}`}>
                      <SelectValue placeholder="Select product (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <input
                    type="text"
                    className={`form-input ${hasItemFieldError(index, 'description') ? 'error' : ''}`}
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Item description"
                    required
                  />
                  {getItemFieldError(index, 'description') && (
                    <div className="error-message">{getItemFieldError(index, 'description')}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    className={`form-input ${hasItemFieldError(index, 'quantity') ? 'error' : ''}`}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                  {getItemFieldError(index, 'quantity') && (
                    <div className="error-message">{getItemFieldError(index, 'quantity')}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Unit Price (₦) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-input ${hasItemFieldError(index, 'unit_price') ? 'error' : ''}`}
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    required
                  />
                  {getItemFieldError(index, 'unit_price') && (
                    <div className="error-message">{getItemFieldError(index, 'unit_price')}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className={`form-input ${hasItemFieldError(index, 'tax_rate') ? 'error' : ''}`}
                    value={item.tax_rate}
                    onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                  />
                  {getItemFieldError(index, 'tax_rate') && (
                    <div className="error-message">{getItemFieldError(index, 'tax_rate')}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className={`form-input ${hasItemFieldError(index, 'discount_rate') ? 'error' : ''}`}
                    value={item.discount_rate}
                    onChange={(e) => handleItemChange(index, 'discount_rate', e.target.value)}
                  />
                  {getItemFieldError(index, 'discount_rate') && (
                    <div className="error-message">{getItemFieldError(index, 'discount_rate')}</div>
                  )}
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid #e5e7eb'
              }}>
                <div className="item-total">
                  Item Total: {formatNaira(calculateItemTotal(item))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Information */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Discount Amount (₦)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`form-input ${hasFieldError('discount_amount') ? 'error' : ''}`}
              value={formData.discount_amount}
              onChange={handleInputChange}
              name="discount_amount"
              placeholder="0.00"
            />
            {getFieldError('discount_amount') && (
              <div className="error-message">{getFieldError('discount_amount')}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Currency</label>
            <Select 
              value={formData.currency} 
              onValueChange={(value) => {
                const event = { target: { name: 'currency', value } };
                handleInputChange(event);
              }}
            >
              <SelectTrigger className={`form-select ${hasFieldError('currency') ? 'error' : ''}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">Nigerian Naira (₦)</SelectItem>
                <SelectItem value="USD">US Dollar ($)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
                <SelectItem value="GBP">British Pound (£)</SelectItem>
              </SelectContent>
            </Select>
            {getFieldError('currency') && (
              <div className="error-message">{getFieldError('currency')}</div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea
            className={`form-textarea ${hasFieldError('notes') ? 'error' : ''}`}
            value={formData.notes}
            onChange={handleInputChange}
            name="notes"
            placeholder="Additional notes for this invoice..."
            rows="3"
          />
          {getFieldError('notes') && (
            <div className="error-message">{getFieldError('notes')}</div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Terms and Conditions</label>
          <textarea
            className={`form-textarea ${hasFieldError('terms_and_conditions') ? 'error' : ''}`}
            value={formData.terms_and_conditions}
            onChange={handleInputChange}
            name="terms_and_conditions"
            placeholder="Terms and conditions for this invoice..."
            rows="3"
          />
          {getFieldError('terms_and_conditions') && (
            <div className="error-message">{getFieldError('terms_and_conditions')}</div>
          )}
        </div>

        {/* Invoice Total */}
        <div className="invoice-total">
          Invoice Total: {formatNaira(calculateInvoiceTotal())}
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
            type="submit"
            className="btn btn-primary"
            disabled={isValidating}
          >
            {isValidating ? (
              <>
                <RefreshCw style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
                Validating...
              </>
            ) : (
              <>
                <Eye style={{ width: '1rem', height: '1rem' }} />
                {editingInvoice ? 'Update Invoice' : 'Review & Create Invoice'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomInvoiceForm; 