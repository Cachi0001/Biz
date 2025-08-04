import React from 'react';
import { FormBuilder } from './index';
import { salesFields } from './fieldConfigs';

export const SalesForm = ({
  customers = [],
  products = [],
  onSuccess,
  onCancel
}) => {
  // Prepare fields with dynamic options
  const customFields = salesFields.map(field => {
    if (field.name === 'customer_id') {
      return {
        ...field,
        options: customers.map(customer => ({
          value: customer.id,
          label: customer.name
        }))
      };
    }
    if (field.name === 'product_id') {
      return {
        ...field,
        options: products.map(product => ({
          value: product.id,
          label: product.name
        }))
      };
    }
    return field;
  });

  // Handle form submission
  const handleSubmit = async (data, formHelpers) => {
    try {
      // Transform data for API submission
      const saleData = {
        ...data,
        customer_id: parseInt(data.customer_id),
        product_id: parseInt(data.product_id),
        // Add any other necessary transformations
      };

      // For actual submission, we would call the API here
      // This would typically be handled by the parent component
      if (onSuccess) {
        onSuccess(saleData);
      }
    } catch (error) {
      console.error('Error recording sale:', error);
      // Error handling would be done by the parent component
    }
  };

  return (
    <FormBuilder
      entityType="sale"
      mode="create"
      onSubmit={handleSubmit}
      onCancel={onCancel}
      customFields={customFields}
      showCancel={true}
    />
  );
};

export default SalesForm;