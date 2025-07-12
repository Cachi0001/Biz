import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const EmailVerified = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      setStatus('error');
      setError('Invalid or missing verification link.');
      return;
    }
    // Call backend to confirm registration
    const confirmRegistration = async () => {
      try {
        const response = await authService.registerConfirmed({ token, email });
        if (response.success && response.data && response.data.access_token) {
          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setStatus('success');
          setTimeout(() => navigate('/dashboard'), 1000);
        } else {
          setStatus('error');
          setError(response.message || 'Verification failed. Please try again.');
        }
      } catch (err) {
        setStatus('error');
        setError(err.message || 'Verification failed. Please try again.');
      }
    };
    confirmRegistration();
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {status === 'success' ? 'Email Verified!' : 'Verifying...'}
      </h2>
      {status === 'verifying' && (
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Finalizing your registration. Please wait...
        </p>
      )}
      {status === 'success' && (
        <p className="text-primary font-semibold mb-6 text-center max-w-md">
          Your email has been verified! Redirecting to your dashboard...
        </p>
      )}
      {status === 'error' && (
        <p className="text-red-500 font-semibold mb-6 text-center max-w-md">
          {error}
        </p>
      )}
    </div>
  );
};

export default EmailVerified; 