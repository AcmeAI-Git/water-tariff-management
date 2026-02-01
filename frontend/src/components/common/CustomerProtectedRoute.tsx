import { Navigate, useLocation } from 'react-router-dom';
import type { User } from '../../types';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * CustomerProtectedRoute component that checks customer authentication
 */
export function CustomerProtectedRoute({ children }: CustomerProtectedRouteProps) {
  const location = useLocation();
  
  // Check if customer is authenticated
  const isAuthenticated = localStorage.getItem('isCustomerAuthenticated') === 'true';
  const customerUserStr = localStorage.getItem('customerUser');
  
  if (!isAuthenticated || !customerUserStr) {
    // Redirect to customer portal login (not admin /login)
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }
  
  // Parse customer user data
  let customerUser: User | null = null;
  try {
    customerUser = JSON.parse(customerUserStr);
  } catch {
    // Invalid customer data, redirect to customer login
    localStorage.removeItem('customerUser');
    localStorage.removeItem('isCustomerAuthenticated');
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }
  
  // User needs either id or account (backend uses account UUID)
  if (!customerUser || (!customerUser.id && !customerUser.account)) {
    // Invalid user data, redirect to customer login
    localStorage.removeItem('customerUser');
    localStorage.removeItem('isCustomerAuthenticated');
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
