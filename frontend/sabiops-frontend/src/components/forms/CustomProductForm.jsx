import React, { useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { toast } from 'react-hot-toast';
import { createProduct, updateProduct } from '../../services/api';
import { handleApiErrorWithToast, showSuccessToast } from '../../utils/errorHandling';

const CustomProductForm = ({ 
  isEdit = false, 
  editingProduct = null, 
  onSuccess, 
  onCancel,
  categories = [] 
}) => {
  const formRef = useRef(null);
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const skuInputRef = useRef(null);
  const categorySelectRef = useRef(null);
  const priceInputRef = useRef(null);
  const costPriceInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const lowStockInputRef = useRef(null);
  const imageUrlInputRef = useRef(null);

  useEffect(() => {
    // Populate form if editing
    if (isEdit && editingProduct) {
      if (nameInputRef.current) nameInputRef.current.value = editingProduct.name || '';
      if (descriptionInputRef.current) descriptionInputRef.current.value = editingProduct.description || '';
      if (skuInputRef.current) skuInputRef.current.value = editingProduct.sku || '';
      if (categorySelectRef.current) categorySelectRef.current.value = editingProduct.category || '';
      if (priceInputRef.current) priceInputRef.current.value = editingProduct.price || '';
      if (costPriceInputRef.current) costPriceInputRef.current.value = editingProduct.cost_price || '';
      if (quantityInputRef.current) quantityInputRef.current.value = editingProduct.quantity || '';
      if (lowStockInputRef.current) lowStockInputRef.current.value = editingProduct.low_stock_threshold || '';
      if (imageUrlInputRef.current) imageUrlInputRef.current.value = editingProduct.image_url || '';
    }

    // Focus on first input
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEdit, editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🎯 CustomProductForm: Form submitted');

    // Get values directly from DOM
    const formData = {
      name: nameInputRef.current?.value?.trim() || '',
      description: descriptionInputRef.current?.value?.trim() || '',
      sku: skuInputRef.current?.value?.trim() || '',
      category: categorySelectRef.current?.value || '',
      price: parseFloat(priceInputRef.current?.value) || 0,
      cost_price: parseFloat(costPriceInputRef.current?.value) || 0,
      quantity: parseInt(quantityInputRef.current?.value) || 0,
      low_stock_threshold: parseInt(lowStockInputRef.current?.value) || 0,
      image_url: imageUrlInputRef.current?.value?.trim() || ''
    };

    console.log('🎯 CustomProductForm: Form data:', formData);

    // Validation
    if (!formData.name) {
      handleApiErrorWithToast(new Error("Product name is required"));
      nameInputRef.current?.focus();
      return;
    }

    if (!formData.price || formData.price <= 0) {
      handleApiErrorWithToast(new Error("Valid selling price is required"));
      priceInputRef.current?.focus();
      return;
    }

    if (!formData.quantity || formData.quantity < 0) {
      handleApiErrorWithToast(new Error("Valid stock quantity is required"));
      quantityInputRef.current?.focus();
      return;
    }

    if (formData.low_stock_threshold > formData.quantity) {
      handleApiErrorWithToast(new Error(`Low stock alert (${formData.low_stock_threshold}) cannot be greater than stock quantity (${formData.quantity})`));
      lowStockInputRef.current?.focus();
      return;
    }

    try {
      console.log('🎯 CustomProductForm: Submitting to API...');
      
      let response;
      if (isEdit && editingProduct) {
        response = await updateProduct(editingProduct.id, formData);
        showSuccessToast("Product updated successfully!");
      } else {
        response = await createProduct(formData);
        showSuccessToast("Product created successfully!");
      }

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
      handleApiErrorWithToast(error, isEdit ? 'Failed to update product' : 'Failed to create product');
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
          background-color: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #2563eb;
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
            <label htmlFor="name" className="form-label">Product Name *</label>
            <input
              ref={nameInputRef}
              type="text"
              id="name"
              name="name"
              className="form-input"
              placeholder="Enter product name"
              required
              onFocus={() => handleInputFocus('name')}
              onBlur={() => handleInputBlur('name')}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="sku" className="form-label">SKU</label>
            <input
              ref={skuInputRef}
              type="text"
              id="sku"
              name="sku"
              className="form-input"
              placeholder="Product SKU (optional)"
              onFocus={() => handleInputFocus('sku')}
              onBlur={() => handleInputBlur('sku')}
              onChange={(e) => handleInputChange('sku', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            ref={descriptionInputRef}
            id="description"
            name="description"
            className="form-textarea"
            placeholder="Product description"
            rows={3}
            onFocus={() => handleInputFocus('description')}
            onBlur={() => handleInputBlur('description')}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category" className="form-label">Category</label>
          <select
            ref={categorySelectRef}
            id="category"
            name="category"
            className="form-select"
            onFocus={() => handleInputFocus('category')}
            onBlur={() => handleInputBlur('category')}
            onChange={(e) => handleInputChange('category', e.target.value)}
          >
            <option value="">Select product category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price" className="form-label">Selling Price (₦) *</label>
            <input
              ref={priceInputRef}
              type="number"
              id="price"
              name="price"
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
            <label htmlFor="cost_price" className="form-label">Cost Price (₦)</label>
            <input
              ref={costPriceInputRef}
              type="number"
              id="cost_price"
              name="cost_price"
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity" className="form-label">Stock Quantity *</label>
            <input
              ref={quantityInputRef}
              type="number"
              id="quantity"
              name="quantity"
              min="0"
              className="form-input"
              placeholder="0"
              required
              onFocus={() => handleInputFocus('quantity')}
              onBlur={() => handleInputBlur('quantity')}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="low_stock_threshold" className="form-label">Low Stock Alert</label>
            <input
              ref={lowStockInputRef}
              type="number"
              id="low_stock_threshold"
              name="low_stock_threshold"
              min="0"
              className="form-input"
              placeholder="5"
              onFocus={() => handleInputFocus('low_stock_threshold')}
              onBlur={() => handleInputBlur('low_stock_threshold')}
              onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
            />
            <div className="help-text">
              Alert when stock falls below this number
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="image_url" className="form-label">Image URL</label>
          <input
            ref={imageUrlInputRef}
            type="url"
            id="image_url"
            name="image_url"
            className="form-input"
            placeholder="Enter image URL (optional)"
            onFocus={() => handleInputFocus('image_url')}
            onBlur={() => handleInputBlur('image_url')}
            onChange={(e) => handleInputChange('image_url', e.target.value)}
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
            {isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomProductForm; 