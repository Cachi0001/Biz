import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Invoices from '../pages/Invoices';
import * as api from '../services/api';

// Mock the API functions
jest.mock('../services/api', () => ({
  getInvoices: jest.fn(),
  getCustomers: jest.fn(),
  getProducts: jest.fn(),
  createInvoice: jest.fn(),
  updateInvoice: jest.fn(),
  getInvoice: jest.fn(),
  deleteInvoice: jest.fn(),
  downloadInvoicePdf: jest.fn(),
  sendInvoice: jest.fn(),
  getErrorMessage: jest.fn((error, defaultMessage) => defaultMessage),
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Plus: () => <div data-testid="plus-icon">Plus</div>,
  Search: () => <div data-testid="search-icon">Search</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  Eye: () => <div data-testid="eye-icon">Eye</div>,
  Download: () => <div data-testid="download-icon">Download</div>,
  Send: () => <div data-testid="send-icon">Send</div>,
}));

// Test data
const mockCustomers = [
  { id: '1', name: 'Test Customer 1', email: 'customer1@test.com' },
  { id: '2', name: 'Test Customer 2', email: 'customer2@test.com' },
];

const mockProducts = [
  { id: '1', name: 'Test Product 1', price: 100.00, unit_price: 100.00 },
  { id: '2', name: 'Test Product 2', price: 200.00, unit_price: 200.00 },
];

const mockInvoices = [
  {
    id: '1',
    customer_id: '1',
    issue_date: '2025-01-01',
    due_date: '2025-01-31',
    total_amount: 100.00,
    status: 'draft',
    items: [
      {
        id: '1',
        product_id: '1',
        description: 'Test Product 1',
        quantity: 1,
        unit_price: 100.00,
        tax_rate: 0,
        discount_rate: 0,
      }
    ]
  }
];

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Complete Invoice Creation Flow', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default API responses
    (api.getInvoices as jest.Mock).mockResolvedValue(mockInvoices);
    (api.getCustomers as jest.Mock).mockResolvedValue(mockCustomers);
    (api.getProducts as jest.Mock).mockResolvedValue(mockProducts);
    (api.createInvoice as jest.Mock).mockResolvedValue({ id: '2', ...mockInvoices[0] });
  });

  test('full invoice creation process without page reloads', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Step 1: Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    // Verify dialog opened
    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Step 2: Fill in customer selection
    const customerSelect = screen.getByRole('combobox', { name: /customer/i });
    await user.click(customerSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Test Customer 1')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Test Customer 1'));

    // Step 3: Fill in issue date (should already be set to today)
    const issueDateInput = screen.getByLabelText(/issue date/i);
    expect(issueDateInput).toHaveValue(new Date().toISOString().split('T')[0]);

    // Step 4: Fill in due date
    const dueDateInput = screen.getByLabelText(/due date/i);
    await user.clear(dueDateInput);
    await user.type(dueDateInput, '2025-01-31');

    // Step 5: Fill in payment terms
    const paymentTermsInput = screen.getByLabelText(/payment terms/i);
    await user.clear(paymentTermsInput);
    await user.type(paymentTermsInput, 'Net 30');

    // Step 6: Fill in invoice items
    // Select product for first item
    const productSelects = screen.getAllByRole('combobox');
    const productSelect = productSelects.find(select => 
      select.getAttribute('id')?.includes('product_id')
    );
    
    if (productSelect) {
      await user.click(productSelect);
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Test Product 1'));
    }

    // Fill in description (should be auto-filled from product)
    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toHaveValue('Test Product 1');

    // Fill in quantity
    const quantityInput = screen.getByLabelText(/qty/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Fill in unit price (should be auto-filled from product)
    const unitPriceInput = screen.getByLabelText(/unit price/i);
    expect(unitPriceInput).toHaveValue('100');

    // Step 7: Add another item
    const addItemButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addItemButton);

    // Verify second item was added
    const descriptionInputs = screen.getAllByLabelText(/description/i);
    expect(descriptionInputs).toHaveLength(2);

    // Fill in second item
    const secondDescriptionInput = descriptionInputs[1];
    await user.type(secondDescriptionInput, 'Custom Service');

    const quantityInputs = screen.getAllByLabelText(/qty/i);
    const secondQuantityInput = quantityInputs[1];
    await user.clear(secondQuantityInput);
    await user.type(secondQuantityInput, '1');

    const unitPriceInputs = screen.getAllByLabelText(/unit price/i);
    const secondUnitPriceInput = unitPriceInputs[1];
    await user.clear(secondUnitPriceInput);
    await user.type(secondUnitPriceInput, '150');

    // Step 8: Fill in notes
    const notesTextarea = screen.getByLabelText(/notes/i);
    await user.type(notesTextarea, 'Test invoice notes');

    // Step 9: Fill in terms and conditions
    const termsTextarea = screen.getByLabelText(/terms and conditions/i);
    await user.clear(termsTextarea);
    await user.type(termsTextarea, 'Payment due within 30 days');

    // Step 10: Submit the form
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify API was called with correct data
    await waitFor(() => {
      expect(api.createInvoice).toHaveBeenCalledWith({
        customer_id: 1, // Should be parsed as integer
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '2025-01-31',
        payment_terms: 'Net 30',
        notes: 'Test invoice notes',
        terms_and_conditions: 'Payment due within 30 days',
        currency: 'NGN',
        discount_amount: 0,
        items: [
          {
            product_id: 1,
            description: 'Test Product 1',
            quantity: 2,
            unit_price: 100,
            tax_rate: 0,
            discount_rate: 0,
          },
          {
            product_id: null,
            description: 'Custom Service',
            quantity: 1,
            unit_price: 150,
            tax_rate: 0,
            discount_rate: 0,
          }
        ],
        total_amount: 350, // (2 * 100) + (1 * 150)
        amount_due: 350,
        status: 'draft'
      });
    });

    // Verify success message
    expect(toast.success).toHaveBeenCalledWith('Invoice created successfully!');

    // Verify dialog closed
    await waitFor(() => {
      expect(screen.queryByText('Create New Invoice')).not.toBeInTheDocument();
    });
  });

  test('form validation without page reload', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Try to submit without required fields
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify validation error is shown without page reload
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select a customer');
    });

    // Verify we're still in the dialog (no page reload)
    expect(screen.getByText('Create New Invoice')).toBeInTheDocument();

    // Fill in customer and try again
    const customerSelect = screen.getByRole('combobox', { name: /customer/i });
    await user.click(customerSelect);
    await user.click(screen.getByText('Test Customer 1'));

    // Clear the description to trigger another validation error
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.clear(descriptionInput);

    await act(async () => {
      await user.click(submitButton);
    });

    // Verify description validation error
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Item 1: Description is required');
    });

    // Verify still in dialog
    expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
  });

  test('error handling scenarios without page reload', async () => {
    const user = userEvent.setup();
    
    // Mock API to return error
    (api.createInvoice as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    renderWithRouter(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Fill in minimum required fields
    const customerSelect = screen.getByRole('combobox', { name: /customer/i });
    await user.click(customerSelect);
    await user.click(screen.getByText('Test Customer 1'));

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test Item');

    const quantityInput = screen.getByLabelText(/qty/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '1');

    const unitPriceInput = screen.getByLabelText(/unit price/i);
    await user.clear(unitPriceInput);
    await user.type(unitPriceInput, '100');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify error handling without page reload
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save invoice');
    });

    // Verify still in dialog (no page reload)
    expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
  });

  test('input field stability during typing', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Test typing in description field
    const descriptionInput = screen.getByLabelText(/description/i);
    
    // Type character by character to test stability
    const testText = 'Test Description';
    for (let i = 0; i < testText.length; i++) {
      await user.type(descriptionInput, testText[i]);
      
      // Verify input maintains focus and value
      expect(descriptionInput).toHaveFocus();
      expect(descriptionInput).toHaveValue(testText.substring(0, i + 1));
    }

    // Test typing in quantity field
    const quantityInput = screen.getByLabelText(/qty/i);
    await user.clear(quantityInput);
    
    const quantityValue = '123';
    for (let i = 0; i < quantityValue.length; i++) {
      await user.type(quantityInput, quantityValue[i]);
      
      // Verify input maintains focus and value
      expect(quantityInput).toHaveFocus();
      expect(quantityInput).toHaveValue(quantityValue.substring(0, i + 1));
    }

    // Test typing in unit price field
    const unitPriceInput = screen.getByLabelText(/unit price/i);
    await user.clear(unitPriceInput);
    
    const priceValue = '99.99';
    for (let i = 0; i < priceValue.length; i++) {
      await user.type(unitPriceInput, priceValue[i]);
      
      // Verify input maintains focus and value
      expect(unitPriceInput).toHaveFocus();
      expect(unitPriceInput).toHaveValue(priceValue.substring(0, i + 1));
    }
  });

  test('successful invoice creation and navigation', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Fill in required fields
    const customerSelect = screen.getByRole('combobox', { name: /customer/i });
    await user.click(customerSelect);
    await user.click(screen.getByText('Test Customer 1'));

    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test Item');

    const quantityInput = screen.getByLabelText(/qty/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '1');

    const unitPriceInput = screen.getByLabelText(/unit price/i);
    await user.clear(unitPriceInput);
    await user.type(unitPriceInput, '100');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create invoice/i });
    
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify successful creation
    await waitFor(() => {
      expect(api.createInvoice).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Invoice created successfully!');
    });

    // Verify dialog closed (successful navigation)
    await waitFor(() => {
      expect(screen.queryByText('Create New Invoice')).not.toBeInTheDocument();
    });

    // Verify invoices list is refreshed
    expect(api.getInvoices).toHaveBeenCalledTimes(2); // Initial load + refresh after creation
  });

  test('form focus management with multiple items', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Add multiple items
    const addItemButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addItemButton);
    await user.click(addItemButton);

    // Verify we have 3 items total
    const descriptionInputs = screen.getAllByLabelText(/description/i);
    expect(descriptionInputs).toHaveLength(3);

    // Test focus management across items
    for (let i = 0; i < descriptionInputs.length; i++) {
      await user.click(descriptionInputs[i]);
      await user.type(descriptionInputs[i], `Item ${i + 1}`);
      
      // Verify focus is maintained
      expect(descriptionInputs[i]).toHaveFocus();
      expect(descriptionInputs[i]).toHaveValue(`Item ${i + 1}`);
    }

    // Test removing an item doesn't break focus
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    if (removeButtons.length > 0) {
      await user.click(removeButtons[0]);
      
      // Verify item was removed
      const remainingDescriptions = screen.getAllByLabelText(/description/i);
      expect(remainingDescriptions).toHaveLength(2);
      
      // Verify remaining items maintain their values
      expect(remainingDescriptions[0]).toHaveValue('Item 2');
      expect(remainingDescriptions[1]).toHaveValue('Item 3');
    }
  });

  test('product selection updates form fields correctly', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Select a product
    const productSelects = screen.getAllByRole('combobox');
    const productSelect = productSelects.find(select => 
      select.getAttribute('id')?.includes('product_id')
    );
    
    if (productSelect) {
      await user.click(productSelect);
      await waitFor(() => {
        expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      });
      await user.click(screen.getByText('Test Product 1'));

      // Verify description and price are auto-filled
      const descriptionInput = screen.getByLabelText(/description/i);
      const unitPriceInput = screen.getByLabelText(/unit price/i);
      
      await waitFor(() => {
        expect(descriptionInput).toHaveValue('Test Product 1');
        expect(unitPriceInput).toHaveValue('100');
      });
    }
  });

  test('form calculations update correctly', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(<Invoices />);

    await waitFor(() => {
      expect(screen.getByText('Invoices')).toBeInTheDocument();
    });

    // Open create invoice dialog
    const createButton = screen.getByRole('button', { name: /create invoice/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Invoice')).toBeInTheDocument();
    });

    // Fill in item details
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test Item');

    const quantityInput = screen.getByLabelText(/qty/i);
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    const unitPriceInput = screen.getByLabelText(/unit price/i);
    await user.clear(unitPriceInput);
    await user.type(unitPriceInput, '50');

    // Verify item total calculation
    await waitFor(() => {
      expect(screen.getByText('₦100.00')).toBeInTheDocument(); // 2 * 50
    });

    // Verify grand total
    await waitFor(() => {
      expect(screen.getByText(/Grand Total: ₦100\.00/)).toBeInTheDocument();
    });

    // Add discount
    const discountInput = screen.getByLabelText(/overall discount/i);
    await user.clear(discountInput);
    await user.type(discountInput, '10');

    // Verify updated grand total
    await waitFor(() => {
      expect(screen.getByText(/Grand Total: ₦90\.00/)).toBeInTheDocument(); // 100 - 10
    });
  });
});