/**
 * ComponentErrorBoundary - Error boundary for individual components
 * Prevents component crashes from affecting the entire application
 */

import React from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { RefreshCw } from 'lucide-react';

class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('ComponentErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Report error to monitoring service if available
    if (window.reportError) {
      window.reportError(error, {
        component: this.props.componentName || 'Unknown',
        errorInfo: errorInfo,
        timestamp: new Date().toISOString()
      });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  {this.props.fallbackTitle || 'Something went wrong with this component'}
                </p>
                <p className="text-sm">
                  {this.props.fallbackMessage || 'Please try refreshing or contact support if the problem persists.'}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto">
                      {this.state.error.toString()}
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            {this.props.onError && (
              <Button 
                onClick={() => this.props.onError(this.state.error)}
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

export default ComponentErrorBoundary;