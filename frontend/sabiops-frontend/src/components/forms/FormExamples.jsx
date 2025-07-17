import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import StandardForm from './StandardForm';
import FormModal from './FormModal';
import FormBuilder, { useFormBuilder } from './FormBuilder';
import { customerFields, productFields, expenseFields } from './fieldConfigs';

/**
 * FormExamples - Comprehensive examples of how to use the standardized form system
 * This component demonstrates various usage patterns and can be used as a reference
 */
const FormExamples = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [builderModalOpen, setBuilderModalOpen] = useState(false);
  
  // Example using useFormBuilder hook
  const customerForm = useFormBuilder('customer', {
    name: '',
    email: '',
    phone: '',
    business_name: '',
    address: '',
    notes: ''
  });

  // Example form data
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    address: '',
    notes: ''
  });

  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: '',
    cost_price: '',
    quantity: '',
    category: '',
    sku: ''
  });

  // Handle customer form changes
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData(prev => ({ ...prev, [name]: value }));
  };

  // Handle customer form submission
  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    console.log('Customer form submitted:', customerData);
    alert('Customer form submitted! Check console for data.');
  };

  // Handle product form changes
  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  // Handle product form submission
  const handleProductSubmit = (e) => {
    e.preventDefault();
    console.log('Product form submitted:', productData);
    alert('Product form submitted! Check console for data.');
  };

  // Handle modal form submission
  const handleModalSubmit = (e) => {
    e.preventDefault();
    console.log('Modal form submitted:', customerData);
    alert('Modal form submitted! Check console for data.');
    setModalOpen(false);
  };

  // Handle FormBuilder submission
  const handleBuilderSubmit = (data, { setErrors, resetForm }) => {
    console.log('FormBuilder submitted:', data);
    
    // Simulate API call
    setTimeout(() => {
      // Simulate validation error
      if (data.name === 'error') {
        setErrors({ name: 'This name is not allowed' });
        return;
      }
      
      alert('FormBuilder form submitted! Check console for data.');
      resetForm();
      setBuilderModalOpen(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Standardized Form Examples</h1>
        <p className="text-gray-600">
          Comprehensive examples of the SabiOps standardized form system
        </p>
      </div>

      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="standard">Standard Form</TabsTrigger>
          <TabsTrigger value="modal">Form Modal</TabsTrigger>
          <TabsTrigger value="builder">Form Builder</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Standard Form Example */}
        <TabsContent value="standard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>StandardForm Component</CardTitle>
              <CardDescription>
                Basic usage of the StandardForm component with field configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardForm
                fields={customerFields}
                data={customerData}
                onChange={handleCustomerChange}
                onSubmit={handleCustomerSubmit}
                onCancel={() => setCustomerData({})}
                submitText="Add Customer"
                layout="default"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compact Layout</CardTitle>
              <CardDescription>
                Same form with compact layout for tighter spaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardForm
                fields={productFields.slice(0, 4)} // Show first 4 fields
                data={productData}
                onChange={handleProductChange}
                onSubmit={handleProductSubmit}
                onCancel={() => setProductData({})}
                submitText="Add Product"
                layout="compact"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Modal Example */}
        <TabsContent value="modal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FormModal Component</CardTitle>
              <CardDescription>
                Responsive modal that uses drawer on mobile, dialog on desktop
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                The FormModal automatically adapts to screen size - try resizing your browser
                or viewing on mobile to see the drawer behavior.
              </p>
              
              <Button onClick={() => setModalOpen(true)}>
                Open Customer Form Modal
              </Button>

              <FormModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                title="Add New Customer"
                description="Fill in the customer information below"
                fields={customerFields}
                data={customerData}
                onChange={handleCustomerChange}
                onSubmit={handleModalSubmit}
                submitText="Add Customer"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Builder Example */}
        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FormBuilder Component</CardTitle>
              <CardDescription>
                High-level form builder with entity types and built-in state management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                FormBuilder provides entity-specific forms with automatic field configuration,
                validation, and state management.
              </p>
              
              <Button onClick={() => setBuilderModalOpen(true)}>
                Open FormBuilder Modal
              </Button>

              <FormBuilder
                entityType="expense"
                mode="create"
                isModal={true}
                modalOpen={builderModalOpen}
                onModalOpenChange={setBuilderModalOpen}
                onSubmit={handleBuilderSubmit}
                onCancel={() => setBuilderModalOpen(false)}
                description="Add a new business expense"
                loading={customerForm.loading}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Inline FormBuilder</CardTitle>
              <CardDescription>
                FormBuilder used inline (not in modal) with custom field modifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormBuilder
                entityType="customer"
                mode="create"
                fieldModifications={{
                  name: { helpText: 'This is a modified help text' },
                  email: { required: true },
                  phone: { placeholder: 'Modified placeholder: +234...' }
                }}
                onSubmit={(data, { resetForm }) => {
                  console.log('Inline FormBuilder:', data);
                  alert('Inline form submitted! Check console.');
                  resetForm();
                }}
                layout="compact"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Examples */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Field Configuration</CardTitle>
              <CardDescription>
                Creating custom field configurations for specific use cases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardForm
                fields={[
                  {
                    name: 'title',
                    label: 'Title',
                    type: 'select',
                    required: true,
                    section: 'Personal Details',
                    options: [
                      { value: 'mr', label: 'Mr.' },
                      { value: 'mrs', label: 'Mrs.' },
                      { value: 'ms', label: 'Ms.' },
                      { value: 'dr', label: 'Dr.' }
                    ]
                  },
                  {
                    name: 'full_name',
                    label: 'Full Name',
                    type: 'text',
                    required: true,
                    section: 'Personal Details',
                    minLength: 2,
                    maxLength: 100,
                    fullWidth: true
                  },
                  {
                    name: 'date_of_birth',
                    label: 'Date of Birth',
                    type: 'date',
                    section: 'Personal Details',
                    validation: (value) => {
                      if (value) {
                        const birthDate = new Date(value);
                        const today = new Date();
                        const age = today.getFullYear() - birthDate.getFullYear();
                        if (age < 18) {
                          return 'Must be at least 18 years old';
                        }
                      }
                    }
                  },
                  {
                    name: 'newsletter',
                    label: 'Subscribe to Newsletter',
                    type: 'checkbox',
                    section: 'Preferences',
                    checkboxLabel: 'Yes, I want to receive newsletters'
                  },
                  {
                    name: 'bio',
                    label: 'Biography',
                    type: 'textarea',
                    section: 'Additional Information',
                    rows: 4,
                    maxLength: 500,
                    fullWidth: true,
                    helpText: 'Tell us about yourself (optional)'
                  }
                ]}
                data={{}}
                onChange={() => {}}
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Custom form submitted!');
                }}
                submitText="Submit Custom Form"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mobile-Optimized Layout</CardTitle>
              <CardDescription>
                Form specifically optimized for mobile devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StandardForm
                fields={[
                  {
                    name: 'quick_name',
                    label: 'Name',
                    type: 'text',
                    required: true,
                    placeholder: 'Enter name',
                    fullWidth: true
                  },
                  {
                    name: 'quick_phone',
                    label: 'Phone',
                    type: 'tel',
                    required: true,
                    placeholder: '+234...',
                    fullWidth: true
                  },
                  {
                    name: 'quick_amount',
                    label: 'Amount (₦)',
                    type: 'number',
                    step: '0.01',
                    required: true,
                    placeholder: '0.00',
                    fullWidth: true
                  }
                ]}
                data={{}}
                onChange={() => {}}
                onSubmit={(e) => {
                  e.preventDefault();
                  alert('Mobile form submitted!');
                }}
                layout="mobile"
                submitText="Quick Submit"
                className="max-w-sm mx-auto"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Usage Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p><strong>StandardForm:</strong> Use for basic forms with field configuration</p>
          <p><strong>FormModal:</strong> Use for forms in modals with responsive behavior</p>
          <p><strong>FormBuilder:</strong> Use for entity-specific forms with built-in patterns</p>
          <p><strong>Field Configs:</strong> Import pre-configured fields for common entities</p>
          <p><strong>Validation:</strong> Built-in validation with custom validation support</p>
          <p><strong>Mobile:</strong> All components are mobile-friendly with touch interactions</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormExamples;