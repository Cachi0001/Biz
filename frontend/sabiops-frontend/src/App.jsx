import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ToastProvider';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';

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

import './App.css';

function NotificationPrompt() {
  const { permission, requestPermission } = useNotification();
  
  if (permission === 'default') {
    return (
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-300 rounded-lg px-4 py-2 shadow-lg z-50 flex items-center gap-2">
        <span className="text-green-800">Enable push notifications for important business alerts!</span>
        <button onClick={requestPermission} className="ml-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Enable</button>
      </div>
    );
  }
  return null;
}

function App() {
  return (
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
  );
}

export default App;


