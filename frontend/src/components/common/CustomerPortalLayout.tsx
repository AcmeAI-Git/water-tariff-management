import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { CustomerPortalSidebar } from './CustomerPortalSidebar';

export default function CustomerPortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'customer-dashboard';
    if (path.includes('/billing')) return 'customer-billing';
    if (path.includes('/visualizer')) return 'customer-visualizer';
    if (path.includes('/analytics')) return 'customer-analytics';
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
      'customer-visualizer': '/customer/visualizer',
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
      <CustomerPortalSidebar activePage={getActivePage()} onNavigate={handleNavigate} />
      <div className="ml-[280px]">
        <Outlet />
      </div>
    </div>
  );
}
