import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getAllSeasons,
  createSeason,
  endSeason,
  getAllRewards,
  createReward,
  updateReward,
  getAllRedemptions,
  getProviderRedemptions,
  getLeaderboard,
  getUserLoyaltyAccount,
  getUserPointsHistory,
  getLoyaltySummary,
  getAllPointsTransactions,
  getAllTiers,
  getRewardPerformance,
  getProviderActivity,
  getTransactionDetail,
  getAdjustmentReasons,
  fulfillRedemption,
  cancelRedemption,
  adjustPoints,
  blockUser,
  unblockUser,
  blockProvider,
  unblockProvider,
  getBlockedUsers,
  getBlockedProviders,
  bulkAwardPoints,
  reverseTransaction,
  getFlaggedActivity,
} from "../services/loyalty-service";
import type {
  SeasonDto,
  CreateSeasonRequest,
  RewardDto,
  CreateRewardRequest,
  UpdateRewardRequest,
  RedemptionDto,
  AdjustPointsRequest,
  BulkAwardRequest,
  ReverseTransactionRequest,
  RewardType,
  RedemptionStatus,
  BlockUserRequest,
  BlockProviderRequest,
} from "../types/api";

// Query keys
export const SEASONS_QUERY_KEY = ["loyalty", "seasons"];
export const REWARDS_QUERY_KEY = ["loyalty", "rewards"];
export const REDEMPTIONS_QUERY_KEY = ["loyalty", "redemptions"];

// ============================================
// Seasons
// ============================================

export function useSeasons() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: SEASONS_QUERY_KEY,
    queryFn: () => getAllSeasons(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const filteredData = useMemo(() => {
    const raw = query.data ?? [];
    if (!search.trim()) return raw;

    const q = search.trim().toLowerCase();
    return raw.filter((season) => (season.name ?? "").toLowerCase().includes(q));
  }, [query.data, search]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredData,
    allData: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    search,
    handleSearchChange,
    handleRefresh,
  };
}

export function useCreateSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSeasonRequest) => createSeason(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEASONS_QUERY_KEY });
    },
  });
}

export function useEndSeason() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => endSeason(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SEASONS_QUERY_KEY });
    },
  });
}

// ============================================
// Rewards
// ============================================

export type RewardSortOption = "NONE" | "POINTS_LOW_HIGH" | "POINTS_HIGH_LOW" | "NEWEST_FIRST";

function applyRewardFilter(items: RewardDto[], search: string): RewardDto[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter((reward) => (reward.name ?? "").toLowerCase().includes(q));
}

function applyRewardSort(items: RewardDto[], sort: RewardSortOption): RewardDto[] {
  const list = [...items];
  switch (sort) {
    case "POINTS_LOW_HIGH":
      return list.sort((a, b) => a.pointsCost - b.pointsCost);
    case "POINTS_HIGH_LOW":
      return list.sort((a, b) => b.pointsCost - a.pointsCost);
    case "NEWEST_FIRST":
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return list;
  }
}

export function useRewards() {
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<RewardSortOption>("NONE");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const query = useQuery({
    queryKey: REWARDS_QUERY_KEY,
    queryFn: () => getAllRewards(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const filteredAndSortedData = useMemo(() => {
    let raw = query.data ?? [];

    // Apply active filter
    if (statusFilter === "active") {
      raw = raw.filter((reward) => reward.isActive);
    } else if (statusFilter === "inactive") {
      raw = raw.filter((reward) => !reward.isActive);
    }

    const filtered = applyRewardFilter(raw, search);
    return applyRewardSort(filtered, sortOption);
  }, [query.data, search, sortOption, statusFilter]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSortChange = useCallback((value: RewardSortOption) => setSortOption(value), []);
  const handleStatusFilterChange = useCallback(
    (value: "all" | "active" | "inactive") => setStatusFilter(value),
    []
  );
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredAndSortedData,
    isLoading: query.isLoading,
    error: query.error,
    search,
    sortOption,
    statusFilter,
    handleSearchChange,
    handleSortChange,
    handleStatusFilterChange,
    handleRefresh,
  };
}

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRewardRequest) => createReward(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRewardRequest }) => updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REWARDS_QUERY_KEY });
    },
  });
}

// ============================================
// Redemptions
// ============================================

export function useRedemptions(statusFilter?: number, page = 1, pageSize = 20) {
  const [search, setSearch] = useState("");

  // Server-paginated (GetAllRedemptions always returns a PagedResult envelope,
  // even for the "no params" case — never a bare array).
  const query = useQuery({
    queryKey: [...REDEMPTIONS_QUERY_KEY, statusFilter, page, pageSize],
    queryFn: () => getAllRedemptions({ status: statusFilter, page, pageSize }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  const items = query.data?.items ?? [];

  // Client-side text filter — scoped to the currently loaded page, since the
  // backend has no search param for this endpoint.
  const filteredData = useMemo(() => {
    if (!search.trim()) return items;

    const q = search.trim().toLowerCase();
    return items.filter(
      (redemption) =>
        (redemption.userName ?? "").toLowerCase().includes(q) ||
        (redemption.rewardName ?? "").toLowerCase().includes(q) ||
        (redemption.redemptionCode ?? "").toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredData,
    totalCount: query.data?.totalCount ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    search,
    handleSearchChange,
    handleRefresh,
  };
}

/** A1 — a specific user's loyalty account (admin). */
export function useUserLoyaltyAccount(userId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["loyalty", "user-account", userId],
    queryFn: () => getUserLoyaltyAccount(userId!),
    enabled: enabled && userId != null && userId > 0,
    retry: false,
  });
}

/** A2 — a specific user's points history (admin, paged). */
export function useUserPointsHistory(
  userId: number | null | undefined,
  params: { transactionType?: number; from?: string; to?: string; page?: number; pageSize?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ["loyalty", "user-history", userId, params],
    queryFn: () => getUserPointsHistory(userId!, params),
    enabled: enabled && userId != null && userId > 0,
  });
}

/** C1 — global points ledger (all users), paged + filtered. */
export function useAllPointsTransactions(params: {
  transactionType?: number;
  userId?: number;
  seasonId?: number;
  providerType?: "ChargingPoint" | "ServiceProvider";
  providerId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["loyalty", "all-transactions", params],
    queryFn: () => getAllPointsTransactions(params),
    staleTime: 60 * 1000,
  });
}

/** I1 — loyalty program-health summary (admin). */
export function useLoyaltySummary(params?: { seasonId?: number; from?: string; to?: string }) {
  return useQuery({
    queryKey: ["loyalty", "summary", params],
    queryFn: () => getLoyaltySummary(params),
    staleTime: 2 * 60 * 1000,
  });
}

/** B1 — unified activity feed at a provider (admin, paged). */
export function useProviderActivity(
  providerType: string | undefined,
  providerId: number | null | undefined,
  params: { activityType?: string; from?: string; to?: string; page?: number; pageSize?: number },
  enabled = true
) {
  return useQuery({
    queryKey: ["loyalty", "provider-activity", providerType, providerId, params],
    queryFn: () => getProviderActivity({ providerType: providerType!, providerId: providerId!, ...params }),
    enabled: enabled && !!providerType && providerId != null && providerId > 0,
  });
}

/** B3 — single transaction detail (admin). */
export function useTransactionDetail(activityType: string | null, id: number | null, enabled = true) {
  return useQuery({
    queryKey: ["loyalty", "transaction-detail", activityType, id],
    queryFn: () => getTransactionDetail(activityType!, id!),
    enabled: enabled && !!activityType && id != null,
    retry: false,
  });
}

/** H1 — tier ladder (admin, read-only). */
export function useAllTiers() {
  return useQuery({
    queryKey: ["loyalty", "tiers"],
    queryFn: () => getAllTiers(),
    staleTime: 10 * 60 * 1000,
  });
}

/** I2 — reward performance (admin). */
export function useRewardPerformance(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ["loyalty", "reward-performance", params],
    queryFn: () => getRewardPerformance(params),
    staleTime: 2 * 60 * 1000,
  });
}

/** Current-season leaderboard — top N users by points. */
export function useLeaderboard(top: number) {
  return useQuery({
    queryKey: ["loyalty", "leaderboard", top],
    queryFn: () => getLeaderboard(top),
    staleTime: 60 * 1000,
  });
}

/** Reward redemptions at a specific provider (charging point or service provider). */
export function useProviderRedemptions(
  providerType: string | undefined,
  providerId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: ["loyalty", "provider-redemptions", providerType, providerId],
    queryFn: () => getProviderRedemptions({ providerType, providerId }),
    // GetProviderRedemptions also returns a PagedResult envelope — unwrap here
    // so callers keep getting a plain array, unchanged.
    select: (paged) => paged.items,
    enabled: enabled && !!providerType && providerId != null && providerId > 0,
    staleTime: 60 * 1000,
  });
}

export function useFulfillRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => fulfillRedemption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REDEMPTIONS_QUERY_KEY });
    },
  });
}

export function useCancelRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => cancelRedemption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REDEMPTIONS_QUERY_KEY });
    },
  });
}

// ============================================
// Point Adjustments
// ============================================

export function useAdjustPoints() {
  return useMutation({
    mutationFn: (data: AdjustPointsRequest) => adjustPoints(data),
  });
}

/** J1 — award points to a whole segment. */
export function useBulkAwardPoints() {
  return useMutation({
    mutationFn: (data: BulkAwardRequest) => bulkAwardPoints(data),
  });
}

/** K1 — reverse (undo) a transaction. Invalidates loyalty caches on success. */
export function useReverseTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReverseTransactionRequest) => reverseTransaction(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["loyalty"] }),
  });
}

/** L1 — heuristic fraud-review queue. */
export function useFlaggedActivity(windowHours: number) {
  return useQuery({
    queryKey: ["loyalty", "flagged-activity", windowHours],
    queryFn: () => getFlaggedActivity({ windowHours }),
    staleTime: 60 * 1000,
  });
}

/** K2 — adjustment reason catalog (static, cached long). */
export function useAdjustmentReasons() {
  return useQuery({
    queryKey: ["loyalty", "adjustment-reasons"],
    queryFn: () => getAdjustmentReasons(),
    staleTime: 30 * 60 * 1000,
  });
}

// ============================================
// Block / Unblock (Admin) — 2026-02-26
// ============================================

export const BLOCKED_USERS_QUERY_KEY = ["loyalty", "blocked-users"];
export const BLOCKED_PROVIDERS_QUERY_KEY = ["loyalty", "blocked-providers"];

/** F1 — currently blocked users. */
export function useBlockedUsers() {
  return useQuery({
    queryKey: BLOCKED_USERS_QUERY_KEY,
    queryFn: () => getBlockedUsers(),
    staleTime: 60 * 1000,
  });
}

/** F2 — currently blocked providers. */
export function useBlockedProviders() {
  return useQuery({
    queryKey: BLOCKED_PROVIDERS_QUERY_KEY,
    queryFn: () => getBlockedProviders(),
    staleTime: 60 * 1000,
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BlockUserRequest) => blockUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY }),
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => unblockUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BLOCKED_USERS_QUERY_KEY }),
  });
}

export function useBlockProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BlockProviderRequest) => blockProvider(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BLOCKED_PROVIDERS_QUERY_KEY }),
  });
}

export function useUnblockProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      providerType,
      providerId,
    }: {
      providerType: "ChargingPoint" | "ServiceProvider";
      providerId: number;
    }) => unblockProvider(providerType, providerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: BLOCKED_PROVIDERS_QUERY_KEY }),
  });
}
