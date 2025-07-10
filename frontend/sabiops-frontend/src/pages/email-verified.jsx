import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const EmailVerified = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [error, setError] = useState('');

  // Extract email from query param
  const params = new URLSearchParams(location.search);
  const email = params.get('email');

  useEffect(() => {
    const finalizeRegistration = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || '/api'}/register/confirmed`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          }
        );
        const data = await response.json();
        if (data.success) {
          setStatus('success');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setStatus('error');
          setError(data.message || 'Could not finalize registration.');
        }
      } catch (err) {
        setStatus('error');
        setError('Network error. Please try again.');
      }
    };
    if (email) finalizeRegistration();
    else {
      setStatus('error');
      setError('Missing email.');
    }
  }, [email, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg" />
      <h2 className="text-2xl font-bold text-foreground mb-2">{status === 'success' ? 'Registration Complete!' : 'Verifying...'}</h2>
      {status === 'verifying' && (
        <>
          <Loader2 className="animate-spin h-8 w-8 text-primary mb-4" />
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Finalizing your registration. Please wait...
          </p>
        </>
      )}
      {status === 'success' && (
        <p className="text-primary font-semibold mb-6 text-center max-w-md">
          Your email has been verified and your account is ready! Redirecting to dashboard...
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