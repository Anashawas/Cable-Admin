import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import { getAllChargingPoints } from "../services/charge-management-service";
import type { ChargingPointDto } from "../types/api";

const REQUEST_BODY = { name: null, chargerPointTypeId: null, cityName: null };

export type SortOption =
  | "NONE"
  | "VISITORS_HIGH_TO_LOW"
  | "VISITORS_LOW_TO_HIGH"
  | "RATING_HIGH_TO_LOW"
  | "NAME_A_TO_Z";

function applyFilter(items: ChargingPointDto[], search: string): ChargingPointDto[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter(
    (row) =>
      (row.name ?? "").toLowerCase().includes(q) ||
      (row.cityName ?? "").toLowerCase().includes(q)
  );
}

function applySort(items: ChargingPointDto[], sort: SortOption): ChargingPointDto[] {
  const list = [...items];
  switch (sort) {
    case "VISITORS_HIGH_TO_LOW":
      return list.sort((a, b) => (b.visitorsCount ?? 0) - (a.visitorsCount ?? 0));
    case "VISITORS_LOW_TO_HIGH":
      return list.sort((a, b) => (a.visitorsCount ?? 0) - (b.visitorsCount ?? 0));
    case "RATING_HIGH_TO_LOW":
      return list.sort((a, b) => (b.avgChargingPointRate ?? 0) - (a.avgChargingPointRate ?? 0));
    case "NAME_A_TO_Z":
      return list.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, { sensitivity: "base" })
      );
    default:
      return list;
  }
}

export function useChargeManagement() {
  const [search, setSearch] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("NONE");

  const query = useQuery({
    queryKey: ["charge-management", "charging-points"],
    queryFn: ({ signal }) => getAllChargingPoints(REQUEST_BODY, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  const filteredAndSortedData = useMemo(() => {
    const raw = query.data ?? [];
    const filtered = applyFilter(raw, search);
    return applySort(filtered, sortOption);
  }, [query.data, search, sortOption]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSortChange = useCallback((value: SortOption) => setSortOption(value), []);
  const handleRefresh = useCallback(() => query.refetch(), [query]);

  return {
    data: filteredAndSortedData,
    isLoading: query.isLoading,
    error: query.error,
    search,
    sortOption,
    handleSearchChange,
    handleSortChange,
    handleRefresh,
  };
}
