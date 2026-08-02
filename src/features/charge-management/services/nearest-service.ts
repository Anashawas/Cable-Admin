import { server } from "../../../lib/@axios";

export interface NearestStationDto {
  id: number;
  name?: string | null;
  cityName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  isPremium?: boolean | null;
  premiumUntil?: string | null;
  viewImage?: string | null;
  viewImageStatus?: string | null;
  iConUrl?: string | null;
  stationType?: { id: number; name?: string | null } | null;
  statusSummary?: { id: number; name?: string | null } | null;
}

export type NearestPremiumFilter = "all" | "true" | "false";

/**
 * GET api/charging-points/GetNearest?lat=&lng=&premium=all|true|false
 * Distance-sorted nearest stations WITH the ads fields (isPremium, premiumUntil,
 * viewImage, distanceKm). This is the endpoint that returns the live ad state.
 */
export const getNearestStations = async (
  lat: number,
  lng: number,
  premium: NearestPremiumFilter,
  signal?: AbortSignal
): Promise<NearestStationDto[]> => {
  const { data } = await server.get<NearestStationDto[]>(
    `api/charging-points/GetNearest?lat=${lat}&lng=${lng}&premium=${premium}`,
    { signal }
  );
  return Array.isArray(data) ? data : [];
};
