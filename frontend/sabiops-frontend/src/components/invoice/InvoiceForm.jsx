/**
 * InvoiceForm - Enhanced invoice creation form with focus stability
 * Addresses focus loss issues in invoice creation forms
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import SimpleFocusInput from '../ui/SimpleFocusInput';
import StableInput from '../ui/StableInput';
import FocusManager from '../../utils/focusManager';
import DebugLogger from '../../utils/debugLogger';

// Import enhanced API functions safely
let enhancedGetCustomers, enhancedGetProducts;
try {
  const enhancedApi = require('../../services/enhancedApi');
  enhancedGetCustomers = enhancedApi.enhancedGetCustomers;
  enhancedGetProducts = enhancedApi.enhancedGetProducts;
} catch (error) {
  console.warn('[InvoiceForm] Enhanced API not available, using fallbacks');
  enhancedGetCustomers = async () => [];
  enhancedGetProducts = async () => ({ products: [] });
}

const InvoiceForm = ({ onSubmit, onCancel, initialData = null }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    notes: '',
    terms_and_conditions: 'Payment is due within 30 days of invoice date.',
    currency: 'NGN',
    discount_amount: 0,
    items: [
      { 
        id: Date.now(), 
        product_id: '', 
        description: '', 
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 0, 
        discount_rate: 0 
      }
    ],
    ...initialData
  });

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load customers and products on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [customersData, productsData] = await Promise.all([
          enhancedGetCustomers(),
          enhancedGetProducts()
        ]);
        
        setCustomers(customersData);
        setProducts(productsData.products || []);
      } catch (error) {
        DebugLogger.logApiError('invoice-form-data-load', error, 'InvoiceForm');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field-specific errors
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [errors]);

  const handleItemChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  }, []);

  const addItem = useCallback(() => {
    FocusManager.preserveFocus(() => {
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
    });
  }, []);

  const removeItem = useCallback((index) => {
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    });
  }, []);

  const handleProductSelect = useCallback((index, productId) => {
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      FocusManager.preserveFocus(() => {
        setFormData(prev => {
          const updatedItems = [...prev.items];
          updatedItems[index] = {
            ...updatedItems[index],
            product_id: productId,
            description: product.name,
            unit_price: product.price || 0
          };
          return { ...prev, items: updatedItems };
        });
      });
    }
  }, [products]);

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required';
    }
    
    if (!formData.issue_date) {
      newErrors.issue_date = 'Issue date is required';
    }
    
    formData.items.forEach((item, index) => {
      if (!item.description?.trim()) {
        newErrors[`item_${index}_description`] = 'Item description is required';
      }
      if (!item.quantity || parseFloat(item.quantity) <= 0) {
        newErrors[`item_${index}_quantity`] = 'Valid quantity is required';
      }
      if (!item.unit_price || parseFloat(item.unit_price) <= 0) {
        newErrors[`item_${index}_unit_price`] = 'Valid unit price is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    DebugLogger.logFormSubmit('InvoiceForm', formData, 'submit');
    
    if (!validateForm()) {
      DebugLogger.logFormSubmit('InvoiceForm', errors, 'validation-failed');
      return;
    }
    
    try {
      setLoading(true);
      await onSubmit(formData);
    } catch (error) {
      DebugLogger.logApiError('invoice-form-submit', error, 'InvoiceForm');
    } finally {
      setLoading(false);
    }
  };

  const formatNaira = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {initialData ? 'Edit Invoice' : 'Create New Invoice'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer_id" className="text-sm font-medium">
                Customer *
              </Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => {
                  FocusManager.preserveFocus(() => {
                    setFormData(prev => ({ ...prev, customer_id: value }));
                    if (errors.customer_id) {
                      setErrors(prev => ({ ...prev, customer_id: null }));
                    }
                  });
                }}
                required
              >
                <SelectTrigger className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && (
                <p className="text-sm text-red-500">{errors.customer_id}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="issue_date" className="text-sm font-medium">
                Issue Date *
              </Label>
              <SimpleFocusInput
                id="issue_date"
                name="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={handleInputChange}
                className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                required
              />
              {errors.issue_date && (
                <p className="text-sm text-red-500">{errors.issue_date}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-medium">
                Due Date
              </Label>
              <StableInput
                id="due_date"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleInputChange}
                className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                componentName="InvoiceForm-DueDate"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_terms" className="text-sm font-medium">
                Payment Terms
              </Label>
              <StableInput
                id="payment_terms"
                name="payment_terms"
                value={formData.payment_terms}
                onChange={handleInputChange}
                placeholder="e.g., Net 30"
                className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                componentName="InvoiceForm-PaymentTerms"
              />
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <Label className="text-base font-medium">Invoice Items *</Label>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={addItem}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>
            
            {formData.items.map((item, index) => (
              <Card key={item.id} className="p-4 border-2 border-gray-100">
                <div className="space-y-4">
                  
                  {/* Product Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`product_id-${index}`} className="text-sm font-medium">
                        Product
                      </Label>
                      <Select
                        value={item.product_id}
                        onValueChange={(value) => handleProductSelect(index, value)}
                      >
                        <SelectTrigger 
                          id={`product_id-${index}`}
                          className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        >
                          <SelectValue placeholder="Select product (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} - {formatNaira(product.price || 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`description-${index}`} className="text-sm font-medium">
                        Description *
                      </Label>
                      <SimpleFocusInput
                        id={`description-${index}`}
                        name="description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Item description"
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        required
                      />
                      {errors[`item_${index}_description`] && (
                        <p className="text-sm text-red-500">{errors[`item_${index}_description`]}</p>
                      )}
                    </div>
                  </div>

                  {/* Quantity and Pricing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">
                        Quantity *
                      </Label>
                      <StableInput
                        id={`quantity-${index}`}
                        name="quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemQuantity-${index}`}
                        required
                      />
                      {errors[`item_${index}_quantity`] && (
                        <p className="text-sm text-red-500">{errors[`item_${index}_quantity`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`unit_price-${index}`} className="text-sm font-medium">
                        Unit Price (₦) *
                      </Label>
                      <StableInput
                        id={`unit_price-${index}`}
                        name="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemUnitPrice-${index}`}
                        required
                      />
                      {errors[`item_${index}_unit_price`] && (
                        <p className="text-sm text-red-500">{errors[`item_${index}_unit_price`]}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`tax_rate-${index}`} className="text-sm font-medium">
                        Tax (%)
                      </Label>
                      <StableInput
                        id={`tax_rate-${index}`}
                        name="tax_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.tax_rate}
                        onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemTaxRate-${index}`}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`discount_rate-${index}`} className="text-sm font-medium">
                        Discount (%)
                      </Label>
                      <StableInput
                        id={`discount_rate-${index}`}
                        name="discount_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={item.discount_rate}
                        onChange={(e) => handleItemChange(index, 'discount_rate', e.target.value)}
                        className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                        componentName={`InvoiceForm-ItemDiscountRate-${index}`}
                      />
                    </div>
                  </div>

                  {/* Total and Remove Button */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-200 gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        {formatNaira(calculateItemTotal(item))}
                      </span>
                    </div>
                    {formData.items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => removeItem(index)}
                        className="w-full sm:w-auto min-h-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Item
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Total Section */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <Label htmlFor="discount_amount" className="text-sm font-medium whitespace-nowrap">
                    Overall Discount (₦)
                  </Label>
                  <StableInput
                    id="discount_amount"
                    name="discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount_amount}
                    onChange={handleInputChange}
                    className="w-full sm:w-32 h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                    componentName="InvoiceForm-DiscountAmount"
                  />
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    Grand Total: {formatNaira(calculateInvoiceTotal())}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
              <StableInput
                id="notes"
                name="notes"
                placeholder="Additional notes for the invoice"
                value={formData.notes}
                onChange={handleInputChange}
                className="min-h-[96px] text-base sm:text-sm touch-manipulation resize-y"
                component="textarea"
                componentName="InvoiceForm-Notes"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions" className="text-sm font-medium">
                Terms and Conditions
              </Label>
              <StableInput
                id="terms_and_conditions"
                name="terms_and_conditions"
                placeholder="Terms and conditions for the invoice"
                value={formData.terms_and_conditions}
                onChange={handleInputChange}
                className="min-h-[96px] text-base sm:text-sm touch-manipulation resize-y"
                component="textarea"
                componentName="InvoiceForm-TermsAndConditions"
                rows={4}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto min-h-[48px] touch-manipulation"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto min-h-[48px] bg-green-600 hover:bg-green-700 touch-manipulation"
              disabled={loading}
            >
              {loading ? 'Creating...' : (initialData ? 'Update Invoice' : 'Create Invoice')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InvoiceForm;