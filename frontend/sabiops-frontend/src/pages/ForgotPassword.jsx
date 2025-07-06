import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request reset, 2: Reset password
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      toast.success('A password reset code has been sent to your email.');
      setStep(2); // Move to reset password step
    } catch (err) {
      const errorMessage = err.message || 'Failed to send reset code. Please try again.';
      toast.error(errorMessage);
    }
    setIsLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      await authService.resetPassword(email, resetCode, newPassword);
      toast.success('Your password has been reset successfully. You can now log in.');
      setStep(3); // Indicate completion
    } catch (err) {
      const errorMessage = err.message || 'Failed to reset password. Please check the code and try again.';
      toast.error(errorMessage);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 1 && 'Enter your email to receive a password reset code.'}
            {step === 2 && 'Enter the reset code and your new password.'}
            {step === 3 && 'Password reset successful!'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{step === 1 ? 'Request Password Reset' : 'Reset Your Password'}</CardTitle>
            <CardDescription>
              {step === 1 && 'We will send a code to your email to reset your password.'}
              {step === 2 && 'Check your email for the reset code. It might be in your spam folder.'}
              {step === 3 && 'You can now log in with your new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <form onSubmit={handleRequestReset} className="space-y-4">
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
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code...</>
                  ) : (
                    'Send Reset Code'
                  )}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetCode">Reset Code</Label>
                  <Input
                    id="resetCode"
                    name="resetCode"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter the reset code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    type="password"
                    required
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirm your new password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password...</>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}

            {step === 3 && (
              <div className="text-center">
                <p className="text-lg font-medium text-green-600">Password has been reset successfully!</p>
                <Link to="/login" className="mt-4 inline-block text-primary hover:underline">
                  Go to Login
                </Link>
              </div>
            )}

            {step !== 3 && (
              <div className="mt-6 text-center">
                <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;


