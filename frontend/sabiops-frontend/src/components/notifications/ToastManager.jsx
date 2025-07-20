import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  // Toast configuration
  const TOAST_DURATIONS = {
    success: 4000,
    warning: 6000,
    error: 8000,
    info: 5000
  };

  const MAX_TOASTS = 5;

  // Add toast function with error handling
  const addToast = useCallback((toast) => {
    try {
      const id = Date.now() + Math.random();
      const newToast = {
        id,
        type: 'info',
        duration: TOAST_DURATIONS.info,
        position: 'top-right',
        dismissible: true,
        ...toast,
        timestamp: Date.now()
      };

      setToasts(prev => {
        try {
          // Stack overflow protection - limit maximum concurrent toasts
          if (prev.length >= MAX_TOASTS) {
            console.warn('Toast stack overflow protection: removing oldest toast');
            const updatedToasts = [newToast, ...prev.slice(0, MAX_TOASTS - 1)];
            return updatedToasts;
          }
          return [newToast, ...prev];
        } catch (error) {
          console.error('Error updating toast state:', error);
          // Fallback: return new toast only
          return [newToast];
        }
      });

      // Auto-dismiss toast with error handling
      if (newToast.duration > 0) {
        setTimeout(() => {
          try {
            removeToast(id);
          } catch (error) {
            console.error('Error auto-dismissing toast:', error);
          }
        }, newToast.duration);
      }

      return id;
    } catch (error) {
      console.error('Error adding toast:', error);
      // Fallback: show basic browser alert
      if (toast.message) {
        console.log('Fallback notification:', toast.message);
      }
      return null;
    }
  }, []);

  // Remove toast function
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Handle toast click with error handling
  const handleToastClick = useCallback((toast) => {
    try {
      if (toast.clickAction?.url) {
        // Provide visual feedback before navigation
        const toastElement = document.querySelector(`[data-toast-id="${toast.id}"]`);
        if (toastElement) {
          toastElement.style.transform = 'scale(0.95)';
          toastElement.style.opacity = '0.8';
          
          setTimeout(() => {
            try {
              navigate(toast.clickAction.url, { 
                state: toast.clickAction.params || {} 
              });
              removeToast(toast.id);
            } catch (navError) {
              console.error('Navigation error:', navError);
              // Fallback: use window.location
              try {
                window.location.href = toast.clickAction.url;
                removeToast(toast.id);
              } catch (fallbackError) {
                console.error('Fallback navigation error:', fallbackError);
                // Show error toast
                addToast({
                  type: 'error',
                  message: 'Navigation failed. Please try again.',
                  duration: 3000
                });
              }
            }
          }, 150);
        }
      }
    } catch (error) {
      console.error('Error handling toast click:', error);
    }
  }, [navigate, removeToast, addToast]);

  // Memoized toast icon component
  const getToastIcon = useCallback((type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" aria-hidden="true" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" aria-hidden="true" />;
    }
  }, []);

  // Memoized toast styling
  const getToastStyling = useCallback((type) => {
    const baseClasses = "flex items-start gap-3 p-4 rounded-lg shadow-lg border-l-4 backdrop-blur-sm transition-all duration-300 ease-in-out transform";
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-green-50/95 border-green-500 text-green-800`;
      case 'warning':
        return `${baseClasses} bg-yellow-50/95 border-yellow-500 text-yellow-800`;
      case 'error':
        return `${baseClasses} bg-red-50/95 border-red-500 text-red-800`;
      case 'info':
      default:
        return `${baseClasses} bg-blue-50/95 border-blue-500 text-blue-800`;
    }
  }, []);

  // Memoized toast accessibility label
  const getToastAriaLabel = useCallback((toast) => {
    const typeLabel = toast.type === 'error' ? 'Error' : 
                     toast.type === 'warning' ? 'Warning' : 
                     toast.type === 'success' ? 'Success' : 'Information';
    return `${typeLabel} notification: ${toast.title ? `${toast.title}. ` : ''}${toast.message}${toast.clickAction ? '. Click to navigate.' : ''}`;
  }, []);

  // Expose addToast function globally
  useEffect(() => {
    window.addToast = addToast;
    return () => {
      delete window.addToast;
    };
  }, [addToast]);

  // Cleanup old toasts with error handling
  useEffect(() => {
    const cleanup = setInterval(() => {
      try {
        const now = Date.now();
        setToasts(prev => {
          try {
            return prev.filter(toast => 
              now - toast.timestamp < 30000 // Remove toasts older than 30 seconds
            );
          } catch (error) {
            console.error('Error filtering old toasts:', error);
            // Fallback: clear all toasts
            return [];
          }
        });
      } catch (error) {
        console.error('Error in toast cleanup:', error);
      }
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  // Offline state handling
  useEffect(() => {
    const handleOnline = () => {
      addToast({
        type: 'success',
        message: 'Connection restored',
        duration: 3000
      });
    };

    const handleOffline = () => {
      addToast({
        type: 'warning',
        message: 'You are offline. Some features may not work.',
        duration: 8000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addToast]);

  // Render toast container with error handling
  const renderToasts = () => {
    try {
      if (toasts.length === 0) return null;

      return (
        <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full pointer-events-none">
          {toasts.map((toast, index) => {
            try {
              return (
                <div
                  key={toast.id}
                  data-toast-id={toast.id}
                  className={`${getToastStyling(toast.type)} pointer-events-auto cursor-pointer hover:shadow-xl hover:scale-[1.02] animate-in slide-in-from-right-full duration-300`}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    zIndex: 9999 - index
                  }}
                  onClick={() => handleToastClick(toast)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getToastIcon(toast.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {toast.title && (
                      <h4 className="font-semibold text-sm mb-1 leading-tight">
                        {toast.title}
                      </h4>
                    )}
                    <p className="text-sm leading-tight break-words">
                      {toast.message || 'Notification'}
                    </p>
                    {toast.action && (
                      <button className="text-xs font-medium mt-2 underline hover:no-underline">
                        {toast.action}
                      </button>
                    )}
                  </div>

                  {/* Dismiss button */}
                  {toast.dismissible && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeToast(toast.id);
                      }}
                      className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors"
                      aria-label="Dismiss notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Progress bar for auto-dismiss */}
                  {toast.duration > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 rounded-b-lg overflow-hidden">
                      <div 
                        className="h-full bg-current opacity-30 animate-pulse"
                        style={{
                          animation: `shrink ${toast.duration}ms linear forwards`
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            } catch (toastError) {
              console.error('Error rendering toast:', toastError, toast);
              // Return fallback toast
              return (
                <div
                  key={toast.id || index}
                  className="flex items-center gap-3 p-4 rounded-lg shadow-lg border-l-4 bg-red-50/95 border-red-500 text-red-800 pointer-events-auto"
                >
                  <span>⚠️</span>
                  <span className="text-sm">Notification error</span>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="ml-auto p-1 rounded-full hover:bg-black/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            }
          })}
        </div>
      );
    } catch (error) {
      console.error('Error rendering toast container:', error);
      return null;
    }
  };

  // Mobile-responsive positioning
  const renderMobileToasts = () => {
    if (toasts.length === 0) return null;

    return (
      <div className="fixed top-16 left-2 right-2 z-[9999] space-y-2 pointer-events-none sm:hidden">
        {toasts.map((toast, index) => (
          <div
            key={toast.id}
            data-toast-id={toast.id}
            className={`${getToastStyling(toast.type)} pointer-events-auto cursor-pointer hover:shadow-xl animate-in slide-in-from-top duration-300`}
            style={{
              animationDelay: `${index * 100}ms`,
              zIndex: 9999 - index
            }}
            onClick={() => handleToastClick(toast)}
          >
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getToastIcon(toast.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="font-semibold text-sm mb-1 leading-tight">
                  {toast.title}
                </h4>
              )}
              <p className="text-sm leading-tight break-words">
                {toast.message}
              </p>
            </div>

            {/* Dismiss button */}
            {toast.dismissible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeToast(toast.id);
                }}
                className="flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Desktop toasts */}
      <div className="hidden sm:block">
        {createPortal(renderToasts(), document.body)}
      </div>
      
      {/* Mobile toasts */}
      {createPortal(renderMobileToasts(), document.body)}
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes slide-in-from-right-full {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-in-from-top {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

// Toast utility functions
export const showToast = (toast) => {
  if (window.addToast) {
    return window.addToast(toast);
  }
  console.warn('ToastManager not initialized');
};

export const showSuccessToast = (message, options = {}) => {
  return showToast({
    type: 'success',
    message,
    ...options
  });
};

export const showWarningToast = (message, options = {}) => {
  return showToast({
    type: 'warning',
    message,
    ...options
  });
};

export const showErrorToast = (message, options = {}) => {
  return showToast({
    type: 'error',
    message,
    ...options
  });
};

export const showInfoToast = (message, options = {}) => {
  return showToast({
    type: 'info',
    message,
    ...options
  });
};

export default ToastManager;