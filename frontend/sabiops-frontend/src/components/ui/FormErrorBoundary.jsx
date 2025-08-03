/**
 * FormErrorBoundary - Specialized error boundary for form components
 * Provides form-specific error recovery and fallback UI
 */

import React from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { RefreshCw, AlertTriangle } from 'lucide-react';

class FormErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('FormErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report to error tracking service
    if (window.reportError) {
      window.reportError(error, {
        component: 'FormErrorBoundary',
        formName: this.props.formName || 'Unknown',
        errorInfo: errorInfo,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleRetry = () => {
    // Perform hard browser refresh instead of local state reset
    window.location.reload(true);
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    });
    
    // Call parent reset function if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-red-800">
                    {this.props.title || 'Form Error'}
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {this.props.message || 'There was a problem with this form. Your data has been preserved.'}
                  </p>
                </div>
                
                {this.state.retryCount > 2 && (
                  <div className="text-sm text-red-600 bg-red-100 p-2 rounded">
                    <strong>Persistent Issue:</strong> This form has failed multiple times. 
                    Please refresh the page or contact support.
                  </div>
                )}
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-red-700">
                      Technical Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-32">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            
            <Button 
              onClick={this.handleReset}
              variant="outline"
              size="sm"
            >
              Reset Form
            </Button>
            
            {this.props.onFallback && (
              <Button 
                onClick={this.props.onFallback}
                variant="outline"
                size="sm"
              >
                {this.props.fallbackText || 'Use Simple Form'}
              </Button>
            )}
            
            {this.props.onReport && (
              <Button 
                onClick={() => this.props.onReport(this.state.error)}
                variant="outline"
                size="sm"
              >
                Report Issue
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default FormErrorBoundary;