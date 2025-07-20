import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { createProduct } from '../../services/api';
import { handleApiErrorWithToast, showSuccessToast } from '../../utils/errorHandling';

const CustomProductForm = ({ 
  categories = [], 
  onSuccess, 
  onCancel 
}) => {
  const formRef = useRef(null);
  const nameInputRef = useRef(null);
  const skuInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const categorySelectRef = useRef(null);
  const priceInputRef = useRef(null);
  const costPriceInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    // Focus on first input
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 CustomProductForm: Form submitted');

    // Get values directly from DOM
    const formData = {
      name: nameInputRef.current?.value?.trim() || '',
      sku: skuInputRef.current?.value?.trim() || '',
      description: descriptionInputRef.current?.value?.trim() || '',
      category: categorySelectRef.current?.value || '',
      price: parseFloat(priceInputRef.current?.value) || 0,
      cost_price: parseFloat(costPriceInputRef.current?.value) || 0,
      quantity: parseInt(quantityInputRef.current?.value) || 0,
      barcode: barcodeInputRef.current?.value?.trim() || null
    };

    console.log('🎯 CustomProductForm: Form data:', formData);

    // Validation
    if (!formData.name) {
      handleApiErrorWithToast(new Error("Product name is required"));
      nameInputRef.current?.focus();
      return;
    }

    if (!formData.category) {
      handleApiErrorWithToast(new Error("Category is required"));
      categorySelectRef.current?.focus();
      return;
    }

    if (!formData.price || formData.price <= 0) {
      handleApiErrorWithToast(new Error("Valid price is required"));
      priceInputRef.current?.focus();
      return;
    }

    try {
      console.log('🎯 CustomProductForm: Submitting to API...');
      
      const response = await createProduct(formData);
      showSuccessToast("Product created successfully!");

      console.log('🎯 CustomProductForm: API response:', response);

      // Reset form
      if (formRef.current) {
        formRef.current.reset();
      }

      // Call success callback
      if (onSuccess) {
        onSuccess(response);
      }

    } catch (error) {
      console.error('🎯 CustomProductForm: Error:', error);
      handleApiErrorWithToast(error, 'Failed to create product');
    }
  };

  const handleInputFocus = (inputName) => {
    console.log(`🎯 CustomProductForm: ${inputName} focused`);
  };

  const handleInputBlur = (inputName) => {
    console.log(`🎯 CustomProductForm: ${inputName} blurred`);
  };

  const handleInputChange = (inputName, value) => {
    console.log(`🎯 CustomProductForm: ${inputName} changed to:`, value);
  };

  return (
    <div className="custom-product-form">
      <style jsx>{`
        .custom-product-form {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .custom-product-form form {
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
        
        @media (min-width: 640px) {
          .form-row {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <form ref={formRef} onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              ref={nameInputRef}
              type="text"
              className="form-input"
              placeholder="Enter product name"
              required
              onFocus={() => handleInputFocus('name')}
              onBlur={() => handleInputBlur('name')}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">SKU</label>
            <input
              ref={skuInputRef}
              type="text"
              className="form-input"
              placeholder="Product SKU (optional)"
              onFocus={() => handleInputFocus('sku')}
              onBlur={() => handleInputBlur('sku')}
              onChange={(e) => handleInputChange('sku', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            ref={descriptionInputRef}
            className="form-textarea"
            placeholder="Product description"
            rows="3"
            onFocus={() => handleInputFocus('description')}
            onBlur={() => handleInputBlur('description')}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              ref={categorySelectRef}
              className="form-select"
              required
              onFocus={() => handleInputFocus('category')}
              onBlur={() => handleInputBlur('category')}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Barcode</label>
            <input
              ref={barcodeInputRef}
              type="text"
              className="form-input"
              placeholder="Product barcode (optional)"
              onFocus={() => handleInputFocus('barcode')}
              onBlur={() => handleInputBlur('barcode')}
              onChange={(e) => handleInputChange('barcode', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Price (₦) *</label>
            <input
              ref={priceInputRef}
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              required
              onFocus={() => handleInputFocus('price')}
              onBlur={() => handleInputBlur('price')}
              onChange={(e) => handleInputChange('price', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Cost Price (₦)</label>
            <input
              ref={costPriceInputRef}
              type="number"
              step="0.01"
              min="0"
              className="form-input"
              placeholder="0.00"
              onFocus={() => handleInputFocus('cost_price')}
              onBlur={() => handleInputBlur('cost_price')}
              onChange={(e) => handleInputChange('cost_price', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Initial Stock Quantity</label>
          <input
            ref={quantityInputRef}
            type="number"
            min="0"
            className="form-input"
            placeholder="0"
            defaultValue="0"
            onFocus={() => handleInputFocus('quantity')}
            onBlur={() => handleInputBlur('quantity')}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
          />
        </div>

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
          >
            Create Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomProductForm; 