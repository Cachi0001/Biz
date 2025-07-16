import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

const CustomerForm = ({ 
  customer, 
  onChange, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  loading = false 
}) => {
  const handleInputChange = (field, value) => {
    onChange({ ...customer, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Required Fields Section */}
      <div className="space-y-4">
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="text-sm font-semibold text-green-700 mb-2">Required Information</h3>
          <div className="space-y-2">
            <Label htmlFor="name" className="text-green-700">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter customer full name (required)"
              value={customer.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="border-green-200 focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-xs text-green-600">This field is mandatory for creating a customer</p>
          </div>
        </div>
      </div>

      {/* Optional Fields Section */}
      <div className="space-y-4">
        <div className="border-l-4 border-gray-300 pl-4">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Optional Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name" className="text-gray-600">
                Business Name <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="business_name"
                placeholder="Enter business name (optional)"
                value={customer.business_name || ''}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-600">
                Email Address <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email address (optional)"
                value={customer.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-gray-600">
                Phone Number <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="phone"
                placeholder="Enter phone number (optional)"
                value={customer.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-gray-600">
                Address <span className="text-gray-400">(optional)</span>
              </Label>
              <Input
                id="address"
                placeholder="Enter customer address (optional)"
                value={customer.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="border-gray-200 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <Label htmlFor="notes" className="text-gray-600">
              Notes <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the customer (optional)"
              value={customer.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="border-gray-200 focus:border-green-500 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500">Add any additional information about this customer</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={loading || !customer.name?.trim()}
        >
          {loading ? 'Saving...' : (isEditing ? 'Update Customer' : 'Add Customer')}
        </Button>
      </div>
    </form>
  );
};

export { CustomerForm };
export default CustomerForm;