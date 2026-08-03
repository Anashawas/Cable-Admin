import { server } from "../../../lib/@axios";
import type { AnalyticsEntityType, AnalyticsSummaryDto } from "../types/api";

/**
 * GET /api/analytics/{entityType}/{entityId}/summary?from=&to= (admin)
 * Totals, unique users, and a daily time-series. Defaults to the last 30 days
 * when from/to are omitted. Admin sees any entity.
 */
export const getAnalyticsSummary = async (
  entityType: AnalyticsEntityType,
  entityId: number,
  params?: { from?: string; to?: string },
  signal?: AbortSignal
): Promise<AnalyticsSummaryDto> => {
  const { data } = await server.get<AnalyticsSummaryDto>(
    `api/analytics/${entityType}/${entityId}/summary`,
    { params, signal }
  );
  return data;
};
