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
    <NotificationProvider>
    <ToastProvider>
      <AuthProvider>
        <Router>
            <NotificationPrompt />
          <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} /> {/* Add ForgotPassword route */}
              <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/email-verified" element={<EmailVerified />} />
            
            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Customers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Products />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Sales />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/sales/report"
              element={
                <ProtectedRoute>
                  <Layout>
                    <SalesReport />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/team"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Team />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Invoices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoices/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Invoices />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Payments />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Expenses />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Transactions />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* 404 fallback */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold">404</h1>
                    <p className="text-muted-foreground">Page not found</p>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
    </ToastProvider>
    </NotificationProvider>
  );
}

export default App;


