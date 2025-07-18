/**
 * Focus Stability Tests - Tests for input focus preservation during re-renders
 * Validates that form inputs maintain focus when state updates occur
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FocusManager from '../utils/focusManager';
import StableInput from '../components/ui/StableInput';
import React, { useState } from 'react';

// Mock DebugLogger to avoid console spam in tests
jest.mock('../utils/debugLogger', () => ({
  logFocusEvent: jest.fn(),
  logStateUpdate: jest.fn(),
  setEnabled: jest.fn()
}));

// Test component that simulates form with state updates
const TestFormComponent = ({ onStateChange = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (onStateChange) onStateChange({ ...formData, [name]: value });
    });
  };

  return (
    <form>
      <StableInput
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Enter name"
        componentName="TestForm-Name"
        data-testid="name-input"
      />
      <StableInput
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="Enter email"
        componentName="TestForm-Email"
        data-testid="email-input"
      />
      <StableInput
        name="amount"
        type="number"
        value={formData.amount}
        onChange={handleChange}
        placeholder="Enter amount"
        componentName="TestForm-Amount"
        data-testid="amount-input"
      />
    </form>
  );
};

describe('Focus Stability Tests', () => {
  beforeEach(() => {
    // Clear any previous focus
    document.body.focus();
  });

  test('maintains focus during rapid typing', async () => {
    const user = userEvent.setup();
    render(<TestFormComponent />);
    
    const nameInput = screen.getByTestId('name-input');
    
    // Focus the input
    await user.click(nameInput);
    expect(nameInput).toHaveFocus();
    
    // Type rapidly to trigger multiple state updates
    await user.type(nameInput, 'John Doe', { delay: 10 });
    
    // Input should still have focus
    expect(nameInput).toHaveFocus();
    expect(nameInput).toHaveValue('John Doe');
  });

  test('preserves cursor position during state updates', async () => {
    const user = userEvent.setup();
    render(<TestFormComponent />);
    
    const emailInput = screen.getByTestId('email-input');
    
    // Focus and type initial text
    await user.click(emailInput);
    await user.type(emailInput, 'test@example.com');
    
    // Move cursor to middle of text
    emailInput.setSelectionRange(4, 4); // After 'test'
    
    // Type more characters
    await user.type(emailInput, 'ing');
    
    // Should have inserted text at cursor position
    expect(emailInput).toHaveValue('testing@example.com');
    expect(emailInput).toHaveFocus();
  });

  test('handles multiple field interactions without losing focus', async () => {
    const user = userEvent.setup();
    render(<TestFormComponent />);
    
    const nameInput = screen.getByTestId('name-input');
    const emailInput = screen.getByTestId('email-input');
    const amountInput = screen.getByTestId('amount-input');
    
    // Type in first field
    await user.click(nameInput);
    await user.type(nameInput, 'John');
    expect(nameInput).toHaveFocus();
    
    // Switch to second field
    await user.click(emailInput);
    await user.type(emailInput, 'john@test.com');
    expect(emailInput).toHaveFocus();
    
    // Switch to third field
    await user.click(amountInput);
    await user.type(amountInput, '100.50');
    expect(amountInput).toHaveFocus();
    
    // Verify all values are correct
    expect(nameInput).toHaveValue('John');
    expect(emailInput).toHaveValue('john@test.com');
    expect(amountInput).toHaveValue('100.50');
  });

  test('handles focus restoration after programmatic state changes', async () => {
    const user = userEvent.setup();
    let stateChanger;
    
    const TestComponent = () => {
      const [value, setValue] = useState('');
      
      stateChanger = (newValue) => {
        FocusManager.preserveFocus(() => {
          setValue(newValue);
        });
      };
      
      return (
        <StableInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="test-input"
          componentName="TestComponent"
        />
      );
    };
    
    render(<TestComponent />);
    
    const input = screen.getByTestId('test-input');
    
    // Focus the input and type
    await user.click(input);
    await user.type(input, 'test');
    expect(input).toHaveFocus();
    
    // Programmatically change state
    stateChanger('programmatic change');
    
    // Wait for focus restoration
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
    
    expect(input).toHaveValue('programmatic change');
  });

  test('FocusManager.createStableOnChange preserves focus', async () => {
    const user = userEvent.setup();
    const mockOnChange = jest.fn();
    
    const TestComponent = () => {
      const [value, setValue] = useState('');
      
      const stableOnChange = FocusManager.createStableOnChange((e) => {
        setValue(e.target.value);
        mockOnChange(e.target.value);
      });
      
      return (
        <input
          value={value}
          onChange={stableOnChange}
          data-testid="stable-input"
        />
      );
    };
    
    render(<TestComponent />);
    
    const input = screen.getByTestId('stable-input');
    
    await user.click(input);
    await user.type(input, 'stable');
    
    expect(input).toHaveFocus();
    expect(input).toHaveValue('stable');
    expect(mockOnChange).toHaveBeenCalledTimes(6); // 's', 't', 'a', 'b', 'l', 'e'
  });

  test('handles textarea focus preservation', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [value, setValue] = useState('');
      
      return (
        <StableInput
          component="textarea"
          value={value}
          onChange={(e) => {
            FocusManager.preserveFocus(() => {
              setValue(e.target.value);
            });
          }}
          data-testid="textarea-input"
          componentName="TestTextarea"
        />
      );
    };
    
    render(<TestComponent />);
    
    const textarea = screen.getByTestId('textarea-input');
    
    await user.click(textarea);
    await user.type(textarea, 'Line 1\nLine 2\nLine 3');
    
    expect(textarea).toHaveFocus();
    expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
  });

  test('handles focus restoration with validation errors', async () => {
    const user = userEvent.setup();
    
    const TestComponent = () => {
      const [value, setValue] = useState('');
      const [error, setError] = useState('');
      
      const handleChange = (e) => {
        const newValue = e.target.value;
        
        FocusManager.preserveFocus(() => {
          setValue(newValue);
          
          // Simulate validation
          if (newValue.length < 3) {
            setError('Must be at least 3 characters');
          } else {
            setError('');
          }
        });
      };
      
      return (
        <div>
          <StableInput
            value={value}
            onChange={handleChange}
            data-testid="validated-input"
            componentName="ValidatedInput"
          />
          {error && <span data-testid="error-message">{error}</span>}
        </div>
      );
    };
    
    render(<TestComponent />);
    
    const input = screen.getByTestId('validated-input');
    
    await user.click(input);
    await user.type(input, 'ab');
    
    // Should show error but maintain focus
    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(input).toHaveFocus();
    
    // Continue typing to clear error
    await user.type(input, 'c');
    
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    expect(input).toHaveFocus();
    expect(input).toHaveValue('abc');
  });

  test('FocusManager.safeFocus works correctly', async () => {
    render(
      <div>
        <input data-testid="target-input" />
        <button data-testid="focus-button">Focus Input</button>
      </div>
    );
    
    const input = screen.getByTestId('target-input');
    const button = screen.getByTestId('focus-button');
    
    // Initially button should not have focus
    expect(input).not.toHaveFocus();
    
    // Use safeFocus to focus the input
    fireEvent.click(button);
    FocusManager.safeFocus(input);
    
    // Wait for focus to be applied
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  test('handles complex form interactions with multiple re-renders', async () => {
    const user = userEvent.setup();
    let renderCount = 0;
    
    const ComplexForm = () => {
      renderCount++;
      const [formData, setFormData] = useState({
        field1: '',
        field2: '',
        field3: ''
      });
      
      const handleChange = (field) => (e) => {
        FocusManager.preserveFocus(() => {
          setFormData(prev => ({ ...prev, [field]: e.target.value }));
        });
      };
      
      return (
        <div>
          <span data-testid="render-count">{renderCount}</span>
          <StableInput
            value={formData.field1}
            onChange={handleChange('field1')}
            data-testid="field1"
            componentName="ComplexForm-Field1"
          />
          <StableInput
            value={formData.field2}
            onChange={handleChange('field2')}
            data-testid="field2"
            componentName="ComplexForm-Field2"
          />
          <StableInput
            value={formData.field3}
            onChange={handleChange('field3')}
            data-testid="field3"
            componentName="ComplexForm-Field3"
          />
        </div>
      );
    };
    
    render(<ComplexForm />);
    
    const field1 = screen.getByTestId('field1');
    const field2 = screen.getByTestId('field2');
    
    // Type in first field
    await user.click(field1);
    await user.type(field1, 'test1');
    
    expect(field1).toHaveFocus();
    expect(field1).toHaveValue('test1');
    
    // Switch to second field and type
    await user.click(field2);
    await user.type(field2, 'test2');
    
    expect(field2).toHaveFocus();
    expect(field2).toHaveValue('test2');
    
    // Verify multiple re-renders occurred
    const renderCountElement = screen.getByTestId('render-count');
    expect(parseInt(renderCountElement.textContent)).toBeGreaterThan(1);
  });
});

describe('FocusManager Utility Tests', () => {
  test('preserveFocus executes callback and maintains focus', () => {
    const mockCallback = jest.fn();
    const mockElement = {
      focus: jest.fn(),
      setSelectionRange: jest.fn(),
      selectionStart: 5,
      selectionEnd: 5,
      tagName: 'INPUT'
    };
    
    // Mock document.activeElement
    Object.defineProperty(document, 'activeElement', {
      value: mockElement,
      writable: true
    });
    
    // Mock document.contains
    document.contains = jest.fn().mockReturnValue(true);
    
    FocusManager.preserveFocus(mockCallback);
    
    expect(mockCallback).toHaveBeenCalled();
    
    // Wait for requestAnimationFrame
    return new Promise(resolve => {
      requestAnimationFrame(() => {
        expect(mockElement.focus).toHaveBeenCalled();
        expect(mockElement.setSelectionRange).toHaveBeenCalledWith(5, 5);
        resolve();
      });
    });
  });

  test('preserveFocus handles non-input elements gracefully', () => {
    const mockCallback = jest.fn();
    const mockElement = {
      tagName: 'DIV'
    };
    
    Object.defineProperty(document, 'activeElement', {
      value: mockElement,
      writable: true
    });
    
    FocusManager.preserveFocus(mockCallback);
    
    expect(mockCallback).toHaveBeenCalled();
  });

  test('preserveFocus handles missing activeElement', () => {
    const mockCallback = jest.fn();
    
    Object.defineProperty(document, 'activeElement', {
      value: null,
      writable: true
    });
    
    expect(() => {
      FocusManager.preserveFocus(mockCallback);
    }).not.toThrow();
    
    expect(mockCallback).toHaveBeenCalled();
  });
});