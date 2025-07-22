/**
 * Toast Provider Component for SabiOps SME Nigeria
 * Provides toast notifications throughout the app using ToastService
 * Features: React context, useToast hook, brand colors, queueing
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toastService, type ToastData } from '../services/ToastService';

// Toast Context
interface ToastContextType {
  toasts: ToastData[];
  success: (message: string, options?: any) => string;
  error: (message: string, options?: any) => string;
  warning: (message: string, options?: any) => string;
  info: (message: string, options?: any) => string;
  loading: (message: string, options?: any) => string;
  remove: (id: string) => void;
  clear: () => void;
  update: (id: string, updates: any) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// Custom hook to use toast context
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Safe useNavigate hook
function useSafeNavigate() {
  try {
    return useNavigate();
  } catch {
    // Return a no-op function if not in a Router context
    return () => {};
  }
}

// Toast item component
const ToastItem: React.FC<{ toast: ToastData; onRemove: (id: string) => void }> = ({ 
  toast, 
  onRemove 
}) => {
  const navigate = useSafeNavigate();
  const brandColors = toastService.getBrandColors();

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-white" aria-hidden="true" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-white" aria-hidden="true" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-white" aria-hidden="true" />;
      case 'info':
      default:
        if (toast.duration === 0) {
          return <Loader className="h-5 w-5 text-white animate-spin" aria-hidden="true" />;
        }
        return <Info className="h-5 w-5 text-white" aria-hidden="true" />;
    }
  };

  const getToastStyles = () => {
    const baseStyles = "flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform hover:shadow-xl hover:scale-[1.02] max-w-md w-full pointer-events-auto";
    const colors = brandColors[toast.type];
    
    return {
      className: `${baseStyles} text-white`,
      style: {
        backgroundColor: toast.type === 'success' ? '#28a745' : colors.primary,
        borderColor: toast.type === 'success' ? '#1e7e34' : colors.secondary,
        fontFamily: 'Inter, system-ui, sans-serif', // Brand typography
      }
    };
  };

  const handleClick = () => {
    if (toast.clickAction?.url) {
      try {
        navigate(toast.clickAction.url, { 
          state: toast.clickAction.params || {} 
        });
        onRemove(toast.id);
      } catch (error) {
        console.error('Navigation error:', error);
      }
    }
  };

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (toast.action?.callback) {
      try {
        toast.action.callback();
      } catch (error) {
        console.error('Action callback error:', error);
      }
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={styles.className}
      style={styles.style}
      onClick={toast.clickAction ? handleClick : undefined}
      role="alert"
      aria-live="polite"
      aria-describedby={`toast-${toast.id}-message`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <h4 className="font-semibold text-sm mb-1 leading-tight text-white">
            {toast.title}
          </h4>
        )}
        <p id={`toast-${toast.id}-message`} className="text-sm leading-tight break-words text-white opacity-95">
          {toast.message}
        </p>
        {toast.action && (
          <button 
            onClick={handleActionClick}
            className="text-xs font-medium mt-2 underline hover:no-underline text-white opacity-90 hover:opacity-100 transition-opacity"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Dismiss button */}
      {toast.dismissible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(toast.id);
          }}
          className="flex-shrink-0 p-1 rounded-full hover:bg-black/20 transition-colors text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Progress bar for auto-dismiss */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-white opacity-40"
            style={{
              animation: `shrinkProgress ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Toast container component
const ToastContainer: React.FC<{ toasts: ToastData[]; onRemove: (id: string) => void }> = ({ 
  toasts, 
  onRemove 
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none sm:max-w-md">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-right-full duration-300 ease-out"
          style={{
            animationDelay: `${index * 50}ms`,
            zIndex: 9999 - index
          }}
        >
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// Mobile toast container
const MobileToastContainer: React.FC<{ toasts: ToastData[]; onRemove: (id: string) => void }> = ({ 
  toasts, 
  onRemove 
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-[9999] space-y-2 pointer-events-none sm:hidden">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="animate-in slide-in-from-top duration-300 ease-out"
          style={{
            animationDelay: `${index * 50}ms`,
            zIndex: 9999 - index
          }}
        >
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
};

// Main ToastProvider component
const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    // Subscribe to toast service updates
    const unsubscribe = toastService.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });

    // Initialize with current toasts
    setToasts(toastService.getToasts());

    return unsubscribe;
  }, []);

  const contextValue: ToastContextType = {
    toasts,
    success: (message, options) => toastService.success(message, options),
    error: (message, options) => toastService.error(message, options),
    warning: (message, options) => toastService.warning(message, options),
    info: (message, options) => toastService.info(message, options),
    loading: (message, options) => toastService.loading(message, options),
    remove: (id) => toastService.removeToast(id),
    clear: () => toastService.clearAll(),
    update: (id, updates) => toastService.updateToast(id, updates),
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Render toast containers using portals */}
      {createPortal(
        <>
          {/* Desktop toasts */}
          <div className="hidden sm:block">
            <ToastContainer toasts={toasts} onRemove={toastService.removeToast.bind(toastService)} />
          </div>
          
          {/* Mobile toasts */}
          <div className="sm:hidden">
            <MobileToastContainer toasts={toasts} onRemove={toastService.removeToast.bind(toastService)} />
          </div>
        </>,
        document.body
      )}
      
      {/* CSS for animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shrinkProgress {
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
        `
      }} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
