import { server } from "../../../lib/@axios";

export interface NearbyRadiusDto {
  radiusKm: number;
}

/**
 * GET api/settings/nearby-radius → { radiusKm }.
 * Max distance (km) for nearest stations + radius banners. Defaults to 30.
 */
export const getNearbyRadius = async (signal?: AbortSignal): Promise<number> => {
  const { data } = await server.get<NearbyRadiusDto>(
    "api/settings/nearby-radius",
    { signal }
  );
  return typeof data?.radiusKm === "number" ? data.radiusKm : 30;
};

/**
 * PUT api/settings/nearby-radius { radiusKm } (admin only).
 */
export const setNearbyRadius = async (
  radiusKm: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.put("api/settings/nearby-radius", { radiusKm }, { signal });
};

export interface ImpressionWindowDto {
  minutes: number;
}

/**
 * GET api/settings/impression-window → { minutes }.
 * How long an impression is de-duplicated per user per asset. Default 30.
 * NOTE for BE: this settings endpoint must be added + wired into the dedup logic.
 */
export const getImpressionWindow = async (signal?: AbortSignal): Promise<number> => {
  const { data } = await server.get<ImpressionWindowDto>(
    "api/settings/impression-window",
    { signal }
  );
  return typeof data?.minutes === "number" ? data.minutes : 30;
};

/**
 * PUT api/settings/impression-window { minutes } (admin only).
 */
export const setImpressionWindow = async (
  minutes: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.put("api/settings/impression-window", { minutes }, { signal });
};
