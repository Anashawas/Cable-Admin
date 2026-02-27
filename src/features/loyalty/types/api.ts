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
  rewardId: number;
  rewardName: string;
  userId: number;
  userName: string;
  pointsSpent: number;
  status: RedemptionStatus;
  redemptionCode: string;
  providerType: string | null;
  providerId: number | null;
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

// ============================================
// Point Adjustment DTOs
// ============================================

export interface AdjustPointsRequest {
  userId: number;
  points: number; // Positive = add, Negative = deduct
  note: string;
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
