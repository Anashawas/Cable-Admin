// Partner app adoption — how many stations have a real owner, and how many of
// those owners actually use the partner app.
//
// Backed by GET /api/admin/partner-adoption (admin only). It is deliberately a
// separate endpoint from GetAllChargingPoints, which is public — owner login
// times must not leak to the consumer app.

/**
 * Where a station sits in the adoption funnel, worst to best. Computed
 * server-side so every screen agrees.
 */
export type AdoptionStage =
	/** No owner assigned at all. */
	| "NoOwner"
	/** Owned by an admin account — a placeholder, not a real partner. */
	| "DefaultOwner"
	/** Real owner, but never signed into a partner client and no activity. */
	| "NeverUsedApp"
	/** Used it once, but nothing inside the active window. */
	| "Inactive"
	/** Partner-side activity or a request inside the window. */
	| "Active";

export const ADOPTION_STAGES: AdoptionStage[] = [
	"NoOwner",
	"DefaultOwner",
	"NeverUsedApp",
	"Inactive",
	"Active",
];

export interface AdoptionFunnelDto {
	allStations: number;
	noOwner: number;
	/** Stations whose owner account holds the Admin role. */
	defaultOwner: number;
	withRealOwner: number;
	/** Real owners counted once, not per station. */
	distinctRealOwners: number;
	ownerUsedPartnerApp: number;
	activeInWindow: number;
}

export interface AdoptionStationDto {
	chargingPointId: number;
	name?: string | null;
	cityName?: string | null;
	ownerId?: number | null;
	ownerName?: string | null;
	/** E.164, e.g. +962786363310. */
	ownerPhone?: string | null;
	isDefaultOwner: boolean;
	ownerUsesPartnerApp: boolean;
	ownerUsesPartnerWeb: boolean;
	/**
	 * Written only by partner-app / partner-web logins — a consumer-app login
	 * does not move it.
	 */
	ownerLastLoginAt?: string | null;
	/** Last authenticated request from a partner client (throttled). */
	ownerLastSeenAt?: string | null;
	/** Newest of: QR generated, offer confirmed, update request, offer proposed. */
	lastPartnerActivityAt?: string | null;
	stage: AdoptionStage;
}

export interface PartnerAdoptionResponse {
	funnel: AdoptionFunnelDto;
	activeWindowDays: number;
	stations: AdoptionStationDto[];
}
