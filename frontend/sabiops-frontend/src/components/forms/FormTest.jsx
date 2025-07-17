import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import StandardForm from './StandardForm';
import { customerFields } from './fieldConfigs';

/**
 * FormTest - Simple test component to verify form functionality
 */
const FormTest = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    address: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Form submitted successfully! Check console for data.');
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      business_name: '',
      address: '',
      notes: ''
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Form Test - Customer Form</CardTitle>
        </CardHeader>
        <CardContent>
          <StandardForm
            fields={customerFields}
            data={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitText="Test Submit"
            cancelText="Reset Form"
          />
        </CardContent>
      </Card>
      
      <Card className="max-w-2xl mx-auto mt-6">
        <CardHeader>
          <CardTitle>Current Form Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default FormTest;