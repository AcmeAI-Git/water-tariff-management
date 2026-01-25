import { Navigate, useLocation } from 'react-router-dom';
import { getRouteKeyFromRoleName, getRouteForRole } from '../../utils/roleUtils';
import type { Admin } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[]; // Route keys like 'admin', 'meter-admin', etc.
}

/**
 * ProtectedRoute component that checks authentication and role-based access
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const adminStr = localStorage.getItem('admin');
  
  if (!isAuthenticated || !adminStr) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // Parse admin data
  let admin: Admin | null = null;
  try {
    admin = JSON.parse(adminStr);
  } catch {
    // Invalid admin data, redirect to login
    localStorage.removeItem('admin');
    localStorage.removeItem('isAuthenticated');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If allowedRoles is specified, check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    const roleName = admin?.role?.name || '';
    const userRouteKey = getRouteKeyFromRoleName(roleName);
    
    // Check if user's role is allowed to access this route
    if (!allowedRoles.includes(userRouteKey)) {
      // User doesn't have permission, redirect to their default route
      const defaultRoute = getRouteForRole(roleName);
      return <Navigate to={defaultRoute} replace />;
    }
  }
  
  return <>{children}</>;
}
