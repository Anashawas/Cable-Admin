import { useQuery } from "@tanstack/react-query";
import { getPartnerAdoption } from "../services/partner-adoption-service";

export const PARTNER_ADOPTION_QUERY_KEY = ["partner-adoption"];

/** The adoption funnel + per-station rows for the given activity window. */
export function usePartnerAdoption(activeWindowDays = 30) {
	return useQuery({
		queryKey: [...PARTNER_ADOPTION_QUERY_KEY, activeWindowDays],
		queryFn: ({ signal }) => getPartnerAdoption(activeWindowDays, signal),
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
	});
}
