import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import { getProviderTransactions } from "../services/offers-service";
import type {
  OfferTransactionDto,
  ProviderType,
  TransactionStatus,
} from "../types/api";

export const TRANSACTIONS_QUERY_KEY = ["transactions"];

function applyFilter(items: OfferTransactionDto[], search: string): OfferTransactionDto[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter(
    (tx) =>
      (tx.offerTitle ?? "").toLowerCase().includes(q) ||
      (tx.userName ?? "").toLowerCase().includes(q) ||
      (tx.offerCode ?? "").toLowerCase().includes(q)
  );
}

export function useProviderTransactions(params: {
  providerType: ProviderType;
  providerId: number;
  status?: TransactionStatus;
}) {
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: [...TRANSACTIONS_QUERY_KEY, params],
    queryFn: () =>
      getProviderTransactions({
        providerType: params.providerType,
        providerId: params.providerId,
        status: params.status,
      }),
    staleTime: 2 * 60 * 1000,
    retry: 2,
    enabled: !!params.providerId,
  });

  const filteredData = useMemo(() => {
    const raw = query.data ?? [];
    return applyFilter(raw, search);
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
