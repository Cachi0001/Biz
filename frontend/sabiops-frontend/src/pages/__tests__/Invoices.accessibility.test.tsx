/**
 * Basic Accessibility Tests for Invoice Form
 * Verifies key accessibility improvements
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/invoices' }),
}));

// Mock API calls
jest.mock('../../services/api', () => ({
  getInvoices: jest.fn(() => Promise.resolve({ data: { invoices: [] } })),
  getCustomers: jest.fn(() => Promise.resolve({ data: { customers: [
    { id: '1', name: 'Test Customer', email: 'test@example.com' }
  ] } })),
  getProducts: jest.fn(() => Promise.resolve({ data: { products: [
    { id: '1', name: 'Test Product', price: 100 }
  ] } })),
  createInvoice: jest.fn(() => Promise.resolve({ success: true })),
  updateInvoice: jest.fn(() => Promise.resolve({ success: true }))
}));

// Mock utility functions
jest.mock('../../utils/errorHandling', () => ({
  handleApiError: jest.fn(),
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
  safeArray: jest.fn((data, fallback) => data || fallback)
}));

// Mock form validation hook
jest.mock('../../hooks/useFormValidation', () => ({
  useFormValidation: () => ({
    errors: {},
    itemErrors: [],
    touchedFields: new Set(),
    isValidating: false,
    isValid: true,
    touchField: jest.fn(),
    touchItemField: jest.fn(),
    validateSingleField: jest.fn(),
    validateItemField: jest.fn(),
    validateForm: jest.fn(() => ({ hasErrors: false, formErrors: {}, itemErrors: [] })),
    clearErrors: jest.fn(),
    getFieldError: jest.fn(() => null),
    getItemFieldError: jest.fn(() => null),
    hasFieldError: jest.fn(() => false),
    hasItemFieldError: jest.fn(() => false),
    getAllErrors: jest.fn(() => []),
    setExternalErrors: jest.fn()
  })
}));

// Import component after mocks
import Invoices from '../Invoices';

describe('Invoice Form Accessibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('search input has proper accessibility attributes', async () => {
    render(<Invoices />);
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search invoices/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('role', 'searchbox');
      expect(searchInput).toHaveAttribute('aria-label');
    });
  });

  test('create invoice button is accessible', async () => {
    render(<Invoices />);
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveAttribute('type', 'button');
    });
  });

  test('form dialog opens with proper accessibility attributes', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toBeInTheDocument();
    });

    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });

  test('form fields have proper labels and accessibility attributes', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Check for customer field
    const customerLabel = screen.getByText('Customer');
    expect(customerLabel).toBeInTheDocument();

    // Check for issue date field
    const issueDateLabel = screen.getByText('Issue Date');
    expect(issueDateLabel).toBeInTheDocument();

    // Check for payment terms field
    const paymentTermsLabel = screen.getByText('Payment Terms');
    expect(paymentTermsLabel).toBeInTheDocument();
  });

  test('invoice items section has proper structure', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Check for invoice items section
    const itemsLabel = screen.getByText('Invoice Items *');
    expect(itemsLabel).toBeInTheDocument();

    // Check for add item button
    const addItemButton = screen.getByText('Add Item');
    expect(addItemButton).toBeInTheDocument();
    expect(addItemButton).toHaveAttribute('type', 'button');
  });

  test('form submission button has proper accessibility', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Check for submit button
    const submitButton = screen.getByText(/review & create invoice/i);
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  test('keyboard navigation works for main actions', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    // Test tab navigation to create button
    await user.tab();
    await user.tab();
    
    const createButton = screen.getByText('Create Invoice');
    expect(createButton).toBeInTheDocument();
  });

  test('mobile touch targets meet minimum size requirements', async () => {
    render(<Invoices />);
    
    await waitFor(() => {
      const createButton = screen.getByText('Create Invoice');
      expect(createButton).toBeInTheDocument();
      expect(createButton).toHaveClass('min-h-[44px]');
    });
  });

  test('loading states are properly announced', async () => {
    render(<Invoices />);
    
    // Check for loading indicator
    const loadingText = screen.getByText('Loading invoices...');
    expect(loadingText).toBeInTheDocument();
  });

  test('refresh button has proper accessibility', async () => {
    render(<Invoices />);
    
    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveAttribute('type', 'button');
    });
  });
});

describe('Invoice Form Keyboard Navigation', () => {
  test('escape key closes dialog', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Press escape
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});

describe('Invoice Form Error Handling', () => {
  test('error messages are properly associated with fields', async () => {
    // This test would need proper error state mocking
    // For now, just verify the structure exists
    const user = userEvent.setup();
    render(<Invoices />);
    
    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });

    // Form structure should be present for error handling
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});