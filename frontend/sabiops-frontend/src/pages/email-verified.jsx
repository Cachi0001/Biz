import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EmailVerified = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    // Parse access token from URL fragment
    const hash = window.location.hash.substr(1);
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');

    if (access_token) {
      localStorage.setItem('token', access_token);
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      setStatus('error');
      setError('Verification failed. Please try logging in.');
    }
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