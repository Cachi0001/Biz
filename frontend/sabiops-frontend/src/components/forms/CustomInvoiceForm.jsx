import React, { useEffect, useRef, useState } from 'react';
import { handleApiErrorWithToast } from '../../utils/errorHandling';
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
import RequiredFieldIndicator from '../ui/RequiredFieldIndicator';
import { handleLimitExceeded, checkLimitsBeforeSubmission } from '../../utils/limitHandler';
import LimitExceededModal from '../subscription/LimitExceededModal';
import subscriptionService from '../../services/subscriptionService';

const CustomInvoiceForm = ({ 
  customers = [], 
  products = [], 
  onSuccess, 
  onCancel,
  editingInvoice = null,
  onReview,
  onError
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
      description: 'Item 1', 
      quantity: 1, 
      unit_price: 0, 
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

  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');

  const fetchProductsData = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      // Assume products prop is managed by parent, or fetch here if needed
      // If fetching here, call the API and set products state
      // setProducts(await getProductsWithStock());
    } catch (error) {
      setProductsError('Failed to load products. Please try again.');
      // setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

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
            description: item.description || `Item ${index + 1}`,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            discount_rate: item.discount_rate || 0,
          }))
          : [{ id: Date.now(), product_id: '', description: 'Item 1', quantity: 1, unit_price: 0, discount_rate: 0 }],
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
    } else if (field === 'discount_rate') {
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
        description: `Item ${prev.items.length + 1}`, 
        quantity: 1, 
        unit_price: 0, 
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
    const discountRate = Math.max(0, Math.min(100, parseFloat(item.discount_rate) || 0));

    let total = quantity * unitPrice;
    total -= total * (discountRate / 100);

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
    console.log('🎯 Form data:', formData);

    const validationResult = validateForm(formData);
    console.log('🎯 Validation result:', validationResult);

    if (validationResult.hasErrors) {
      const allErrors = getAllErrors();
      console.log('🎯 All errors:', allErrors);
      
      if (allErrors.length === 1) {
        console.log('🎯 Single error:', allErrors[0]);
        handleApiErrorWithToast(new Error(allErrors[0]));
      } else {
        console.log('🎯 Multiple errors:', allErrors);
        handleApiErrorWithToast(new Error(`Please fix ${allErrors.length} errors before submitting`));
      }
      if (typeof onError === 'function') onError(new Error('Validation failed'), editingInvoice ? 'update' : 'create');
      return;
    }

    // Show review dialog instead of directly submitting
    if (onReview) {
      onReview(formData);
    } else if (onSuccess) {
      // If no review function is provided, call onSuccess directly
      onSuccess(formData, editingInvoice ? 'update' : 'create');
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
      items: [{ id: Date.now(), product_id: '', description: 'Item 1', quantity: 1, unit_price: 0, discount_rate: 0 }],
    });
    clearErrors();
    
    // Reset form fields
    if (formRef.current) {
      formRef.current.reset();
    }
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
        
        .compact-input {
          max-width: 120px;
          height: 2.5rem;
          padding: 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background-color: white;
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
          touch-action: manipulation;
        }
        
        .compact-input:focus {
          outline: none;
          border-color: hsl(142 76% 36%);
          box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.1);
        }
        
        .compact-input.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1);
        }
        
        .compact-input:read-only {
          background-color: #f3f4f6;
          cursor: not-allowed;
          color: #6b7280;
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
        
        @media (max-width: 639px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .item-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          
          .form-input,
          .form-select,
          .form-textarea {
            font-size: 16px; /* Prevents zoom on iOS */
            padding: 0.75rem;
            height: auto;
            min-height: 3rem;
          }
          
          .compact-input {
            max-width: 100%;
            font-size: 16px; /* Prevents zoom on iOS */
            height: 3rem;
            padding: 0.75rem;
          }
          
          .item-card {
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
            background-color: white;
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
        {/* Basic Information */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label flex items-center gap-1">
              Customer
              <RequiredFieldIndicator />
            </label>
            <Select 
              value={formData.customer_id ? String(formData.customer_id) : ''} 
              onValueChange={(value) => {
                console.log('🎯 InvoiceForm Customer Dropdown Change:', {
                  selectedValue: value,
                  customer_id: formData.customer_id,
                  customersAvailable: customers.length,
                  foundCustomer: customers.find(c => String(c.id) === value),
                  allCustomers: customers.map(c => ({ id: c.id, name: c.name, type: typeof c.id }))
                });
                
                const event = { target: { name: 'customer_id', value: value } };
                handleInputChange(event);
              }}
            >
              <SelectTrigger className={`form-select ${hasFieldError('customer_id') ? 'error' : ''} border-2 border-dashed border-blue-300`} style={{ backgroundColor: '#f0f8ff' }}>
                <SelectValue placeholder="Select a customer">
                  {formData.customer_id ? 
                    (customers.find(c => String(c.id) === String(formData.customer_id))?.name || 'Unknown Customer') : 
                    'Select a customer'
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span>{customer.name}</span>
                      <span style={{ fontSize: '10px', color: '#666', marginLeft: '8px' }}>
                        ID: {customer.id} ({typeof customer.id})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getFieldError('customer_id') && (
              <div className="error-message">{getFieldError('customer_id')}</div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label flex items-center gap-1">
              Issue Date
              <RequiredFieldIndicator />
            </label>
            <input
              type="date"
              className={`form-input ${hasFieldError('issue_date') ? 'error' : ''}`}
              value={formData.issue_date}
              onChange={handleInputChange}
              name="issue_date"
              required
              readOnly
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
            />
            <div className="text-xs text-gray-500 mt-1">
              📅 Issue date is automatically set to today's date
            </div>
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
            <label className="form-label flex items-center gap-1">
              Invoice Items
              <RequiredFieldIndicator />
            </label>
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
                  <div className="flex items-center justify-between">
                    <label className="form-label">Product</label>
                    <button
                      type="button"
                      className="btn btn-outline px-2 py-1 text-xs h-8 ml-2"
                      onClick={fetchProductsData}
                      disabled={productsLoading}
                      aria-label="Refresh products"
                    >
                      {productsLoading ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </div>
                  <Select
                    value={item.product_id ? String(item.product_id) : ''}
                    onValueChange={(value) => {
                      console.log('🎯 InvoiceForm Product Dropdown Change:', {
                        itemIndex: index,
                        selectedValue: value,
                        product_id: item.product_id,
                        productsAvailable: products.length,
                        foundProduct: products.find(p => String(p.id) === value),
                        allProducts: products.map(p => ({ id: p.id, name: p.name, type: typeof p.id }))
                      });
                      
                      const product = products.find(p => String(p.id) === value);
                      if (product) {
                        handleItemChange(index, 'product_id', parseInt(value));
                        handleItemChange(index, 'unit_price', parseFloat(product.price || product.unit_price || 0));
                        handleItemChange(index, 'description', product.name || 'Item ' + (index + 1));
                      }
                    }}
                    disabled={productsLoading || !!productsError}
                  >
                    <SelectTrigger className={`form-select ${hasItemFieldError(index, 'product_id') ? 'error' : ''} border-2 border-dashed border-purple-300`} style={{ backgroundColor: '#faf5ff' }}>
                      <SelectValue 
                        placeholder={productsLoading ? 'Loading products...' : (productsError ? productsError : 'Select product (optional)')}
                      >
                        {item.product_id ? 
                          `${products.find(p => String(p.id) === String(item.product_id))?.name || 'Unknown Product'} (${products.find(p => String(p.id) === String(item.product_id))?.quantity || 0} left)` : 
                          'Select product'
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {productsLoading ? (
                        <SelectItem value="_info_loading_" disabled>
                          Loading products...
                        </SelectItem>
                      ) : productsError ? (
                        <SelectItem value="_info_error_" disabled>
                          {productsError}
                        </SelectItem>
                      ) : products.length === 0 ? (
                        <SelectItem value="_info_empty_" disabled>
                          No products available
                        </SelectItem>
                      ) : (
                        products.map((product) => {
                          const quantity = parseInt(product.quantity) || 0;
                          const lowStockThreshold = parseInt(product.low_stock_threshold) || 5;
                          const isOutOfStock = quantity === 0;
                          const isLowStock = quantity <= lowStockThreshold && quantity > 0;
                          
                          return (
                            <SelectItem 
                              key={product.id} 
                              value={String(product.id)}
                              disabled={isOutOfStock}
                              className={isOutOfStock ? 'opacity-50' : ''}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span className={isOutOfStock ? 'line-through' : ''}>
                                  {product.name}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '8px' }}>
                                  <span style={{ fontSize: '12px', color: '#059669', fontWeight: '500' }}>
                                    {formatNaira(product.price || product.unit_price || 0)}
                                  </span>
                                  <span style={{ fontSize: '10px', color: '#666', marginLeft: '4px' }}>
                                    ID: {product.id} ({typeof product.id})
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    isOutOfStock 
                                      ? 'bg-red-100 text-red-700' 
                                      : isLowStock 
                                      ? 'bg-yellow-100 text-yellow-700' 
                                      : 'bg-green-100 text-green-700'
                                  }`}>
                                    {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low: ${quantity}` : `Qty: ${quantity}`}
                                  </span>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-1">
                    Description
                    <RequiredFieldIndicator />
                  </label>
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
                  <label className="form-label flex items-center gap-1">
                    Quantity
                    <RequiredFieldIndicator />
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`compact-input ${hasItemFieldError(index, 'quantity') ? 'error' : ''}`}
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    required
                  />
                  {getItemFieldError(index, 'quantity') && (
                    <div className="error-message">{getItemFieldError(index, 'quantity')}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label flex items-center gap-1">
                    Unit Price (₦)
                    <RequiredFieldIndicator />
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`compact-input ${hasItemFieldError(index, 'unit_price') ? 'error' : ''}`}
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                    required
                    readOnly={!!item.product_id}
                  />
                  {item.product_id && (
                    <div className="text-xs text-gray-500 mt-1">
                      Price from selected product. Edit product to change price.
                    </div>
                  )}
                  {getItemFieldError(index, 'unit_price') && (
                    <div className="error-message">{getItemFieldError(index, 'unit_price')}</div>
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

        {/* Invoice Total */}
        <div className="invoice-total">
          Invoice Total: {formatNaira(calculateInvoiceTotal())}
        </div>

        {/* Form Buttons */}
        <div className="form-buttons grid grid-cols-2 gap-2 sm:flex sm:gap-3 sm:justify-end">
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
            className="btn btn-primary col-span-2 sm:col-span-1"
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