import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { resetPassword } from '../services/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setIsResetting(true);
    try {
      const response = await resetPassword({ email, reset_code: resetCode, new_password: password });
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your new password below.
          </p>
        </div>
        <form onSubmit={handleReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isResetting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resetCode">Reset Code</Label>
            <Input
              id="resetCode"
              name="resetCode"
              type="text"
              required
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Enter the code sent to your email"
              disabled={isResetting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={isResetting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              disabled={isResetting}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isResetting}>
            {isResetting ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 