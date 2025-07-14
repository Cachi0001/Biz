import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { requestPasswordReset } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [step, setStep] = useState(1); // 1: Request, 2: Sent

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsRequesting(true);
    try {
      const response = await requestPasswordReset({ email });
      if (response.success) {
        setStep(2);
        window.toast && window.toast.success('A password reset code has been sent to your email.');
      } else {
        window.toast && window.toast.error(response.message || 'Failed to send reset code.');
      }
    } catch (err) {
      window.toast && window.toast.error(err.response?.data?.message || 'Failed to send reset code.');
    }
    setIsRequesting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8 flex flex-col items-center">
        {/* Logo inside card */}
        <div className="flex flex-col items-center mb-4">
          <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-14 h-14 rounded-lg shadow mb-2" />
          <h2 className="text-2xl font-bold text-foreground mb-1 text-center">Forgot Password</h2>
          <p className="text-sm text-muted-foreground text-center mb-2">Enter your email to receive a password reset link.</p>
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


