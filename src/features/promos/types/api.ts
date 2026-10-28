// Promo codes — campaigns, unique / public codes, assignment and the report.
// Backed by /api/admin/promos and /api/admin/user-promos (admin only).
// Enum fields are strings in JSON; dates are Jordan local time.

export type PromoEffectType = "DiscountPercent" | "DiscountFixed" | "PointsMultiplier" | "BonusPoints";
export const PROMO_EFFECT_TYPES: PromoEffectType[] = ["DiscountPercent", "DiscountFixed", "PointsMultiplier", "BonusPoints"];

export type PromoTargetScope = "None" | "All" | "Selected";
export const PROMO_TARGET_SCOPES: PromoTargetScope[] = ["None", "All", "Selected"];

export type PromoCodeMode = "Public" | "Unique";
export type UserPromoStatus = "Available" | "Used" | "Expired" | "Revoked";
export const USER_PROMO_STATUSES: UserPromoStatus[] = ["Available", "Used", "Expired", "Revoked"];
export type UserPromoSource = "Code" | "Assigned";
export type PromoAssignTarget = "All" | "City" | "Users";

/** Version 1 applies to partner scans (PTR- codes) only. */
export const PROMO_APPLIES_TO = ["PartnerScan"] as const;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages?: number;
}

export interface AdminPromoCampaignDto {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  scopeLabelAr?: string | null;
  scopeLabelEn?: string | null;
  cableSharePercent: number;
  cableBudgetJod?: number | null;
  cableSpentJod: number;
  budgetLeftJod?: number | null;
  stationsScope: PromoTargetScope;
  stationIds: number[];
  serviceProvidersScope: PromoTargetScope;
  serviceProviderIds: number[];
  effectType: PromoEffectType;
  effectValue: number;
  maxDiscountJod?: number | null;
  appliesTo: string[];
  serviceCategoryIds: number[];
  cities: string[];
  minAmountJod?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  validDaysAfterClaim?: number | null;
  totalLimit?: number | null;
  perUserLimit: number;
  newUsersOnly: boolean;
  codeMode: PromoCodeMode;
  publicCode?: string | null;
  claimsCount: number;
  usesCount: number;
  codesCount: number;
  codesClaimed: number;
  isActive: boolean;
  /** "BudgetExhausted" when the server switched it off. */
  deactivatedReason?: string | null;
  /** True after the first use: type / value / cap / Cable's share are locked. */
  effectLocked: boolean;
  createdByUserId?: number | null;
  createdAt: string;
}

export interface PromoCampaignInput {
  titleAr: string;
  titleEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  scopeLabelAr?: string | null;
  scopeLabelEn?: string | null;
  cableSharePercent: number;
  cableBudgetJod?: number | null;
  stationsScope: PromoTargetScope;
  stationIds: number[];
  serviceProvidersScope: PromoTargetScope;
  serviceProviderIds: number[];
  effectType: PromoEffectType;
  effectValue: number;
  maxDiscountJod?: number | null;
  appliesTo: string[];
  serviceCategoryIds: number[];
  cities: string[];
  minAmountJod?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  validDaysAfterClaim?: number | null;
  totalLimit?: number | null;
  perUserLimit?: number | null;
  newUsersOnly: boolean;
  codeMode: PromoCodeMode;
  publicCode?: string | null;
  isActive: boolean;
}

export interface GeneratePromoCodesResult {
  generated: number;
  totalCodes: number;
  batchId: string;
}

export interface AssignPromoRequest {
  target: PromoAssignTarget;
  cities?: string[];
  userIds?: number[];
  phones?: string[];
}

export interface AssignPromoResult {
  assigned: number;
  skipped: number;
  batchId: string;
}

export interface PromoReportProviderDto {
  providerType: "ChargingPoint" | "ServiceProvider" | string;
  providerId: number;
  providerName?: string | null;
  uses: number;
  originalAmountJod: number;
  discountJod: number;
  cableShareJod: number;
  providerShareJod: number;
  bonusPoints: number;
}

export interface PromoReportDto {
  campaignId: number;
  title: string;
  claims: number;
  assigned: number;
  available: number;
  used: number;
  expired: number;
  revoked: number;
  uses: number;
  originalAmountJod: number;
  totalDiscountJod: number;
  cableShareJod: number;
  providersShareJod: number;
  bonusPointsGiven: number;
  budgetJod?: number | null;
  cableSpentJod: number;
  budgetLeftJod?: number | null;
  byProvider: PromoReportProviderDto[];
}

export interface AdminUserPromoDto {
  id: number;
  userId: number;
  userName?: string | null;
  userPhone?: string | null;
  campaignId: number;
  campaignTitle: string;
  code?: string | null;
  source: UserPromoSource;
  status: UserPromoStatus;
  claimedAt: string;
  expiresAt?: string | null;
  usedAt?: string | null;
  revokedAt?: string | null;
  revokeReason?: string | null;
}
