import { server } from "../../../lib/@axios";
import type { ChargingPointDto, GetAllChargingPointsRequest } from "../types/api";

/**
 * POST api/charging-points/GetAllChargingPoints
 * Returns full list; filtering/sorting is client-side per spec.
 */
const getAllChargingPoints = async (
  body: GetAllChargingPointsRequest = { name: null, chargerPointTypeId: null, cityName: null },
  signal?: AbortSignal
): Promise<ChargingPointDto[]> => {
  const { data } = await server.post<ChargingPointDto[]>(
    "api/charging-points/GetAllChargingPoints",
    body,
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

export { getAllChargingPoints };
