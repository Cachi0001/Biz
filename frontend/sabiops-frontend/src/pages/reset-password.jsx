import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) setToken(tokenParam);
  }, []);

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }
    if (!token) {
      toast.error('Invalid or missing reset link.');
      return;
    }
    setIsResetting(true);
    try {
      const response = await resetPassword({ token, password });
      if (response.success) {
        toast.success('Password reset successful! You can now log in.');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        toast.error(response.message || 'Failed to reset password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password.');
    }
    setIsResetting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2 py-8 overflow-x-hidden">
      <div className="w-full max-w-xs sm:max-w-md bg-white rounded-2xl shadow-lg p-4 sm:p-8 flex flex-col items-center">
        {/* Logo inside card */}
        <div className="flex flex-col items-center mb-4">
          <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-14 h-14 rounded-lg shadow mb-2" />
          <h2 className="text-base sm:text-2xl font-bold text-foreground mb-1 text-center">Reset Your Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-2">Enter your new password below.</p>
        </div>
        <form onSubmit={handleReset} className="w-full space-y-4" autoComplete="off" noValidate>
          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="flex items-center gap-2 bg-input border rounded-md px-3 h-12 mt-1">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                inputMode="text"
                spellCheck={false}
                className="flex-1 border-none bg-transparent shadow-none h-12 focus:ring-0 focus:border-none"
              />
              <button
                type="button"
                tabIndex={-1}
                className="h-12 flex items-center px-2 text-gray-500 hover:text-primary focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="flex items-center gap-2 bg-input border rounded-md px-3 h-12 mt-1">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                inputMode="text"
                spellCheck={false}
                className="flex-1 border-none bg-transparent shadow-none h-12 focus:ring-0 focus:border-none"
              />
              <button
                type="button"
                tabIndex={-1}
                className="h-12 flex items-center px-2 text-gray-500 hover:text-primary focus:outline-none"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={isResetting}>
            {isResetting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>
        <div className="w-full flex flex-col items-center mt-4">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 