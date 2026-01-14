import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../services/api';
import { toast } from 'sonner';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [emailOrMeter, setEmailOrMeter] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!emailOrMeter || !password) {
      setError('Please enter both email/meter number and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Fetch all users to find matching user
      const users = await api.users.getAll();
      
      // Try to find user by email or meter number
      const user = users.find(
        (u) => u.email?.toLowerCase() === emailOrMeter.toLowerCase() || 
               u.meterNo?.toLowerCase() === emailOrMeter.toLowerCase()
      );

      if (!user) {
        throw new Error('Invalid email/meter number or password');
      }

      // Check password from localStorage (demo authentication)
      const userPasswords = JSON.parse(localStorage.getItem('userPasswords') || '{}');
      const storedPassword = userPasswords[user.id];

      if (!storedPassword || storedPassword !== password) {
        throw new Error('Invalid email/meter number or password');
      }

      // Store authenticated user
      localStorage.setItem('customerUser', JSON.stringify(user));
      localStorage.setItem('isCustomerAuthenticated', 'true');
      
      toast.success('Login successful!');
      navigate('/customer/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get first active user for demo
      const users = await api.users.getAll('active');
      if (users.length === 0) {
        toast.error('No active users found. Please create a customer first.');
        return;
      }

      const demoUser = users[0];
      const userPasswords = JSON.parse(localStorage.getItem('userPasswords') || '{}');
      const demoPassword = userPasswords[demoUser.id] || 'demo123';

      // If no password exists, set a default demo password
      if (!userPasswords[demoUser.id]) {
        userPasswords[demoUser.id] = demoPassword;
        localStorage.setItem('userPasswords', JSON.stringify(userPasswords));
      }

      setEmailOrMeter(demoUser.email || demoUser.meterNo);
      setPassword(demoPassword);
      
      // Auto login
      localStorage.setItem('customerUser', JSON.stringify(demoUser));
      localStorage.setItem('isCustomerAuthenticated', 'true');
      
      toast.success('Demo login successful!');
      navigate('/customer/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Demo login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Portal</h1>
            <p className="text-gray-600">Sign in to view your water usage and bills</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailOrMeter" className="text-sm font-medium text-gray-700">
                Email or Meter Number
              </Label>
              <Input
                id="emailOrMeter"
                type="text"
                value={emailOrMeter}
                onChange={(e) => setEmailOrMeter(e.target.value)}
                placeholder="Enter email or meter number"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="h-11"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary-600 text-white"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleDemoLogin}
              className="w-full h-11 border-gray-300"
              disabled={loading}
            >
              Demo Login
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have an account? Contact your administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
