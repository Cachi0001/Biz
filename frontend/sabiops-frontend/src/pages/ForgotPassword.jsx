import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [step, setStep] = useState(1); // 1: Request, 2: Sent

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsRequesting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://sabiops.vercel.app/reset-password',
      });
      if (error) {
        toast.error(error.message);
      } else {
        setStep(2);
        toast.success('A password reset link has been sent to your email.');
      }
    } catch (err) {
      toast.error('Failed to send reset link. Please try again.');
    }
    setIsRequesting(false);
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
            {step === 1 && 'Enter your email to receive a password reset link.'}
            {step === 2 && 'Check your email for the password reset link.'}
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Request Password Reset'}
              {step === 2 && 'Reset Link Sent'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'We will send a link to your email to reset your password.'}
              {step === 2 && 'Click the link in your email to set a new password.'}
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
                    disabled={isRequesting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isRequesting}>
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
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <Link to="/login" className="font-medium text-primary hover:text-primary/80">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


