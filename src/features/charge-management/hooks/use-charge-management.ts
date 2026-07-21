import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import { getAllChargingPoints } from "../services/charge-management-service";
import type { ChargingPointDto } from "../types/api";
import { toTimestamp } from "../../../utils/date-format";

const REQUEST_BODY = { name: null, chargerPointTypeId: null, cityName: null };

export type SortOption =
  | "NONE"
  | "VISITORS_HIGH_TO_LOW"
  | "VISITORS_LOW_TO_HIGH"
  | "RATING_HIGH_TO_LOW"
  | "NAME_A_TO_Z"
  | "JOINED_NEWEST"
  | "JOINED_OLDEST"
  | "EDITED_NEWEST"
  | "EDITED_OLDEST";

/**
 * Rows with no timestamp always sink to the bottom, whichever direction is
 * chosen — an unknown date is not "oldest", it is unknown.
 */
function byDate(
  pick: (row: ChargingPointDto) => string | null | undefined,
  direction: "asc" | "desc"
) {
  return (a: ChargingPointDto, b: ChargingPointDto) => {
    const ta = toTimestamp(pick(a));
    const tb = toTimestamp(pick(b));
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return direction === "desc" ? tb - ta : ta - tb;
  };
}

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
    case "JOINED_NEWEST":
      return list.sort(byDate((r) => r.createdAt, "desc"));
    case "JOINED_OLDEST":
      return list.sort(byDate((r) => r.createdAt, "asc"));
    case "EDITED_NEWEST":
      return list.sort(byDate((r) => r.modifiedAt, "desc"));
    case "EDITED_OLDEST":
      return list.sort(byDate((r) => r.modifiedAt, "asc"));
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
