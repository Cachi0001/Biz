import React from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, MessageCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-sm text-red-600 mb-4">
              {this.props.fallbackMessage || 'We couldn\'t load this part of the page. Please try again or contact support if the problem continues.'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onRetry) {
                  this.props.onRetry();
                }
              }}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-100 mb-3"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => window.open('https://wa.me/2348158025887', '_blank')}
              variant="outline"
              size="sm"
              className="bg-green-500 text-white border-green-600 hover:bg-green-600 flex items-center justify-center"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Us on WhatsApp
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;