import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ToastProvider';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Card, CardContent } from './components/ui/card';
import ScriptErrorIsolation from './utils/scriptErrorIsolation';
import PageReloadPrevention from './utils/pageReloadPrevention';
import ErrorRecoverySystem from './utils/errorRecoverySystem';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Sales from './pages/Sales';
import SalesReport from './pages/SalesReport';
import Team from './pages/Team';
import Customers from './pages/Customers';
import Settings from './pages/Settings';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Transactions from './pages/Transactions';
import EmailVerified from './pages/email-verified';
import ResetPassword from './pages/reset-password';
import SubscriptionUpgrade from './pages/SubscriptionUpgrade';

import './App.css';
import './styles/mobile.css';

function NotificationPrompt() {
  const { permission, requestPermission } = useNotification();
  
  if (permission === 'default') {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs sm:max-w-md px-2">
        <Card className="shadow-lg border-green-300 bg-green-50">
          <CardContent className="flex flex-col items-center gap-3 p-4 sm:flex-row sm:justify-between sm:gap-4">
            <span className="text-green-900 text-center text-sm font-medium">Enable push notifications for important business alerts!</span>
            <button
              onClick={requestPermission}
              className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold shadow hover:bg-green-700 transition"
            >
              Enable
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return null;
}

function App() {
  // Initialize error handling and stability systems on app startup
  useEffect(() => {
    ScriptErrorIsolation.init();
    PageReloadPrevention.init();
    ErrorRecoverySystem.init();
    console.log('[App] Comprehensive error handling and stability systems initialized');
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <NotificationPrompt />
              <div className="min-h-screen bg-background">
                <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/email-verified" element={<EmailVerified />} />
                
                {/* Protected routes - All using modern layout */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
                <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
                <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
                <Route path="/sales/report" element={<ProtectedRoute><SalesReport /></ProtectedRoute>} />
                <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
                <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="/invoices/new" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
                <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/subscription-upgrade" element={<ProtectedRoute><SubscriptionUpgrade /></ProtectedRoute>} />
                <Route path="/pricing" element={<ProtectedRoute><SubscriptionUpgrade /></ProtectedRoute>} />
                
                {/* 404 fallback */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold">404</h1>
                      <p className="text-muted-foreground">Page not found</p>
                    </div>
                  </div>
                } />
              </Routes>
            </div>
          </Router>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;


