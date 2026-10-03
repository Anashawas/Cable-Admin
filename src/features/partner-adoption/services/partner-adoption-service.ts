import { server } from "../../../lib/@axios";
import type { PartnerAdoptionResponse } from "../types/api";

/**
 * GET /api/admin/partner-adoption?activeWindowDays=30 (admin)
 * The adoption funnel plus a per-station row carrying the owner, whether they
 * have ever used a partner client, and when they were last seen.
 */
export const getPartnerAdoption = async (
	activeWindowDays = 30,
	signal?: AbortSignal
): Promise<PartnerAdoptionResponse> => {
	const { data } = await server.get<PartnerAdoptionResponse>("api/admin/partner-adoption", {
		params: { activeWindowDays },
		signal,
	});
	return {
		activeWindowDays: data?.activeWindowDays ?? activeWindowDays,
		funnel: data?.funnel ?? {
			allStations: 0,
			noOwner: 0,
			defaultOwner: 0,
			withRealOwner: 0,
			distinctRealOwners: 0,
			ownerUsedPartnerApp: 0,
			activeInWindow: 0,
		},
		stations: Array.isArray(data?.stations) ? data.stations : [],
	};
};
