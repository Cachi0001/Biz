// Offline-capable Product Creation/Update Form
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

const OfflineProductForm = ({ onSuccess, onCancel, editingProduct = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    unit_price: 0,
    quantity: 0,
    low_stock_threshold: 5,
    sku: '',
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
        unit_price: editingProduct.unit_price || editingProduct.price || 0,
        quantity: editingProduct.quantity || 0,
        low_stock_threshold: editingProduct.low_stock_threshold || 5,
        sku: editingProduct.sku || '',
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
        sku: formData.sku || autoGenerateService.generateSKU(formData.name, formData.category),
        unit_price: formData.price, // Ensure consistency
        price: formData.price
      };

      if (isOffline) {
        // Handle offline creation/update
        if (editingProduct) {
          const updatedProduct = offlineService.updateOfflineProduct(editingProduct.id, productData);
          toastService.success('Product updated offline! Will sync when online.', {
            duration: 4000,
            icon: '📱'
          });
          
          if (onSuccess) {
            onSuccess(updatedProduct);
          }
        } else {
          const offlineProduct = offlineService.createOfflineProduct(productData);
          toastService.success('Product saved offline! Will sync when online.', {
            duration: 4000,
            icon: '📱'
          });
          
          if (onSuccess) {
            onSuccess(offlineProduct);
          }
        }
      } else {
        // Handle online creation/update
        // This would integrate with your actual API
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

  const handleAutoGenerateSKU = () => {
    const autoSKU = autoGenerateService.generateSKU(formData.name, formData.category);
    setFormData(prev => ({ ...prev, sku: autoSKU }));
    toastService.success('SKU auto-generated!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Offline Indicator */}
      <div className="flex justify-end">
        <OfflineIndicator />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-base font-medium flex items-center gap-1">
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
            className="h-12 text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-base font-medium">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="h-12 text-base">
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

        <div className="space-y-2">
          <Label htmlFor="price" className="text-base font-medium flex items-center gap-1">
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
              setFormData(prev => ({ 
                ...prev, 
                price,
                unit_price: price 
              }));
            }}
            placeholder="0.00"
            className="h-12 text-base"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-base font-medium">Initial Stock Quantity</Label>
          <StableInput
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
            placeholder="0"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="low_stock_threshold" className="text-base font-medium">Low Stock Alert</Label>
          <StableInput
            id="low_stock_threshold"
            name="low_stock_threshold"
            type="number"
            min="0"
            value={formData.low_stock_threshold}
            onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
            placeholder="5"
            className="h-12 text-base"
          />
        </div>

        {/* SKU auto-generated - no input needed */}
        <div className="space-y-2">
          <div className="p-3 bg-green-50 rounded-md border border-green-200">
            <div className="text-sm font-medium text-green-800">✅ SKU Auto-Generated</div>
            <div className="text-xs text-green-700 mt-1">
              Product SKU will be automatically created based on name and category
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="unit_of_measurement" className="text-base font-medium">Unit of Measurement</Label>
        <Select
          value={formData.unit_of_measurement}
          onValueChange={(value) => setFormData(prev => ({ ...prev, unit_of_measurement: value }))}
        >
          <SelectTrigger className="h-12 text-base">
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

      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">Description (Optional)</Label>
        <StableInput
          id="description"
          name="description"
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Product description"
          className="text-base"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button 
          type="submit" 
          disabled={loading || !formData.name.trim()}
          className="flex-1 h-12 text-base"
        >
          {loading ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product')}
          {isOffline && ' (Offline)'}
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

export default OfflineProductForm;