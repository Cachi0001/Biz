import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import StableInput from '../ui/StableInput';
import RequiredFieldIndicator from '../ui/RequiredFieldIndicator';
import { formatNaira } from '../../utils/formatting';
import { toastService } from '../../services/ToastService';
import { createSale, getCustomers, getProducts } from '../../services/api';
import { handleLimitExceeded, checkLimitsBeforeSubmission } from '../../utils/limitHandler';
import LimitExceededModal from '../subscription/LimitExceededModal';
import subscriptionService from '../../services/subscriptionService';

export const SalesForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    product_id: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    payment_method: 'cash',
    notes: ''
  });
  
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState('');
  
  // Limit exceeded modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchProductsData();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customersData = await getCustomers();
      setCustomers(Array.isArray(customersData) ? customersData : customersData.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProductsData = async () => {
    try {
      setProductsLoading(true);
      setProductsError('');
      const productsData = await getProducts();
      setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProductsError('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  // Show limit exceeded modal
  const showLimitModal = (limitData) => {
    setLimitModalData(limitData);
    setLimitModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_id) {
      toastService.error('Please select a product');
      return;
    }
    
    if (formData.quantity <= 0) {
      toastService.error('Please enter a valid quantity');
      return;
    }

    // Check limits before submission
    const canCreate = await checkLimitsBeforeSubmission(
      'sales',
      subscriptionService.getUsageStatus,
      showLimitModal
    );
    
    if (!canCreate) {
      return; // Limit exceeded, don't proceed
    }

    try {
      setLoading(true);
      
      const selectedProduct = products.find(p => p.id === formData.product_id);
      const availableQuantity = parseInt(selectedProduct?.quantity) || 0;
      
      if (formData.quantity > availableQuantity) {
        toastService.error(`Only ${availableQuantity} units available for ${selectedProduct?.name}`);
        return;
      }

      const saleData = {
        customer_id: formData.customer_id || null,
        customer_name: formData.customer_name || 'Walk-in Customer',
        product_id: formData.product_id,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        total_amount: formData.total_amount,
        payment_method: formData.payment_method,
        notes: formData.notes
      };

      await createSale(saleData);
      toastService.success('Sale recorded successfully!');
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      
      // Handle limit exceeded errors from backend
      if (error.response && error.response.data) {
        const handled = handleLimitExceeded(error.response.data, showLimitModal);
        if (!handled) {
          // Enhanced error handling with specific messages
          let errorMessage = 'Failed to record sale';
          
          if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.response?.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (error.response?.status === 403) {
            errorMessage = 'You do not have permission to record sales.';
          } else if (error.response?.status >= 500) {
            errorMessage = 'Server error. Please try again later.';
          } else if (error.code === 'NETWORK_ERROR') {
            errorMessage = 'Network error. Please check your connection.';
          }
          
          toastService.error(errorMessage, {
            duration: 5000,
            position: 'top-center'
          });
        }
      } else {
        toastService.error('Failed to record sale', {
          duration: 5000,
          position: 'top-center'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer" className="text-base font-medium">Customer</Label>
          <Select
            value={formData.customer_id ? String(formData.customer_id) : 'walkin'}
            onValueChange={(value) => {
              console.log('🎯 SalesForm Customer Dropdown Change:', {
                selectedValue: value,
                customer_id: formData.customer_id,
                customersAvailable: customers.length,
                foundCustomer: customers.find(c => String(c.id) === value),
                allCustomers: customers.map(c => ({ id: c.id, name: c.name, type: typeof c.id }))
              });
              
              const customer = customers.find(c => String(c.id) === value);
              setFormData(prev => ({
                ...prev,
                customer_id: value === 'walkin' ? '' : value,
                customer_name: customer ? customer.name : (value === 'walkin' ? 'Walk-in Customer' : '')
              }));
            }}
          >
            <SelectTrigger className="h-12 text-base border-2 border-dashed border-blue-300" style={{ backgroundColor: '#f0f8ff' }}>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walkin">Walk-in Customer</SelectItem>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="product" className="text-base font-medium flex items-center gap-1">
              Product
              <RequiredFieldIndicator />
            </Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={fetchProductsData}
              disabled={productsLoading}
              className="ml-2 px-2 py-1 text-xs h-8"
            >
              {productsLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          <Select
            value={formData.product_id ? String(formData.product_id) : ''}
            onValueChange={(value) => {
              console.log('🎯 SalesForm Product Dropdown Change:', {
                selectedValue: value,
                product_id: formData.product_id,
                productsAvailable: products.length,
                foundProduct: products.find(p => String(p.id) === value),
                allProducts: products.map(p => ({ id: p.id, name: p.name, type: typeof p.id }))
              });
              
              const product = products.find(p => String(p.id) === value);
              if (product) {
                setFormData(prev => ({
                  ...prev,
                  product_id: value,
                  unit_price: parseFloat(product.price || product.unit_price || 0),
                  total_amount: parseFloat(product.price || product.unit_price || 0) * prev.quantity
                }));
              }
            }}
            disabled={productsLoading || !!productsError || products.length === 0}
          >
            <SelectTrigger className="h-12 text-base border-2 border-dashed border-purple-300" style={{ backgroundColor: '#faf5ff' }}>
              <SelectValue placeholder="Select product" />
            </SelectTrigger>
            <SelectContent>
              {productsLoading ? (
                <SelectItem value="all" disabled>
                  Loading products...
                </SelectItem>
              ) : productsError ? (
                <SelectItem value="all" disabled>
                  {productsError}
                </SelectItem>
              ) : products.length === 0 ? (
                <SelectItem value="all" disabled>
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

        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-base font-medium flex items-center gap-1">
            Quantity
            <RequiredFieldIndicator />
          </Label>
          <StableInput
            id="quantity"
            name="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => {
              const quantity = parseInt(e.target.value) || 1;
              setFormData(prev => ({
                ...prev,
                quantity,
                total_amount: prev.unit_price * quantity
              }));
            }}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="unit_price" className="text-base font-medium flex items-center gap-1">
            Unit Price
            <RequiredFieldIndicator />
          </Label>
          <StableInput
            id="unit_price"
            name="unit_price"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.unit_price}
            onChange={(e) => {
              const unit_price = parseFloat(e.target.value) || 0;
              setFormData(prev => ({
                ...prev,
                unit_price,
                total_amount: unit_price * prev.quantity
              }));
            }}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method" className="text-base font-medium">Payment Method</Label>
          <Select
            value={formData.payment_method}
            onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="transfer">Bank Transfer</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total_amount" className="text-base font-medium">Total Amount</Label>
          <div className="h-12 flex items-center px-3 bg-gray-100 rounded-md text-lg font-semibold">
            {formatNaira(formData.total_amount)}
          </div>
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
          placeholder="Additional notes about this sale"
          className="text-base"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading || !formData.product_id}
          className="flex-1 h-12 text-base"
        >
          {loading ? 'Recording...' : 'Record Sale'}
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

      {/* Limit Exceeded Modal */}
      <LimitExceededModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        featureType={limitModalData?.featureType}
        currentUsage={limitModalData?.currentUsage}
        limit={limitModalData?.limit}
        currentPlan={limitModalData?.currentPlan}
        suggestedPlans={limitModalData?.suggestedPlans}
      />
    </form>
  );
};