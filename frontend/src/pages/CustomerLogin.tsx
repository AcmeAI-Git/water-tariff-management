import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { User } from '../types';
import { ArrowLeft } from 'lucide-react';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!customerName.trim() || !identifier.trim()) {
      setError('Please enter both customer name and identifier (Meter ID or Inspection Code)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch all users
      const users = await api.users.getAll();
      if (!Array.isArray(users)) {
        throw new Error('Failed to fetch customers');
      }

      // Find customer by name (case-insensitive) and identifier (meter ID or inspection code)
      const matchingCustomer = users.find((user: User) => {
        const userName = (user.name || user.fullName || '').toLowerCase().trim();
        const searchName = customerName.toLowerCase().trim();
        const searchIdentifier = String(identifier).trim();
        
        // Match by name first
        if (userName !== searchName) return false;
        
        // Then match by either meter ID or inspection code
        const userMeterId = String(user.meterNo || '').trim();
        const userInspCode = String(user.inspCode || '').trim();
        
        return userMeterId === searchIdentifier || userInspCode === searchIdentifier;
      });

      if (!matchingCustomer) {
        setError('Customer not found. Please check your name and identifier (Meter ID or Inspection Code).');
        toast.error('Customer not found');
        return;
      }

      // Prepare customer user object - preserve account field (UUID) for bill matching
      const customerUser: User = {
        ...matchingCustomer,
        // Preserve account UUID as-is (critical for matching bills)
        account: matchingCustomer.account || matchingCustomer.id?.toString() || '',
        id: matchingCustomer.id || (matchingCustomer.account ? Number(String(matchingCustomer.account).replace(/-/g, '').substring(0, 8), 16) : 1),
        fullName: matchingCustomer.fullName || matchingCustomer.name || 'Customer',
        name: matchingCustomer.name || matchingCustomer.fullName || 'Customer',
        email: matchingCustomer.email || '',
        phone: matchingCustomer.phone || '',
        address: matchingCustomer.address || '',
        hourseType: matchingCustomer.hourseType || '',
        meterNo: matchingCustomer.meterNo || '',
        installDate: matchingCustomer.installDate || '',
        zoneId: matchingCustomer.zoneId || 0,
        wardId: matchingCustomer.wardId || 0,
        status: matchingCustomer.status || matchingCustomer.activeStatus || 'Active',
      };

      // Store authenticated customer user
      localStorage.setItem('customerUser', JSON.stringify(customerUser));
      localStorage.setItem('isCustomerAuthenticated', 'true');

      toast.success(`Welcome, ${customerUser.fullName || customerUser.name}!`);
      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="mb-4 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Admin Login
        </Button>

        {/* Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2">Customer Portal</h1>
          <p className="text-sm md:text-base text-gray-600">Enter your details to access your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Customer Login</h2>
            <p className="text-sm text-gray-600">Please enter your name and meter ID</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                Customer Name
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Enter your full name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loading}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Meter ID or Inspection Code
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder="Enter meter ID (if metered) or inspection code"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500">
                For metered customers: enter your Meter ID. For non-metered customers: enter your Inspection Code.
              </p>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-600 text-white rounded-lg h-11 text-base font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Don't have an account? Contact your administrator.
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
