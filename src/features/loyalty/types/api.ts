// ============================================
// Season DTOs
// ============================================

export interface SeasonDto {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSeasonRequest {
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  activateImmediately: boolean;
}

export interface EndSeasonResult {
  usersProcessed: number;
  totalBonusPointsAwarded: number;
}

// ============================================
// Reward DTOs
// ============================================

export enum RewardType {
  Discount = 1,
  FreeCharge = 2,
  FreeService = 3,
  PriorityAccess = 4,
  Badge = 5,
}

export interface RewardDto {
  id: number;
  name: string;
  description: string | null;
  pointsCost: number;
  rewardType: RewardType;
  rewardValue: string | null;
  providerType: string | null;
  providerId: number | null;
  serviceCategoryId: number | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  imageUrl: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRewardRequest {
  name: string;
  description?: string | null;
  pointsCost: number;
  rewardType: RewardType;
  rewardValue?: string | null;
  providerType?: string | null;
  providerId?: number | null;
  serviceCategoryId?: number | null;
  maxRedemptions?: number | null;
  imageUrl?: string | null;
  validFrom: string;
  validTo: string;
}

export interface UpdateRewardRequest {
  name: string;
  description?: string | null;
  pointsCost: number;
  rewardType: RewardType;
  rewardValue?: string | null;
  providerType?: string | null;
  providerId?: number | null;
  serviceCategoryId?: number | null;
  maxRedemptions?: number | null;
  imageUrl?: string | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
}

// ============================================
// Redemption DTOs
// ============================================

export enum RedemptionStatus {
  Pending = 1,
  Fulfilled = 2,
  Cancelled = 3,
}

export interface RedemptionDto {
  id: number;
  rewardName: string;
  userId: number;
  userName: string;
  pointsSpent: number;
  status: RedemptionStatus;
  redemptionCode: string;
  providerType: string | null;
  providerId: number | null;
  providerName: string | null;
  redeemedAt: string;
  fulfilledAt: string | null;
}

export interface ProviderRedemptionDto {
  id: number;
  userName: string;
  rewardName: string;
  pointsSpent: number;
  status: RedemptionStatus;
  redemptionCode: string;
  redeemedAt: string;
  fulfilledAt: string | null;
}

/** One row from GET /api/loyalty/GetLeaderboard — current-season ranking. */
export interface LeaderboardEntryDto {
  rank: number;
  userId: number;
  userName: string | null;
  seasonPointsEarned: number;
  tierName: string | null;
}

// ============================================
// Admin loyalty (2026-07-07 BE — Phases 1–3)
// ============================================

/** Standard paged envelope returned by admin list endpoints. */
export interface Paged<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/** Admin points-ledger row — PointsHistoryDto enriched with the user + admin actor. */
export interface AdminPointsHistoryDto {
  id: number;
  userId: number;
  userName: string | null;
  transactionType: number; // 1=Earn 2=Redeem 3=Expired 4=AdminAdjust 5=SeasonBonus
  points: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  actionName: string | null;
  providerName: string | null;
  performedByUserId: number | null;
  performedByUserName: string | null;
  createdAt: string;
}

/** B1 — one row from GET /api/loyalty/admin/GetProviderActivity. */
export interface ProviderActivityDto {
  activityType: "Offer" | "Partner" | "Redemption";
  transactionId: number;
  userId: number;
  userName: string | null;
  code: string | null;
  status: number;
  statusName: string | null;
  points: number;          // signed: earned (+) / spent (−)
  amount: number | null;
  currencyCode: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** B3 — GET /api/loyalty/admin/GetTransactionDetail. */
export interface TransactionDetailDto {
  activityType: string;
  transactionId: number;
  status: number;
  statusName: string | null;
  user: { userId: number; userName: string | null; phone: string | null };
  provider: { providerType: string; providerId: number; providerName: string | null };
  code: string | null;
  amount: number | null;
  currencyCode: string | null;
  commissionAmount: number | null;
  points: number;
  note: string | null;
  performedByUserId: number | null;
  performedByUserName: string | null;
  createdAt: string;
  completedAt: string | null;
}

/** GET /api/loyalty/admin/GetAllTiers */
export interface TierDto {
  id: number;
  name: string;
  minPoints: number;
  multiplier: number;
  bonusPoints: number;
  iconUrl: string | null;
  isActive: boolean;
}

/** GET /api/loyalty/admin/GetRewardPerformance */
export interface RewardPerformanceDto {
  rewardId: number;
  rewardName: string;
  isActive: boolean;
  pointsCost: number;
  redemptions: number;
  cancelledRedemptions: number;
  pointsSpent: number;
  remainingStock: number | null;
}

/** GET /api/loyalty/admin/GetLoyaltySummary — program-health dashboard. */
export interface LoyaltySummaryDto {
  outstandingLiabilityPoints: number;
  estimatedLiabilityValue: number;
  liabilityCurrencyCode: string;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  totalPointsExpired: number;
  totalPointsAdminAdjusted: number;
  redemptionRatePct: number;
  totalRedemptions: number;
  activeMembers: number;
  blockedUsers: number;
  issuedVsRedeemedDaily: { day: string; issued: number; redeemed: number }[];
  topEarners: { userId: number; userName: string | null; points: number }[];
}

// ============================================
// Point Adjustment DTOs
// ============================================

export interface AdjustPointsRequest {
  userId: number;
  points: number; // Positive = add, Negative = deduct
  note: string;
  /** K2 — optional reason code validated against GetAdjustmentReasons. */
  reasonCode?: string | null;
}

/** J1 — award points to a whole segment. At least one filter is required. */
export interface BulkAwardRequest {
  carTypeId?: number | null;
  carModelId?: number | null;
  city?: string | null;
  tierId?: number | null;
  points: number; // 1–100,000
  note: string;
}

/** J1 — result of a bulk award. */
export interface BulkAwardResult {
  targetedUsers: number;
  awardedUsers: number;
  skippedBlockedUsers: number;
  pointsAwardedTotal: number;
}

/** K1 — reverse (undo) a transaction, points-side only. */
export interface ReverseTransactionRequest {
  activityType: "Offer" | "Partner" | "Redemption" | "PointsAdjustment";
  transactionId: number;
  reason: string;
}

/** K1 — result of a reversal. */
export interface ReverseTransactionResult {
  reversalTransactionId: number;
  pointsDelta: number;
  newBalance: number;
}

/** L1 — a flagged-activity row from the heuristic fraud queue. */
export interface FlaggedActivityDto {
  ruleCode: string; // EARN_VELOCITY | REDEMPTION_VELOCITY | BALANCE_SWING
  ruleName: string;
  userId: number;
  userName: string | null;
  metric: number;
  windowHours: number;
}

// ============================================
// Loyalty Account DTOs (Read-only for admin)
// ============================================

export interface LoyaltyAccountDto {
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  currentTierName: string;
  currentMultiplier: number;
  seasonPointsEarned: number;
  seasonName: string;
  // NEW (2026-02-26)
  isBlocked: boolean;
  blockedUntil: string | null;
  blockReason: string | null;
}

export interface PointsHistoryDto {
  id: number;
  transactionType: number; // 1=Earn, 2=Redeem, 3=Expired, 4=AdminAdjust, 5=SeasonBonus
  points: number;
  balanceAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  actionName: string | null;
  providerName: string | null; // NEW (2026-02-26)
  createdAt: string;
}

// ============================================
// Block / Unblock DTOs (Admin) — 2026-02-26
// ============================================

export interface BlockUserRequest {
  userId: number;
  reason: string;
  blockUntil?: string | null; // ISO datetime, null = permanent
}

export interface BlockProviderRequest {
  providerType: "ChargingPoint" | "ServiceProvider";
  providerId: number;
  reason: string;
  blockUntil?: string | null; // ISO datetime, null = permanent
}

/** F1 — a currently-blocked user. */
export interface BlockedUserDto {
  userId: number;
  userName: string | null;
  reason: string | null;
  blockedAt: string;
  blockedUntil: string | null; // null = permanent
  blockedByUserId: number | null;
  blockedByUserName: string | null;
}

/** F2 — a currently-blocked provider (charging point or service provider). */
export interface BlockedProviderDto {
  providerType: "ChargingPoint" | "ServiceProvider";
  providerId: number;
  providerName: string | null;
  reason: string | null;
  blockedAt: string;
  blockedUntil: string | null;
  blockedByUserId: number | null;
}
