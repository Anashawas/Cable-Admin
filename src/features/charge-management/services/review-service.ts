import { server } from "../../../lib/@axios";
import type { ChargingPointReviewsResponse } from "../types/api";

/**
 * GET /api/rate/GetChargingPointReviews/{id} (public)
 * Average rating, total, and reviews ordered newest first. Ratings without a
 * comment appear with comment = null.
 */
export const getChargingPointReviews = async (
  id: number,
  signal?: AbortSignal
): Promise<ChargingPointReviewsResponse> => {
  const { data } = await server.get<ChargingPointReviewsResponse>(
    `api/rate/GetChargingPointReviews/${id}`,
    { signal }
  );
  return data;
};
