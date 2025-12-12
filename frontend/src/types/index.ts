// API Response Types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  statusCode: number;
  message: string;
  data?: T;
  timestamp?: string;
  path?: string;
}

// Admin Types
export interface Admin {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  roleId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  roleId: number;
}

export interface UpdateAdminDto {
  fullName?: string;
  email?: string;
  phone?: string;
}

export interface LoginAdminDto {
  email: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// User Types
export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  hourseType: string;
  meterNo: string;
  installDate: string;
  zoneId: number;
  wardId: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  hourseType: string;
  meterNo: string;
  installDate: string;
  zoneId: number;
  wardId: number;
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
  hourseType?: string;
  meterNo?: string;
  installDate?: string;
  zoneId?: number;
  wardId?: number;
  status?: string;
}

// Role Types
export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

// City Corporation Types
export interface CityCorporation {
  id: number;
  name: string;
  code: string;
  address?: string;
  createdAt?: string;
}

export interface CreateCityCorporationDto {
  name: string;
  code: string;
  address?: string;
}

export interface UpdateCityCorporationDto {
  name?: string;
  code?: string;
  address?: string;
}

// Zone Types
export interface Zone {
  id: number;
  zoneNo: string;
  name: string;
  cityName: string;
  tariffCategory: string;
  cityCorporationId: number;
  createdAt?: string;
}

export interface CreateZoneDto {
  name: string;
  zoneNo: string;
  cityName: string;
  tariffCategory: string;
  cityCorporationId: number;
}

export interface UpdateZoneDto {
  name?: string;
  zoneNo?: string;
  cityName?: string;
  tariffCategory?: string;
  cityCorporationId?: number;
}

// Ward Types
export interface Ward {
  id: number;
  wardNo: string;
  name: string;
  tariffMultiplier: number;
  zoneId: number;
  createdAt?: string;
}

export interface CreateWardDto {
  name: string;
  wardNo: string;
  tariffMultiplier: number;
  zoneId: number;
}

export interface UpdateWardDto {
  name?: string;
  wardNo?: string;
  tariffMultiplier?: number;
  zoneId?: number;
}

// Tariff Slab Types
export interface TariffSlab {
  id: number;
  tariffPlanId: number;
  minConsumption: number;
  maxConsumption: number | null;
  ratePerUnit: number;
  slabOrder: number;
}

export interface TariffSlabDto {
  minConsumption: number;
  maxConsumption?: number | null;
  ratePerUnit: number;
  slabOrder: number;
}

// Tariff Plan Types
export interface TariffPlan {
  id: number;
  name: string;
  description?: string;
  createdBy: number;
  approvedBy?: number | null;
  approvalStatusId: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  slabs?: TariffSlab[];
  createdAt?: string;
}

export interface CreateTariffPlanDto {
  name: string;
  description?: string;
  createdBy: number;
  effectiveFrom: string;
  effectiveTo?: string;
  slabs: TariffSlabDto[];
}

export interface UpdateTariffPlanDto {
  name?: string;
  description?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  slabs?: TariffSlabDto[];
}

export interface CalculateBillDto {
  tariffPlanId: number;
  consumption: number;
}

export interface BillCalculationResult {
  totalAmount: number;
  consumption: number;
  breakdown: {
    slab: string;
    units: number;
    rate: number;
    amount: number;
  }[];
}

export interface ApproveTariffPlanDto {
  approvedBy: number;
  comments?: string;
}

export interface RejectTariffPlanDto {
  rejectedBy: number;
  comments?: string;
}

// Approval Status Types
export interface ApprovalStatus {
  id: number;
  name: string;
  description?: string;
}

export interface CreateApprovalStatusDto {
  name: string;
  description?: string;
}

// Approval Request Types
export interface ApprovalRequest {
  id: number;
  moduleName: string;
  recordId: number;
  requestedBy: number;
  reviewedBy?: number | null;
  approvalStatusId: number;
  comments?: string | null;
  requestedAt: string;
  reviewedAt?: string | null;
  // Relations (populated by backend)
  requester?: Admin;
  reviewer?: Admin | null;
  approvalStatus?: ApprovalStatus;
}

export interface CreateApprovalRequestDto {
  moduleName: string;
  recordId: number;
  requestedBy: number;
  comments?: string;
}

export interface ReviewApprovalRequestDto {
  reviewedBy: number;
  status: string; // 'Approved' or 'Rejected'
  comments?: string;
}

// Consumption Types
export interface Consumption {
  id: number;
  userId: number;
  createdBy: number;
  billMonth: string;
  currentReading: number;
  previousReading?: number;
  consumption?: number;
  status?: string;
  createdAt?: string;
}

export interface CreateConsumptionDto {
  userId: number;
  createdBy: number;
  billMonth: string;
  currentReading: number;
  previousReading?: number;
}

export interface UpdateConsumptionDto {
  currentReading?: number;
  previousReading?: number;
  billMonth?: string;
}

export interface ApproveConsumptionDto {
  approvedBy: number;
  comments?: string;
}

// Water Bill Types
export interface WaterBill {
  id: number;
  userId: number;
  tariffPlanId: number;
  consumptionId: number;
  totalBill: number;
  breakdown?: any;
  billMonth: string;
  status: string;
  createdAt?: string;
}

export interface CreateWaterBillDto {
  userId: number;
  tariffPlanId: number;
  consumptionId: number;
  totalBill: number;
  breakdown?: any;
  billMonth: string;
  status?: string;
}

export interface UpdateWaterBillDto {
  totalBill?: number;
  breakdown?: any;
  billMonth?: string;
  status?: string;
}

// Audit Log Types
export interface AuditLog {
  id: number;
  userId?: number | null;
  action: string;
  tableName: string;
  recordId: number;
  oldData?: any | null;
  newData?: any | null;
  ipAddress?: string | null;
  createdAt: string;
  // Relations (populated by backend)
  user?: User | null;
}

export interface CreateAuditLogDto {
  userId?: number;
  adminId?: number;
  action: string;
  module: string;
  tableName?: string;
  recordId?: number;
  details: string;
  ipAddress?: string;
  userAgent?: string;
}

// Notification Types
export interface Notification {
  id: number;
  userId?: number;
  adminId?: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationDto {
  userId?: number;
  adminId?: number;
  title: string;
  message: string;
  type: string;
}

export interface UpdateNotificationDto {
  title?: string;
  message?: string;
  type?: string;
  isRead?: boolean;
}
