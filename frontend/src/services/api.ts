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
  Wasa,
  CreateWasaDto,
  UpdateWasaDto,
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
  ZoneScoringRuleSet,
  ZoneScore,
  Area,
  CreateZoneScoringRuleSetDto,
  UpdateZoneScoringRuleSetDto,
  CreateAreaDto,
  UpdateAreaDto,
  Meter,
  CreateMeterDto,
  UpdateMeterDto,
  TariffCategory,
  CreateTariffCategoryDto,
  UpdateTariffCategoryDto,
  TariffCategorySettings,
  CreateTariffCategorySettingsDto,
  UpdateTariffCategorySettingsDto,
  TariffPolicy,
  CreateTariffPolicyDto,
  UpdateTariffPolicyDto,
  TariffThresholdSlab,
  CreateTariffThresholdSlabDto,
  UpdateTariffThresholdSlabDto,
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
    // No timeout for login - Render backend needs time to wake up from dormancy
    return fetchService.post<Admin>("/admins/login", data, { timeout: 0 });
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

  updateStatus: (account: string, activeStatus: 'Active' | 'Inactive'): Promise<User> => {
    return fetchService.put<User>(`/users/${account}/status`, { activeStatus });
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

// ==================== WASAS ====================
export const wasasApi = {
  getAll: (): Promise<Wasa[]> => {
    return fetchService.get<Wasa[]>("/wasa");
  },

  getById: (id: number): Promise<Wasa> => {
    return fetchService.get<Wasa>(`/wasa/${id}`);
  },

  create: (data: CreateWasaDto): Promise<Wasa> => {
    return fetchService.post<Wasa>("/wasa", data);
  },

  update: (
    id: number,
    data: UpdateWasaDto
  ): Promise<Wasa> => {
    return fetchService.put<Wasa>(`/wasa/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/wasa/${id}`);
  },
};

// ==================== ZONES ====================
export const zonesApi = {
  getAll: (wasaId?: number): Promise<Zone[]> => {
    const query = wasaId
      ? `?wasaId=${wasaId}`
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
  getAll: (optionsOrStatusId?: { statusId?: number; moduleName?: string } | number): Promise<ApprovalRequest[]> => {
    const params: string[] = [];
    
    // Handle backward compatibility: if it's a number, treat it as statusId
    if (typeof optionsOrStatusId === 'number') {
      params.push(`statusId=${optionsOrStatusId}`);
    } else if (optionsOrStatusId) {
      if (optionsOrStatusId.statusId) {
        params.push(`statusId=${optionsOrStatusId.statusId}`);
      }
      if (optionsOrStatusId.moduleName) {
        params.push(`moduleName=${encodeURIComponent(optionsOrStatusId.moduleName)}`);
      }
    }
    
    const query = params.length > 0 ? `?${params.join('&')}` : "";
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
  getAll: (options?: { account?: number; billMonth?: string; approvalStatus?: 'Pending' | 'Approved' | 'Rejected' }): Promise<Consumption[]> => {
    const params: string[] = [];
    if (options?.account) params.push(`account=${options.account}`);
    if (options?.billMonth) params.push(`billMonth=${options.billMonth}`);
    if (options?.approvalStatus) params.push(`approvalStatus=${options.approvalStatus}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return fetchService.get<Consumption[]>(`/consumption${query}`);
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
  getAll: (userId?: number): Promise<WaterBill[]> => {
    const query = userId ? `?userId=${userId}` : "";
    return fetchService.get<WaterBill[]>(`/water-bills${query}`);
  },

  getById: (id: number): Promise<WaterBill> => {
    return fetchService.get<WaterBill>(`/water-bills/${id}`);
  },

  getByUserId: (userId: number): Promise<WaterBill[]> => {
    return fetchService.get<WaterBill[]>(`/water-bills?userId=${userId}`);
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

// ==================== ZONE SCORING ====================
export const zoneScoringApi = {
  getAll: (): Promise<ZoneScoringRuleSet[]> => {
    return fetchService.get<ZoneScoringRuleSet[]>('/zone-scoring');
  },

  getById: (id: number): Promise<ZoneScoringRuleSet> => {
    return fetchService.get<ZoneScoringRuleSet>(`/zone-scoring/${id}`);
  },

  create: (data: CreateZoneScoringRuleSetDto): Promise<ZoneScoringRuleSet> => {
    return fetchService.post<ZoneScoringRuleSet>('/zone-scoring', data);
  },

  update: (id: number, data: UpdateZoneScoringRuleSetDto): Promise<ZoneScoringRuleSet> => {
    return fetchService.put<ZoneScoringRuleSet>(`/zone-scoring/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/zone-scoring/${id}`);
  },

  // Publish endpoint - makes a ruleset active/published
  publish: (id: number): Promise<ZoneScoringRuleSet> => {
    return fetchService.patch<ZoneScoringRuleSet>(`/zone-scoring/publish/${id}`, {});
  },

  // Status endpoint - updates the status of a ruleset
  updateStatus: (id: number, status: string): Promise<ZoneScoringRuleSet> => {
    return fetchService.patch<ZoneScoringRuleSet>(`/zone-scoring/status/${id}`, { status });
  },

  // Get zone scores endpoint - returns calculated zone scores for all rulesets
  getScores: (): Promise<ZoneScore[]> => {
    return fetchService.get<ZoneScore[]>('/zone-scoring/scores');
  },
};

// ==================== AREA ====================
export const areaApi = {
  getAll: (): Promise<Area[]> => {
    return fetchService.get<Area[]>('/area');
  },

  getById: (id: number): Promise<Area> => {
    return fetchService.get<Area>(`/area/${id}`);
  },

  getByZone: (zoneId: number): Promise<Area[]> => {
    return fetchService.get<Area[]>(`/area/zone/${zoneId}`);
  },

  create: (data: CreateAreaDto): Promise<Area> => {
    return fetchService.post<Area>('/area', data);
  },

  update: (id: number, data: UpdateAreaDto): Promise<Area> => {
    return fetchService.put<Area>(`/area/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/area/${id}`);
  },
};

// ==================== METERS ====================
export const metersApi = {
  getAll: (): Promise<Meter[]> => {
    return fetchService.get<Meter[]>("/meters");
  },

  getById: (id: number): Promise<Meter> => {
    return fetchService.get<Meter>(`/meters/${id}`);
  },

  create: (data: CreateMeterDto): Promise<Meter> => {
    return fetchService.post<Meter>("/meters", data);
  },

  update: (id: number, data: UpdateMeterDto): Promise<Meter> => {
    return fetchService.put<Meter>(`/meters/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/meters/${id}`);
  },
};

// ==================== TARIFF CATEGORY ====================
export const tariffCategoryApi = {
  getAll: (settingsId?: number): Promise<TariffCategory[]> => {
    const query = settingsId ? `?settingsId=${settingsId}` : "";
    return fetchService.get<TariffCategory[]>(`/tariff-category${query}`);
  },

  getById: (id: number): Promise<TariffCategory> => {
    return fetchService.get<TariffCategory>(`/tariff-category/${id}`);
  },

  create: (data: CreateTariffCategoryDto): Promise<TariffCategory> => {
    return fetchService.post<TariffCategory>("/tariff-category", data);
  },

  update: (id: number, data: UpdateTariffCategoryDto): Promise<TariffCategory> => {
    return fetchService.put<TariffCategory>(`/tariff-category/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/tariff-category/${id}`);
  },
};

// ==================== TARIFF CATEGORY SETTINGS ====================
export const tariffCategorySettingsApi = {
  getAll: (): Promise<TariffCategorySettings[]> => {
    return fetchService.get<TariffCategorySettings[]>("/tariff-category-settings");
  },

  getActive: (): Promise<TariffCategorySettings> => {
    return fetchService.get<TariffCategorySettings>("/tariff-category-settings/active");
  },

  getById: (id: number): Promise<TariffCategorySettings> => {
    return fetchService.get<TariffCategorySettings>(`/tariff-category-settings/${id}`);
  },

  create: (data: CreateTariffCategorySettingsDto): Promise<TariffCategorySettings> => {
    return fetchService.post<TariffCategorySettings>("/tariff-category-settings", data);
  },

  update: (id: number, data: UpdateTariffCategorySettingsDto): Promise<TariffCategorySettings> => {
    return fetchService.put<TariffCategorySettings>(`/tariff-category-settings/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/tariff-category-settings/${id}`);
  },

  activate: (id: number): Promise<TariffCategorySettings> => {
    return fetchService.put<TariffCategorySettings>(`/tariff-category-settings/${id}/activate`, {});
  },
};

// ==================== TARIFF POLICY ====================
export const tariffPolicyApi = {
  getAll: (): Promise<TariffPolicy[]> => {
    return fetchService.get<TariffPolicy[]>("/tariff-policy");
  },

  getActive: (): Promise<TariffPolicy> => {
    return fetchService.get<TariffPolicy>("/tariff-policy/active");
  },

  getById: (id: number): Promise<TariffPolicy> => {
    return fetchService.get<TariffPolicy>(`/tariff-policy/${id}`);
  },

  create: (data: CreateTariffPolicyDto): Promise<TariffPolicy> => {
    return fetchService.post<TariffPolicy>("/tariff-policy", data);
  },

  update: (id: number, data: UpdateTariffPolicyDto): Promise<TariffPolicy> => {
    return fetchService.put<TariffPolicy>(`/tariff-policy/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/tariff-policy/${id}`);
  },

  activate: (id: number): Promise<TariffPolicy> => {
    return fetchService.patch<TariffPolicy>(`/tariff-policy/${id}/activate`, {});
  },
};

// ==================== TARIFF THRESHOLD SLABS ====================
export const tariffThresholdSlabsApi = {
  getAll: (isActive?: boolean): Promise<TariffThresholdSlab[]> => {
    const query = isActive !== undefined ? `?isActive=${isActive}` : "";
    return fetchService.get<TariffThresholdSlab[]>(`/tariff-threshold-slabs${query}`);
  },

  getById: (id: number): Promise<TariffThresholdSlab> => {
    return fetchService.get<TariffThresholdSlab>(`/tariff-threshold-slabs/${id}`);
  },

  create: (data: CreateTariffThresholdSlabDto): Promise<TariffThresholdSlab> => {
    return fetchService.post<TariffThresholdSlab>("/tariff-threshold-slabs", data);
  },

  update: (id: number, data: UpdateTariffThresholdSlabDto): Promise<TariffThresholdSlab> => {
    return fetchService.put<TariffThresholdSlab>(`/tariff-threshold-slabs/${id}`, data);
  },

  delete: (id: number): Promise<void> => {
    return fetchService.delete<void>(`/tariff-threshold-slabs/${id}`);
  },
};

// Export all APIs as a single object for convenience
export const api = {
  admins: adminsApi,
  users: usersApi,
  roles: rolesApi,
  wasas: wasasApi,
  zones: zonesApi,
  wards: wardsApi,
  tariffPlans: tariffPlansApi,
  approvalStatus: approvalStatusApi,
  approvalRequests: approvalRequestsApi,
  consumption: consumptionApi,
  waterBills: waterBillsApi,
  auditLogs: auditLogsApi,
  notifications: notificationsApi,
  zoneScoring: zoneScoringApi,
  area: areaApi,
  meters: metersApi,
  tariffCategory: tariffCategoryApi,
  tariffCategorySettings: tariffCategorySettingsApi,
  tariffPolicy: tariffPolicyApi,
  tariffThresholdSlabs: tariffThresholdSlabsApi,
};

export default api;

