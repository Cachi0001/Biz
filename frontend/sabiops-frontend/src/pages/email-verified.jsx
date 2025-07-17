import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { toast } from 'react-hot-toast';

const EmailVerified = () => {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuth();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const autoLogin = params.get('auto_login');
    const userData = params.get('user');
    const token = params.get('token');
    const email = params.get('email');
    const verified = params.get('verified');
    const reason = params.get('reason');

    console.log('Email verification params:', { success, autoLogin, token, email, verified, reason });

    // If user is already authenticated, redirect to dashboard
    if (isAuthenticated) {
      console.log('Already authenticated, navigating to dashboard');
      navigate('/dashboard');
      return;
    }

    // Handle verification failure cases - only show error if email is NOT verified
    if (success === 'false') {
      setStatus('error');
      const errorMessages = {
        'missing_params': 'Invalid verification link. Please try clicking the link from your email again.',
        'invalid_token': 'This verification link is invalid or has already been used.',
        'user_not_found': 'User account not found. Please register again.',
        'email_mismatch': 'Email verification failed. Please try again.',
        'expired_token': 'This verification link has expired. Please request a new one.',
        'user_update_failed': 'Email verification failed. Please try again or contact support.'
      };
      setError(errorMessages[reason] || 'Email verification failed. Please try again.');
      return;
    }

    // Handle successful verification with automatic login
    if (success === 'true' && autoLogin === 'true' && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        console.log('Auto-login with user data:', user);
        
        // Create a temporary JWT token by calling the backend
        const performAutoLogin = async () => {
          try {
            // Use the backend's register confirmation endpoint to get a proper JWT
            const response = await authService.registerConfirmed({ 
              token: 'verified', // Special token to indicate already verified
              email: user.email 
            });
            
            if (response.success && response.data && response.data.access_token) {
              localStorage.setItem('token', response.data.access_token);
              localStorage.setItem('user', JSON.stringify(response.data.user));
              setStatus('success');
              toast.success('Email verified! Welcome to SabiOps!');
              
              // Update auth context
              await checkAuth();
              
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else {
              // Fallback: redirect to login with success message
              setStatus('verified-login');
              toast.success('Email verified! Please log in to continue.');
              setTimeout(() => {
                navigate('/login');
              }, 2000);
            }
          } catch (error) {
            console.error('Auto-login failed:', error);
            // Fallback: redirect to login with success message
            setStatus('verified-login');
            toast.success('Email verified! Please log in to continue.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        };
        
        performAutoLogin();
        return;
      } catch (parseError) {
        console.error('Failed to parse user data:', parseError);
        // Fallback to manual login
        setStatus('verified-login');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
    }

    // Handle legacy verification flow (verified=true)
    if (verified === 'true') {
      setStatus('verified-login');
      toast.success('Email verified! Please log in to continue.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      return;
    }

    // Handle token-based verification (legacy flow)
    if (token && email) {
      setStatus('verifying');
      const confirmRegistration = async () => {
        try {
          const response = await authService.registerConfirmed({ token, email });
          if (response.success && response.data && response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setStatus('success');
            toast.success('Email verified! Welcome to SabiOps!');
            
            // Update auth context
            await checkAuth();
            
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else if (response && (response.message || '').toLowerCase().includes('already confirmed')) {
            setStatus('verified-login');
            toast.success('Email already verified! Please log in to continue.');
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            setStatus('error');
            setError(response?.message || 'Verification failed. Please try again.');
          }
        } catch (err) {
          setStatus('error');
          setError(err?.message || 'Verification failed. Please try again.');
          console.error('Verification failed:', err);
        }
      };
      confirmRegistration();
      return;
    }

    // No valid parameters
    setStatus('error');
    setError('Invalid or missing verification link. Please check your email and click the verification link.');
  }, [navigate, isAuthenticated, checkAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {status === 'success' ? 'Welcome to SabiOps!' : 
         status === 'verified-login' ? 'Email Verified!' : 
         status === 'error' ? 'Verification Error' : 
         'Verifying Your Email...'}
      </h2>
      {status === 'verifying' && (
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-6">
            Finalizing your registration. Please wait...
          </p>
        </div>
      )}
      {status === 'success' && (
        <div className="text-center max-w-md">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <p className="text-primary font-semibold mb-6">
            Your email has been verified! Taking you to your dashboard...
          </p>
        </div>
      )}
      {status === 'verified-login' && (
        <div className="text-center max-w-md">
          <div className="text-green-500 text-4xl mb-4">✅</div>
          <p className="text-primary font-semibold mb-6">
            Email verified successfully! Please log in to access your account.
          </p>
        </div>
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