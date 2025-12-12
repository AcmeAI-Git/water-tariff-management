import fetchService from "./fetchService";
import type {
  Admin,
  CreateAdminDto,
  UpdateAdminDto,
  LoginAdminDto,
  ChangePasswordDto,
  User,
  CreateUserDto,
  UpdateUserDto,
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  CityCorporation,
  CreateCityCorporationDto,
  UpdateCityCorporationDto,
  Zone,
  CreateZoneDto,
  UpdateZoneDto,
  Ward,
  CreateWardDto,
  UpdateWardDto,
  TariffPlan,
  CreateTariffPlanDto,
  UpdateTariffPlanDto,
  CalculateBillDto,
  BillCalculationResult,
  ApproveTariffPlanDto,
  RejectTariffPlanDto,
  ApprovalStatus,
  CreateApprovalStatusDto,
  ApprovalRequest,
  CreateApprovalRequestDto,
  ReviewApprovalRequestDto,
  Consumption,
  CreateConsumptionDto,
  UpdateConsumptionDto,
  ApproveConsumptionDto,
  WaterBill,
  CreateWaterBillDto,
  UpdateWaterBillDto,
  AuditLog,
  CreateAuditLogDto,
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
} from "../types";

// ==================== ADMINS ====================
export const adminsApi = {
  getAll: (roleId?: number): Promise<Admin[]> => {
    const query = roleId ? `?roleId=${roleId}` : "";
    return fetchService.get<Admin[]>(`/admins${query}`);
  },

  getById: (id: number): Promise<Admin> => {
    return fetchService.get<Admin>(`/admins/${id}`);
  },

  create: (data: CreateAdminDto): Promise<Admin> => {
    return fetchService.post<Admin>("/admins", data);
  },

  update: (id: number, data: UpdateAdminDto): Promise<Admin> => {
    return fetchService.put<Admin>(`/admins/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/admins/${id}`);
  },

  login: (data: LoginAdminDto): Promise<Admin> => {
    return fetchService.post<Admin>("/admins/login", data);
  },

  changePassword: (id: number, data: ChangePasswordDto): Promise<void> => {
    return fetchService.put<void>(`/admins/${id}/change-password`, data);
  },
};

// ==================== USERS ====================
export const usersApi = {
  getAll: (status?: string): Promise<User[]> => {
    const query = status ? `?status=${status}` : "";
    return fetchService.get<User[]>(`/users${query}`);
  },

  getById: (id: number): Promise<User> => {
    return fetchService.get<User>(`/users/${id}`);
  },

  create: (data: CreateUserDto): Promise<User> => {
    return fetchService.post<User>("/users", data);
  },

  update: (id: number, data: UpdateUserDto): Promise<User> => {
    return fetchService.put<User>(`/users/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/users/${id}`);
  },

  activate: (id: number): Promise<User> => {
    return fetchService.put<User>(`/users/${id}/activate`, {});
  },
};

// ==================== ROLES ====================
export const rolesApi = {
  getAll: (): Promise<Role[]> => {
    return fetchService.get<Role[]>("/roles");
  },

  getById: (id: number): Promise<Role> => {
    return fetchService.get<Role>(`/roles/${id}`);
  },

  create: (data: CreateRoleDto): Promise<Role> => {
    return fetchService.post<Role>("/roles", data);
  },

  update: (id: number, data: UpdateRoleDto): Promise<Role> => {
    return fetchService.put<Role>(`/roles/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/roles/${id}`);
  },
};

// ==================== CITY CORPORATIONS ====================
export const cityCorporationsApi = {
  getAll: (): Promise<CityCorporation[]> => {
    return fetchService.get<CityCorporation[]>("/city-corporations");
  },

  getById: (id: number): Promise<CityCorporation> => {
    return fetchService.get<CityCorporation>(`/city-corporations/${id}`);
  },

  create: (data: CreateCityCorporationDto): Promise<CityCorporation> => {
    return fetchService.post<CityCorporation>("/city-corporations", data);
  },

  update: (
    id: number,
    data: UpdateCityCorporationDto
  ): Promise<CityCorporation> => {
    return fetchService.put<CityCorporation>(`/city-corporations/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/city-corporations/${id}`);
  },
};

// ==================== ZONES ====================
export const zonesApi = {
  getAll: (cityCorporationId?: number): Promise<Zone[]> => {
    const query = cityCorporationId
      ? `?cityCorporationId=${cityCorporationId}`
      : "";
    return fetchService.get<Zone[]>(`/zones${query}`);
  },

  getById: (id: number): Promise<Zone> => {
    return fetchService.get<Zone>(`/zones/${id}`);
  },

  create: (data: CreateZoneDto): Promise<Zone> => {
    return fetchService.post<Zone>("/zones", data);
  },

  update: (id: number, data: UpdateZoneDto): Promise<Zone> => {
    return fetchService.put<Zone>(`/zones/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/zones/${id}`);
  },
};

// ==================== WARDS ====================
export const wardsApi = {
  getAll: (zoneId?: number): Promise<Ward[]> => {
    const query = zoneId ? `?zoneId=${zoneId}` : "";
    return fetchService.get<Ward[]>(`/wards${query}`);
  },

  getById: (id: number): Promise<Ward> => {
    return fetchService.get<Ward>(`/wards/${id}`);
  },

  create: (data: CreateWardDto): Promise<Ward> => {
    return fetchService.post<Ward>("/wards", data);
  },

  update: (id: number, data: UpdateWardDto): Promise<Ward> => {
    return fetchService.put<Ward>(`/wards/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/wards/${id}`);
  },
};

// ==================== TARIFF PLANS ====================
export const tariffPlansApi = {
  getAll: (approvalStatusId?: number): Promise<TariffPlan[]> => {
    const query = approvalStatusId
      ? `?approvalStatusId=${approvalStatusId}`
      : "";
    return fetchService.get<TariffPlan[]>(`/tariff-plans${query}`);
  },

  getActive: (): Promise<TariffPlan[]> => {
    return fetchService.get<TariffPlan[]>("/tariff-plans/active");
  },

  getById: (id: number): Promise<TariffPlan> => {
    return fetchService.get<TariffPlan>(`/tariff-plans/${id}`);
  },

  create: (data: CreateTariffPlanDto): Promise<TariffPlan> => {
    return fetchService.post<TariffPlan>("/tariff-plans", data);
  },

  update: (id: number, data: UpdateTariffPlanDto): Promise<TariffPlan> => {
    return fetchService.put<TariffPlan>(`/tariff-plans/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/tariff-plans/${id}`);
  },

  calculateBill: (data: CalculateBillDto): Promise<BillCalculationResult> => {
    return fetchService.post<BillCalculationResult>(
      "/tariff-plans/calculate-bill",
      data
    );
  },

  approve: (id: number, data: ApproveTariffPlanDto): Promise<TariffPlan> => {
    return fetchService.put<TariffPlan>(`/tariff-plans/${id}/approve`, data);
  },

  reject: (id: number, data: RejectTariffPlanDto): Promise<TariffPlan> => {
    return fetchService.put<TariffPlan>(`/tariff-plans/${id}/reject`, data);
  },
};

// ==================== APPROVAL STATUS ====================
export const approvalStatusApi = {
  getAll: (): Promise<ApprovalStatus[]> => {
    return fetchService.get<ApprovalStatus[]>("/approval-status");
  },

  getById: (id: number): Promise<ApprovalStatus> => {
    return fetchService.get<ApprovalStatus>(`/approval-status/${id}`);
  },

  create: (data: CreateApprovalStatusDto): Promise<ApprovalStatus> => {
    return fetchService.post<ApprovalStatus>("/approval-status", data);
  },
};

// ==================== APPROVAL REQUESTS ====================
export const approvalRequestsApi = {
  getAll: (statusId?: number): Promise<ApprovalRequest[]> => {
    const query = statusId ? `?statusId=${statusId}` : "";
    return fetchService.get<ApprovalRequest[]>(`/approval-requests${query}`);
  },

  getPending: (): Promise<ApprovalRequest[]> => {
    return fetchService.get<ApprovalRequest[]>("/approval-requests/pending");
  },

  getById: (id: number): Promise<ApprovalRequest> => {
    return fetchService.get<ApprovalRequest>(`/approval-requests/${id}`);
  },

  create: (data: CreateApprovalRequestDto): Promise<ApprovalRequest> => {
    return fetchService.post<ApprovalRequest>("/approval-requests", data);
  },

  review: (
    id: number,
    data: ReviewApprovalRequestDto
  ): Promise<ApprovalRequest> => {
    return fetchService.put<ApprovalRequest>(
      `/approval-requests/${id}/review`,
      data
    );
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/approval-requests/${id}`);
  },
};

// ==================== CONSUMPTION ====================
export const consumptionApi = {
  getAll: (): Promise<Consumption[]> => {
    return fetchService.get<Consumption[]>("/consumption");
  },

  getById: (id: number): Promise<Consumption> => {
    return fetchService.get<Consumption>(`/consumption/${id}`);
  },

  create: (data: CreateConsumptionDto): Promise<Consumption> => {
    return fetchService.post<Consumption>("/consumption", data);
  },

  update: (id: number, data: UpdateConsumptionDto): Promise<Consumption> => {
    return fetchService.put<Consumption>(`/consumption/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/consumption/${id}`);
  },

  approve: (id: number, data: ApproveConsumptionDto): Promise<Consumption> => {
    return fetchService.put<Consumption>(`/consumption/${id}/approve`, data);
  },

  reject: (id: number, data: ApproveConsumptionDto): Promise<Consumption> => {
    return fetchService.put<Consumption>(`/consumption/${id}/reject`, data);
  },
};

// ==================== WATER BILLS ====================
export const waterBillsApi = {
  getAll: (): Promise<WaterBill[]> => {
    return fetchService.get<WaterBill[]>("/water-bills");
  },

  getById: (id: number): Promise<WaterBill> => {
    return fetchService.get<WaterBill>(`/water-bills/${id}`);
  },

  create: (data: CreateWaterBillDto): Promise<WaterBill> => {
    return fetchService.post<WaterBill>("/water-bills", data);
  },

  update: (id: number, data: UpdateWaterBillDto): Promise<WaterBill> => {
    return fetchService.put<WaterBill>(`/water-bills/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/water-bills/${id}`);
  },

  calculate: (data: CalculateBillDto): Promise<BillCalculationResult> => {
    return fetchService.post<BillCalculationResult>(
      "/water-bills/calculate",
      data
    );
  },

  markPaid: (id: number): Promise<WaterBill> => {
    return fetchService.put<WaterBill>(`/water-bills/${id}/mark-paid`, {});
  },
};

// ==================== AUDIT LOGS ====================
export const auditLogsApi = {
  getAll: (): Promise<AuditLog[]> => {
    return fetchService.get<AuditLog[]>("/audit-logs");
  },

  getById: (id: number): Promise<AuditLog> => {
    return fetchService.get<AuditLog>(`/audit-logs/${id}`);
  },

  recordForRecord: (
    tablename: string,
    recordid: number,
    data: CreateAuditLogDto
  ): Promise<AuditLog> => {
    return fetchService.post<AuditLog>(
      `/audit-logs/record/${tablename}/${recordid}`,
      data
    );
  },

  create: (data: CreateAuditLogDto): Promise<AuditLog> => {
    return fetchService.post<AuditLog>("/audit-logs", data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/audit-logs/${id}`);
  },
};

// ==================== NOTIFICATIONS ====================
export const notificationsApi = {
  getAll: (): Promise<Notification[]> => {
    return fetchService.get<Notification[]>("/notifications");
  },

  getById: (id: number): Promise<Notification> => {
    return fetchService.get<Notification>(`/notifications/${id}`);
  },

  getUnreadByUser: (userId: number): Promise<Notification[]> => {
    return fetchService.get<Notification[]>(
      `/notifications/user/${userId}/unread`
    );
  },

  getUnreadCount: (userId: number): Promise<number> => {
    return fetchService.get<number>(`/notifications/user/${userId}/count`);
  },

  create: (data: CreateNotificationDto): Promise<Notification> => {
    return fetchService.post<Notification>("/notifications", data);
  },

  update: (id: number, data: UpdateNotificationDto): Promise<Notification> => {
    return fetchService.put<Notification>(`/notifications/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/notifications/${id}`);
  },

  markAsRead: (id: number): Promise<Notification> => {
    return fetchService.put<Notification>(`/notifications/${id}/read`, {});
  },

  markAllAsRead: (userId: number): Promise<void> => {
    return fetchService.put<void>(`/notifications/user/${userId}/read-all`, {});
  },
};

// Export all APIs as a single object for convenience
export const api = {
  admins: adminsApi,
  users: usersApi,
  roles: rolesApi,
  cityCorporations: cityCorporationsApi,
  zones: zonesApi,
  wards: wardsApi,
  tariffPlans: tariffPlansApi,
  approvalStatus: approvalStatusApi,
  approvalRequests: approvalRequestsApi,
  consumption: consumptionApi,
  waterBills: waterBillsApi,
  auditLogs: auditLogsApi,
  notifications: notificationsApi,
};

export default api;

