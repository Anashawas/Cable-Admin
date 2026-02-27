import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import {
  getAllConversionRates,
  createConversionRate,
  updateConversionRate,
} from "../services/offers-service";
import type {
  ConversionRateDto,
  CreateConversionRateRequest,
  UpdateConversionRateRequest,
} from "../types/api";

// Query keys
export const CONVERSION_RATES_QUERY_KEY = ["conversion-rates"];

// ============================================
// Queries
// ============================================

export function useConversionRates() {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: CONVERSION_RATES_QUERY_KEY,
    queryFn: () => getAllConversionRates(),
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  const filteredData = useMemo(() => {
    const raw = query.data ?? [];
    if (!search.trim()) return raw;

    const q = search.trim().toLowerCase();
    return raw.filter(
      (rate) =>
        (rate.name ?? "").toLowerCase().includes(q) ||
        (rate.currencyCode ?? "").toLowerCase().includes(q)
    );
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

// ============================================
// Mutations
// ============================================

export function useCreateConversionRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConversionRateRequest) => createConversionRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSION_RATES_QUERY_KEY });
    },
  });
}

export function useUpdateConversionRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateConversionRateRequest }) =>
      updateConversionRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONVERSION_RATES_QUERY_KEY });
    },
  });
}
