/**
 * Debug Logger - Comprehensive logging system for debugging UI issues
 * Provides structured logging for API calls, focus events, and state updates
 */

export class DebugLogger {
  static isEnabled = process.env.NODE_ENV === 'development';
  
  /**
   * Logs API calls with detailed response information
   * @param {string} endpoint - API endpoint
   * @param {*} response - API response
   * @param {string} component - Component name making the call
   * @param {string} method - HTTP method (GET, POST, etc.)
   */
  static logApiCall(endpoint, response, component, method = 'GET') {
    if (!this.isEnabled) return;
    
    console.group(`🌐 [${component}] API ${method}: ${endpoint}`);
    console.log('📥 Response:', response);
    console.log('📊 Response Type:', typeof response);
    
    if (response && typeof response === 'object') {
      console.log('🔍 Response Structure:', Object.keys(response));
      
      // Log specific data structures
      if (response.data) {
        console.log('📦 Data:', response.data);
        console.log('📦 Data Type:', typeof response.data);
        if (Array.isArray(response.data)) {
          console.log('📦 Data Length:', response.data.length);
        }
      }
      
      if (response.success !== undefined) {
        console.log('✅ Success:', response.success);
      }
      
      if (response.error) {
        console.log('❌ Error:', response.error);
      }
    }
    
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Logs API errors with detailed information
   * @param {string} endpoint - API endpoint
   * @param {Error} error - Error object
   * @param {string} component - Component name
   */
  static logApiError(endpoint, error, component) {
    if (!this.isEnabled) return;
    
    console.group(`🚨 [${component}] API Error: ${endpoint}`);
    console.error('❌ Error:', error);
    console.error('📝 Message:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📦 Response Data:', error.response.data);
      console.error('🔍 Headers:', error.response.headers);
    }
    
    if (error.request) {
      console.error('📡 Request:', error.request);
    }
    
    console.error('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Logs focus events for debugging focus issues
   * @param {string} component - Component name
   * @param {string} event - Event type (focus, blur, change, etc.)
   * @param {HTMLElement} element - Target element
   * @param {*} additionalData - Additional context data
   */
  static logFocusEvent(component, event, element, additionalData = {}) {
    if (!this.isEnabled) return;
    
    console.log(`🎯 [${component}] Focus Event: ${event}`, {
      element: element?.tagName,
      id: element?.id,
      name: element?.name,
      className: element?.className,
      value: element?.value,
      selectionStart: element?.selectionStart,
      selectionEnd: element?.selectionEnd,
      activeElement: document.activeElement?.tagName,
      activeElementId: document.activeElement?.id,
      timestamp: new Date().toISOString(),
      ...additionalData
    });
  }

  /**
   * Logs state updates for debugging re-render issues
   * @param {string} component - Component name
   * @param {string} stateName - Name of the state being updated
   * @param {*} oldValue - Previous state value
   * @param {*} newValue - New state value
   */
  static logStateUpdate(component, stateName, oldValue, newValue) {
    if (!this.isEnabled) return;
    
    console.log(`🔄 [${component}] State Update: ${stateName}`, {
      old: oldValue,
      new: newValue,
      changed: oldValue !== newValue,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logs component render cycles
   * @param {string} component - Component name
   * @param {string} phase - Render phase (mount, update, unmount)
   * @param {Object} props - Component props
   * @param {Object} state - Component state
   */
  static logRender(component, phase, props = {}, state = {}) {
    if (!this.isEnabled) return;
    
    console.log(`🎨 [${component}] Render: ${phase}`, {
      props: Object.keys(props),
      state: Object.keys(state),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Logs form submission events
   * @param {string} component - Component name
   * @param {Object} formData - Form data being submitted
   * @param {string} action - Action being performed (create, update, delete)
   */
  static logFormSubmit(component, formData, action = 'submit') {
    if (!this.isEnabled) return;
    
    console.group(`📝 [${component}] Form ${action}`);
    console.log('📦 Form Data:', formData);
    console.log('🔍 Data Keys:', Object.keys(formData));
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Logs data display issues
   * @param {string} component - Component name
   * @param {string} dataType - Type of data (expenses, products, etc.)
   * @param {*} data - Data being displayed
   * @param {string} issue - Description of the issue
   */
  static logDisplayIssue(component, dataType, data, issue) {
    if (!this.isEnabled) return;
    
    console.group(`🚨 [${component}] Display Issue: ${dataType}`);
    console.warn('⚠️ Issue:', issue);
    console.log('📦 Data:', data);
    console.log('📊 Data Type:', typeof data);
    console.log('📏 Data Length:', Array.isArray(data) ? data.length : 'Not an array');
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Logs dropdown/select component issues
   * @param {string} component - Component name
   * @param {Array} options - Options array
   * @param {*} selectedValue - Currently selected value
   * @param {string} issue - Description of the issue
   */
  static logDropdownIssue(component, options, selectedValue, issue) {
    if (!this.isEnabled) return;
    
    console.group(`🔽 [${component}] Dropdown Issue`);
    console.warn('⚠️ Issue:', issue);
    console.log('📋 Options:', options);
    console.log('📏 Options Length:', Array.isArray(options) ? options.length : 'Not an array');
    console.log('🎯 Selected Value:', selectedValue);
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Creates a performance timer for measuring operation duration
   * @param {string} label - Timer label
   * @returns {Function} - Function to end the timer
   */
  static startTimer(label) {
    if (!this.isEnabled) return () => {};
    
    const startTime = performance.now();
    console.time(`⏱️ ${label}`);
    
    return () => {
      const endTime = performance.now();
      console.timeEnd(`⏱️ ${label}`);
      console.log(`⏱️ ${label} took ${(endTime - startTime).toFixed(2)}ms`);
    };
  }

  /**
   * Logs component lifecycle events
   * @param {string} component - Component name
   * @param {string} lifecycle - Lifecycle event (useEffect, cleanup, etc.)
   * @param {Array} dependencies - Effect dependencies
   */
  static logLifecycle(component, lifecycle, dependencies = []) {
    if (!this.isEnabled) return;
    
    console.log(`🔄 [${component}] Lifecycle: ${lifecycle}`, {
      dependencies,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Enables or disables debug logging
   * @param {boolean} enabled - Whether to enable logging
   */
  static setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔧 Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Logs a summary of current application state
   * @param {string} component - Component name
   * @param {Object} summary - State summary object
   */
  static logStateSummary(component, summary) {
    if (!this.isEnabled) return;
    
    console.group(`📊 [${component}] State Summary`);
    Object.entries(summary).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.log('⏰ Timestamp:', new Date().toISOString());
    console.groupEnd();
  }
}

export default DebugLogger;