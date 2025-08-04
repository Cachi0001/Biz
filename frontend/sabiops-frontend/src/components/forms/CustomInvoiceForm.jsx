import React from 'react';
import { FormBuilder } from './index';
import { invoiceFields } from './fieldConfigs';

const CustomInvoiceForm = ({
  customers = [],
  products = [],
  onSuccess,
  onCancel,
  editingInvoice = null,
  onReview
}) => {
  // Prepare fields with dynamic options
  const customFields = invoiceFields.map(field => {
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
      const invoiceData = {
        ...data,
        customer_id: parseInt(data.customer_id),
        product_id: parseInt(data.product_id),
        // Add any other necessary transformations
      };

      // If we have an onReview function and this is a new invoice, call it
      if (onReview && !editingInvoice) {
        onReview(invoiceData);
        return;
      }

      // For actual submission, we would call the API here
      // This would typically be handled by the parent component
      if (onSuccess) {
        onSuccess(invoiceData);
      }
    } catch (error) {
      console.error('Error submitting invoice:', error);
      // Error handling would be done by the parent component
    }
  };

  return (
    <FormBuilder
      entityType="invoice"
      mode={editingInvoice ? "edit" : "create"}
      initialData={editingInvoice || {}}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      customFields={customFields}
      showCancel={true}
    />
  );
};

export default CustomInvoiceForm;