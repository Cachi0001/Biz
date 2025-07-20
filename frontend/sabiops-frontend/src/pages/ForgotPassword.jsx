import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { requestPasswordReset } from '../services/api';
import BackButton from '@/components/ui/BackButton';

const MAX_RESENDS_PER_DAY = 5;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [step, setStep] = useState(1); // 1: Request, 2: Sent
  const [resendTimer, setResendTimer] = useState(60);
  const [resendCount, setResendCount] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (step === 2 && resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer, step]);

  const handleRequestReset = async (e, isResend = false) => {
    if (e) e.preventDefault();
    if (isResend && resendCount >= MAX_RESENDS_PER_DAY) {
      window.toast && window.toast.error('You have reached the maximum number of reset requests for today.');
      return;
    }
    setIsRequesting(true);
    try {
      const response = await requestPasswordReset({ email });
      if (response.success) {
      setStep(2);
        if (isResend) {
          setResendCount(count => count + 1);
          setResendTimer(60);
          window.toast && window.toast.success('A password reset link has been resent to your email.');
        } else {
          setResendCount(1);
          setResendTimer(60);
          window.toast && window.toast.success('A password reset link has been sent to your email.');
        }
      } else {
        window.toast && window.toast.error(response.message || 'Failed to send reset code.');
      }
    } catch (err) {
      window.toast && window.toast.error(err.response?.data?.message || 'Failed to send reset code.');
    }
    setIsRequesting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2 py-8 overflow-x-hidden relative">
      <BackButton to="/login" variant="floating" />
      <div className="w-full max-w-xs sm:max-w-md bg-white rounded-2xl shadow-lg p-4 sm:p-8 flex flex-col items-center">
        {/* Logo inside card */}
        <div className="flex flex-col items-center mb-4">
          <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-14 h-14 rounded-lg shadow mb-2" />
          <h2 className="text-2xl font-bold text-foreground mb-1 text-center">Forgot Password</h2>
          {step === 1 && (
            <p className="text-sm text-muted-foreground text-center mb-2">Enter your email to receive a password reset link.</p>
          )}
        </div>
        <div className="w-full">
                {step === 1 && (
            <form onSubmit={handleRequestReset} className="space-y-4" autoComplete="off" noValidate>
              <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                  autoComplete="email"
                  />
                </div>
              <Button type="submit" className="w-full mt-2" disabled={isRequesting}>
                  {isRequesting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Link...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}
            {step === 2 && (
              <div className="text-center text-muted-foreground">
                <p>
                  We sent a password reset link to <span className="font-semibold text-primary">{email}</span>.<br />
                  Please check your inbox and follow the instructions.
              </p>
              <div className="mt-4">
                <Button
                  type="button"
                  className="w-full"
                  disabled={resendTimer > 0 || resendCount >= MAX_RESENDS_PER_DAY}
                  onClick={(e) => handleRequestReset(e, true)}
                >
                  {resendTimer > 0
                    ? `Resend reset link (${resendTimer}s)`
                    : resendCount >= MAX_RESENDS_PER_DAY
                      ? 'Resend limit reached'
                      : 'Resend reset link'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  {resendCount >= MAX_RESENDS_PER_DAY
                    ? 'You have reached the maximum number of reset requests for today.'
                    : `You can resend the reset link ${MAX_RESENDS_PER_DAY - resendCount} more time(s) today.`}
                </p>
              </div>
              </div>
            )}
        </div>
        <div className="w-full flex flex-col items-center mt-4">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


