import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStationSessions } from "../services/ocpp-service";
import { OCPP_QUERY_KEY } from "../utils/live-events";
import type { OcppStationSessionDto } from "../types/api";
import { fetchSessionsSince, mapWithConcurrency, type DayRange, type PaymentSession, type SessionsSince } from "../utils/payments";

/** Stations fetched at once; each walks its own pages one after another. */
const STATION_CONCURRENCY = 3;
const PAGE_SIZE = 100;
const MAX_PAGES = 20;
const STALE_MS = 60_000;

export interface StationSessionsResult {
  items: PaymentSession[];
  /** Stations whose sessions were cut by the page cap before the period start. */
  cappedStationIds: number[];
  /** Stations whose sessions could not be loaded. */
  failedStationIds: number[];
}

/**
 * Every session of the given stations since the period start. There is no admin-wide
 * sessions endpoint, so each station's list (newest first) is paged until it reaches
 * back past the start, 3 stations at a time. Each station+period is cached on its own,
 * so narrowing to one station reuses what "all stations" already loaded.
 * Keys sit under "payments", which no live event invalidates.
 */
export function useStationSessionsInRange(stationIds: number[], range: DayRange, enabled: boolean) {
  const qc = useQueryClient();
  const ids = [...new Set(stationIds)].sort((a, b) => a - b);
  return useQuery<StationSessionsResult>({
    queryKey: [...OCPP_QUERY_KEY, "payments", "sessions", ids, range.from, range.to],
    enabled: enabled && ids.length > 0,
    staleTime: STALE_MS,
    queryFn: async ({ signal }): Promise<StationSessionsResult> => {
      const results = await mapWithConcurrency(ids, STATION_CONCURRENCY, async (stationId) => {
        try {
          const res = await qc.fetchQuery<SessionsSince<OcppStationSessionDto>>({
            queryKey: [...OCPP_QUERY_KEY, "payments", "station", stationId, range.from, range.to],
            staleTime: STALE_MS,
            queryFn: () =>
              fetchSessionsSince((page, pageSize) => getStationSessions(stationId, page, pageSize, signal), range.from, {
                pageSize: PAGE_SIZE,
                maxPages: MAX_PAGES,
              }),
          });
          return { stationId, ok: true as const, ...res };
        } catch (err) {
          if (signal.aborted) throw err;
          return { stationId, ok: false as const, items: [], capped: false };
        }
      });
      if (results.length > 0 && results.every((r) => !r.ok)) throw new Error("sessions");
      return {
        items: results.flatMap((r) => r.items.map((s) => ({ ...s, stationId: r.stationId }))),
        cappedStationIds: results.filter((r) => r.capped).map((r) => r.stationId),
        failedStationIds: results.filter((r) => !r.ok).map((r) => r.stationId),
      };
    },
  });
}

/** Drops the cached pages so a refresh really reloads them. */
export function useRefreshPayments() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [...OCPP_QUERY_KEY, "payments"] });
}
