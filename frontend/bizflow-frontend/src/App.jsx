import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Team from './pages/Team';
import Customers from './pages/Customers';

// Placeholder components for other pages
const Payments = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Payments</h1>
    <p className="text-muted-foreground">Payment management coming soon...</p>
  </div>
);

const Settings = () => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold">Settings</h1>
    <p className="text-muted-foreground">Settings page coming soon...</p>
  </div>
);

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
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
  );
}

export default App;

