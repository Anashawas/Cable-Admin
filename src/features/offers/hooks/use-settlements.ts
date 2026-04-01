import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getSettlements,
  getProviderSettlements,
  getSettlementSummary,
  updateSettlementStatus,
  addWalletDeposit,
  getWalletBalance,
  getWalletHistory,
} from "../services/offers-service";
import type {
  ProviderSettlementDto,
  UpdateSettlementStatusRequest,
  AddWalletDepositRequest,
  ProviderType,
} from "../types/api";

// Query keys
export const SETTLEMENTS_QUERY_KEY = ["settlements"];
export const SETTLEMENT_SUMMARY_QUERY_KEY = (year?: number) => [
  "settlement-summary",
  year,
];

// ============================================
// Queries
// ============================================

export function useSettlements(filters?: {
  providerType?: ProviderType;
  providerId?: number;
  status?: number;
  year?: number;
}) {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: [...SETTLEMENTS_QUERY_KEY, filters],
    queryFn: () => getSettlements(filters),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });

  const filteredData = useMemo(() => {
    const raw = query.data ?? [];
    if (!search.trim()) return raw;

    const q = search.trim().toLowerCase();
    return raw.filter((s) =>
      (s.providerName ?? "").toLowerCase().includes(q) ||
      (s.providerOwnerName ?? "").toLowerCase().includes(q) ||
      (s.ownerEmail ?? "").toLowerCase().includes(q) ||
      String(s.providerId).includes(q)
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

export function useSettlementSummary(year?: number) {
  return useQuery({
    queryKey: SETTLEMENT_SUMMARY_QUERY_KEY(year),
    queryFn: () => getSettlementSummary({ year }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export const PROVIDER_SETTLEMENTS_QUERY_KEY = (providerType: ProviderType, providerId: number) => [
  "provider-settlements",
  providerType,
  providerId,
];

export function useProviderSettlements(params: {
  providerType: ProviderType;
  providerId: number;
  status?: number;
  year?: number;
  week?: number;
  unpaidOnly?: boolean;
  hasDebt?: boolean;
}) {
  return useQuery({
    queryKey: [...PROVIDER_SETTLEMENTS_QUERY_KEY(params.providerType, params.providerId), params],
    queryFn: () => getProviderSettlements(params),
    enabled: !!params.providerType && !!params.providerId,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

// ============================================
// Mutations
// ============================================

export function useUpdateSettlementStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSettlementStatusRequest }) =>
      updateSettlementStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["settlement-summary"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
  });
}

// ============================================
// Wallet (formerly PreCredit)
// ============================================

export const WALLET_BALANCE_KEY = (providerType: ProviderType, providerId: number) => [
  "wallet-balance",
  providerType,
  providerId,
];

export const WALLET_HISTORY_KEY = (providerType: ProviderType, providerId: number) => [
  "wallet-history",
  providerType,
  providerId,
];

export function useWalletBalance(providerType?: ProviderType, providerId?: number) {
  return useQuery({
    queryKey: WALLET_BALANCE_KEY(providerType!, providerId!),
    queryFn: () => getWalletBalance({ providerType: providerType!, providerId: providerId! }),
    enabled: !!providerType && !!providerId,
    staleTime: 60 * 1000,
  });
}

export function useWalletHistory(providerType?: ProviderType, providerId?: number) {
  return useQuery({
    queryKey: WALLET_HISTORY_KEY(providerType!, providerId!),
    queryFn: () => getWalletHistory({ providerType: providerType!, providerId: providerId! }),
    enabled: !!providerType && !!providerId,
    staleTime: 60 * 1000,
  });
}

export function useAddWalletDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddWalletDepositRequest) => addWalletDeposit(data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({
        queryKey: WALLET_BALANCE_KEY(variables.providerType, variables.providerId),
      });
      queryClient.invalidateQueries({
        queryKey: WALLET_HISTORY_KEY(variables.providerType, variables.providerId),
      });
      queryClient.invalidateQueries({ queryKey: SETTLEMENTS_QUERY_KEY });
    },
  });
}
