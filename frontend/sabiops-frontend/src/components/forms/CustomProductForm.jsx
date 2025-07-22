import React, { useEffect, useRef } from 'react';
import { toastService } from '../../services/ToastService';
import { createProduct, updateProduct } from '../../services/api';
import { handleApiErrorWithToast } from '../../utils/errorHandling';
import { BUSINESS_CATEGORIES, BUSINESS_SUBCATEGORIES, getSubcategories } from '../../constants/categories';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const CustomProductForm = ({ 
  categories = [], 
  onSuccess, 
  onCancel,
  editingProduct = null
}) => {
  const formRef = useRef(null);
  const nameInputRef = useRef(null);
  const skuInputRef = useRef(null);
  const descriptionInputRef = useRef(null);
  const categorySelectRef = useRef(null);
  const priceInputRef = useRef(null);
  const costPriceInputRef = useRef(null);
  const quantityInputRef = useRef(null);
  const lowStockThresholdInputRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Add state for form data
  const [formData, setFormData] = React.useState({
    name: '',
    sku: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    cost_price: '',
    quantity: '',
    low_stock_threshold: '5',
    barcode: ''
  });

  const [loading, setLoading] = React.useState(false);

  // Categories and subcategories are now imported from shared constants

  useEffect(() => {
    // Focus on first input
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);

  // Populate form with editing data
  useEffect(() => {
    if (editingProduct) {
      console.log('🎯 CustomProductForm: Populating form with editing data:', editingProduct);
      
      // Set form values
      if (nameInputRef.current) nameInputRef.current.value = editingProduct.name || '';
      if (skuInputRef.current) skuInputRef.current.value = editingProduct.sku || '';
      if (descriptionInputRef.current) descriptionInputRef.current.value = editingProduct.description || '';
      if (priceInputRef.current) priceInputRef.current.value = editingProduct.price || editingProduct.unit_price || '';
      if (costPriceInputRef.current) costPriceInputRef.current.value = editingProduct.cost_price || '';
      if (quantityInputRef.current) quantityInputRef.current.value = editingProduct.quantity || '';
      if (lowStockThresholdInputRef.current) lowStockThresholdInputRef.current.value = editingProduct.low_stock_threshold || '5';
      if (barcodeInputRef.current) barcodeInputRef.current.value = editingProduct.barcode || '';

      // Set form data state
      setFormData({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        description: editingProduct.description || '',
        category: editingProduct.category || '',
        subcategory: editingProduct.subcategory || '',
        price: editingProduct.price || editingProduct.unit_price || '',
        cost_price: editingProduct.cost_price || '',
        quantity: editingProduct.quantity || '0',
        low_stock_threshold: editingProduct.low_stock_threshold || '5',
        barcode: editingProduct.barcode || ''
      });
    }
  }, [editingProduct]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    // Always use the latest value from formData for quantity
    const submitData = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      description: formData.description.trim(),
      category: formData.category,
      subcategory: formData.subcategory,
      price: parseFloat(formData.price) || 0,
      cost_price: parseFloat(formData.cost_price) || 0,
      quantity: parseInt(formData.quantity) || 0,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
      barcode: formData.barcode.trim() || null
    };

    try {
      const { validateProductData } = await import('../../utils/productValidator');
      const validation = validateProductData(submitData);
      if (!validation.isValid) {
        const firstErrorKey = Object.keys(validation.errors)[0];
        const firstError = validation.errors[firstErrorKey];
        toastService.error(firstError);
        return;
      }
      let response;
      if (editingProduct) {
        response = await updateProduct(editingProduct.id, validation.formattedData);
        toastService.success('Product updated successfully!');
      } else {
        response = await createProduct(validation.formattedData);
        toastService.success('Product created successfully!');
      }
      setFormData({
        name: '', sku: '', description: '', category: '', subcategory: '', price: '', cost_price: '', quantity: '', low_stock_threshold: '5', barcode: ''
      });
      if (onSuccess) onSuccess(response);
    } catch (error) {
      toastService.error(error?.response?.data?.message || error.message || 'Failed to create product');
    } finally {
      setLoading(false);
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
    
    // Update formData state for Select components
    if (inputName === 'category') {
      setFormData(prev => ({ 
        ...prev, 
        category: value,
        subcategory: '' // Reset subcategory when category changes
      }));
      
      // Auto-select first subcategory if available
      const subcategories = getSubcategories(value);
      if (subcategories.length > 0) {
        setTimeout(() => {
          setFormData(prev => ({ 
            ...prev, 
            subcategory: subcategories[0] 
          }));
        }, 100);
      }
    } else if (inputName === 'subcategory') {
      setFormData(prev => ({ ...prev, subcategory: value }));
    }
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
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className="form-select">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {BUSINESS_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <Select 
              value={formData.subcategory} 
              onValueChange={(value) => handleInputChange('subcategory', value)}
              disabled={!formData.category}
            >
              <SelectTrigger className="form-select">
                <SelectValue placeholder={formData.category ? "Select a subcategory" : "Select category first"} />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {getSubcategories(formData.category).map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="form-row">
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
            <label className="form-label">Selling Price (₦) *</label>
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

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Stock Quantity *</label>
            <input
              ref={quantityInputRef}
              type="number"
              min="0"
              className="form-input"
              placeholder="Enter quantity"
              required
              onFocus={() => handleInputFocus('quantity')}
              onBlur={() => handleInputBlur('quantity')}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Low Stock Threshold</label>
            <input
              ref={lowStockThresholdInputRef}
              type="number"
              min="0"
              className="form-input"
              placeholder="5"
              defaultValue="5"
              onFocus={() => handleInputFocus('low_stock_threshold')}
              onBlur={() => handleInputBlur('low_stock_threshold')}
              onChange={(e) => handleInputChange('low_stock_threshold', e.target.value)}
            />
          </div>
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
            disabled={loading}
          >
            {loading ? (editingProduct ? 'Updating...' : 'Creating...') : (editingProduct ? 'Update Product' : 'Create Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomProductForm; 