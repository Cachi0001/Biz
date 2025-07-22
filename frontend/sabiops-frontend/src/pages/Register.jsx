import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import BackButton from '@/components/ui/BackButton';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    full_name: '',
    business_name: '',
    referral_code: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('Email address is required');
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return false;
    }
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return false;
    }
    if (!formData.password.trim()) {
      toast.error('Password is required. Please enter your password to continue.');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await register(formData);
      if (result.success || (result.message && result.message.toLowerCase().includes('check your email'))) {
        toast.success('Registration successful! Please check your email for confirmation.');
        localStorage.setItem('pending_registration', JSON.stringify(formData));
        setShowCheckEmail(true);
        // Start cooldown timer for resend button
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else if (result.message) {
        toast.error(result.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      // Error handling is now done in the auth context
    } catch (error) {
      console.error('[REGISTER] Unexpected error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0 || isResending) return;
    
    setIsResending(true);
    try {
      const { resendVerificationEmail } = await import('../services/api');
      await resendVerificationEmail(formData.email);
      toast.success('Verification email sent! Please check your inbox.');
      
      // Start cooldown timer
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to resend email:', error);
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (showCheckEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 overflow-x-hidden">
        <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-20 h-20 mb-4 rounded-full shadow-lg" />
        <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Check your email</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-md text-base">
          We sent a confirmation link to <span className="font-semibold text-primary">{formData.email}</span>.<br />
          Please click the link in your inbox to verify your account.
        </p>
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground mb-4">
            Didn't get the email? Check your spam folder or try resending.
          </p>
          <Button
            onClick={handleResendEmail}
            disabled={resendCooldown > 0 || isResending}
            variant="outline"
            className="w-full max-w-xs"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : resendCooldown > 0 ? (
              `Resend in ${resendCooldown}s`
            ) : (
              'Resend Email'
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Wrong email? <button 
              onClick={() => setShowCheckEmail(false)} 
              className="text-primary hover:underline"
            >
              Go back to edit
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2 py-8 overflow-x-hidden relative">
      <BackButton to="/" variant="floating" />
      <div className="w-full max-w-xs sm:max-w-md bg-white rounded-2xl shadow-lg p-4 sm:p-8 flex flex-col items-center">
        {/* Logo inside card */}
        <div className="flex flex-col items-center mb-4">
          <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-14 h-14 rounded-lg shadow mb-2" />
          <h2 className="text-2xl font-bold text-foreground mb-1 text-center">Create your account</h2>
          <p className="text-sm text-muted-foreground text-center mb-2">Start managing your business today</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4" autoComplete="off" noValidate>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
              autoComplete="name"
                  />
                </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
              autoComplete="email"
                    />
                  </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
              placeholder="+234..."
              autoComplete="tel"
                    />
                  </div>
          
          <div>
            <Label htmlFor="business_name">Business Name (Optional)</Label>
            <Input
              id="business_name"
              name="business_name"
              type="text"
              value={formData.business_name}
              onChange={handleChange}
              placeholder="Your business name"
              autoComplete="organization"
            />
                </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="flex items-center gap-2 bg-input border rounded-md px-3 h-12 mt-1">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                placeholder="Create a password"
                autoComplete="new-password"
                className="flex-1 border-none bg-transparent shadow-none h-12 focus:ring-0 focus:border-none"
                      />
              <button
                        type="button"
                tabIndex={-1}
                className="h-12 flex items-center px-2 text-gray-500 hover:text-primary focus:outline-none"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
                    </div>
                  </div>

          <div>
            <Label htmlFor="referral_code">Referral Code (Optional)</Label>
                  <Input
                    id="referral_code"
                    name="referral_code"
                    type="text"
                    value={formData.referral_code}
                    onChange={handleChange}
              placeholder="Enter referral code"
                  />
              </div>

          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

        <div className="w-full flex flex-col items-center mt-4">
          <span className="text-sm text-muted-foreground">Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary/80">Sign in</Link>
          </span>
            </div>
      </div>
    </div>
  );
};

export default Register;