import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback, useEffect, useState } from "react";
import { useListState } from "../../../hooks";
import { getAllChargingPoints } from "../services/charge-management-service";
import type { ChargingPointDto } from "../types/api";
import { toTimestamp } from "../../../utils/date-format";
import { normalizePhoneDigits, normalizeSearchText } from "../../../utils/search-normalize";
import { cityLabel } from "../../dashboard/utils/city-names";

const REQUEST_BODY = { name: null, chargerPointTypeId: null, cityName: null };

/** Debounce for the search box: the input stays instant, filtering waits for a pause. */
const SEARCH_DEBOUNCE_MS = 300;

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

/**
 * Client-side search over name, city (raw value plus its Arabic and English
 * names, so «عمان» finds "Amman"), phone (with or without +962 / 0) and id.
 * Arabic text is normalised (diacritics, alef/ta-marbuta/ya variants, digits).
 */
function applyFilter(items: ChargingPointDto[], search: string): ChargingPointDto[] {
  const q = normalizeSearchText(search);
  if (!q) return items;
  const qPhone = /^[+\d\s()-]+$/.test(q) ? normalizePhoneDigits(q) : "";
  const qId = q.replace(/^#/, "");
  return items.filter((row) => {
    if (normalizeSearchText(row.name).includes(q)) return true;
    const c = row.cityName;
    if (
      c &&
      (normalizeSearchText(c).includes(q) ||
        normalizeSearchText(cityLabel(c, "ar")).includes(q) ||
        normalizeSearchText(cityLabel(c, "en")).includes(q))
    )
      return true;
    if (String(row.id) === qId) return true;
    if (qPhone.length >= 3 && normalizePhoneDigits(row.phone).includes(qPhone)) return true;
    return false;
  });
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
  const [search, setSearch] = useListState("search", "");
  const [sortOption, setSortOption] = useListState<SortOption>("sort", "NONE");
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    // Clearing applies immediately; typing waits for a short pause.
    if (!search.trim()) {
      setDebouncedSearch(search);
      return;
    }
    const id = window.setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [search]);

  const query = useQuery({
    queryKey: ["charge-management", "charging-points"],
    queryFn: ({ signal }) => getAllChargingPoints(REQUEST_BODY, signal),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    placeholderData: (prev) => prev,
  });

  const filteredAndSortedData = useMemo(() => {
    const raw = query.data ?? [];
    const filtered = applyFilter(raw, debouncedSearch);
    return applySort(filtered, sortOption);
  }, [query.data, debouncedSearch, sortOption]);

  const handleSearchChange = useCallback((value: string) => setSearch(value), []);
  const handleSortChange = useCallback((value: SortOption) => setSortOption(value), []);
  const { refetch } = query;
  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  return {
    data: filteredAndSortedData,
    /** Every station, before search/filters (header stats). */
    allData: query.data,
    /** True only for the very first load (nothing to show yet). */
    isLoading: query.isLoading,
    /** Any fetch in flight, including background refreshes. */
    isFetching: query.isFetching,
    /** First load failed — nothing to show. */
    error: query.data ? null : query.error,
    /** A refresh failed while older data is still on screen. */
    refreshError: query.data ? query.error : null,
    dataUpdatedAt: query.dataUpdatedAt,
    search,
    /** The search term actually applied to the list (debounced). */
    debouncedSearch,
    sortOption,
    handleSearchChange,
    handleSortChange,
    handleRefresh,
  };
}
