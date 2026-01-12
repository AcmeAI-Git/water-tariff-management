import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../services/api';
import { toast } from 'sonner';
import { getRouteForRole } from '../utils/roleUtils';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Demo account credentials mapping
  const demoCredentials: Record<string, { email: string; password: string }> = {
    admin: { email: 'admin@demo.com', password: 'demo123' },
    'meter-admin': { email: 'meter-admin@demo.com', password: 'demo123' },
    'customer-admin': { email: 'customer-admin@demo.com', password: 'demo123' },
    'tariff-admin': { email: 'tariff-admin@demo.com', password: 'demo123' },
    'approval-admin': { email: 'approval-admin@demo.com', password: 'demo123' },
    'general-info': { email: 'general-info@demo.com', password: 'demo123' },
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const admin = await api.admins.login({
        email,
        password,
      });
      
      // Store admin data in localStorage
      localStorage.setItem('admin', JSON.stringify(admin));
      localStorage.setItem('isAuthenticated', 'true');
      
      toast.success('Login successful!');
      
      // Navigate based on role
      const roleName = admin.role?.name || '';
      const route = getRouteForRole(roleName);
      
      // Debug logging (can be removed in production)
      if (!roleName) {
        console.warn('No role name found in admin object:', admin);
      }
      
      navigate(route);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: string) => {
    // Handle customer portal demo login separately
    if (role === 'customer') {
      try {
        setDemoLoading('customer');
        setError('');
        
        // Get first active user for demo
        const users = await api.users.getAll('active');
        if (users.length === 0) {
          toast.error('No active users found. Please create a household first.');
          setDemoLoading(null);
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

        // Store authenticated customer user
        localStorage.setItem('customerUser', JSON.stringify(demoUser));
        localStorage.setItem('isCustomerAuthenticated', 'true');
        
        toast.success('Login successful!');
        navigate('/customer/dashboard');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Demo login failed';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setDemoLoading(null);
      }
      return;
    }

    // Handle admin demo logins
    const credentials = demoCredentials[role];
    if (!credentials) {
      toast.error('Invalid demo role');
      return;
    }

    try {
      setDemoLoading(role);
      setError('');
      
      // Call login API with demo credentials
      const admin = await api.admins.login({
        email: credentials.email,
        password: credentials.password,
      });
      
      // Store admin data in localStorage
      localStorage.setItem('admin', JSON.stringify(admin));
      localStorage.setItem('isAuthenticated', 'true');
      
      toast.success('Login successful!');
      
      // Navigate based on role (same logic as regular login)
      const roleName = admin.role?.name || '';
      const route = getRouteForRole(roleName);
      
      // Debug logging (can be removed in production)
      if (!roleName) {
        console.warn('No role name found in admin object:', admin);
      }
      
      navigate(route);
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Water Tariff</h1>
          <p className="text-base text-gray-600">Management System</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-sm text-gray-600">Please enter your credentials to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || demoLoading !== null}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
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
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || demoLoading !== null}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary/20" disabled={loading || demoLoading !== null} />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button className="text-sm font-medium text-primary hover:text-primary-600" disabled={loading || demoLoading !== null}>
                Forgot password?
              </button>
            </div>

            <Button 
              type="submit"
              disabled={loading || demoLoading !== null}
              className="w-full bg-primary hover:bg-primary-600 text-white rounded-lg h-11 text-base font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Quick Demo Access:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleDemo('admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === 'admin' ? 'Logging in...' : 'Super Admin'}
              </Button>
              <Button 
                onClick={() => handleDemo('meter-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === 'meter-admin' ? 'Logging in...' : 'Meter Reader'}
              </Button>
              <Button 
                onClick={() => handleDemo('customer-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === 'customer-admin' ? 'Logging in...' : 'Customer Admin'}
              </Button>
              <Button 
                onClick={() => handleDemo('tariff-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === 'tariff-admin' ? 'Logging in...' : 'Tariff Admin'}
              </Button>
              <Button 
                onClick={() => handleDemo('approval-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === 'approval-admin' ? 'Logging in...' : 'Approval Admin'}
              </Button>
              <Button 
                onClick={() => handleDemo('general-info')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {demoLoading === 'general-info' ? 'Logging in...' : 'General Admin'}
              </Button>
              <Button 
                onClick={() => handleDemo('customer')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
              >
                {demoLoading === 'customer' ? 'Logging in...' : 'Customer Portal'}
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button className="font-medium text-primary hover:text-primary-600">
                Contact Administrator
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          © 2025 Water Tariff Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}


