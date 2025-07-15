import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ToastProvider from './components/ToastProvider';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword'; // Import ForgotPassword
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Dashboard from './pages/Dashboard';
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
  console.log('[APP] NotificationPrompt render. Permission:', permission);
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
  console.log('[APP] App component render');
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
        {console.log('[APP] Inside AuthProvider')}
        <Router>
            {console.log('[APP] Inside Router')}
            <NotificationPrompt />
          <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing /> && (console.log('[APP] Route: / (Landing)'), <Landing />)} />
            <Route path="/login" element={<Login /> && (console.log('[APP] Route: /login (Login)'), <Login />)} />
            <Route path="/register" element={<Register /> && (console.log('[APP] Route: /register (Register)'), <Register />)} />
            <Route path="/forgot-password" element={<ForgotPassword /> && (console.log('[APP] Route: /forgot-password (ForgotPassword)'), <ForgotPassword />)} />
            <Route path="/reset-password" element={<ResetPassword /> && (console.log('[APP] Route: /reset-password (ResetPassword)'), <ResetPassword />)} />
            <Route path="/terms" element={<TermsOfService /> && (console.log('[APP] Route: /terms (TermsOfService)'), <TermsOfService />)} />
            <Route path="/privacy" element={<PrivacyPolicy /> && (console.log('[APP] Route: /privacy (PrivacyPolicy)'), <PrivacyPolicy />)} />
            <Route path="/email-verified" element={<EmailVerified /> && (console.log('[APP] Route: /email-verified (EmailVerified)'), <EmailVerified />)} />
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute>{console.log('[APP] Route: /customers (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /customers'), <Customers />}</Layout>}</ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute>{console.log('[APP] Route: /products (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /products'), <Products />}</Layout>}</ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute>{console.log('[APP] Route: /sales (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /sales'), <Sales />}</Layout>}</ProtectedRoute>} />
            <Route path="/sales/report" element={<ProtectedRoute>{console.log('[APP] Route: /sales/report (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /sales/report'), <SalesReport />}</Layout>}</ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute>{console.log('[APP] Route: /team (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /team'), <Team />}</Layout>}</ProtectedRoute>} />
            <Route path="/invoices" element={<ProtectedRoute>{console.log('[APP] Route: /invoices (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /invoices'), <Invoices />}</Layout>}</ProtectedRoute>} />
            <Route path="/invoices/new" element={<ProtectedRoute>{console.log('[APP] Route: /invoices/new (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /invoices/new'), <Invoices />}</Layout>}</ProtectedRoute>} />
            <Route path="/payments" element={<ProtectedRoute>{console.log('[APP] Route: /payments (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /payments'), <Payments />}</Layout>}</ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute>{console.log('[APP] Route: /settings (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /settings'), <Settings />}</Layout>}</ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute>{console.log('[APP] Route: /expenses (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /expenses'), <Expenses />}</Layout>}</ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute>{console.log('[APP] Route: /transactions (ProtectedRoute)'), <Layout>{console.log('[APP] Layout for /transactions'), <Transactions />}</Layout>}</ProtectedRoute>} />
            {/* 404 fallback */}
            <Route path="*" element={<div className="min-h-screen flex items-center justify-center"> <div className="text-center"><h1 className="text-4xl font-bold">404</h1><p className="text-muted-foreground">Page not found</p></div>}</div>} />
          </Routes>
        </div>
      </Router>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;


