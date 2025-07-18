import React from 'react';
import { AlertCircle, Wifi, RefreshCw, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from './alert';

/**
 * Enhanced error message component with specific, actionable messages
 * Supports different error types with appropriate icons and styling
 */
const ErrorMessage = ({ 
  error, 
  type = 'validation', 
  field = '', 
  className = '',
  showIcon = true,
  onRetry = null 
}) => {
  if (!error) return null;

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: <Wifi className="h-4 w-4" />,
          className: 'border-orange-200 bg-orange-50 text-orange-800',
          iconColor: 'text-orange-600'
        };
      case 'server':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          className: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600'
        };
      case 'validation':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          className: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
          iconColor: 'text-yellow-600'
        };
      default:
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          className: 'border-red-200 bg-red-50 text-red-800',
          iconColor: 'text-red-600'
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Alert className={`${config.className} ${className} border-l-4`}>
      <div className="flex items-start gap-2">
        {showIcon && (
          <div className={`${config.iconColor} flex-shrink-0 mt-0.5`}>
            {config.icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <AlertDescription className="text-sm font-medium">
            {error}
          </AlertDescription>
          {onRetry && type === 'network' && (
            <button
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:text-orange-800 underline"
            >
              <RefreshCw className="h-3 w-3" />
              Try Again
            </button>
          )}
        </div>
      </div>
    </Alert>
  );
};

/**
 * Field-specific error message component
 * Displays validation errors below form fields
 */
export const FieldError = ({ error, className = '' }) => {
  if (!error) return null;

  return (
    <div className={`mt-1 text-sm text-red-600 font-medium ${className}`}>
      <div className="flex items-center gap-1">
        <AlertCircle className="h-3 w-3 flex-shrink-0" />
        <span>{error}</span>
      </div>
    </div>
  );
};

/**
 * Multiple errors display component
 * Shows a list of validation errors
 */
export const ErrorList = ({ errors, className = '' }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <Alert className={`border-red-200 bg-red-50 text-red-800 border-l-4 ${className}`}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription>
        <div className="font-medium mb-2">Please fix the following errors:</div>
        <ul className="list-disc list-inside space-y-1 text-sm">
          {errors.map((error, index) => (
            <li key={index}>{error}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorMessage;