import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { formatNaira } from '../../utils/formatting';

export const SalesForm = ({
  open,
  onOpenChange,
  onSubmit,
  loading,
  products,
  customers,
  formData,
  setFormData,
  productsLoading,
  productsError,
  fetchProductsData
}) => {
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: formData
  });

  // Watch form values
  const watchProductId = watch('product_id');
  const watchQuantity = watch('quantity', 1);
  const watchUnitPrice = watch('unit_price', 0);

  // Calculate total amount when quantity or unit price changes
  useEffect(() => {
    const quantity = parseFloat(watchQuantity) || 0;
    const unitPrice = parseFloat(watchUnitPrice) || 0;
    const total = quantity * unitPrice;
    
    setFormData(prev => ({
      ...prev,
      quantity,
      unit_price: unitPrice,
      total_amount: total
    }));
  }, [watchQuantity, watchUnitPrice, setFormData]);

  // Handle product selection
  const handleProductChange = (value) => {
    const product = products.find(p => p.id === value);
    if (product) {
      const availableQuantity = parseInt(product.quantity) || 0;
      const price = parseFloat(product.price || product.unit_price || 0);
      
      setFormData(prev => ({
        ...prev,
        product_id: value,
        unit_price: price,
        quantity: 1,
        total_amount: price * (prev.quantity || 1)
      }));

      setValue('unit_price', price);
      setValue('quantity', 1);
    }
  };

  // Handle quantity change with validation
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setValue('quantity', value);
  };

  // Handle blur for quantity validation
  const handleQuantityBlur = (e) => {
    const value = parseInt(e.target.value) || 1;
    const product = products.find(p => p.id === watchProductId);
    
    if (product) {
      const availableQuantity = parseInt(product.quantity) || 0;
      
      if (value > availableQuantity && availableQuantity > 0) {
        // Show warning and adjust quantity to available stock
        setValue('quantity', availableQuantity);
        return;
      }
      
      if (availableQuantity === 0) {
        // Show out of stock message
        return;
      }
    }
  };

  // Reset form when dialog is closed
  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Record New Sale</DialogTitle>
          <DialogDescription>
            Add a new sale transaction to your records
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Selection */}
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
                  {Array.isArray(customers) && customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem key={customer?.id || ''} value={customer?.id || ''}>
                        {customer?.name || 'Unknown Customer'}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No customers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="product" className="text-base font-medium">Product *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={fetchProductsData}
                  disabled={productsLoading}
                  className="ml-2 px-2 py-1 text-xs h-8"
                  aria-label="Refresh products"
                >
                  {productsLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              <Select
                value={formData.product_id}
                onValueChange={handleProductChange}
                disabled={productsLoading || !!productsError || products.length === 0}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={productsLoading ? 'Loading products...' : (productsError ? productsError : 'Select product')} />
                </SelectTrigger>
                <SelectContent>
                  {productsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading products...
                    </SelectItem>
                  ) : productsError ? (
                    <SelectItem value="error" disabled>
                      {productsError}
                    </SelectItem>
                  ) : !Array.isArray(products) || products.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No products available
                    </SelectItem>
                  ) : (
                    (Array.isArray(products) ? products : []).map((product) => {
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
                              {product.stockLabel || product.name}
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
                                {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock: ${quantity}` : `Qty: ${quantity}`}
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

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-base font-medium">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity || ''}
                onChange={handleQuantityChange}
                onBlur={handleQuantityBlur}
                className="h-12 text-base"
                required
              />
              {formData.product_id && (
                <p className="text-sm text-gray-500 mt-1">
                  Available: {products.find(p => p.id === formData.product_id)?.quantity || 0} units
                </p>
              )}
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Label htmlFor="unit_price" className="text-base font-medium">Unit Price (₦) *</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                min="0"
                value={formData.unit_price || ''}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    unit_price: value,
                    total_amount: value * (prev.quantity || 1)
                  }));
                }}
                className="h-12 text-base"
                required
              />
            </div>

            {/* Total Amount (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="total_amount" className="text-base font-medium">Total Amount</Label>
              <Input
                id="total_amount"
                type="text"
                value={formatNaira(formData.total_amount || 0)}
                readOnly
                className="h-12 text-base font-semibold text-green-600"
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method" className="text-base font-medium">Payment Method *</Label>
              <Select
                value={formData.payment_method || ''}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    payment_method: value
                  }));
                }}
                required
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="transfer">Bank Transfer</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-medium">Notes</Label>
            <textarea
              id="notes"
              rows="3"
              value={formData.notes || ''}
              onChange={(e) => {
                setFormData(prev => ({
                  ...prev,
                  notes: e.target.value
                }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Additional notes about this sale..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="px-6 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 px-6 h-12"
            >
              {loading ? 'Processing...' : 'Record Sale'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalesForm;
