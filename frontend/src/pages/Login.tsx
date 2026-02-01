import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../services/api';
import { toast } from 'sonner';
import { getRouteForRole } from '../utils/roleUtils';
import { useLanguage } from '../context/LanguageContext';
import { getStaticTranslation } from '../constants/staticTranslations';

export default function Login() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
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
      setError(t('login.pleaseEnterBoth'));
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
      
      toast.success(t('login.loginSuccessful'));
      
      // Navigate based on role
      const roleName = admin.role?.name || '';
      const route = getRouteForRole(roleName);
      
      // Debug logging (can be removed in production)
      if (!roleName) {
        console.warn('No role name found in admin object:', admin);
      }
      
      navigate(route);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('login.loginFailed');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role: string) => {
    // Customer portal demo: navigate to customer login page
    if (role === 'customer') {
      navigate('/customer/login');
      return;
    }

    // Handle admin demo logins
    const credentials = demoCredentials[role];
    if (!credentials) {
      toast.error(t('login.invalidDemoRole'));
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
      
      toast.success(t('login.loginSuccessful'));
      
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
        : t('login.loginFailed');
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
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 notranslate" translate="no">{t('login.title')}</h1>
          <p className="text-sm md:text-base text-gray-600 notranslate" translate="no">{t('login.subtitle')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 notranslate" translate="no">{t('login.welcomeBack')}</h2>
            <p className="text-sm text-gray-600 notranslate" translate="no">{t('login.pleaseEnterCredentials')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700 notranslate" translate="no">
                {t('login.email')}
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.enterEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || demoLoading !== null}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 notranslate" translate="no">
                {t('login.password')}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t('login.enterPassword')}
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
                <span className="text-sm text-gray-600 notranslate" translate="no">{t('login.rememberMe')}</span>
              </label>
              <button type="button" className="text-sm font-medium text-primary hover:text-primary-600 notranslate" translate="no" disabled={loading || demoLoading !== null}>
                {t('login.forgotPassword')}
              </button>
            </div>

            <Button 
              type="submit"
              disabled={loading || demoLoading !== null}
              className="w-full bg-primary hover:bg-primary-600 text-white rounded-lg h-11 text-base font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="notranslate" translate="no">{loading ? t('login.loggingIn') : t('login.login')}</span>
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs md:text-sm text-gray-600 mb-3 text-center notranslate" translate="no">{t('login.quickDemoAccess')}</p>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <Button 
                onClick={() => handleDemo('admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="notranslate" translate="no">{demoLoading === 'admin' ? t('login.loggingIn') : t('login.superAdmin')}</span>
              </Button>
              <Button 
                onClick={() => handleDemo('meter-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="notranslate" translate="no">{demoLoading === 'meter-admin' ? t('login.loggingIn') : t('login.meterReader')}</span>
              </Button>
              <Button 
                onClick={() => handleDemo('customer-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="notranslate" translate="no">{demoLoading === 'customer-admin' ? t('login.loggingIn') : t('login.customerAdmin')}</span>
              </Button>
              <Button 
                onClick={() => handleDemo('tariff-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="notranslate" translate="no">{demoLoading === 'tariff-admin' ? t('login.loggingIn') : t('login.tariffAdmin')}</span>
              </Button>
              <Button 
                onClick={() => handleDemo('approval-admin')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="notranslate" translate="no">{demoLoading === 'approval-admin' ? t('login.loggingIn') : t('login.approvalAdmin')}</span>
              </Button>
              <Button 
                onClick={() => handleDemo('general-info')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="notranslate" translate="no">{demoLoading === 'general-info' ? t('login.loggingIn') : t('login.generalAdmin')}</span>
              </Button>
              <Button 
                onClick={() => handleDemo('customer')}
                variant="outline"
                disabled={loading || demoLoading !== null}
                className="border-gray-300 text-gray-700 rounded-lg h-9 md:h-10 text-xs md:text-sm hover:bg-gray-50 bg-white disabled:opacity-50 disabled:cursor-not-allowed col-span-2"
              >
                <span className="notranslate" translate="no">{demoLoading === 'customer' ? t('login.loggingIn') : t('login.customerPortal')}</span>
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600 notranslate" translate="no">
              {t('login.dontHaveAccount')}{' '}
              <button type="button" className="font-medium text-primary hover:text-primary-600">
                {t('login.contactAdministrator')}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 notranslate" translate="no">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}


