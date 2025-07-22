/**
 * Toast Example Component
 * Demonstrates how to use the new ToastService and useToast hook
 */

import React from 'react';
import { useToast } from '../ToastProvider';
import { toastService, showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showLoadingToast } from '../../services/ToastService';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

const ToastExample: React.FC = () => {
  // Using the useToast hook (recommended way)
  const toast = useToast();

  // Example usage with hook
  const showSuccessExample = () => {
    toast.success('Product successfully created!', {
      title: 'Success',
      duration: 4000,
    });
  };

  const showErrorExample = () => {
    toast.error('Failed to save customer data. Please try again.', {
      title: 'Error',
      duration: 6000,
      action: {
        label: 'Retry',
        callback: () => console.log('Retrying action...')
      }
    });
  };

  const showWarningExample = () => {
    toast.warning('Your subscription expires in 3 days', {
      title: 'Subscription Warning',
      clickAction: {
        url: '/subscription-upgrade',
        params: { source: 'warning-toast' }
      }
    });
  };

  const showInfoExample = () => {
    toast.info('New features available in this update!', {
      title: 'Update Available',
      duration: 5000,
    });
  };

  const showLoadingExample = () => {
    const loadingId = toast.loading('Processing payment...');
    
    // Simulate async operation
    setTimeout(() => {
      // Update the loading toast to success
      toast.update(loadingId, {
        type: 'success',
        message: 'Payment processed successfully!',
        duration: 4000,
        dismissible: true
      });
    }, 3000);
  };

  // Example usage with direct service calls
  const showServiceExamples = () => {
    // Using convenience functions
    showSuccessToast('Direct service call - Success!');
    showErrorToast('Direct service call - Error!');
    showWarningToast('Direct service call - Warning!');
    showInfoToast('Direct service call - Info!');
  };

  const showAdvancedExample = () => {
    // Multiple toasts to demonstrate queueing
    toast.success('First toast - should show immediately');
    toast.info('Second toast - queued');
    toast.warning('Third toast - queued');
    toast.error('Fourth toast - queued');
    toast.success('Fifth toast - queued (will be queued due to max limit)');
  };

  const clearAllToasts = () => {
    toast.clear();
  };

  const getQueueStatus = () => {
    const status = toastService.getQueueStatus();
    toast.info(`Queue Status: ${status.activeToasts} active, ${status.queuedToasts} queued`, {
      title: 'Debug Info',
      duration: 6000,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Toast System Examples
            <Badge variant="secondary">New ToastService</Badge>
          </CardTitle>
          <CardDescription>
            Demonstration of the new ToastService with queueing, brand colors, and enhanced functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              onClick={showSuccessExample}
              className="bg-success hover:bg-success/80"
            >
              Success Toast
            </Button>
            <Button 
              onClick={showErrorExample}
              variant="destructive"
            >
              Error Toast
            </Button>
            <Button 
              onClick={showWarningExample}
              className="bg-warning hover:bg-warning/80 text-white"
            >
              Warning Toast
            </Button>
            <Button 
              onClick={showInfoExample}
              variant="secondary"
            >
              Info Toast
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button 
              onClick={showLoadingExample}
              variant="outline"
            >
              Loading Toast (Auto-Update)
            </Button>
            <Button 
              onClick={showServiceExamples}
              variant="outline"
            >
              Direct Service Calls
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              onClick={showAdvancedExample}
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-white"
            >
              Test Queueing (5 toasts)
            </Button>
            <Button 
              onClick={getQueueStatus}
              variant="outline"
            >
              Show Queue Status
            </Button>
            <Button 
              onClick={clearAllToasts}
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            >
              Clear All Toasts
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-success rounded-full"></span>
              <strong>Brand Colors:</strong> Uses SabiOps brand green (#28a745) for success toasts
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              <strong>Queueing:</strong> Max 4 concurrent toasts, excess are queued automatically
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-warning rounded-full"></span>
              <strong>Auto-dismiss:</strong> Different durations per type (4s success, 8s error, etc.)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-info rounded-full"></span>
              <strong>Typography:</strong> Uses Inter font family for brand consistency
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-secondary rounded-full"></span>
              <strong>Mobile Responsive:</strong> Adapts positioning and sizing for mobile devices
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-muted rounded-full"></span>
              <strong>Accessibility:</strong> Proper ARIA labels and live regions
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 font-mono text-sm bg-muted p-4 rounded-lg">
            <div>
              <strong>Hook Usage (Recommended):</strong>
              <pre className="mt-2 text-xs">
{`const toast = useToast();
toast.success('Operation completed!');
toast.error('Something went wrong!', {
  title: 'Error',
  action: { label: 'Retry', callback: () => retry() }
});`}
              </pre>
            </div>
            <div>
              <strong>Direct Service Usage:</strong>
              <pre className="mt-2 text-xs">
{`import { showSuccessToast } from '../services/ToastService';
showSuccessToast('Direct success message!');`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToastExample;
