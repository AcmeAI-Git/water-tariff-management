import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { api } from '../services/api';
import { toast } from 'sonner';
import type { User } from '../types';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getStaticTranslation } from '../constants/staticTranslations';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);
  const [customerName, setCustomerName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!customerName.trim() || !identifier.trim()) {
      setError(t('customerLogin.pleaseEnterBoth'));
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Fetch all users (backend must allow this for unauthenticated customer portal; else 401)
      let users: User[];
      try {
        const raw = await api.users.getAll();
        users = Array.isArray(raw) ? raw : (raw as any)?.data ?? (raw as any)?.items ?? [];
      } catch (apiErr: any) {
        const msg = apiErr?.message || '';
        if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
          throw new Error(t('customerLogin.portalVerifyError'));
        }
        throw apiErr;
      }
      if (!Array.isArray(users) || users.length === 0) {
        throw new Error(t('customerLogin.failedToLoadCustomers'));
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
        const userInspCode = String((user as any).inspCode || '').trim();
        
        return userMeterId === searchIdentifier || userInspCode === searchIdentifier;
      });

      if (!matchingCustomer) {
        setError(t('customerLogin.customerNotFound'));
        toast.error(t('customerLogin.customerNotFoundToast'));
        return;
      }

      // Prepare customer user object - preserve account field (UUID) for bill matching
      const customerUser: User = {
        ...matchingCustomer,
        // Preserve account UUID as-is (critical for matching bills)
        account: matchingCustomer.account || matchingCustomer.id?.toString() || '',
        id: matchingCustomer.id || (matchingCustomer.account ? parseInt(String(matchingCustomer.account).replace(/-/g, '').substring(0, 8), 16) : 1),
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
        status: (matchingCustomer as any).approvalStatus ?? matchingCustomer.status ?? (matchingCustomer as any).activeStatus ?? 'Active',
      };

      // Store authenticated customer user
      localStorage.setItem('customerUser', JSON.stringify(customerUser));
      localStorage.setItem('isCustomerAuthenticated', 'true');

      toast.success(`Welcome, ${customerUser.fullName || customerUser.name}!`);
      navigate(from && from.startsWith('/customer/') ? from : '/customer/dashboard', { replace: true });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('customerLogin.loginFailed');
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
          <span className="notranslate" translate="no">{t('customerLogin.backToAdminLogin')}</span>
        </Button>

        {/* Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-2 notranslate" translate="no">{t('customerLogin.title')}</h1>
          <p className="text-sm md:text-base text-gray-600 notranslate" translate="no">{t('customerLogin.subtitle')}</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1 notranslate" translate="no">{t('customerLogin.heading')}</h2>
            <p className="text-sm text-gray-600 notranslate" translate="no">{t('customerLogin.pleaseEnterNameMeter')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-sm font-medium text-gray-700 notranslate" translate="no">
                {t('customerLogin.customerName')}
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder={t('customerLogin.enterFullName')}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loading}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identifier" className="text-sm font-medium text-gray-700 notranslate" translate="no">
                {t('customerLogin.meterIdOrInspectionCode')}
              </Label>
              <Input
                id="identifier"
                type="text"
                placeholder={t('customerLogin.enterMeterIdPlaceholder')}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                className="bg-gray-50 border-gray-300 rounded-lg h-11 focus:ring-2 focus:ring-primary/20 focus:border-blue-500"
                required
              />
              <p className="text-xs text-gray-500 notranslate" translate="no">
                {t('customerLogin.meterIdHint')}
              </p>
            </div>

            <Button 
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-600 text-white rounded-lg h-11 text-base font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="notranslate" translate="no">{loading ? t('customerLogin.loggingIn') : t('customerLogin.login')}</span>
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center notranslate" translate="no">
              {t('customerLogin.dontHaveAccount')}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6 notranslate" translate="no">
          {t('customerLogin.footer')}
        </p>
      </div>
    </div>
  );
}
