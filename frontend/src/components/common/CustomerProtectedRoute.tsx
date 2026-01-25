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
    // Redirect to customer login if not authenticated
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }
  
  // Parse customer user data
  let customerUser: User | null = null;
  try {
    customerUser = JSON.parse(customerUserStr);
  } catch {
    // Invalid customer data, redirect to login
    localStorage.removeItem('customerUser');
    localStorage.removeItem('isCustomerAuthenticated');
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }
  
  if (!customerUser || !customerUser.id) {
    // Invalid user data, redirect to login
    localStorage.removeItem('customerUser');
    localStorage.removeItem('isCustomerAuthenticated');
    return <Navigate to="/customer/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
