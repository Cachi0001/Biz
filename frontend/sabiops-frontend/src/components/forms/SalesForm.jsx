import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { StableInput } from '../ui/StableInput';
import { RequiredFieldIndicator } from '../ui/RequiredFieldIndicator';
import { formatNaira } from '../../utils/formatting';
import { toastService } from '../../services/ToastService';
import { createSale, getCustomers, getProducts } from '../../services/api';

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
      toastService.error('Failed to record sale');
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
            value={formData.customer_id || 'walkin'}
            onValueChange={(value) => {
              const customer = customers.find(c => c.id === value);
              setFormData(prev => ({
                ...prev,
                customer_id: value === 'walkin' ? '' : value,
                customer_name: customer ? customer.name : (value === 'walkin' ? 'Walk-in Customer' : '')
              }));
            }}
          >
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walkin">Walk-in Customer</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
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
            value={formData.product_id}
            onValueChange={(value) => {
              const product = products.find(p => p.id === value);
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
            <SelectTrigger className="h-12 text-base">
              <SelectValue 
                placeholder={productsLoading ? 'Loading products...' : (productsError ? productsError : 'Select product')}
              />
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
                      value={product.id}
                      disabled={isOutOfStock}
                      className={isOutOfStock ? 'opacity-50' : ''}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={isOutOfStock ? 'line-through' : ''}>
                          {product.name}
                        </span>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-sm text-green-600 font-medium">
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
              <SelectValue />
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
    </form>
  );
};
