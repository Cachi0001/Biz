// Compact Product Form - Fixed layout without excessive spacing
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import StableInput from '../ui/StableInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import RequiredFieldIndicator from '../ui/RequiredFieldIndicator';
import { toastService } from '../../services/ToastService';
import offlineService from '../../services/offlineService';
import autoGenerateService from '../../services/autoGenerateService';
import OfflineIndicator from '../ui/OfflineIndicator';

const CompactProductForm = ({ onSuccess, onCancel, editingProduct = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    quantity: 0,
    low_stock_threshold: 5,
    description: '',
    unit_of_measurement: 'pieces'
  });
  
  const [loading, setLoading] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Initialize form with editing data
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        price: editingProduct.price || editingProduct.unit_price || 0,
        quantity: editingProduct.quantity || 0,
        low_stock_threshold: editingProduct.low_stock_threshold || 5,
        description: editingProduct.description || '',
        unit_of_measurement: editingProduct.unit_of_measurement || 'pieces'
      });
    }
  }, [editingProduct]);

  // Setup online/offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toastService.error('Product name is required');
      return;
    }
    
    if (formData.price <= 0) {
      toastService.error('Please enter a valid price');
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        ...formData,
        // Auto-generate SKU (not shown to user)
        sku: autoGenerateService.generateSKU(formData.name, formData.category),
        unit_price: formData.price,
        price: formData.price
      };

      if (isOffline) {
        if (editingProduct) {
          const updatedProduct = offlineService.updateOfflineProduct(editingProduct.id, productData);
          toastService.success('Product updated offline! Will sync when online.');
          
          if (onSuccess) {
            onSuccess(updatedProduct);
          }
        } else {
          const offlineProduct = offlineService.createOfflineProduct(productData);
          toastService.success('Product saved offline! Will sync when online.');
          
          if (onSuccess) {
            onSuccess(offlineProduct);
          }
        }
      } else {
        // Handle online creation/update
        console.log('Online product submission:', productData);
        toastService.success(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
        
        if (onSuccess) {
          onSuccess(productData);
        }
      }
      
    } catch (error) {
      console.error('Error saving product:', error);
      toastService.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Offline Indicator */}
        <div className="flex justify-end">
          <OfflineIndicator />
        </div>
        
        {/* Main product information - 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1">
              Product Name
              <RequiredFieldIndicator />
            </Label>
            <StableInput
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter product name"
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">Food & Beverages</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="clothing">Clothing</SelectItem>
                <SelectItem value="health">Health & Beauty</SelectItem>
                <SelectItem value="home">Home & Garden</SelectItem>
                <SelectItem value="books">Books & Media</SelectItem>
                <SelectItem value="sports">Sports & Recreation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="price" className="text-sm font-medium flex items-center gap-1">
              Price (₦)
              <RequiredFieldIndicator />
            </Label>
            <StableInput
              id="price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.price}
              onChange={(e) => {
                const price = parseFloat(e.target.value) || 0;
                setFormData(prev => ({ ...prev, price }));
              }}
              placeholder="0.00"
              className="h-9 text-sm"
              required
            />
          </div>
        </div>

        {/* Stock and unit information - 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label htmlFor="quantity" className="text-sm font-medium">Initial Stock</Label>
            <StableInput
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="low_stock_threshold" className="text-sm font-medium">Low Stock Alert</Label>
            <StableInput
              id="low_stock_threshold"
              name="low_stock_threshold"
              type="number"
              min="0"
              value={formData.low_stock_threshold}
              onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
              placeholder="5"
              className="h-9 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="unit_of_measurement" className="text-sm font-medium">Unit</Label>
            <Select
              value={formData.unit_of_measurement}
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measurement: value }))}
            >
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pieces">Pieces</SelectItem>
                <SelectItem value="kg">Kilograms</SelectItem>
                <SelectItem value="g">Grams</SelectItem>
                <SelectItem value="liters">Liters</SelectItem>
                <SelectItem value="ml">Milliliters</SelectItem>
                <SelectItem value="meters">Meters</SelectItem>
                <SelectItem value="cm">Centimeters</SelectItem>
                <SelectItem value="boxes">Boxes</SelectItem>
                <SelectItem value="packs">Packs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Description and auto-generated info - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
            <StableInput
              id="description"
              name="description"
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Product description"
              className="h-9 text-sm"
            />
          </div>

          {/* Compact auto-generated fields info */}
          <div className="bg-blue-50 p-3 rounded border border-blue-200 flex items-center">
            <div>
              <div className="text-xs font-medium text-blue-900">✨ Auto-Generated</div>
              <div className="text-xs text-blue-700">
                SKU, Product ID, and timestamps created automatically
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            type="submit" 
            disabled={loading || !formData.name.trim()}
            className="flex-1 h-10 text-sm"
          >
            {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
            {isOffline && ' (Offline)'}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1 h-10 text-sm"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CompactProductForm;