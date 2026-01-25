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
  role?: Role; // Role relation from backend
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
  name?: string; // Alias for fullName for backward compatibility
  email: string;
  phone: string;
  address: string;
  hourseType: string;
  meterNo: string;
  installDate: string;
  zoneId: number;
  wardId: number;
  status: string;
  account?: string | number; // Account identifier (can be UUID string or number)
  landSizeDecimal?: number;
  numberOfStories?: number;
  numberOfFlats?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Nested meter DTO for user creation (no account field needed)
export interface CreateUserMeterDto {
  meterNo: number;
  meterStatus: string;
  sizeOfDia: string;
  meterInstallationDate?: string;
}

export interface CreateUserDto {
  name: string;
  address: string;
  inspCode: number;
  areaId: number;
  accountType: string;
  customerCategory: string;
  waterStatus: string;
  sewerStatus: string;
  landSizeDecimal?: number;
  numberOfStories?: number;
  numberOfFlats?: number;
  meter?: CreateUserMeterDto; // Optional nested meter object
}

export interface UpdateUserMeterDto {
  meterNo?: number;
  meterStatus?: string;
  sizeOfDia?: string;
  meterInstallationDate?: string;
}

export interface UpdateUserDto {
  name?: string;
  address?: string;
  inspCode?: number;
  areaId?: number;
  accountType?: string;
  customerCategory?: string;
  waterStatus?: string;
  sewerStatus?: string;
  landSizeDecimal?: number;
  numberOfStories?: number;
  numberOfFlats?: number;
  meter?: UpdateUserMeterDto; // Optional nested meter object for updates
}

export interface UpdateUserStatusDto {
  activeStatus: 'Active' | 'Inactive';
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
  cityCorporation?: CityCorporation; // Optional relation
  createdAt?: string;
}

export interface CreateZoneDto {
  name: string;
  zoneNo: string;
  cityName: string;
  cityCorporationId: number;
  // Note: tariffCategory is not in the DTO - backend rejects it
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
// Note: Backend uses statusName, but we support both for compatibility
export interface ApprovalStatus {
  id: number;
  name?: string; // Frontend type (may not match backend)
  statusName?: string; // Backend field name
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
  approvalStatusId?: number;
  approvalStatus?: ApprovalStatus;
  approvedBy?: number | null;
}

export interface CreateConsumptionDto {
  account: number; // Numeric ID (workaround: backend validation expects number but users have UUID strings)
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
  breakdown?: unknown;
  billMonth: string;
  status: string;
  createdAt?: string;
}

export interface CreateWaterBillDto {
  userId: number;
  tariffPlanId: number;
  consumptionId: number;
  totalBill: number;
  breakdown?: unknown;
  billMonth: string;
  status?: string;
}

export interface UpdateWaterBillDto {
  totalBill?: number;
  breakdown?: unknown;
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
  oldData?: unknown | null;
  newData?: unknown | null;
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

// Zone Scoring Types
export interface Area {
  id: number;
  name: string;
  zoneId: number;
  zone?: Zone; // Optional relation
  geojson: {
    type: string;
    coordinates: number[][][];
  };
}

export interface ScoringParam {
  id: number;
  area: Area;
  areaId: number;
  landHomeRate: string;
  landHomeRatePercentage: string;
  landRate: string;
  landRatePercentage: string;
  landTaxRate: string;
  landTaxRatePercentage: string;
  buildingTaxRateUpto120sqm: string;
  buildingTaxRateUpto120sqmPercentage: string;
  buildingTaxRateUpto200sqm: string;
  buildingTaxRateUpto200sqmPercentage: string;
  buildingTaxRateAbove200sqm: string;
  buildingTaxRateAbove200sqmPercentage: string;
  highIncomeGroupConnectionPercentage: string;
  geoMean: string;
  ruleSetId: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ZoneScoringRuleSet {
  id: number;
  title: string;
  description: string;
  status: string;
  scoringParams: ScoringParam[];
  effectiveFrom: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneScoringRuleSetDto {
  title: string;
  description?: string;
  status?: string;
  scoringParams?: CreateScoringParamDto[];
}

export interface UpdateZoneScoringRuleSetDto {
  title?: string;
  description?: string;
  status?: string;
  scoringParams?: CreateScoringParamDto[];
}

export interface CreateScoringParamDto {
  areaId: number;
  landHomeRate: string;
  landHomeRatePercentage: string;
  landRate: string;
  landRatePercentage: string;
  landTaxRate: string;
  landTaxRatePercentage: string;
  buildingTaxRateUpto120sqm: string;
  buildingTaxRateUpto120sqmPercentage: string;
  buildingTaxRateUpto200sqm: string;
  buildingTaxRateUpto200sqmPercentage: string;
  buildingTaxRateAbove200sqm: string;
  buildingTaxRateAbove200sqmPercentage: string;
  highIncomeGroupConnectionPercentage: string;
  geoMean: string;
}

export interface ZoneScore {
  id: number;
  area: Area;
  areaId: number;
  ruleSet: ZoneScoringRuleSet;
  ruleSetId: number;
  score: string;
  areaGeomean: string;
  zoneGeomean: string;
  averageGeomean: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaDto {
  name: string;
  geojson: {
    type: string;
    coordinates: number[][][];
  };
  zoneId?: number;
}

export interface UpdateAreaDto {
  name?: string;
  geojson?: {
    type: string;
    coordinates: number[][][];
  };
  zoneId?: number;
}

// Meter Types
export interface Meter {
  id: number;
  account: string; // UUID string
  userAccount?: string | number; // Alias for account for backward compatibility
  meterNo: number;
  meterStatus: string;
  sizeOfDia: string;
  meterInstallationDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMeterDto {
  account: string; // UUID string
  meterNo: number;
  meterStatus: string;
  sizeOfDia: string;
  meterInstallationDate?: string;
}

export interface UpdateMeterDto {
  meterNo?: number;
  meterStatus?: string;
  sizeOfDia?: string;
  meterInstallationDate?: string;
}

// Tariff Category Types
export interface TariffCategory {
  id: number;
  slNo: number;
  category: 'Domestic' | 'Commercial' | 'Industrial' | 'Government' | 'Community';
  name: string;
  lowerRange?: number;
  upperRange?: number;
  rangeDescription?: string;
  isBaseCategory: boolean;
  isFixedRate: boolean;
  isActive: boolean;
  settingsId: number;
  wasaTariff?: number;
  tubewellTariff?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTariffCategoryDto {
  slNo: number;
  category: 'Domestic' | 'Commercial' | 'Industrial' | 'Government' | 'Community';
  name: string;
  lowerRange?: number;
  upperRange?: number;
  rangeDescription?: string;
  isBaseCategory?: boolean;
  isFixedRate?: boolean;
  isActive?: boolean;
  settingsId: number;
}

export interface UpdateTariffCategoryDto {
  slNo?: number;
  category?: 'Domestic' | 'Commercial' | 'Industrial' | 'Government' | 'Community';
  name?: string;
  lowerRange?: number;
  upperRange?: number;
  rangeDescription?: string;
  isBaseCategory?: boolean;
  isFixedRate?: boolean;
  isActive?: boolean;
  settingsId?: number;
}

// Tariff Category Settings Types
export interface TariffCategorySettings {
  id: number;
  productionCost: number;
  baseRate: number;
  currentTariff: number;
  currentTubewellTariff: number;
  tubewellRatioStandard?: number;
  tubewellRatioCommercial?: number;
  aboveBaseIncreasePercent?: number;
  belowBaseDecreasePercent?: number;
  commercialIncreasePercent?: number;
  governmentIncreasePercent?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTariffCategorySettingsDto {
  productionCost: number;
  baseRate: number;
  currentTariff: number;
  currentTubewellTariff: number;
  tubewellRatioStandard?: number;
  tubewellRatioCommercial?: number;
  aboveBaseIncreasePercent?: number;
  belowBaseDecreasePercent?: number;
  commercialIncreasePercent?: number;
  governmentIncreasePercent?: number;
}

export interface UpdateTariffCategorySettingsDto {
  productionCost?: number;
  baseRate?: number;
  currentTariff?: number;
  currentTubewellTariff?: number;
  tubewellRatioStandard?: number;
  tubewellRatioCommercial?: number;
  aboveBaseIncreasePercent?: number;
  belowBaseDecreasePercent?: number;
  commercialIncreasePercent?: number;
  governmentIncreasePercent?: number;
}