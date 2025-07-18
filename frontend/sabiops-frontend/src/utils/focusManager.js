/**
 * FocusManager - Utility for preserving focus during React re-renders
 * Addresses input focus loss issues in forms
 */

export class FocusManager {
  /**
   * Preserves focus and cursor position during state updates
   * @param {Function} callback - Function that triggers state update
   */
  static preserveFocus(callback) {
    const activeElement = document.activeElement;
    const selectionStart = activeElement?.selectionStart;
    const selectionEnd = activeElement?.selectionEnd;
    const tagName = activeElement?.tagName?.toLowerCase();
    
    // Only preserve focus for input elements
    if (!activeElement || !['input', 'textarea', 'select'].includes(tagName)) {
      callback();
      return;
    }

    console.log('[FocusManager] Preserving focus for:', {
      element: tagName,
      id: activeElement.id,
      name: activeElement.name,
      selectionStart,
      selectionEnd
    });
    
    // Execute the callback that causes re-render
    callback();
    
    // Restore focus after React has finished re-rendering
    requestAnimationFrame(() => {
      // Check if the original element still exists and is visible
      if (activeElement && document.contains(activeElement) && activeElement.offsetParent !== null) {
        try {
          activeElement.focus();
          
          // Restore cursor position for text inputs
          if (selectionStart !== undefined && selectionEnd !== undefined) {
            if (activeElement.setSelectionRange) {
              activeElement.setSelectionRange(selectionStart, selectionEnd);
            }
          }
          
          console.log('[FocusManager] Focus restored successfully');
        } catch (error) {
          console.warn('[FocusManager] Failed to restore focus:', error);
        }
      } else {
        // Try to find a similar element if the original is gone
        const fallbackElement = this.findFallbackElement(activeElement);
        if (fallbackElement) {
          try {
            fallbackElement.focus();
            console.log('[FocusManager] Focus restored to fallback element');
          } catch (error) {
            console.log('[FocusManager] Element no longer exists in DOM');
          }
        } else {
          console.log('[FocusManager] Element no longer exists in DOM');
        }
      }
    });
  }

  /**
   * Finds a fallback element when the original is no longer available
   * @param {HTMLElement} originalElement - The original element that lost focus
   * @returns {HTMLElement|null} - Fallback element or null
   */
  static findFallbackElement(originalElement) {
    if (!originalElement) return null;
    
    // Try to find by ID
    if (originalElement.id) {
      const byId = document.getElementById(originalElement.id);
      if (byId && byId !== originalElement) return byId;
    }
    
    // Try to find by name
    if (originalElement.name) {
      const byName = document.querySelector(`[name="${originalElement.name}"]`);
      if (byName && byName !== originalElement) return byName;
    }
    
    // Try to find by similar attributes
    const tagName = originalElement.tagName.toLowerCase();
    const className = originalElement.className;
    
    if (className) {
      const byClass = document.querySelector(`${tagName}.${className.split(' ')[0]}`);
      if (byClass && byClass !== originalElement) return byClass;
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