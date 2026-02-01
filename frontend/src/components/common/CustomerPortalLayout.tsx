import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../../context/LanguageContext';
import { getStaticTranslation } from '../../constants/staticTranslations';
import { CustomerPortalSidebar } from './CustomerPortalSidebar';
import { Sheet, SheetContent } from '../ui/sheet';
import { useIsMobile } from '../ui/use-mobile';

export default function CustomerPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const t = (key: string) => getStaticTranslation(language, key);

  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'customer-dashboard';
    if (path.includes('/billing')) return 'customer-billing';
    if (path.includes('/feedback')) return 'customer-feedback';
    return 'customer-dashboard';
  };

  const handleNavigate = (page: string) => {
    if (page === 'logout') {
      localStorage.removeItem('customerUser');
      localStorage.removeItem('isCustomerAuthenticated');
      navigate('/customer/login');
      return;
    }

    const routeMap: Record<string, string> = {
      'customer-dashboard': '/customer/dashboard',
      'customer-billing': '/customer/billing',
      'customer-feedback': '/customer/feedback',
    };

    const route = routeMap[page];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 md:hidden"
          aria-label={t('common.openMenu')}
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-[260px] fixed inset-y-0 left-0 bg-white shadow z-20">
        <CustomerPortalSidebar activePage={getActivePage()} onNavigate={handleNavigate} />
      </aside>

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-white">
            <div className="h-full overflow-y-auto bg-white">
              <CustomerPortalSidebar activePage={getActivePage()} onNavigate={(page) => {
                handleNavigate(page);
                setMobileMenuOpen(false);
              }} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-[260px] px-4 md:px-6 py-4 md:py-6 overflow-x-hidden min-w-0">
        <div className="sticky top-0 z-10 flex justify-end py-2 -mt-2 mb-2">
          <LanguageSwitcher />
        </div>
        <Outlet />
      </main>
    </div>
  );
}
