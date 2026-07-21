import { server } from "@/lib/@axios";
import type {
  SeasonDto,
  CreateSeasonRequest,
  EndSeasonResult,
  RewardDto,
  CreateRewardRequest,
  UpdateRewardRequest,
  RedemptionDto,
  ProviderRedemptionDto,
  AdjustPointsRequest,
  LoyaltyAccountDto,
  PointsHistoryDto,
  BlockUserRequest,
  BlockProviderRequest,
  BlockedUserDto,
  BlockedProviderDto,
  BulkAwardRequest,
  BulkAwardResult,
  ReverseTransactionRequest,
  ReverseTransactionResult,
  FlaggedActivityDto,
  LeaderboardEntryDto,
  Paged,
  AdminPointsHistoryDto,
  LoyaltySummaryDto,
  TierDto,
  RewardPerformanceDto,
  ProviderActivityDto,
  TransactionDetailDto,
} from "../types/api";

// ============================================
// Leaderboard
// ============================================

/** GET /api/loyalty/GetLeaderboard?top=N — current-season top users by points. */
export const getLeaderboard = async (top: number): Promise<LeaderboardEntryDto[]> => {
  const response = await server.get("/api/loyalty/GetLeaderboard", { params: { top } });
  return Array.isArray(response.data) ? response.data : [];
};

// ============================================
// Admin loyalty — per-user & program (2026-07-07)
// ============================================

/** A1 — GET /api/loyalty/admin/GetUserLoyaltyAccount/{userId} */
export const getUserLoyaltyAccount = async (userId: number): Promise<LoyaltyAccountDto> => {
  const response = await server.get(`/api/loyalty/admin/GetUserLoyaltyAccount/${userId}`);
  return response.data;
};

/** A2 — GET /api/loyalty/admin/GetUserPointsHistory/{userId} (paged) */
export const getUserPointsHistory = async (
  userId: number,
  params?: { transactionType?: number; seasonId?: number; from?: string; to?: string; page?: number; pageSize?: number }
): Promise<Paged<AdminPointsHistoryDto>> => {
  const response = await server.get(`/api/loyalty/admin/GetUserPointsHistory/${userId}`, { params });
  return response.data;
};

/** C1 — the global points ledger (all users), paged + filtered. */
export const getAllPointsTransactions = async (
  params?: {
    transactionType?: number;
    userId?: number;
    seasonId?: number;
    providerType?: "ChargingPoint" | "ServiceProvider";
    providerId?: number;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }
): Promise<Paged<AdminPointsHistoryDto>> => {
  const response = await server.get("/api/loyalty/admin/GetAllPointsTransactions", { params });
  return response.data;
};

/** I1 — GET /api/loyalty/admin/GetLoyaltySummary */
export const getLoyaltySummary = async (
  params?: { seasonId?: number; from?: string; to?: string }
): Promise<LoyaltySummaryDto> => {
  const response = await server.get("/api/loyalty/admin/GetLoyaltySummary", { params });
  return response.data;
};

/** B1 — GET /api/loyalty/admin/GetProviderActivity (paged) */
export const getProviderActivity = async (params: {
  providerType: string;
  providerId: number;
  activityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paged<ProviderActivityDto>> => {
  const response = await server.get("/api/loyalty/admin/GetProviderActivity", { params });
  return response.data;
};

/** B3 — GET /api/loyalty/admin/GetTransactionDetail?activityType=&id= */
export const getTransactionDetail = async (activityType: string, id: number): Promise<TransactionDetailDto> => {
  const response = await server.get("/api/loyalty/admin/GetTransactionDetail", { params: { activityType, id } });
  return response.data;
};

/** H1 — GET /api/loyalty/admin/GetAllTiers (read-only) */
export const getAllTiers = async (): Promise<TierDto[]> => {
  const response = await server.get("/api/loyalty/admin/GetAllTiers");
  return Array.isArray(response.data) ? response.data : [];
};

/** I2 — GET /api/loyalty/admin/GetRewardPerformance */
export const getRewardPerformance = async (
  params?: { from?: string; to?: string }
): Promise<RewardPerformanceDto[]> => {
  const response = await server.get("/api/loyalty/admin/GetRewardPerformance", { params });
  return Array.isArray(response.data) ? response.data : [];
};

// ============================================
// Seasons
// ============================================

export const getAllSeasons = async (): Promise<SeasonDto[]> => {
  const response = await server.get("/api/loyalty/admin/GetAllSeasons");
  return response.data;
};

export const createSeason = async (data: CreateSeasonRequest): Promise<number> => {
  const response = await server.post("/api/loyalty/admin/CreateSeason", data);
  return response.data;
};

/** Ends the CURRENTLY ACTIVE season — no id/body (BE 2026-07-07). `id` kept for caller compat, unused. */
export const endSeason = async (_id?: number): Promise<EndSeasonResult> => {
  const response = await server.post(`/api/loyalty/admin/EndSeason`);
  return response.data;
};

// ============================================
// Rewards
// ============================================

export const getAllRewards = async (): Promise<RewardDto[]> => {
  const response = await server.get("/api/loyalty/GetAvailableRewards");
  return response.data;
};

export const createReward = async (data: CreateRewardRequest): Promise<number> => {
  const response = await server.post("/api/loyalty/admin/CreateReward", data);
  return response.data;
};

export const updateReward = async (id: number, data: UpdateRewardRequest): Promise<void> => {
  await server.put(`/api/loyalty/admin/UpdateReward/${id}`, data);
};

// ============================================
// Redemptions
// ============================================

export const getAllRedemptions = async (params?: {
  status?: number;
}): Promise<RedemptionDto[]> => {
  const response = await server.get("/api/loyalty/admin/GetAllRedemptions", { params });
  return response.data;
};

export const getProviderRedemptions = async (params?: {
  providerType?: string;
  providerId?: number;
  status?: number;
}): Promise<ProviderRedemptionDto[]> => {
  const response = await server.get("/api/loyalty/admin/GetProviderRedemptions", { params });
  return response.data;
};

export const fulfillRedemption = async (id: number): Promise<void> => {
  await server.patch(`/api/loyalty/admin/FulfillRedemption/${id}`);
};

export const cancelRedemption = async (id: number): Promise<void> => {
  await server.patch(`/api/loyalty/admin/CancelRedemption/${id}`);
};

// ============================================
// Point Adjustments
// ============================================

export const adjustPoints = async (data: AdjustPointsRequest): Promise<void> => {
  await server.post("/api/loyalty/admin/AdjustPoints", data);
};

/** K2 — the static catalog of adjustment reason codes. */
export const getAdjustmentReasons = async (): Promise<string[]> => {
  const { data } = await server.get("/api/loyalty/admin/GetAdjustmentReasons");
  if (Array.isArray(data)) {
    // Tolerate either ["CODE", …] or [{ code }] / [{ value }] shapes.
    return data.map((r: unknown) =>
      typeof r === "string" ? r : ((r as { code?: string; value?: string })?.code ?? (r as { value?: string })?.value ?? String(r))
    );
  }
  return [];
};

// ============================================
// Block / Unblock (Admin) — 2026-02-26
// ============================================

export const blockUser = async (data: BlockUserRequest): Promise<void> => {
  await server.post("/api/loyalty/admin/BlockUser", data);
};

export const unblockUser = async (userId: number): Promise<void> => {
  await server.post(`/api/loyalty/admin/UnblockUser/${userId}`);
};

export const blockProvider = async (data: BlockProviderRequest): Promise<void> => {
  await server.post("/api/loyalty/admin/BlockProvider", data);
};

export const unblockProvider = async (
  providerType: "ChargingPoint" | "ServiceProvider",
  providerId: number
): Promise<void> => {
  await server.post(`/api/loyalty/admin/UnblockProvider/${providerType}/${providerId}`);
};

/** J1 — award points to a whole segment (city/tier/car). */
export const bulkAwardPoints = async (data: BulkAwardRequest): Promise<BulkAwardResult> => {
  const { data: res } = await server.post("/api/loyalty/admin/BulkAwardPoints", data);
  return res as BulkAwardResult;
};

/** K1 — reverse (undo) a transaction, points-side only. */
export const reverseTransaction = async (
  data: ReverseTransactionRequest
): Promise<ReverseTransactionResult> => {
  const { data: res } = await server.post("/api/loyalty/admin/ReverseTransaction", data);
  return res as ReverseTransactionResult;
};

/** L1 — heuristic fraud-review queue. */
export const getFlaggedActivity = async (params?: {
  windowHours?: number;
}): Promise<FlaggedActivityDto[]> => {
  const { data } = await server.get("/api/loyalty/admin/GetFlaggedActivity", { params });
  return Array.isArray(data) ? data : [];
};

/** F1 — currently blocked users. */
export const getBlockedUsers = async (): Promise<BlockedUserDto[]> => {
  const { data } = await server.get("/api/loyalty/admin/GetBlockedUsers");
  return Array.isArray(data) ? data : [];
};

/** F2 — currently blocked providers. */
export const getBlockedProviders = async (): Promise<BlockedProviderDto[]> => {
  const { data } = await server.get("/api/loyalty/admin/GetBlockedProviders");
  return Array.isArray(data) ? data : [];
};
