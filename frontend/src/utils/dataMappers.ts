import type { Admin, Role, User, ApprovalRequest, AuditLog } from '../types';

// Display types for UI components
export interface DisplayAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  roleId: number;
  phone: string;
  createdAt?: string;
}

export interface DisplayCustomer {
  id: number;
  name: string;
  address: string;
  inspCode?: number;
  accountType?: string;
  customerCategory?: string;
  waterStatus?: string;
  sewerStatus?: string;
  status: string;
  zoneId?: number;
  areaId?: number;
  // Backward compatibility fields
  fullName?: string;
  meterNo?: string | number;
  meterStatus?: string;
  sizeOfDia?: string;
  meterInstallationDate?: string;
  phone?: string;
  email?: string;
}

export interface DisplayApprovalRequest {
  id: string;
  module: string;
  requestedBy: string;
  request: string;
  status: string;
  oldData: unknown;
  newData: unknown;
  reviewedBy?: string;
  review?: string;
  comments?: string;
}

export interface DisplayAuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details: string;
}

/**
 * Maps backend Admin to display format with role name
 */
export function mapAdminToDisplay(admin: Admin, roles: Role[]): DisplayAdmin {
  const role = roles.find((r) => r.id === admin.roleId);
  return {
    id: admin.id,
    name: admin.fullName,
    email: admin.email,
    role: role?.name || 'Unknown',
    roleId: admin.roleId,
    phone: admin.phone,
    createdAt: admin.createdAt,
  };
}

/**
 * Maps backend User to customer display format
 */
export function mapUserToCustomer(user: User): DisplayCustomer {
  // Handle both id (number) and account (UUID string) fields
  const userId = (user as any).account || user.id;
  const userData = user as any;
  
  // Get status - check multiple possible field names
  // Note: New API structure might not include status field
  // Since customers register directly without approval, default to 'active' if status is missing
  const rawStatus = userData.activeStatus || userData.status || user.status;
  
  // If status exists, use it (normalize to lowercase)
  // If status doesn't exist, default to 'active' (customers register directly as active now)
  const status = rawStatus ? String(rawStatus).toLowerCase() : 'active';
  
  // Extract meter data from nested meter object or direct fields
  const meterData = userData.meter || {};
  const meterNo = meterData.meterNo || userData.meterNo || user.meterNo || '';
  const meterStatus = meterData.meterStatus || userData.meterStatus || '';
  const sizeOfDia = meterData.sizeOfDia || userData.sizeOfDia || '';
  const meterInstallationDate = meterData.meterInstallationDate || userData.meterInstallationDate || '';

  return {
    id: userId,
    name: userData.name || user.fullName || '',
    address: user.address || '',
    inspCode: userData.inspCode,
    accountType: userData.accountType,
    customerCategory: userData.customerCategory,
    waterStatus: userData.waterStatus,
    sewerStatus: userData.sewerStatus,
    status: status,
    zoneId: user.zoneId || userData.zoneId || userData.dmaId,
    areaId: userData.areaId || user.wardId, // Support both for backward compatibility
    // Backward compatibility
    fullName: userData.name || user.fullName || '',
    meterNo: meterNo,
    meterStatus: meterStatus,
    sizeOfDia: sizeOfDia,
    meterInstallationDate: meterInstallationDate,
    phone: user.phone || '',
    email: user.email,
  };
}

/**
 * Maps backend ApprovalRequest to display format
 * Note: Requires admin name lookup - caller should fetch admin details
 */
export function mapApprovalRequestToDisplay(
  request: ApprovalRequest,
  adminName?: string
): DisplayApprovalRequest {
  // Extract oldData and newData from the request if available
  // The backend structure may vary, so we handle it flexibly
  const requestWithExtras = request as ApprovalRequest & {
    oldData?: unknown;
    newData?: unknown;
  };
  const oldData = requestWithExtras.oldData || null;
  const newData = requestWithExtras.newData || null;

  // Map status - backend uses statusName, not name
  const status = (request.approvalStatus as any)?.statusName || 
                 request.approvalStatus?.name || 
                 'Pending';

  return {
    id: `REQ-${String(request.id).padStart(3, '0')}`,
    module: request.moduleName || 'Unknown',
    requestedBy: adminName || `Admin #${request.requestedBy}`,
    request: request.requestedAt
      ? new Date(request.requestedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '',
    status,
    oldData,
    newData,
    reviewedBy: request.reviewer?.fullName,
    review: request.reviewedAt
      ? new Date(request.reviewedAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : undefined,
    comments: request.comments || undefined,
  };
}

/**
 * Maps backend AuditLog to display format
 * Note: Requires user/admin name lookup - caller should fetch user details
 */
export function mapAuditLogToDisplay(
  log: AuditLog,
  userName?: string,
  adminName?: string
): DisplayAuditLog {
  const user = userName || adminName || (log.userId ? `User #${log.userId}` : 'System');

  // Format action for display
  const action = log.action.toUpperCase();

  // Format details from oldData/newData if available
  interface AuditLogWithExtras extends AuditLog {
    details?: string;
  }
  const logWithExtras = log as AuditLogWithExtras;
  let details = logWithExtras.details || '';
  if (!details && log.oldData && log.newData) {
    details = `Changed ${log.tableName} record #${log.recordId}`;
  } else if (!details) {
    details = `${action} ${log.tableName}`;
  }

  return {
    id: `LOG-${log.id}`,
    timestamp: log.createdAt
      ? new Date(log.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '',
    user,
    action,
    module: log.tableName,
    details,
  };
}

/**
 * Formats JSONB data for display in approval requests
 */
export function formatJsonbData(data: unknown): string {
  if (!data) return 'N/A';
  if (typeof data === 'string') return data;
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Maps user status to display format
 */
export function mapUserStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Approved',
    inactive: 'Pending',
    Active: 'Approved',
    Inactive: 'Pending',
    Pending: 'Pending',
    Approved: 'Approved',
  };
  return statusMap[status] || status;
}

