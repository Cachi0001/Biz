import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        try {
          navigate('/dashboard');
        } catch (e) {
          window.location.href = '/dashboard';
        }
      } else {
        // Show error toast
        window.toast && window.toast.error(result.message || 'Login failed.', { duration: 4000 });
      }
    } catch (err) {
      window.toast && window.toast.error('Login failed. Please try again.', { duration: 4000 });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-2 py-8 overflow-x-hidden">
      <div className="w-full max-w-xs sm:max-w-md bg-white rounded-2xl shadow-lg p-4 sm:p-8 flex flex-col items-center">
        {/* Logo inside card */}
        <div className="flex flex-col items-center mb-4">
          <img src="/sabiops.jpg" alt="SabiOps Logo" className="w-14 h-14 rounded-lg shadow mb-2" />
          <h2 className="text-2xl font-bold text-foreground mb-1 text-center">Login to SabiOps</h2>
          <p className="text-sm text-muted-foreground text-center mb-2">Welcome back! Please sign in to your account.</p>
        </div>
        <form onSubmit={handleLogin} className="w-full space-y-4" autoComplete="off" noValidate>
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
                  autoComplete="username"
                />
              </div>
          <div className="relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
              type={showPassword ? 'text' : 'password'}
                    required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  autoComplete="current-password"
              inputMode="text"
              spellCheck={false}
              className="pr-10"
                />
            <button
              type="button"
              tabIndex={-1}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-primary focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
              </div>
          <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
        <div className="w-full flex flex-col items-center mt-4">
          <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80 mb-2">
                Forgot password?
          </Link>
          <span className="text-sm text-muted-foreground">Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary/80">Register</Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;

