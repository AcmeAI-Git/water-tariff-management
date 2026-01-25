/**
 * Maps database role names to route keys for navigation
 */
export function getRouteKeyFromRoleName(roleName: string): string {
  const normalizedName = roleName.toLowerCase().trim();
  
  // Map common role name variations to route keys
  const roleMap: Record<string, string> = {
    'super admin': 'admin',
    'superadmin': 'admin',
    'admin': 'admin',
    'meter reader': 'meter-admin',
    'meter reader admin': 'meter-admin',
    'meter admin': 'meter-admin',
    'meteradmin': 'meter-admin',
    'meter-reader': 'meter-admin',
    'meter-reader-admin': 'meter-admin',
    'customer admin': 'customer-admin',
    'customeradmin': 'customer-admin',
    'tariff admin': 'tariff-admin',
    'tariffadmin': 'tariff-admin',
    'approval admin': 'approval-admin',
    'approvaladmin': 'approval-admin',
    'approver': 'approval-admin',
    'general info': 'general-info',
    'general info admin': 'general-info',
    'generalinfo': 'general-info',
    'general-info': 'general-info',
    'general-info-admin': 'general-info',
  };
  
  // Direct match
  if (roleMap[normalizedName]) {
    return roleMap[normalizedName];
  }
  
  // Partial match (e.g., "Meter Reader Admin" contains "meter")
  if (normalizedName.includes('meter')) {
    return 'meter-admin';
  }
  if (normalizedName.includes('customer')) {
    return 'customer-admin';
  }
  if (normalizedName.includes('tariff')) {
    return 'tariff-admin';
  }
  if (normalizedName.includes('approval') || normalizedName.includes('approver')) {
    return 'approval-admin';
  }
  if (normalizedName.includes('general') || normalizedName.includes('info')) {
    return 'general-info';
  }
  if (normalizedName.includes('super') || normalizedName.includes('admin')) {
    return 'admin';
  }
  
  // Default to admin dashboard
  return 'admin';
}

/**
 * Gets the default route for a role
 */
export function getRouteForRole(roleName: string): string {
  const routeKey = getRouteKeyFromRoleName(roleName);
  
  const routeMap: Record<string, string> = {
    admin: '/admin/dashboard',
    'meter-admin': '/meter-reader/entry',
    'meter-reader': '/meter-reader/entry',
    'customer-admin': '/customer-admin/customers',
    'tariff-admin': '/tariff-admin/zone-scoring',
    'approval-admin': '/approval-admin/queue',
    'general-info': '/general-admin/dashboard',
    'general-admin': '/general-admin/dashboard',
  };
  
  return routeMap[routeKey] || '/admin/dashboard';
}
