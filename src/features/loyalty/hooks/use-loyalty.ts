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
  fulfillRedemption,
  cancelRedemption,
  adjustPoints,
  blockUser,
  unblockUser,
  blockProvider,
  unblockProvider,
} from "../services/loyalty-service";
import type {
  SeasonDto,
  CreateSeasonRequest,
  RewardDto,
  CreateRewardRequest,
  UpdateRewardRequest,
  RedemptionDto,
  AdjustPointsRequest,
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

export function useRedemptions(statusFilter?: number) {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: [...REDEMPTIONS_QUERY_KEY, statusFilter],
    queryFn: () => getAllRedemptions({ status: statusFilter }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const filteredData = useMemo(() => {
    const raw = query.data ?? [];
    if (!search.trim()) return raw;

    const q = search.trim().toLowerCase();
    return raw.filter(
      (redemption) =>
        (redemption.userName ?? "").toLowerCase().includes(q) ||
        (redemption.rewardName ?? "").toLowerCase().includes(q) ||
        (redemption.redemptionCode ?? "").toLowerCase().includes(q)
    );
  }, [query.data, search]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredData,
    isLoading: query.isLoading,
    error: query.error,
    search,
    handleSearchChange,
    handleRefresh,
  };
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

// ============================================
// Block / Unblock (Admin) — 2026-02-26
// ============================================

export function useBlockUser() {
  return useMutation({
    mutationFn: (data: BlockUserRequest) => blockUser(data),
  });
}

export function useUnblockUser() {
  return useMutation({
    mutationFn: (userId: number) => unblockUser(userId),
  });
}

export function useBlockProvider() {
  return useMutation({
    mutationFn: (data: BlockProviderRequest) => blockProvider(data),
  });
}

export function useUnblockProvider() {
  return useMutation({
    mutationFn: ({
      providerType,
      providerId,
    }: {
      providerType: "ChargingPoint" | "ServiceProvider";
      providerId: number;
    }) => unblockProvider(providerType, providerId),
  });
}
