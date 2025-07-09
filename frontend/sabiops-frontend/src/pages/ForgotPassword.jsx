import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request, 2: Verify, 3: Reset, 4: Success
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [cooldown, setCooldown] = useState(0);
  const cooldownSeconds = 60;

  useEffect(() => {
    // If user is logged in and not Owner, block access
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.role !== 'Owner') {
        setIsOwner(false);
      }
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsResending(true);
    try {
      await authService.requestPasswordReset(email);
      toast.success('A password reset code has been sent to you via this email ,onyemechicaleb4@gmail.com please check your spam folder');
      setStep(2);
      setCooldown(cooldownSeconds);
    } catch (err) {
      // Backend returns proper error messages
      let errorMessage = err.message || 'Failed to send reset code. Please try again.';
      if (errorMessage.includes('No account')) {
        toast.error('No account with this email.');
      } else if (errorMessage.includes('wait') && errorMessage.includes('seconds')) {
        // Try to extract seconds from backend message
        const match = errorMessage.match(/(\d+) seconds/);
        const seconds = match ? parseInt(match[1], 10) : cooldownSeconds;
        setCooldown(seconds);
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
    setIsLoading(false);
  };


  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    try {
      await authService.verifyResetCode(email, resetCode);
      toast.success('Code verified. You can now set a new password.');
      setStep(3);
    } catch (err) {
      const errorMessage = err.message || 'Invalid or expired code.';
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
      setStep(4);
    } catch (err) {
      const errorMessage = err.message || 'Failed to reset password. Please check the code and try again.';
      toast.error(errorMessage);
    }
    setIsLoading(false);
  };

  if (!isOwner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only Owners can reset their password. Please contact your account Owner for assistance.
          </p>
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

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
            {step === 2 && 'Enter the reset code sent to your email.'}
            {step === 3 && 'Enter your new password.'}
            {step === 4 && 'Password reset successful!'}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Request Password Reset'}
              {step === 2 && 'Verify Reset Code'}
              {step === 3 && 'Reset Your Password'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'We will send a code to your email to reset your password.'}
              {step === 2 && 'Check your email for the reset code. It might be in your spam folder.'}
              {step === 3 && 'Enter your new password below.'}
              {step === 4 && 'You can now log in with your new password.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(step === 1 || step === 2) && (
              <>
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
                        disabled={isVerifying || cooldown > 0}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isVerifying || cooldown > 0}>
                      {isVerifying ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code...</>
                      ) : (
                        cooldown > 0 ? `Send Reset Code (${cooldown}s)` : 'Send Reset Code'
                      )}
                    </Button>
                  </form>
                )}
                {step === 2 && (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
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
                    <Button type="submit" className="w-full" disabled={isVerifying}>
                      {isVerifying ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying Code...</>
                      ) : (
                        'Verify Code'
                      )}
                    </Button>
                    <Button
                      type="button"
                      className="w-full mt-2"
                      variant="outline"
                      disabled={cooldown > 0 || isResending}
                      onClick={handleRequestReset}
                    >
                      {isResending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resending...</>
                      ) : (
                        cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'
                      )}
                    </Button>
                    {cooldown > 0 && (
                      <div className="text-center text-sm text-muted-foreground mt-2">
                        Please wait <span className="font-semibold">{cooldown} second{cooldown !== 1 ? 's' : ''}</span> before requesting another reset code.
                      </div>
                    )}
                  </form>
                )}
              </>
            )}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
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
                <Button type="submit" className="w-full" disabled={isVerifying}>
                  {isVerifying ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting Password...</>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            )}
            {step === 4 && (
              <div className="text-center">
                <p className="text-lg font-medium text-green-600">Password has been reset successfully!</p>
                <Link to="/login" className="mt-4 inline-block text-primary hover:underline">
                  Go to Login
                </Link>
              </div>
            )}
            {step !== 4 && (
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


