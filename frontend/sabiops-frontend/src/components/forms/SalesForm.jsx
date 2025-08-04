import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import StableInput from '../ui/StableInput';
import RequiredFieldIndicator from '../ui/RequiredFieldIndicator';
import { formatNaira } from '../../utils/formatting';
import { toastService } from '../../services/ToastService';
import { createSale } from '../../services/api';
import { handleLimitExceeded, checkLimitsBeforeSubmission } from '../../utils/limitHandler';
import LimitExceededModal from '../subscription/LimitExceededModal';
import subscriptionService from '../../services/subscriptionService';
import { CustomerDropdown, ProductDropdown } from '../dropdowns';
import PaymentMethodSelector from './PaymentMethodSelector';

export const SalesForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    customer_id: '',
    customer_name: '',
    product_id: '',
    product_name: '',
    quantity: 1,
    unit_price: 0,
    total_amount: 0,
    payment_method: 'cash',
    payment_details: {},
    pos_account: '',
    pos_reference: '',
    transaction_type: 'Sale',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  // Limit exceeded modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalData, setLimitModalData] = useState(null);

  // Data fetching is now handled by the dropdown components

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
      
      // Product validation is now handled by the ProductDropdown component

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
          <CustomerDropdown
            value={formData.customer_id}
            onChange={(customer) => {
              console.log('SalesForm Customer Dropdown Change (Reusable):', customer);
              setFormData(prev => ({
                ...prev,
                customer_id: customer.id,
                customer_name: customer.name
              }));
            }}
            placeholder="Select customer"
            allowWalkIn={true}
            debugLabel="SalesForm"
            className="h-12 text-base"
            onError={(error) => {
              console.error('Customer dropdown error:', error);
              toastService.error('Failed to load customers');
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product" className="text-base font-medium flex items-center gap-1">
            Product
            <RequiredFieldIndicator />
          </Label>
          <ProductDropdown
            value={formData.product_id}
            onChange={(product) => {
              console.log('SalesForm Product Dropdown Change (Reusable):', product);
              setFormData(prev => ({
                ...prev,
                product_id: product.id,
                product_name: product.name,
                unit_price: parseFloat(product.price || product.unit_price || 0),
                total_amount: parseFloat(product.price || product.unit_price || 0) * prev.quantity
              }));
            }}
            placeholder="Select product"
            required={true}
            showStock={true}
            showPrice={true}
            showQuantityInInput={true}
            showSearch={true}
            debugLabel="SalesForm"
            className="h-12 text-base"
            onError={(error) => {
              console.error('Product dropdown error:', error);
              toastService.error('Failed to load products');
            }}
          />
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
          <PaymentMethodSelector
            value={formData.payment_method}
            onChange={(paymentData) => {
              console.log('SalesForm Payment Method Change (Enhanced):', paymentData);
              setFormData(prev => ({
                ...prev,
                payment_method: paymentData.method,
                payment_details: paymentData.details,
                pos_account: paymentData.pos_account,
                pos_reference: paymentData.pos_reference,
                transaction_type: paymentData.transaction_type
              }));
            }}
            className="h-12 text-base"
            showPOSDetails={true}
            showCreditOptions={true}
            debugLabel="SalesForm"
          />
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