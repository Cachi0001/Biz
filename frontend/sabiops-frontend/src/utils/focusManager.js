/**
 * FocusManager - Utility for preserving focus during React re-renders
 * Addresses input focus loss issues in forms
 */

export class FocusManager {
  static focusQueue = [];
  static isProcessingQueue = false;
  /**
   * Preserves focus and cursor position during state updates
   * @param {Function} callback - Function that triggers state update
   */
  static preserveFocus(callback) {
    // Safety check for callback
    if (typeof callback !== 'function') {
      console.warn('[FocusManager] Invalid callback provided');
      return;
    }

    const activeElement = document.activeElement;
    const selectionStart = activeElement?.selectionStart;
    const selectionEnd = activeElement?.selectionEnd;
    const tagName = activeElement?.tagName?.toLowerCase();
    
    // Only preserve focus for input elements
    if (!activeElement || !['input', 'textarea', 'select'].includes(tagName)) {
      try {
        callback();
      } catch (error) {
        console.error('[FocusManager] Callback execution failed:', error);
      }
      return;
    }

    // Store element reference data
    const elementData = {
      element: tagName,
      id: activeElement.id,
      name: activeElement.name,
      className: activeElement.className,
      selectionStart,
      selectionEnd
    };

    console.log('[FocusManager] Preserving focus for:', elementData);
    
    // Execute the callback that causes re-render
    try {
      callback();
    } catch (error) {
      console.error('[FocusManager] Callback execution failed:', error);
      return;
    }
    
    // Restore focus after React has finished re-rendering
    requestAnimationFrame(() => {
      try {
        // Check if the original element still exists and is visible
        if (activeElement && 
            document.contains(activeElement) && 
            activeElement.offsetParent !== null &&
            !activeElement.disabled) {
          
          activeElement.focus();
          
          // Restore cursor position for text inputs
          if (selectionStart !== undefined && selectionEnd !== undefined) {
            if (activeElement.setSelectionRange && 
                typeof activeElement.setSelectionRange === 'function') {
              try {
                activeElement.setSelectionRange(selectionStart, selectionEnd);
              } catch (selectionError) {
                console.warn('[FocusManager] Failed to restore selection:', selectionError);
              }
            }
          }
          
          console.log('[FocusManager] Focus restored successfully');
        } else {
          // Try to find a similar element if the original is gone
          const fallbackElement = this.findFallbackElement(elementData);
          if (fallbackElement) {
            try {
              fallbackElement.focus();
              console.log('[FocusManager] Focus restored to fallback element');
            } catch (focusError) {
              console.warn('[FocusManager] Failed to focus fallback element:', focusError);
            }
          } else {
            console.log('[FocusManager] Element no longer exists in DOM, no fallback found');
          }
        }
      } catch (error) {
        console.error('[FocusManager] Focus restoration failed:', error);
      }
    });
  }

  /**
   * Finds a fallback element when the original is no longer available
   * @param {Object} elementData - Data about the original element
   * @returns {HTMLElement|null} - Fallback element or null
   */
  static findFallbackElement(elementData) {
    if (!elementData) return null;
    
    // Try to find by ID
    if (elementData.id) {
      const byId = document.getElementById(elementData.id);
      if (byId) return byId;
    }
    
    // Try to find by name
    if (elementData.name) {
      const byName = document.querySelector(`[name="${elementData.name}"]`);
      if (byName) return byName;
    }
    
    // Try to find by similar attributes
    const tagName = elementData.element;
    const className = elementData.className;
    
    if (className) {
      const byClass = document.querySelector(`${tagName}.${className.split(' ')[0]}`);
      if (byClass) return byClass;
    }
    
    return null;
  }

  /**
   * Creates a focus-preserving wrapper for onChange handlers
   * @param {Function} onChange - Original onChange handler
   * @returns {Function} - Wrapped onChange handler
   */
  static createStableOnChange(onChange) {
    return (event) => {
      if (!onChange) return;
      
      this.preserveFocus(() => {
        onChange(event);
      });
    };
  }

  /**
   * Creates stable input props to prevent focus loss
   * @param {Object} props - Original input props
   * @returns {Object} - Enhanced props with focus stability
   */
  static createStableInput(props) {
    return {
      ...props,
      onFocus: (e) => {
        e.target.dataset.focused = 'true';
        e.target.dataset.focusTime = Date.now().toString();
        this.logFocusEvent(props.componentName || 'Input', 'focus', e.target);
        props.onFocus?.(e);
      },
      onBlur: (e) => {
        const focusTime = parseInt(e.target.dataset.focusTime || '0');
        const now = Date.now();
        
        // Only blur if focus was held for more than 100ms (prevents accidental blur)
        if (now - focusTime > 100) {
          setTimeout(() => {
            if (e.target.dataset.focused === 'true') {
              e.target.dataset.focused = 'false';
              this.logFocusEvent(props.componentName || 'Input', 'blur', e.target);
              props.onBlur?.(e);
            }
          }, 50);
        }
      },
      onChange: this.createStableOnChange(props.onChange),
      onMouseDown: (e) => {
        // Prevent focus loss on mouse interactions
        if (e.target.focus && e.target.dataset.focused !== 'true') {
          e.target.focus();
        }
        props.onMouseDown?.(e);
      }
    };
  }

  /**
   * Prevents focus loss during callback execution
   * @param {Function} callback - Function to execute
   */
  static preventFocusLoss(callback) {
    const activeElement = document.activeElement;
    const wasInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.contentEditable === 'true'
    );
    
    if (wasInputFocused) {
      this.preserveFocus(callback);
    } else {
      callback();
    }
  }

  /**
   * Handles form submission while preserving focus
   * @param {HTMLElement} formElement - Form element
   * @param {Function} callback - Submit callback
   */
  static handleFormSubmit(formElement, callback) {
    const activeElement = document.activeElement;
    
    this.preventFocusLoss(() => {
      callback();
      
      // After submission, restore focus to first input if no element is focused
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          const firstInput = formElement?.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])');
          if (firstInput && firstInput.focus) {
            firstInput.focus();
          }
        }
      }, 100);
    });
  }

  /**
   * Creates mobile-friendly input props
   * @param {Object} props - Original input props
   * @returns {Object} - Enhanced props for mobile
   */
  static createMobileFriendlyInput(props) {
    return {
      ...this.createStableInput(props),
      onTouchStart: (e) => {
        // Prevent iOS zoom on input focus
        if (e.target.tagName === 'INPUT' && e.target.type !== 'range') {
          const originalFontSize = e.target.style.fontSize;
          e.target.style.fontSize = '16px';
          e.target.dataset.originalFontSize = originalFontSize;
        }
        props.onTouchStart?.(e);
      },
      onTouchEnd: (e) => {
        // Restore original font size
        if (e.target.dataset.originalFontSize !== undefined) {
          e.target.style.fontSize = e.target.dataset.originalFontSize;
          delete e.target.dataset.originalFontSize;
        }
        props.onTouchEnd?.(e);
      }
    };
  }

  /**
   * Logs focus events for debugging
   * @param {string} component - Component name
   * @param {string} event - Event type
   * @param {HTMLElement} element - Target element
   */
  static logFocusEvent(component, event, element) {
    console.log(`[${component}] Focus Event: ${event}`, {
      element: element?.tagName,
      id: element?.id,
      name: element?.name,
      activeElement: document.activeElement?.tagName,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Attempts to restore focus to a specific element
   * @param {string} selector - CSS selector for the element
   * @param {number} delay - Delay before attempting focus (ms)
   */
  static restoreFocusToElement(selector, delay = 100) {
    setTimeout(() => {
      const element = document.querySelector(selector);
      if (element) {
        element.focus();
        console.log('[FocusManager] Focus restored to:', selector);
      } else {
        console.warn('[FocusManager] Could not find element:', selector);
      }
    }, delay);
  }

  /**
   * Queue focus restoration for delayed execution
   * @param {string} selector - CSS selector for the element
   * @param {number} priority - Priority level (lower = higher priority)
   */
  static queueFocusRestore(selector, priority = 1) {
    this.focusQueue.push({ selector, priority, timestamp: Date.now() });
    this.focusQueue.sort((a, b) => a.priority - b.priority);
    
    if (!this.isProcessingQueue) {
      this.processFocusQueue();
    }
  }

  /**
   * Process the focus restoration queue
   */
  static processFocusQueue() {
    if (this.focusQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;
    const { selector } = this.focusQueue.shift();

    requestAnimationFrame(() => {
      const element = document.querySelector(selector);
      if (element && !element.disabled) {
        try {
          element.focus();
          console.log('[FocusManager] Queued focus restored to:', selector);
        } catch (error) {
          console.warn('[FocusManager] Failed to restore queued focus:', error);
        }
      }
      
      // Process next item in queue
      setTimeout(() => this.processFocusQueue(), 50);
    });
  }

  /**
   * Clear the focus restoration queue
   */
  static clearFocusQueue() {
    this.focusQueue = [];
    this.isProcessingQueue = false;
    console.log('[FocusManager] Focus queue cleared');
  }
}

/**
 * React hook for stable form handling with focus preservation
 * @param {Object} initialData - Initial form data
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} - Form utilities
 */
export const useStableForm = (initialData, onSubmit) => {
  const [formData, setFormData] = React.useState(initialData);
  const [errors, setErrors] = React.useState({});
  const formRef = React.useRef();

  const updateField = React.useCallback((field, value) => {
    FocusManager.preserveFocus(() => {
      setFormData(prev => ({ ...prev, [field]: value }));
    });
  }, []);

  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('[StableForm] Submit error:', error);
      setErrors({ submit: error.message });
    }
  }, [formData, onSubmit]);

  const resetForm = React.useCallback(() => {
    FocusManager.preserveFocus(() => {
      setFormData(initialData);
      setErrors({});
    });
  }, [initialData]);

  return {
    formData,
    errors,
    updateField,
    handleSubmit,
    resetForm,
    formRef
  };
};

export default FocusManager;