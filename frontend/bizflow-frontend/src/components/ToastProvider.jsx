/**
 * Toast Provider Component for Bizflow SME Nigeria
 * Provides toast notifications throughout the app
 */

import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = ({ children }) => {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            fontSize: '14px',
            fontWeight: '500',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e5e7eb',
            maxWidth: '400px',
          },
          
          // Success toasts
          success: {
            duration: 4000,
            style: {
              background: '#10B981',
              color: '#fff',
              border: '1px solid #059669',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#10B981',
            },
          },
          
          // Error toasts
          error: {
            duration: 6000,
            style: {
              background: '#EF4444',
              color: '#fff',
              border: '1px solid #DC2626',
            },
            iconTheme: {
              primary: '#fff',
              secondary: '#EF4444',
            },
          },
          
          // Loading toasts
          loading: {
            duration: Infinity,
            style: {
              background: '#3B82F6',
              color: '#fff',
              border: '1px solid #2563EB',
            },
          },
        }}
      />
    </>
  );
};

export default ToastProvider;