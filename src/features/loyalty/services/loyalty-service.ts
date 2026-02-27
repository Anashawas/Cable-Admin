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
} from "../types/api";

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

export const endSeason = async (id: number): Promise<EndSeasonResult> => {
  const response = await server.put(`/api/loyalty/admin/EndSeason/${id}`);
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
  await server.put(`/api/loyalty/admin/FulfillRedemption/${id}`);
};

export const cancelRedemption = async (id: number): Promise<void> => {
  await server.put(`/api/loyalty/admin/CancelRedemption/${id}`);
};

// ============================================
// Point Adjustments
// ============================================

export const adjustPoints = async (data: AdjustPointsRequest): Promise<void> => {
  await server.post("/api/loyalty/admin/AdjustPoints", data);
};

// ============================================
// User Loyalty Info (Read-only for admin)
// ============================================

export const getUserLoyaltyAccount = async (userId: number): Promise<LoyaltyAccountDto> => {
  const response = await server.get(`/api/loyalty/GetUserLoyaltyAccount/${userId}`);
  return response.data;
};

export const getUserPointsHistory = async (
  userId: number,
  params?: { page?: number; pageSize?: number; seasonId?: number }
): Promise<PointsHistoryDto[]> => {
  const response = await server.get(`/api/loyalty/GetUserPointsHistory/${userId}`, { params });
  return response.data;
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
