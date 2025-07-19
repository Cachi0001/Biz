/**
 * Page Reload Prevention - Prevents unexpected page reloads during user interactions
 * Handles form submissions, navigation, and script errors that might cause reloads
 */

export class PageReloadPrevention {
  static isEnabled = true;
  static reloadAttempts = 0;
  static maxReloadAttempts = 3;
  static formSubmissionInProgress = false;

  /**
   * Initialize page reload prevention
   */
  static init() {
    if (!this.isEnabled) return;

    // Prevent form submissions from causing page reloads
    this.preventFormReloads();
    
    // Handle beforeunload events
    this.handleBeforeUnload();
    
    // Monitor for unexpected reloads
    this.monitorReloads();
    
    // Prevent script errors from causing reloads
    this.preventScriptReloads();
    
    console.log('[PageReloadPrevention] Initialized');
  }

  /**
   * Prevent form submissions from causing page reloads
   */
  static preventFormReloads() {
    // Override form submission behavior
    document.addEventListener('submit', (event) => {
      const form = event.target;
      
      // Check if this is a React form (has React event handlers)
      if (this.isReactForm(form)) {
        console.log('[PageReloadPrevention] Preventing React form reload');
        event.preventDefault();
        return false;
      }
      
      // For regular forms, ensure they have proper action
      if (!form.action || form.action === window.location.href) {
        console.log('[PageReloadPrevention] Preventing form reload - no action specified');
        event.preventDefault();
        return false;
      }
    }, true);

    // Monitor form submission state
    document.addEventListener('submit', (event) => {
      this.formSubmissionInProgress = true;
      
      setTimeout(() => {
        this.formSubmissionInProgress = false;
      }, 5000); // Reset after 5 seconds
    });
  }

  /**
   * Check if a form is a React form
   */
  static isReactForm(form) {
    // Check for React-specific attributes or event handlers
    const reactIndicators = [
      'data-reactroot',
      'data-react-',
      '__reactInternalInstance',
      '_reactInternalFiber'
    ];

    // Check form attributes
    for (const attr of form.attributes) {
      if (reactIndicators.some(indicator => attr.name.includes(indicator))) {
        return true;
      }
    }

    // Check if form has React event handlers
    const hasReactHandlers = form.onsubmit && form.onsubmit.toString().includes('SyntheticEvent');
    
    // Check if form is inside a React component
    let parent = form.parentElement;
    while (parent) {
      if (parent.hasAttribute && reactIndicators.some(indicator => 
        Array.from(parent.attributes).some(attr => attr.name.includes(indicator))
      )) {
        return true;
      }
      parent = parent.parentElement;
    }

    return hasReactHandlers;
  }

  /**
   * Handle beforeunload events to prevent accidental navigation
   */
  static handleBeforeUnload() {
    window.addEventListener('beforeunload', (event) => {
      // Only prevent unload if form submission is in progress
      if (this.formSubmissionInProgress) {
        event.preventDefault();
        event.returnValue = 'Form submission in progress. Are you sure you want to leave?';
        return event.returnValue;
      }
      
      // Check for unsaved form data
      if (this.hasUnsavedFormData()) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    });
  }

  /**
   * Check if there's unsaved form data
   */
  static hasUnsavedFormData() {
    const forms = document.querySelectorAll('form');
    
    for (const form of forms) {
      const inputs = form.querySelectorAll('input, textarea, select');
      
      for (const input of inputs) {
        // Skip certain input types
        if (['submit', 'button', 'reset', 'hidden'].includes(input.type)) {
          continue;
        }
        
        // Check if input has been modified
        if (input.value && input.value !== input.defaultValue) {
          return true;
        }
        
        // Check checkboxes and radio buttons
        if ((input.type === 'checkbox' || input.type === 'radio') && 
            input.checked !== input.defaultChecked) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Monitor for unexpected reloads
   */
  static monitorReloads() {
    // Track page load time
    const loadTime = Date.now();
    
    // Check if this is a reload
    if (performance.navigation.type === performance.navigation.TYPE_RELOAD) {
      this.reloadAttempts++;
      console.warn(`[PageReloadPrevention] Page reload detected (attempt ${this.reloadAttempts})`);
      
      if (this.reloadAttempts > this.maxReloadAttempts) {
        console.error('[PageReloadPrevention] Excessive reloads detected - possible issue');
        
        // Report to monitoring service
        if (window.reportError) {
          window.reportError(new Error('Excessive page reloads'), {
            component: 'PageReloadPrevention',
            reloadAttempts: this.reloadAttempts,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    // Reset reload counter after successful operation
    setTimeout(() => {
      if (Date.now() - loadTime > 30000) { // 30 seconds of stable operation
        this.reloadAttempts = 0;
      }
    }, 30000);
  }

  /**
   * Prevent script errors from causing reloads
   */
  static preventScriptReloads() {
    // Override location.reload
    const originalReload = window.location.reload;
    window.location.reload = function(forcedReload) {
      console.warn('[PageReloadPrevention] Reload attempt intercepted');
      
      // Allow reload if explicitly forced or if there are critical errors
      if (forcedReload || PageReloadPrevention.shouldAllowReload()) {
        console.log('[PageReloadPrevention] Allowing reload');
        originalReload.call(window.location, forcedReload);
      } else {
        console.log('[PageReloadPrevention] Reload prevented');
      }
    };

    // Monitor for programmatic navigation that might cause reloads
    const originalAssign = window.location.assign;
    window.location.assign = function(url) {
      // Check if this is a reload attempt
      if (url === window.location.href) {
        console.warn('[PageReloadPrevention] Reload via location.assign prevented');
        return;
      }
      
      originalAssign.call(window.location, url);
    };
  }

  /**
   * Determine if a reload should be allowed
   */
  static shouldAllowReload() {
    // Allow reload if there are critical errors
    const criticalErrors = [
      'ChunkLoadError',
      'Loading chunk',
      'Loading CSS chunk'
    ];

    const recentErrors = this.getRecentErrors();
    const hasCriticalError = recentErrors.some(error => 
      criticalErrors.some(critical => error.includes(critical))
    );

    return hasCriticalError;
  }

  /**
   * Get recent error messages
   */
  static getRecentErrors() {
    // This would integrate with your error tracking system
    // For now, return empty array
    return [];
  }

  /**
   * Safe form submission wrapper
   */
  static safeFormSubmit(form, handler) {
    return (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      this.formSubmissionInProgress = true;
      
      try {
        const result = handler(event);
        
        // Handle promise-based handlers
        if (result && typeof result.then === 'function') {
          result
            .then(() => {
              this.formSubmissionInProgress = false;
            })
            .catch((error) => {
              this.formSubmissionInProgress = false;
              console.error('[PageReloadPrevention] Form submission error:', error);
            });
        } else {
          this.formSubmissionInProgress = false;
        }
        
        return result;
      } catch (error) {
        this.formSubmissionInProgress = false;
        console.error('[PageReloadPrevention] Form submission error:', error);
        throw error;
      }
    };
  }

  /**
   * Create a safe event handler that prevents reloads
   */
  static createSafeHandler(handler, context = 'unknown') {
    return (event) => {
      try {
        // Prevent default behavior that might cause reloads
        if (event && typeof event.preventDefault === 'function') {
          event.preventDefault();
        }
        
        return handler(event);
      } catch (error) {
        console.error(`[PageReloadPrevention] Handler error in ${context}:`, error);
        
        // Don't let the error bubble up and potentially cause a reload
        return null;
      }
    };
  }

  /**
   * Disable page reload prevention (for debugging)
   */
  static disable() {
    this.isEnabled = false;
    console.log('[PageReloadPrevention] Disabled');
  }

  /**
   * Enable page reload prevention
   */
  static enable() {
    this.isEnabled = true;
    console.log('[PageReloadPrevention] Enabled');
  }

  /**
   * Get status for monitoring
   */
  static getStatus() {
    return {
      isEnabled: this.isEnabled,
      reloadAttempts: this.reloadAttempts,
      formSubmissionInProgress: this.formSubmissionInProgress
    };
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  PageReloadPrevention.init();
}

export default PageReloadPrevention;