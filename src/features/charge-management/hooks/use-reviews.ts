import { useQuery } from "@tanstack/react-query";
import { getChargingPointReviews } from "../services/review-service";

export const CP_REVIEWS_QUERY_KEY = ["charge-management", "reviews"];

/** Reviews (rating + comment) for a station. */
export function useChargingPointReviews(id: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: [...CP_REVIEWS_QUERY_KEY, id],
    queryFn: ({ signal }) => getChargingPointReviews(id!, signal),
    enabled: enabled && id != null && id > 0,
  });
}
