import { useQuery } from "@tanstack/react-query";
import { getAnalyticsSummary } from "../services/analytics-service";
import type { AnalyticsEntityType } from "../types/api";

export const ANALYTICS_QUERY_KEY = ["analytics", "summary"];

export function useAnalyticsSummary(
  entityType: AnalyticsEntityType,
  entityId: number | null | undefined,
  range: { from?: string; to?: string },
  enabled = true
) {
  return useQuery({
    queryKey: [...ANALYTICS_QUERY_KEY, entityType, entityId, range.from, range.to],
    queryFn: ({ signal }) => getAnalyticsSummary(entityType, entityId!, range, signal),
    enabled: enabled && entityId != null && entityId > 0,
  });
}
