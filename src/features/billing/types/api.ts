// Partner billing (Sprint 5): admin-managed plans, subscription records,
// upgrade requests, billing alerts and loyalty scan bundles.
// Backed by /api/admin/plans, /api/admin/subscriptions, /api/admin/upgrade-requests,
// /api/admin/billing-alerts and /api/partners/{agreementId}/bundles | billing-model.
// The existing payment engine (/api/subscriptions) still decides what is on.

import type { PayerRef, PaymentMethod } from "../../subscriptions/types/api";

export type PlanCategory = "Subscription" | "Loyalty";
export type BillingProviderType = "ChargingPoint" | "ServiceProvider";
export const BILLING_PROVIDER_TYPES: BillingProviderType[] = ["ChargingPoint", "ServiceProvider"];

/** Ties a subscription plan to the existing engine rows. */
export const LEGACY_ENTITY_TYPES = ["StationPremium", "ServiceProviderPremium", "OcppConnect"] as const;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// ── Plans ────────────────────────────────────────────────────────────

export interface PointsTier {
  fromJod: number;
  /** Null on the last (open-ended) tier only. */
  toJod: number | null;
  points: number;
}

export interface PointsRule {
  mode: "Fixed" | "Tiered";
  fixedPoints?: number | null;
  tiers?: PointsTier[] | null;
}

export interface PriceOptionDto {
  id: number;
  months?: number | null;
  priceJod: number;
  scans?: number | null;
  isUnlimited: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface PlanDto {
  id: number;
  key: string;
  category: PlanCategory;
  name: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  appliesTo: string[];
  features: string[];
  includesPlanIds: number[];
  legacyEntityTypes: string[];
  priceOptions: PriceOptionDto[];
  pointsRule?: PointsRule | null;
  trialDays: number;
  trialScans: number;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  badgeColor?: string | null;
  dailySoftCap?: number | null;
  targetMarginPercent?: number | null;
  subscriberCount: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface PriceOptionInput {
  /** With an id the option is updated; without one it is added. Left-out options are retired. */
  id?: number | null;
  months?: number | null;
  priceJod: number;
  scans?: number | null;
  sortOrder?: number | null;
}

export interface PlanInput {
  key: string;
  category: PlanCategory;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  appliesTo: string[];
  features: string[];
  includesPlanIds: number[];
  legacyEntityTypes: string[];
  priceOptions: PriceOptionInput[];
  pointsRule?: PointsRule | null;
  trialDays: number;
  trialScans: number;
  isActive: boolean;
  isVisible: boolean;
  sortOrder: number;
  badgeColor?: string | null;
  dailySoftCap?: number | null;
  targetMarginPercent?: number | null;
  /** PUT only: kept in the change log. */
  note?: string | null;
}

export interface PlanChange {
  field: string;
  from?: unknown;
  to?: unknown;
  added?: string[] | null;
  removed?: string[] | null;
}

export interface PlanSaveResult {
  plan: PlanDto;
  changes: PlanChange[];
  /** Feature edits apply at once to this many current subscribers. */
  affectedSubscribers: number;
  /** Price / rule edits apply to new subscriptions and renewals only. */
  pricingChangedForNewOnly: boolean;
}

export interface PlanChangeLogDto {
  id: number;
  planId: number;
  changedByUserId?: number | null;
  changedByName?: string | null;
  changedAt: string;
  changes: PlanChange[];
  note?: string | null;
}

export interface PlanSubscriberDto {
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
  planSubscriptionId?: number | null;
  subscriptionId?: number | null;
  status: string;
  expiresAt?: string | null;
  isTrial: boolean;
  scansRemaining?: number | null;
}

export interface PlanFeatureDto {
  key: string;
  name: string;
  nameAr: string;
  nameEn: string;
}

// ── Margin calculator ────────────────────────────────────────────────

export interface AmountMixEntry {
  fromJod: number;
  percent: number;
}

export interface MarginCheckRequest {
  priceJod: number;
  scans?: number | null;
  months?: number | null;
  pointsRule: PointsRule;
  amountMix?: AmountMixEntry[] | null;
  providerId?: number | null;
  providerType?: BillingProviderType | null;
  targetMarginPercent?: number | null;
  expectedMonthlyScans?: number | null;
}

export interface MarginCheckResult {
  avgPointsPerScan: number;
  pointValueJod: number;
  costPerScanJod: number;
  pricePerScanJod?: number | null;
  breakEvenScans?: number | null;
  recommendedScans?: number | null;
  scansAboveBreakEven?: number | null;
  breakEvenScansPerMonth?: number | null;
  suggestedDailySoftCap?: number | null;
  ok: boolean;
  targetMarginPercent: number;
  /** manual | provider | equal | fixed */
  mixSource: string;
  amountMix: AmountMixEntry[];
  warning?: string | null;
}

// ── Subscription records ─────────────────────────────────────────────

export type PlanSubscriptionStatus =
  | "Active"
  | "ExpiringSoon"
  | "InGrace"
  | "Expired"
  | "SwitchedOff"
  | "Scheduled"
  | "Exhausted"
  | "Cancelled"
  | "Upgraded"
  | "Renewed";

export interface PriceOptionSnapshot {
  months?: number | null;
  priceJod: number;
  scans?: number | null;
}

export interface PlanSubscriptionDto {
  id: number;
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
  planId: number;
  planKey: string;
  planCategory: PlanCategory;
  planName: string;
  planNameAr: string;
  planNameEn: string;
  priceOptionId?: number | null;
  priceOptionSnapshot?: PriceOptionSnapshot | null;
  pointsRuleSnapshot?: PointsRule | null;
  isTrial: boolean;
  startsAt: string;
  endsAt?: string | null;
  scansIncluded?: number | null;
  scansUsed: number;
  scansRemaining?: number | null;
  scansCarriedOver: number;
  status: PlanSubscriptionStatus;
  isOn: boolean;
  graceEndsAt?: string | null;
  pricePaidJod: number;
  creditAppliedJod: number;
  paymentId?: number | null;
  paymentReferenceNo?: string | null;
  receiptDownloadPath?: string | null;
  subscriptionId?: number | null;
  walletTransactionId?: number | null;
  upgradedFromId?: number | null;
  /** payment | admin | trial | bundle | upgrade | migration */
  source: string;
  createdByUserId?: number | null;
  createdAt: string;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  note?: string | null;
}

/** Payment taken with a subscription (recorded through the existing payment engine). */
export interface AdminPaymentInput {
  /** Defaults to the option price (minus any upgrade credit). */
  amount?: number | null;
  method: PaymentMethod;
  /** Jordan local time, no offset. */
  paidDate: string;
  payer: PayerRef;
  currency?: string | null;
  note?: string | null;
  receiptImageFileName?: string | null;
}

export interface CreatePlanSubscriptionRequest {
  providerType: BillingProviderType;
  providerId: number;
  planId: number;
  priceOptionId?: number | null;
  startsAt?: string | null;
  payment?: AdminPaymentInput | null;
  isTrial: boolean;
  upgradeRequestId?: number | null;
  note?: string | null;
}

export interface UpgradePlanSubscriptionRequest {
  planId: number;
  priceOptionId: number;
  payment?: AdminPaymentInput | null;
  note?: string | null;
}

export interface BreakEvenDto {
  planSubscriptionId: number;
  /** total (scan bundle) | month (unlimited: this Jordan month) */
  period: string;
  scansUsed: number;
  breakEvenScans?: number | null;
  percent: number;
  /** ok | warning (≥ 80%) | over (> 100%) */
  state: "ok" | "warning" | "over" | string;
  avgPointsPerScan: number;
  costPerScanJod: number;
  priceJod: number;
  avgSource: string;
}

// ── Upgrade requests / alerts ────────────────────────────────────────

export type UpgradeRequestStatus = "Pending" | "Fulfilled" | "Rejected";
export const UPGRADE_REQUEST_STATUSES: UpgradeRequestStatus[] = ["Pending", "Fulfilled", "Rejected"];

export interface UpgradeRequestDto {
  id: number;
  providerType: BillingProviderType;
  providerId: number;
  providerName?: string | null;
  planId: number;
  /** The plan key (premium, connect, loyalty_bundle_400, …). */
  tier: string;
  planName: string;
  /** upgrade | renew | bundle */
  kind: string;
  months?: number | null;
  priceOptionId?: number | null;
  note?: string | null;
  status: UpgradeRequestStatus;
  requestedByUserId: number;
  requestedByName?: string | null;
  /** E.164 */
  requestedByPhone?: string | null;
  createdAt: string;
  handledByUserId?: number | null;
  handledAt?: string | null;
  rejectReason?: string | null;
  fulfilledPaymentId?: number | null;
  fulfilledPlanSubscriptionId?: number | null;
}

export interface BillingAlertDto {
  id: number;
  /** adminSoftCap | adminBreakEven | upgradeRequest */
  kind: string;
  providerType?: BillingProviderType | null;
  providerId?: number | null;
  providerName?: string | null;
  planSubscriptionId?: number | null;
  title?: string | null;
  body?: string | null;
  createdAt: string;
  acknowledgedAt?: string | null;
}

// ── Scan bundles on a partner agreement ──────────────────────────────

export type BillingModel = "percentage" | "bundle";

export interface LoyaltyBundleDto {
  planSubscriptionId: number;
  planId: number;
  planKey: string;
  planName: string;
  /** Null = unlimited scanning. */
  scansTotal?: number | null;
  scansUsed: number;
  scansRemaining?: number | null;
  percentRemaining?: number | null;
  isUnlimited: boolean;
  isTrial: boolean;
  startsAt: string;
  endsAt?: string | null;
  /** active | low | exhausted | expired */
  state: string;
}

export interface AgreementBundlesDto {
  agreementId: number;
  providerType: BillingProviderType;
  providerId: number;
  billingModel: BillingModel;
  minimumTransactionAmount?: number | null;
  current?: LoyaltyBundleDto | null;
  history: PlanSubscriptionDto[];
}

export interface SetBillingModelResult {
  agreementId: number;
  billingModel: BillingModel;
  minimumTransactionAmount?: number | null;
  /** Codes created before the switch that still complete on percentage. */
  openPercentageCodes: number;
  bundle?: LoyaltyBundleDto | null;
}
