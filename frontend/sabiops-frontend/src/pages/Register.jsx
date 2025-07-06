import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Import useToast

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    business_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast(); // Initialize useToast

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Registration Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return false;
    }
    if (formData.password.length < 6) {
      toast({
        title: 'Registration Error',
        description: 'Password must be at least 6 characters long',
        variant: 'destructive',
      });
      return false;
    }
    if (!formData.email || !formData.phone) {
      toast({
        title: 'Registration Error',
        description: 'Email and phone number are required',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...registrationData } = formData;
      await register(registrationData);
      toast({
        title: 'Registration Successful',
        description: 'Your account has been created!',
        variant: 'success',
      });
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Registration failed. Please check your information and try again.';
      toast({
        title: 'Registration Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-2xl w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xl">S</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start managing your business with SabiOps - No username required!
          </p>
        </div>

        <Card className="shadow-lg border-0 bg-card">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center">Sign Up</CardTitle>
            <CardDescription className="text-center">
              Fill in your details to create your business account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Personal Information</h3>
                
                {/* First Name and Last Name - Side by Side */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-xs sm:text-sm font-medium">First Name *</Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="First name"
                      className="h-9 sm:h-11 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-xs sm:text-sm font-medium">Last Name *</Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Last name"
                      className="h-9 sm:h-11 text-sm"
                    />
                  </div>
                </div>

                {/* Email and Phone - Side by Side */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email"
                      className="h-9 sm:h-11 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs sm:text-sm font-medium">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone"
                      className="h-9 sm:h-11 text-sm"
                    />
                  </div>
                </div>

                {/* Password and Confirm Password - Side by Side */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-medium">Password *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className="h-9 sm:h-11 pr-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-medium">Confirm Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm"
                        className="h-9 sm:h-11 pr-8 text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-2 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">Business Information</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="business_name" className="text-sm font-medium">Business Name (Optional)</Label>
                  <Input
                    id="business_name"
                    name="business_name"
                    type="text"
                    value={formData.business_name}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    className="h-10 sm:h-11"
                  />
                  <p className="text-xs text-muted-foreground">You can add more business details later in your profile</p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Terms and Privacy */}
              <p className="text-xs text-center text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </p>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;


