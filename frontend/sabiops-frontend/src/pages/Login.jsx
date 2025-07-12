import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from '../services/api';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(getErrorMessage(error, error.message || 'Login failed.'), { duration: 4000 });
      } else if (data.session) {
        localStorage.setItem('token', data.session.access_token);
        // Optionally fetch user profile from your backend here if needed
        try {
          navigate('/dashboard'); // React Router navigation
        } catch (e) {
          window.location.href = '/dashboard'; // Fallback in case navigate fails
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed. Please try again.'), { duration: 4000 });
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
            Login to SabiOps
          </h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
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
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                  type="password"
                    required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            <div className="text-center mt-4">
              <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                Forgot password?
                </Link>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-4">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link to="/register" className="font-medium text-primary hover:text-primary/80">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

