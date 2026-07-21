import { server } from "../../../lib/@axios";
import type {
  RecordPremiumPaymentRequest,
  PremiumHistoryResponse,
} from "../types/api";

/**
 * PATCH /api/charging-points/{id}/premium (admin)
 * Records/renews a premium payment: appends history, updates current dates, and
 * sets the station type to Premium automatically.
 */
export const recordPremiumPayment = async (
  id: number,
  body: RecordPremiumPaymentRequest,
  signal?: AbortSignal
): Promise<{ subscriptionId: number; paymentDate: string; expiresAt: string }> => {
  const { data } = await server.patch(`api/charging-points/${id}/premium`, body, { signal });
  return data;
};

/**
 * GET /api/charging-points/{id}/premium-history (admin)
 * Current dates + isPremiumActive + full payment history.
 */
export const getPremiumHistory = async (
  id: number,
  signal?: AbortSignal
): Promise<PremiumHistoryResponse> => {
  const { data } = await server.get<PremiumHistoryResponse>(
    `api/charging-points/${id}/premium-history`,
    { signal }
  );
  return data;
};
