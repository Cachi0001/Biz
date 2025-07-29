import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { PlanLimitProvider } from './contexts/PlanLimitContext';
import ProtectedRoute from './components/ProtectedRoute';

// Import your pages here
// import Landing from './pages/Landing';
// import Login from './pages/Login';
// etc.

function App() {
  return (
    <AuthProvider>
      <PlanLimitProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Add your routes here */}
              {/* Example:
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              */}
            </Routes>
          </div>
        </Router>
      </PlanLimitProvider>
    </AuthProvider>
  );
}

export default App;