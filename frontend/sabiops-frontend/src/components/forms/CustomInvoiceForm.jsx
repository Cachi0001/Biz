import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { createInvoice } from '../../services/api';
import { handleApiErrorWithToast, showSuccessToast } from '../../utils/errorHandling';

const CustomInvoiceForm = ({ 
  customers = [], 
  products = [], 
  onSuccess, 
  onCancel 
}) => {
  const formRef = useRef(null);
  const customerSelectRef = useRef(null);
  const productSelectRef = useRef(null);
  const quantityInputRef = useRef(null);
  const priceInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const dueDateInputRef = useRef(null);
  const notesInputRef = useRef(null);

  useEffect(() => {
    // Focus on first input
    if (customerSelectRef.current) {
      customerSelectRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 CustomInvoiceForm: Form submitted');

    // Get values directly from DOM
    const formData = {
      customer_id: customerSelectRef.current?.value || '',
      product_id: productSelectRef.current?.value || '',
      quantity: parseInt(quantityInputRef.current?.value) || 0,
      unit_price: parseFloat(priceInputRef.current?.value) || 0,
      discount: parseFloat(discountInputRef.current?.value) || 0,
      due_date: dueDateInputRef.current?.value || '',
      notes: notesInputRef.current?.value?.trim() || ''
    };

    console.log('🎯 CustomInvoiceForm: Form data:', formData);

    // Validation
    if (!formData.customer_id) {
      handleApiErrorWithToast(new Error("Customer is required"));
      customerSelectRef.current?.focus();
      return;
    }

    if (!formData.product_id) {
      handleApiErrorWithToast(new Error("Product is required"));
      productSelectRef.current?.focus();
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      handleApiErrorWithToast(new Error("Valid quantity is required"));
      quantityInputRef.current?.focus();
      return;
    }

    if (!formData.unit_price || formData.unit_price <= 0) {
      handleApiErrorWithToast(new Error("Valid unit price is required"));
      priceInputRef.current?.focus();
      return;
    }

    try {
      console.log('🎯 CustomInvoiceForm: Submitting to API...');
      
      const response = await createInvoice(formData);
      showSuccessToast("Invoice created successfully!");

      console.log('🎯 CustomInvoiceForm: API response:', response);

      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }

    } catch (error) {
      console.error('🎯 CustomInvoiceForm: Error:', error);
      handleApiErrorWithToast(error, 'Failed to create invoice');
    }
  };

  const handleInputFocus = (inputName) => {
    console.log(`🎯 CustomInvoiceForm: ${inputName} focused`);
  };

  const handleInputBlur = (inputName) => {
    console.log(`🎯 CustomInvoiceForm: ${inputName} blurred`);
  };

  const handleInputChange = (inputName, value) => {
    console.log(`🎯 CustomInvoiceForm: ${inputName} changed to:`, value);
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
        }
        
        .form-buttons {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn {
          height: 3rem;
          padding: 0 1.5rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          touch-action: manipulation;
        }
        
        .btn-primary {
          background-color: #10b981;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #059669;
        }
        
        .btn-secondary {
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        
        .btn-secondary:hover {
          background-color: #f9fafb;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .help-text {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 0.25rem;
        }
        
        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="customer_id" className="form-label">Customer *</label>
            <select
              ref={customerSelectRef}
              id="customer_id"
              name="customer_id"
              className="form-select"
              required
              onFocus={() => handleInputFocus('customer_id')}
              onBlur={() => handleInputBlur('customer_id')}
              onChange={(e) => handleInputChange('customer_id', e.target.value)}
            >
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.email}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="product_id" className="form-label">Product *</label>
            <select
              ref={productSelectRef}
              id="product_id"
              name="product_id"
              className="form-select"
              required
              onFocus={() => handleInputFocus('product_id')}
              onBlur={() => handleInputBlur('product_id')}
              onChange={(e) => handleInputChange('product_id', e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - ₦{product.price}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity" className="form-label">Quantity *</label>
            <input
              ref={quantityInputRef}
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              className="form-input"
              placeholder="1"
              required
              onFocus={() => handleInputFocus('quantity')}
              onBlur={() => handleInputBlur('quantity')}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit_price" className="form-label">Unit Price (₦) *</label>
            <input
              ref={priceInputRef}
              type="number"
              id="unit_price"
              name="unit_price"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              required
              onFocus={() => handleInputFocus('unit_price')}
              onBlur={() => handleInputBlur('unit_price')}
              onChange={(e) => handleInputChange('unit_price', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="discount" className="form-label">Discount (%)</label>
            <input
              ref={discountInputRef}
              type="number"
              id="discount"
              name="discount"
              step="0.01"
              min="0"
              max="100"
              className="form-input"
              placeholder="0.00"
              onFocus={() => handleInputFocus('discount')}
              onBlur={() => handleInputBlur('discount')}
              onChange={(e) => handleInputChange('discount', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="due_date" className="form-label">Due Date</label>
            <input
              ref={dueDateInputRef}
              type="date"
              id="due_date"
              name="due_date"
              className="form-input"
              onFocus={() => handleInputFocus('due_date')}
              onBlur={() => handleInputBlur('due_date')}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">Notes</label>
          <textarea
            ref={notesInputRef}
            id="notes"
            name="notes"
            className="form-textarea"
            placeholder="Additional notes (optional)"
            rows={3}
            onFocus={() => handleInputFocus('notes')}
            onBlur={() => handleInputBlur('notes')}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
        </div>

        <div className="form-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomInvoiceForm; 