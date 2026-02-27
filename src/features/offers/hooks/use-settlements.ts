import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getSettlements,
  getSettlementSummary,
  updateSettlementStatus,
  generateSettlement,
} from "../services/offers-service";
import type {
  ProviderSettlementDto,
  UpdateSettlementStatusRequest,
  GenerateSettlementRequest,
  ProviderType,
  SettlementStatus,
} from "../types/api";

// Query keys
export const SETTLEMENTS_QUERY_KEY = ["settlements"];
export const SETTLEMENT_SUMMARY_QUERY_KEY = (year?: number, month?: number) => [
  "settlement-summary",
  year,
  month,
];

// ============================================
// Queries
// ============================================

export function useSettlements(filters?: {
  providerType?: ProviderType;
  providerId?: number;
  status?: number;
  year?: number;
  month?: number;
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
    return raw.filter((settlement) =>
      (settlement.providerOwnerName ?? "").toLowerCase().includes(q)
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

export function useSettlementSummary(year?: number, month?: number) {
  return useQuery({
    queryKey: SETTLEMENT_SUMMARY_QUERY_KEY(year, month),
    queryFn: () => getSettlementSummary({ year, month }),
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
    },
  });
}

export function useGenerateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateSettlementRequest) => generateSettlement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTLEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["settlement-summary"] });
    },
  });
}
