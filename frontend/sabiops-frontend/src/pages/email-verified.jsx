import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';

const EmailVerified = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const verified = params.get('verified');
    console.log('Email verification useEffect', { token, email, verified });
    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      console.log('Already authenticated, navigating to dashboard');
      navigate('/dashboard');
      return;
    }

    // If verified=true is present, always show success and redirect to login (absolute priority)
    if (verified === 'true') {
      setStatus('verified-true');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // If token and email are present, always try to auto-login
    if (token && email) {
      setStatus('verifying');
      const confirmRegistration = async () => {
        try {
          const response = await authService.registerConfirmed({ token, email });
          if (response.success && response.data && response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard');
              window.location.href = '/dashboard';
            }, 1000);
          } else if (response && (response.message || '').toLowerCase().includes('already confirmed')) {
            setStatus('already');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            setStatus('error');
            setError(
              (response && (response.message || 'Verification failed. Please try again.'))
            );
          }
        } catch (err) {
          setStatus('error');
          setError(
            (err && (err.message || JSON.stringify(err))) || 'Verification failed. Please try again.'
          );
          console.log('Verification failed (exception):', err);
        }
      };
      confirmRegistration();
      return;
    }

    // No valid parameters
    setStatus('error');
    setError('Invalid or missing verification link.');
    console.log('Verification failed: Invalid or missing verification link.');
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {status === 'success' ? 'Email Verified!' : status === 'already' ? 'Email Already Verified' : status === 'verified-true' ? 'Email Verified!' : status === 'error' ? 'Verification Error' : 'Verifying...'}
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
      {status === 'already' && (
        <p className="text-primary font-semibold mb-6 text-center max-w-md">
          Your email is already verified. Redirecting to login...
        </p>
      )}
      {status === 'verified-true' && (
        <p className="text-primary font-semibold mb-6 text-center max-w-md">
          Email verified! You can now log in.<br />Redirecting to login...
        </p>
      )}
      {status === 'error' && (
        <div className="text-center max-w-md">
          <p className="text-red-500 font-semibold mb-4">
            {typeof error === 'string' && error.startsWith('{"error"') ? 'Verification failed. Please try again or contact support.' : error}
          </p>
          <p className="text-muted-foreground text-sm mb-4">
            If you clicked a verification link from your email, please try clicking it again or contact support.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      )}
    </div>
  );
};

export default EmailVerified; 