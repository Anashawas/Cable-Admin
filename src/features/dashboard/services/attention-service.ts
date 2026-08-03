import { server } from "../../../lib/@axios";

/** Counts for the dashboard "Needs Attention" panel (one call, all queues). */
export interface AttentionSummaryDto {
  stationUpdateRequests: number;
  openComplaints: number;
  pendingViewImages: number;
  pendingOffers: number;
  settlementsPending: number;
  settlementsDisputed: number;
  premiumExpiringSoon: number;
  premiumExpired: number;
  campaignsEndingSoon: number;
  announcementsExpiringSoon: number;
  pendingWorkerNotifications: number;
}

/**
 * GET api/admin/attention-summary
 * One lightweight call returning the count for every admin queue. Resolves to
 * null on failure so the dashboard can fall back to its per-query counts.
 */
export const getAttentionSummary = async (
  signal?: AbortSignal
): Promise<AttentionSummaryDto | null> => {
  try {
    const { data } = await server.get<AttentionSummaryDto>(
      "api/admin/attention-summary",
      { signal }
    );
    return data ?? null;
  } catch {
    return null;
  }
};
