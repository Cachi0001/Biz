/**
 * Script Error Isolation - Prevents third-party script errors from affecting core functionality
 * Handles ad scripts, analytics, and other external scripts safely
 */

export class ScriptErrorIsolation {
  static isEnabled = true;
  static errorCount = 0;
  static maxErrors = 10;
  static blockedScripts = new Set();

  /**
   * Initialize script error isolation
   */
  static init() {
    if (!this.isEnabled) return;

    // Global error handler for uncaught errors
    window.addEventListener('error', this.handleGlobalError.bind(this));
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    // Override console.error to catch script errors
    this.wrapConsoleError();
    
    console.log('[ScriptErrorIsolation] Initialized error isolation');
  }

  /**
   * Handle global JavaScript errors
   */
  static handleGlobalError(event) {
    const { error, filename, lineno, colno, message } = event;
    
    // Check if this is from a third-party script
    if (this.isThirdPartyScript(filename)) {
      console.warn('[ScriptErrorIsolation] Third-party script error isolated:', {
        filename,
        message,
        lineno,
        colno
      });
      
      // Prevent the error from bubbling up
      event.preventDefault();
      event.stopPropagation();
      
      this.logScriptError('global-error', error || new Error(message), filename);
      return true;
    }
    
    // Allow core application errors to be handled normally
    return false;
  }

  /**
   * Handle unhandled promise rejections
   */
  static handleUnhandledRejection(event) {
    const { reason } = event;
    
    // Check if this is from a third-party source
    if (this.isThirdPartyError(reason)) {
      console.warn('[ScriptErrorIsolation] Third-party promise rejection isolated:', reason);
      
      // Prevent the error from causing app crashes
      event.preventDefault();
      
      this.logScriptError('promise-rejection', reason, 'unknown');
      return true;
    }
    
    return false;
  }

  /**
   * Wrap console.error to catch and isolate script errors
   */
  static wrapConsoleError() {
    const originalError = console.error;
    
    console.error = (...args) => {
      // Check if this looks like a third-party script error
      const errorMessage = args.join(' ');
      
      if (this.isThirdPartyErrorMessage(errorMessage)) {
        console.warn('[ScriptErrorIsolation] Third-party console error isolated:', ...args);
        this.logScriptError('console-error', new Error(errorMessage), 'console');
        return;
      }
      
      // Allow normal console.error for core app
      originalError.apply(console, args);
    };
  }

  /**
   * Check if a filename belongs to a third-party script
   */
  static isThirdPartyScript(filename) {
    if (!filename) return false;
    
    const thirdPartyDomains = [
      'buysellads.com',
      'srv.buysellads.com',
      'googletagmanager.com',
      'google-analytics.com',
      'facebook.net',
      'doubleclick.net',
      'googlesyndication.com',
      'amazon-adsystem.com',
      'monetization.js',
      'ads.js',
      'analytics.js'
    ];
    
    return thirdPartyDomains.some(domain => filename.includes(domain));
  }

  /**
   * Check if an error is from a third-party source
   */
  static isThirdPartyError(error) {
    if (!error) return false;
    
    const errorString = error.toString();
    const stack = error.stack || '';
    
    return this.isThirdPartyErrorMessage(errorString) || 
           this.isThirdPartyErrorMessage(stack);
  }

  /**
   * Check if an error message indicates third-party origin
   */
  static isThirdPartyErrorMessage(message) {
    if (!message) return false;
    
    const thirdPartyIndicators = [
      'buysellads',
      'monetization',
      'BSA ad',
      'Failed to fetch',
      'net::ERR_BLOCKED_BY_CLIENT',
      'Script error',
      'Non-Error promise rejection captured'
    ];
    
    return thirdPartyIndicators.some(indicator => 
      message.toLowerCase().includes(indicator.toLowerCase())
    );
  }

  /**
   * Log script errors for debugging
   */
  static logScriptError(type, error, source) {
    this.errorCount++;
    
    if (this.errorCount > this.maxErrors) {
      console.warn('[ScriptErrorIsolation] Max error count reached, suppressing further logs');
      return;
    }
    
    console.group(`🛡️ [ScriptErrorIsolation] ${type} isolated`);
    console.warn('Error:', error);
    console.warn('Source:', source);
    console.warn('Count:', this.errorCount);
    console.warn('Timestamp:', new Date().toISOString());
    console.groupEnd();
  }

  /**
   * Safely execute a potentially problematic script function
   */
  static safeExecute(fn, context = 'unknown', fallback = null) {
    try {
      return fn();
    } catch (error) {
      console.warn(`[ScriptErrorIsolation] Safe execution failed for ${context}:`, error);
      this.logScriptError('safe-execute', error, context);
      return fallback;
    }
  }

  /**
   * Safely load a script with error isolation
   */
  static safeLoadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
      // Check if this script has been blocked
      if (this.blockedScripts.has(src)) {
        console.warn(`[ScriptErrorIsolation] Script ${src} is blocked`);
        reject(new Error('Script blocked'));
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.async = options.async !== false;
      script.defer = options.defer || false;
      
      script.onload = () => {
        console.log(`[ScriptErrorIsolation] Script loaded safely: ${src}`);
        resolve(script);
      };
      
      script.onerror = (error) => {
        console.warn(`[ScriptErrorIsolation] Script failed to load: ${src}`, error);
        this.blockedScripts.add(src);
        this.logScriptError('script-load', error, src);
        reject(error);
      };
      
      // Add timeout for script loading
      const timeout = setTimeout(() => {
        console.warn(`[ScriptErrorIsolation] Script load timeout: ${src}`);
        this.blockedScripts.add(src);
        script.remove();
        reject(new Error('Script load timeout'));
      }, options.timeout || 10000);
      
      script.onload = () => {
        clearTimeout(timeout);
        resolve(script);
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * Create an isolated execution context for third-party code
   */
  static createIsolatedContext(code, context = 'isolated') {
    try {
      // Create a sandboxed function
      const isolatedFunction = new Function(`
        try {
          ${code}
        } catch (error) {
          console.warn('[ScriptErrorIsolation] Isolated execution error:', error);
          return null;
        }
      `);
      
      return this.safeExecute(isolatedFunction, context);
    } catch (error) {
      this.logScriptError('isolated-context', error, context);
      return null;
    }
  }

  /**
   * Disable error isolation (for debugging)
   */
  static disable() {
    this.isEnabled = false;
    console.log('[ScriptErrorIsolation] Error isolation disabled');
  }

  /**
   * Enable error isolation
   */
  static enable() {
    this.isEnabled = true;
    console.log('[ScriptErrorIsolation] Error isolation enabled');
  }

  /**
   * Get error statistics
   */
  static getStats() {
    return {
      errorCount: this.errorCount,
      blockedScripts: Array.from(this.blockedScripts),
      isEnabled: this.isEnabled
    };
  }

  /**
   * Reset error isolation state
   */
  static reset() {
    this.errorCount = 0;
    this.blockedScripts.clear();
    console.log('[ScriptErrorIsolation] State reset');
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  ScriptErrorIsolation.init();
}

export default ScriptErrorIsolation;