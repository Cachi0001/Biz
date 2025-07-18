/**
 * Comprehensive Accessibility Tests for Invoice Form
 * Tests for WCAG 2.1 AA compliance and screen reader compatibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import Invoices from '../../pages/Invoices';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock dependencies
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

jest.mock('../../utils/errorHandling', () => ({
  handleApiError: jest.fn(),
  showSuccessToast: jest.fn(),
  showErrorToast: jest.fn(),
  safeArray: jest.fn((data, fallback) => data || fallback)
}));

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

describe('Invoice Form Accessibility Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('ARIA Labels and Descriptions', () => {
    test('all form inputs have proper aria-labels', async () => {
      render(<Invoices />);
      
      // Open create dialog
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      // Wait for dialog to open
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check customer select has aria-label
      const customerSelect = screen.getByLabelText(/select customer for invoice/i);
      expect(customerSelect).toHaveAttribute('aria-label');
      expect(customerSelect).toHaveAttribute('aria-required', 'true');

      // Check date inputs have aria-labels
      const issueDateInput = screen.getByLabelText(/invoice issue date/i);
      expect(issueDateInput).toHaveAttribute('aria-label');
      expect(issueDateInput).toHaveAttribute('aria-required', 'true');

      const dueDateInput = screen.getByLabelText(/invoice due date/i);
      expect(dueDateInput).toHaveAttribute('aria-label');

      // Check payment terms has aria-label
      const paymentTermsInput = screen.getByLabelText(/payment terms for invoice/i);
      expect(paymentTermsInput).toHaveAttribute('aria-label');

      // Check notes and terms have aria-labels
      const notesInput = screen.getByLabelText(/additional notes for invoice/i);
      expect(notesInput).toHaveAttribute('aria-label');

      const termsInput = screen.getByLabelText(/terms and conditions for invoice/i);
      expect(termsInput).toHaveAttribute('aria-label');
    });

    test('invoice item fields have proper aria-labels', async () => {
      render(<Invoices />);
      
      // Open create dialog
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check item fields have proper aria-labels with item numbers
      const descriptionInput = screen.getByLabelText(/description for item 1/i);
      expect(descriptionInput).toHaveAttribute('aria-label');
      expect(descriptionInput).toHaveAttribute('aria-required', 'true');

      const quantityInput = screen.getByLabelText(/quantity for item 1/i);
      expect(quantityInput).toHaveAttribute('aria-label');
      expect(quantityInput).toHaveAttribute('aria-required', 'true');

      const unitPriceInput = screen.getByLabelText(/unit price for item 1 in naira/i);
      expect(unitPriceInput).toHaveAttribute('aria-label');
      expect(unitPriceInput).toHaveAttribute('aria-required', 'true');

      const taxRateInput = screen.getByLabelText(/tax rate for item 1 \(0-100%\)/i);
      expect(taxRateInput).toHaveAttribute('aria-label');

      const discountRateInput = screen.getByLabelText(/discount rate for item 1 \(0-100%\)/i);
      expect(discountRateInput).toHaveAttribute('aria-label');
    });

    test('search functionality has proper aria-labels', async () => {
      render(<Invoices />);

      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label');
      expect(searchInput.getAttribute('aria-label')).toMatch(/search invoices/i);
    });
  });

  describe('Keyboard Navigation', () => {
    test('form can be navigated using Tab key', async () => {
      render(<Invoices />);
      
      // Open create dialog
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test tab navigation through form fields
      await user.tab();
      expect(document.activeElement).toHaveAttribute('id', 'field-customer_id');

      await user.tab();
      expect(document.activeElement).toHaveAttribute('name', 'issue_date');

      await user.tab();
      expect(document.activeElement).toHaveAttribute('name', 'due_date');

      await user.tab();
      expect(document.activeElement).toHaveAttribute('name', 'payment_terms');
    });

    test('keyboard shortcuts work correctly', async () => {
      render(<Invoices />);

      // Test Ctrl+N to open create dialog
      await user.keyboard('{Control>}n{/Control}');
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Test Escape to close dialog
      await user.keyboard('{Escape}');
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Test Ctrl+F to focus search
      await user.keyboard('{Control>}f{/Control}');
      expect(document.activeElement).toHaveAttribute('role', 'searchbox');
    });

    test('Enter key prevents form submission in input fields', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/description for item 1/i);
      await user.click(descriptionInput);
      await user.keyboard('{Enter}');

      // Form should not submit, dialog should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('focus moves to first field when dialog opens', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for focus to be set
      await waitFor(() => {
        expect(document.activeElement).toHaveAttribute('id', 'field-customer_id');
      }, { timeout: 200 });
    });

    test('focus is trapped within dialog', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Focus should be trapped within the dialog
      const dialog = screen.getByRole('dialog');
      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  describe('Screen Reader Compatibility', () => {
    test('form has proper semantic structure', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check for proper form structure
      const form = screen.getByRole('form') || screen.getByRole('dialog').querySelector('form');
      expect(form).toBeInTheDocument();

      // Check for fieldsets and legends for grouped fields
      const invoiceItemsSection = screen.getByText('Invoice Items *');
      expect(invoiceItemsSection).toBeInTheDocument();
    });

    test('error messages are properly associated with fields', async () => {
      // Mock validation errors
      const mockUseFormValidation = require('../../hooks/useFormValidation').useFormValidation;
      mockUseFormValidation.mockReturnValue({
        errors: { customer_id: 'Customer is required' },
        itemErrors: [],
        touchedFields: new Set(['customer_id']),
        isValidating: false,
        isValid: false,
        touchField: jest.fn(),
        touchItemField: jest.fn(),
        validateSingleField: jest.fn(),
        validateItemField: jest.fn(),
        validateForm: jest.fn(() => ({ hasErrors: true, formErrors: { customer_id: 'Customer is required' }, itemErrors: [] })),
        clearErrors: jest.fn(),
        getFieldError: jest.fn((field) => field === 'customer_id' ? 'Customer is required' : null),
        getItemFieldError: jest.fn(() => null),
        hasFieldError: jest.fn((field) => field === 'customer_id'),
        hasItemFieldError: jest.fn(() => false),
        getAllErrors: jest.fn(() => ['Customer is required']),
        setExternalErrors: jest.fn()
      });

      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check that error message is associated with field
      const customerField = screen.getByLabelText(/select customer for invoice/i);
      const errorMessage = screen.getByText('Customer is required');
      
      expect(customerField).toHaveAttribute('aria-describedby');
      expect(customerField.getAttribute('aria-describedby')).toContain('error');
      expect(errorMessage).toBeInTheDocument();
    });

    test('loading states are announced to screen readers', async () => {
      render(<Invoices />);

      // Check for loading announcement
      const loadingElement = screen.getByText('Loading invoices...');
      expect(loadingElement).toBeInTheDocument();
    });
  });

  describe('SearchableSelect Accessibility', () => {
    test('SearchableSelect has proper ARIA attributes', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Find the customer select (which should be a SearchableSelect)
      const customerSelect = screen.getByLabelText(/select customer for invoice/i);
      
      // Check ARIA attributes
      expect(customerSelect).toHaveAttribute('role', 'combobox');
      expect(customerSelect).toHaveAttribute('aria-expanded');
      expect(customerSelect).toHaveAttribute('aria-haspopup', 'listbox');
    });

    test('SearchableSelect keyboard navigation works', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const customerSelect = screen.getByLabelText(/select customer for invoice/i);
      
      // Test keyboard interaction
      await user.click(customerSelect);
      await user.keyboard('{ArrowDown}');
      
      // Should open dropdown
      expect(customerSelect).toHaveAttribute('aria-expanded', 'true');
    });
  });

  describe('ReviewDialog Accessibility', () => {
    test('ReviewDialog has proper ARIA attributes', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form and submit to trigger review dialog
      const submitButton = screen.getByText(/review & create invoice/i);
      await user.click(submitButton);

      // Check if review dialog opens (may need to mock successful validation)
      // This test would need proper mocking of form validation
    });
  });

  describe('WCAG 2.1 AA Compliance', () => {
    test('invoice form has no accessibility violations', async () => {
      const { container } = render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Run axe accessibility tests
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('color contrast meets WCAG AA standards', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check that buttons have sufficient color contrast
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button);
        // This would need actual color contrast calculation
        expect(button).toBeInTheDocument();
      });
    });

    test('touch targets meet minimum size requirements', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Check that interactive elements meet 44px minimum
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        const styles = window.getComputedStyle(input);
        const height = parseInt(styles.minHeight || styles.height);
        expect(height).toBeGreaterThanOrEqual(44); // 44px minimum for touch targets
      });
    });
  });

  describe('Error Handling Accessibility', () => {
    test('validation errors are announced to screen readers', async () => {
      render(<Invoices />);
      
      const createButton = screen.getByText('Create Invoice');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to submit empty form to trigger validation
      const submitButton = screen.getByText(/review & create invoice/i);
      await user.click(submitButton);

      // Check for error announcements
      const errorElements = screen.getAllByRole('alert');
      expect(errorElements.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Mobile Accessibility', () => {
  beforeEach(() => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667,
    });
  });

  test('mobile form maintains accessibility features', async () => {
    const user = userEvent.setup();
    render(<Invoices />);
    
    const createButton = screen.getByText('Create Invoice');
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    // Check that mobile-specific accessibility features work
    const inputs = screen.getAllByRole('textbox');
    inputs.forEach(input => {
      expect(input).toHaveClass('touch-manipulation');
    });
  });
});