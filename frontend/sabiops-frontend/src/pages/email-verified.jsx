import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const EmailVerified = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ password: '', confirmPassword: '', full_name: '', phone: '', business_name: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    // If token or email missing, show error
    if (!token || !email) {
      setStatus('error');
      setError('Invalid or missing verification link.');
      return;
    }
    // Try to get registration data from localStorage (if available)
    const regData = JSON.parse(localStorage.getItem('pending_registration') || '{}');
    // If we have all required fields, auto-submit
    if (regData && regData.email === email && regData.password && regData.full_name && regData.phone) {
      handleConfirm({
        ...regData,
        token,
        email,
      });
    } else {
      // Prompt user for missing fields (password, full_name, phone)
      setShowForm(true);
      setStatus('verifying');
    }
    // eslint-disable-next-line
  }, []);

  const handleConfirm = async (data) => {
    setStatus('verifying');
    setError('');
    try {
      if (!data.password || !data.full_name || !data.phone) {
        setError('Please provide all required fields.');
        setStatus('error');
        return;
      }
      if (data.password !== data.confirmPassword) {
        setError('Passwords do not match.');
        setStatus('error');
        return;
      }
      const payload = {
        email: data.email,
        token: data.token,
        phone: data.phone,
        password: data.password,
        full_name: data.full_name,
        business_name: data.business_name || '',
      };
      const response = await authService.registerConfirmed(payload);
      if (response.success) {
        setStatus('success');
        // Clean up pending registration
        localStorage.removeItem('pending_registration');
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    handleConfirm({ ...form, token, email });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg" />
      <h2 className="text-2xl font-bold text-foreground mb-2">
        {status === 'success' ? 'Email Verified!' : 'Verifying...'}
      </h2>
      {status === 'verifying' && !showForm && (
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          Finalizing your registration. Please wait...
        </p>
      )}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="w-full max-w-sm space-y-4 mt-4">
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={form.phone}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="text"
            name="business_name"
            placeholder="Business Name (optional)"
            value={form.business_name}
            onChange={handleInputChange}
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded font-semibold"
            disabled={status === 'verifying'}
          >
            Confirm Registration
          </button>
        </form>
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