import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { CustomerPortalSidebar } from './CustomerPortalSidebar';
import { Sheet, SheetContent } from '../ui/sheet';
import { useIsMobile } from '../ui/use-mobile';

export default function CustomerPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'customer-dashboard';
    if (path.includes('/billing')) return 'customer-billing';
    if (path.includes('/analytics')) return 'customer-analytics';
    if (path.includes('/feedback')) return 'customer-feedback';
    return 'customer-dashboard';
  };

  const handleNavigate = (page: string) => {
    if (page === 'logout') {
      localStorage.removeItem('customerUser');
      localStorage.removeItem('isCustomerAuthenticated');
      navigate('/login');
      return;
    }

    const routeMap: Record<string, string> = {
      'customer-dashboard': '/customer/dashboard',
      'customer-billing': '/customer/billing',
      'customer-analytics': '/customer/analytics',
      'customer-feedback': '/customer/feedback',
    };

    const route = routeMap[page];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="min-h-screen bg-app">
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="fixed top-4 left-4 z-30 p-2 bg-white rounded-lg shadow-md border border-gray-200 md:hidden"
          aria-label="Open menu"
        >
          <Menu size={24} className="text-gray-700" />
        </button>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <CustomerPortalSidebar activePage={getActivePage()} onNavigate={handleNavigate} />
      </div>

      {/* Mobile Sidebar */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
            <div className="h-full overflow-y-auto">
              <CustomerPortalSidebar activePage={getActivePage()} onNavigate={(page) => {
                handleNavigate(page);
                setMobileMenuOpen(false);
              }} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="w-full md:ml-[280px] px-4 md:px-6 py-4 md:py-6">
        <Outlet />
      </div>
    </div>
  );
}
