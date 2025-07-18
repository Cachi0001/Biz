/**
 * Integration Tests - End-to-end tests for complete user workflows
 * Tests the interaction between focus management, data display, and form submission
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';

// Mock components for testing
import StableInput from '../components/ui/StableInput';
import FocusManager from '../utils/focusManager';
import { enhancedGetExpenses, enhancedCreateExpense, enhancedGetProducts, enhancedCreateProduct } from '../services/enhancedApi';

// Mock the enhanced API
jest.mock('../services/enhancedApi');
jest.mock('../utils/debugLogger', () => ({
  logApiCall: jest.fn(),
  logFormSubmit: jest.fn(),
  logFocusEvent: jest.fn(),
  logDataDisplay: jest.fn(),
  logDisplayIssue: jest.fn(),
  logDropdownEvent: jest.fn(),
  logDropdownIssue: jest.fn(),
  startTimer: jest.fn(() => jest.fn()),
  setEnabled: jest.fn()
}));

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Test component that simulates expense form
const ExpenseFormTest = ({ onSubmit = jest.fn() }) => {
  const [formData, setFormData] = React.useState({
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear field errors
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'Valid amount is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        await onSubmit(formData);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="expense-form">
      <div>
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          data-testid="category-select"
        >
          <option value="">Select category</option>
          <option value="Office">Office</option>
          <option value="Travel">Travel</option>
          <option value="Utilities">Utilities</option>
        </select>
        {errors.category && <span data-testid="category-error">{errors.category}</span>}
      </div>
      
      <div>
        <label htmlFor="amount">Amount</label>
        <StableInput
          id="amount"
          name="amount"
          type="number"
          value={formData.amount}
          onChange={handleChange}
          data-testid="amount-input"
          componentName="ExpenseForm-Amount"
        />
        {errors.amount && <span data-testid="amount-error">{errors.amount}</span>}
      </div>
      
      <div>
        <label htmlFor="description">Description</label>
        <StableInput
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          data-testid="description-input"
          componentName="ExpenseForm-Description"
        />
      </div>
      
      <div>
        <label htmlFor="date">Date</label>
        <StableInput
          id="date"
          name="date"
          type="date"
          value={formData.date}
          onChange={handleChange}
          data-testid="date-input"
          componentName="ExpenseForm-Date"
        />
      </div>
      
      <button type="submit" disabled={loading} data-testid="submit-button">
        {loading ? 'Saving...' : 'Save Expense'}
      </button>
    </form>
  );
};

// Test component that simulates product form
const ProductFormTest = ({ onSubmit = jest.fn() }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    price: '',
    quantity: '',
    category: ''
  });
  const [loading, setLoading] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({ ...prev, [name]: value }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="product-form">
      <StableInput
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Product name"
        data-testid="name-input"
        componentName="ProductForm-Name"
      />
      
      <StableInput
        name="price"
        type="number"
        value={formData.price}
        onChange={handleChange}
        placeholder="Price"
        data-testid="price-input"
        componentName="ProductForm-Price"
      />
      
      <StableInput
        name="quantity"
        type="number"
        value={formData.quantity}
        onChange={handleChange}
        placeholder="Quantity"
        data-testid="quantity-input"
        componentName="ProductForm-Quantity"
      />
      
      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        data-testid="category-select"
      >
        <option value="">Select category</option>
        <option value="Electronics">Electronics</option>
        <option value="Clothing">Clothing</option>
      </select>
      
      <button type="submit" disabled={loading} data-testid="submit-button">
        {loading ? 'Saving...' : 'Save Product'}
      </button>
    </form>
  );
};

describe('Integration Tests - Complete Workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('expense creation workflow with focus preservation', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });
    
    render(<ExpenseFormTest onSubmit={mockSubmit} />);
    
    // Fill out the form with focus preservation
    const categorySelect = screen.getByTestId('category-select');
    const amountInput = screen.getByTestId('amount-input');
    const descriptionInput = screen.getByTestId('description-input');
    
    // Select category
    await user.selectOptions(categorySelect, 'Office');
    expect(categorySelect).toHaveValue('Office');
    
    // Type amount with focus preservation
    await user.click(amountInput);
    await user.type(amountInput, '150.75');
    expect(amountInput).toHaveFocus();
    expect(amountInput).toHaveValue('150.75');
    
    // Type description with focus preservation
    await user.click(descriptionInput);
    await user.type(descriptionInput, 'Office supplies purchase');
    expect(descriptionInput).toHaveFocus();
    expect(descriptionInput).toHaveValue('Office supplies purchase');
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        category: 'Office',
        amount: '150.75',
        description: 'Office supplies purchase',
        date: expect.any(String)
      });
    });
  });

  test('expense form validation with focus restoration', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    
    render(<ExpenseFormTest onSubmit={mockSubmit} />);
    
    const amountInput = screen.getByTestId('amount-input');
    const submitButton = screen.getByTestId('submit-button');
    
    // Try to submit without required fields
    await user.click(submitButton);
    
    // Should show validation errors
    expect(screen.getByTestId('category-error')).toBeInTheDocument();
    expect(screen.getByTestId('amount-error')).toBeInTheDocument();
    
    // Form should not be submitted
    expect(mockSubmit).not.toHaveBeenCalled();
    
    // Fill in amount field
    await user.click(amountInput);
    await user.type(amountInput, '100');
    
    // Amount error should clear
    expect(screen.queryByTestId('amount-error')).not.toBeInTheDocument();
    expect(amountInput).toHaveFocus();
  });

  test('product creation workflow with dropdown interaction', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockResolvedValue({ success: true });
    
    render(<ProductFormTest onSubmit={mockSubmit} />);
    
    const nameInput = screen.getByTestId('name-input');
    const priceInput = screen.getByTestId('price-input');
    const quantityInput = screen.getByTestId('quantity-input');
    const categorySelect = screen.getByTestId('category-select');
    
    // Fill out product form
    await user.click(nameInput);
    await user.type(nameInput, 'Test Product');
    expect(nameInput).toHaveFocus();
    
    await user.click(priceInput);
    await user.type(priceInput, '29.99');
    expect(priceInput).toHaveFocus();
    
    await user.click(quantityInput);
    await user.type(quantityInput, '50');
    expect(quantityInput).toHaveFocus();
    
    await user.selectOptions(categorySelect, 'Electronics');
    expect(categorySelect).toHaveValue('Electronics');
    
    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'Test Product',
        price: '29.99',
        quantity: '50',
        category: 'Electronics'
      });
    });
  });

  test('rapid form interactions maintain focus stability', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn();
    
    render(<ExpenseFormTest onSubmit={mockSubmit} />);
    
    const amountInput = screen.getByTestId('amount-input');
    const descriptionInput = screen.getByTestId('description-input');
    
    // Rapid switching between fields
    await user.click(amountInput);
    await user.type(amountInput, '123');
    
    await user.click(descriptionInput);
    await user.type(descriptionInput, 'Test');
    
    await user.click(amountInput);
    await user.type(amountInput, '.45');
    
    await user.click(descriptionInput);
    await user.type(descriptionInput, ' description');
    
    // Verify final values and focus
    expect(amountInput).toHaveValue('123.45');
    expect(descriptionInput).toHaveValue('Test description');
    expect(descriptionInput).toHaveFocus();
  });

  test('form submission with API error handling', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockRejectedValue(new Error('API Error'));
    
    render(<ExpenseFormTest onSubmit={mockSubmit} />);
    
    // Fill out form
    await user.selectOptions(screen.getByTestId('category-select'), 'Office');
    await user.type(screen.getByTestId('amount-input'), '100');
    
    // Submit form
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
    
    // Button should return to normal state after error
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Save Expense');
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });
  });

  test('complex form with multiple field types maintains focus', async () => {
    const user = userEvent.setup();
    
    const ComplexForm = () => {
      const [data, setData] = React.useState({
        text: '',
        number: '',
        date: '',
        select: '',
        textarea: ''
      });
      
      const handleChange = (e) => {
        const { name, value } = e.target;
        FocusManager.preserveFocus(() => {
          setData(prev => ({ ...prev, [name]: value }));
        });
      };
      
      return (
        <form>
          <StableInput
            name="text"
            value={data.text}
            onChange={handleChange}
            data-testid="text-input"
            componentName="ComplexForm-Text"
          />
          
          <StableInput
            name="number"
            type="number"
            value={data.number}
            onChange={handleChange}
            data-testid="number-input"
            componentName="ComplexForm-Number"
          />
          
          <StableInput
            name="date"
            type="date"
            value={data.date}
            onChange={handleChange}
            data-testid="date-input"
            componentName="ComplexForm-Date"
          />
          
          <select
            name="select"
            value={data.select}
            onChange={handleChange}
            data-testid="select-input"
          >
            <option value="">Choose</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </select>
          
          <StableInput
            name="textarea"
            component="textarea"
            value={data.textarea}
            onChange={handleChange}
            data-testid="textarea-input"
            componentName="ComplexForm-Textarea"
          />
        </form>
      );
    };
    
    render(<ComplexForm />);
    
    // Test each field type
    const textInput = screen.getByTestId('text-input');
    const numberInput = screen.getByTestId('number-input');
    const dateInput = screen.getByTestId('date-input');
    const selectInput = screen.getByTestId('select-input');
    const textareaInput = screen.getByTestId('textarea-input');
    
    // Text input
    await user.click(textInput);
    await user.type(textInput, 'Sample text');
    expect(textInput).toHaveFocus();
    expect(textInput).toHaveValue('Sample text');
    
    // Number input
    await user.click(numberInput);
    await user.type(numberInput, '42.5');
    expect(numberInput).toHaveFocus();
    expect(numberInput).toHaveValue('42.5');
    
    // Date input
    await user.click(dateInput);
    await user.type(dateInput, '2024-01-15');
    expect(dateInput).toHaveFocus();
    expect(dateInput).toHaveValue('2024-01-15');
    
    // Select input
    await user.selectOptions(selectInput, 'option1');
    expect(selectInput).toHaveValue('option1');
    
    // Textarea input
    await user.click(textareaInput);
    await user.type(textareaInput, 'Multi-line\ntext content');
    expect(textareaInput).toHaveFocus();
    expect(textareaInput).toHaveValue('Multi-line\ntext content');
  });

  test('form with dynamic fields maintains focus during field addition/removal', async () => {
    const user = userEvent.setup();
    
    const DynamicForm = () => {
      const [fields, setFields] = React.useState([{ id: 1, value: '' }]);
      
      const addField = () => {
        FocusManager.preserveFocus(() => {
          setFields(prev => [...prev, { id: Date.now(), value: '' }]);
        });
      };
      
      const removeField = (id) => {
        FocusManager.preserveFocus(() => {
          setFields(prev => prev.filter(field => field.id !== id));
        });
      };
      
      const updateField = (id, value) => {
        FocusManager.preserveFocus(() => {
          setFields(prev => prev.map(field => 
            field.id === id ? { ...field, value } : field
          ));
        });
      };
      
      return (
        <div>
          {fields.map((field, index) => (
            <div key={field.id}>
              <StableInput
                value={field.value}
                onChange={(e) => updateField(field.id, e.target.value)}
                data-testid={`field-${index}`}
                componentName={`DynamicForm-Field-${index}`}
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  data-testid={`remove-${index}`}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addField}
            data-testid="add-field"
          >
            Add Field
          </button>
        </div>
      );
    };
    
    render(<DynamicForm />);
    
    // Type in first field
    const firstField = screen.getByTestId('field-0');
    await user.click(firstField);
    await user.type(firstField, 'First field');
    expect(firstField).toHaveFocus();
    
    // Add second field
    await user.click(screen.getByTestId('add-field'));
    
    // First field should still have its value and focus should be preserved
    expect(firstField).toHaveValue('First field');
    
    // Type in second field
    const secondField = screen.getByTestId('field-1');
    await user.click(secondField);
    await user.type(secondField, 'Second field');
    expect(secondField).toHaveFocus();
    
    // Remove first field
    await user.click(screen.getByTestId('remove-0'));
    
    // Second field should still exist and maintain its value
    expect(screen.getByTestId('field-0')).toHaveValue('Second field');
  });
});

describe('Error Recovery Integration Tests', () => {
  test('handles API failures gracefully with user feedback', async () => {
    const user = userEvent.setup();
    
    // Mock API to fail first, then succeed
    let callCount = 0;
    const mockSubmit = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({ success: true });
    });
    
    render(<ExpenseFormTest onSubmit={mockSubmit} />);
    
    // Fill and submit form
    await user.selectOptions(screen.getByTestId('category-select'), 'Office');
    await user.type(screen.getByTestId('amount-input'), '100');
    await user.click(screen.getByTestId('submit-button'));
    
    // First submission should fail
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
    
    // Button should be enabled again for retry
    await waitFor(() => {
      expect(screen.getByTestId('submit-button')).not.toBeDisabled();
    });
    
    // Retry submission
    await user.click(screen.getByTestId('submit-button'));
    
    // Second submission should succeed
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(2);
    });
  });

  test('maintains form state during error recovery', async () => {
    const user = userEvent.setup();
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Validation error'));
    
    render(<ExpenseFormTest onSubmit={mockSubmit} />);
    
    // Fill out form completely
    await user.selectOptions(screen.getByTestId('category-select'), 'Travel');
    await user.type(screen.getByTestId('amount-input'), '250.00');
    await user.type(screen.getByTestId('description-input'), 'Business trip expenses');
    
    // Submit and fail
    await user.click(screen.getByTestId('submit-button'));
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled();
    });
    
    // Form should maintain all values after error
    expect(screen.getByTestId('category-select')).toHaveValue('Travel');
    expect(screen.getByTestId('amount-input')).toHaveValue('250.00');
    expect(screen.getByTestId('description-input')).toHaveValue('Business trip expenses');
  });
});