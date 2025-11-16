import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // UI-only: navigate to home as a demo
    navigate('/');
  };

  const handleDemo = (role: string) => {
    // UI-only demo: navigate to home
    const routeMap: Record<string, string> = {
        admin: '/superadmin',
    }
    const dest = routeMap[role] ?? '/superadmin';
    console.log('Demo login as,', role, '->', dest);
    navigate(dest); 
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-4">
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

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#4C6EF5] focus:ring-2 focus:ring-blue-500/20" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <button className="text-sm font-medium text-[#4C6EF5] hover:text-[#3B5EE5]">
                Forgot password?
              </button>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full bg-[#4C6EF5] hover:bg-[#3B5EE5] text-white rounded-lg h-11 text-base font-medium shadow-sm"
            >
              Login
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 text-center">Quick Demo Access:</p>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={() => handleDemo('admin')}
                variant="outline"
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white"
              >
                Super Admin
              </Button>
              <Button 
                onClick={() => handleDemo('meter-admin')}
                variant="outline"
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white"
              >
                Meter Admin
              </Button>
              <Button 
                onClick={() => handleDemo('customer-admin')}
                variant="outline"
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white"
              >
                Customer Admin
              </Button>
              <Button 
                onClick={() => handleDemo('tariff-admin')}
                variant="outline"
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white"
              >
                Tariff Admin
              </Button>
              <Button 
                onClick={() => handleDemo('approval-admin')}
                variant="outline"
                className="border-gray-300 text-gray-700 rounded-lg h-10 text-sm hover:bg-gray-50 bg-white col-span-2"
              >
                Approval Admin
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <button className="font-medium text-[#4C6EF5] hover:text-[#3B5EE5]">
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
