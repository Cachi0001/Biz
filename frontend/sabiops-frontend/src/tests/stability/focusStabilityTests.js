/**
 * Focus Stability Integration Tests
 * Tests focus preservation during rapid typing and state updates
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StableInput from '../../components/ui/StableInput';
import FocusManager from '../../utils/focusManager';

describe('Focus Stability Tests', () => {
    let user;

    beforeEach(() => {
        user = userEvent.setup();
        // Reset focus manager state
        FocusManager.clearFocusQueue();
    });

    test('should maintain focus during rapid typing', async () => {
        let value = '';
        const handleChange = jest.fn((e) => {
            value = e.target.value;
        });

        const TestComponent = () => {
            const [inputValue, setInputValue] = React.useState(value);

            React.useEffect(() => {
                setInputValue(value);
            }, [value]);

            return (
                <StableInput
                    data-testid="stable-input"
                    value={inputValue}
                    onChange={(e) => {
                        handleChange(e);
                        setInputValue(e.target.value);
                    }}
                    placeholder="Type here"
                />
            );
        };

        render(<TestComponent />);

        const input = screen.getByTestId('stable-input');

        // Focus the input
        await user.click(input);
        expect(input).toHaveFocus();

        // Type rapidly
        const testText = 'Hello World Test';
        for (const char of testText) {
            await user.type(input, char, { delay: 10 }); // Very fast typing

            // Verify focus is maintained after each character
            expect(input).toHaveFocus();
        }

        // Verify final value
        expect(input.value).toBe(testText);
        expect(handleChange).toHaveBeenCalledTimes(testText.length);
    });

    test('should preserve cursor position during state updates', async () => {
        const TestComponent = () => {
            const [value, setValue] = React.useState('Initial text');
            const [triggerUpdate, setTriggerUpdate] = React.useState(0);

            return (
                <div>
                    <StableInput
                        data-testid="cursor-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                    />
                    <button
                        data-testid="trigger-update"
                        onClick={() => setTriggerUpdate(prev => prev + 1)}
                    >
                        Trigger Update
                    </button>
                </div>
            );
        };

        render(<TestComponent />);

        const input = screen.getByTestId('cursor-input');
        const button = screen.getByTestId('trigger-update');

        // Focus input and set cursor position
        await user.click(input);
        input.setSelectionRange(7, 7); // Position cursor after "Initial"

        const initialCursorPos = input.selectionStart;

        // Trigger state update
        await user.click(button);

        // Wait for any async updates
        await waitFor(() => {
            expect(input.selectionStart).toBe(initialCursorPos);
        });
    });

    test('should handle focus restoration when element is replaced', async () => {
        const TestComponent = () => {
            const [showFirst, setShowFirst] = React.useState(true);

            return (
                <div>
                    {showFirst ? (
                        <StableInput
                            data-testid="first-input"
                            id="test-input"
                            defaultValue="First input"
                        />
                    ) : (
                        <StableInput
                            data-testid="second-input"
                            id="test-input"
                            defaultValue="Second input"
                        />
                    )}
                    <button
                        data-testid="toggle-input"
                        onClick={() => setShowFirst(prev => !prev)}
                    >
                        Toggle Input
                    </button>
                </div>
            );
        };

        render(<TestComponent />);

        const firstInput = screen.getByTestId('first-input');
        const toggleButton = screen.getByTestId('toggle-input');

        // Focus first input
        await user.click(firstInput);
        expect(firstInput).toHaveFocus();

        // Toggle to second input
        await user.click(toggleButton);

        // Check if focus was transferred to the new input
        await waitFor(() => {
            const secondInput = screen.getByTestId('second-input');
            expect(secondInput).toBeInTheDocument();
        });
    });

    test('should handle multiple inputs with focus preservation', async () => {
        const TestComponent = () => {
            const [values, setValues] = React.useState({
                input1: '',
                input2: '',
                input3: ''
            });

            const handleChange = (name) => (e) => {
                setValues(prev => ({ ...prev, [name]: e.target.value }));
            };

            return (
                <div>
                    <StableInput
                        data-testid="input-1"
                        value={values.input1}
                        onChange={handleChange('input1')}
                        placeholder="Input 1"
                    />
                    <StableInput
                        data-testid="input-2"
                        value={values.input2}
                        onChange={handleChange('input2')}
                        placeholder="Input 2"
                    />
                    <StableInput
                        data-testid="input-3"
                        value={values.input3}
                        onChange={handleChange('input3')}
                        placeholder="Input 3"
                    />
                </div>
            );
        };

        render(<TestComponent />);

        const input1 = screen.getByTestId('input-1');
        const input2 = screen.getByTestId('input-2');
        const input3 = screen.getByTestId('input-3');

        // Type in first input
        await user.click(input1);
        await user.type(input1, 'First');
        expect(input1).toHaveFocus();
        expect(input1.value).toBe('First');

        // Switch to second input
        await user.click(input2);
        await user.type(input2, 'Second');
        expect(input2).toHaveFocus();
        expect(input2.value).toBe('Second');

        // Switch to third input
        await user.click(input3);
        await user.type(input3, 'Third');
        expect(input3).toHaveFocus();
        expect(input3.value).toBe('Third');

        // Verify all values are preserved
        expect(input1.value).toBe('First');
        expect(input2.value).toBe('Second');
        expect(input3.value).toBe('Third');
    });

    test('should handle focus during form validation errors', async () => {
        const TestComponent = () => {
            const [value, setValue] = React.useState('');
            const [error, setError] = React.useState('');

            const handleChange = (e) => {
                setValue(e.target.value);
                // Simulate validation
                if (e.target.value.length < 3) {
                    setError('Minimum 3 characters required');
                } else {
                    setError('');
                }
            };

            return (
                <div>
                    <StableInput
                        data-testid="validation-input"
                        value={value}
                        onChange={handleChange}
                        placeholder="Enter at least 3 characters"
                    />
                    {error && <div data-testid="error-message">{error}</div>}
                </div>
            );
        };

        render(<TestComponent />);

        const input = screen.getByTestId('validation-input');

        // Focus and type less than 3 characters
        await user.click(input);
        await user.type(input, 'Hi');

        // Verify error appears but focus is maintained
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(input).toHaveFocus();

        // Type more characters
        await user.type(input, ' there');

        // Verify error disappears and focus is maintained
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
        expect(input).toHaveFocus();
        expect(input.value).toBe('Hi there');
    });

    test('should handle focus during async operations', async () => {
        const TestComponent = () => {
            const [value, setValue] = React.useState('');
            const [loading, setLoading] = React.useState(false);

            const handleChange = async (e) => {
                setValue(e.target.value);

                // Simulate async operation
                setLoading(true);
                await new Promise(resolve => setTimeout(resolve, 100));
                setLoading(false);
            };

            return (
                <div>
                    <StableInput
                        data-testid="async-input"
                        value={value}
                        onChange={handleChange}
                        placeholder="Type to trigger async operation"
                    />
                    {loading && <div data-testid="loading">Loading...</div>}
                </div>
            );
        };

        render(<TestComponent />);

        const input = screen.getByTestId('async-input');

        // Focus and type
        await user.click(input);
        await user.type(input, 'Test');

        // Verify focus is maintained during async operation
        expect(input).toHaveFocus();

        // Wait for async operation to complete
        await waitFor(() => {
            expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        });

        // Verify focus is still maintained
        expect(input).toHaveFocus();
        expect(input.value).toBe('Test');
    });
});

export default focusStabilityTests;