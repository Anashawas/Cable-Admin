import { server } from "../../../lib/@axios";
import type { ChargingPointDto } from "../types/api";

export interface PlugTypeDto {
  id: number;
  name?: string | null;
}

/**
 * GET api/plug-types/GetAllPlugTypes
 * Returns array of { id, name }.
 */
const getAllPlugTypes = async (signal?: AbortSignal): Promise<PlugTypeDto[]> => {
  const { data } = await server.get<PlugTypeDto[]>("api/plug-types/GetAllPlugTypes", {
    signal,
  });
  return Array.isArray(data) ? data : [];
};

/**
 * GET api/charging-points/GetChargingPointById/{id}
 */
const getStationById = async (
  id: number,
  signal?: AbortSignal
): Promise<ChargingPointDto> => {
  const { data } = await server.get<ChargingPointDto>(
    `api/charging-points/GetChargingPointById/${id}`,
    { signal }
  );
  return data;
};

/**
 * POST api/charging-points/AddChargingPoint
 * Returns ID (possibly as array [123]); parses to number.
 */
const addStation = async (
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<number> => {
  const { data } = await server.post<number | number[]>(
    "api/charging-points/AddChargingPoint",
    body,
    { signal }
  );
  if (Array.isArray(data) && data.length > 0) {
    return Number(data[0]);
  }
  return Number(data);
};

/**
 * PUT api/charging-points/UpdateChargingPoint/{id}
 */
const updateStation = async (
  id: number,
  body: Record<string, unknown>,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`api/charging-points/UpdateChargingPoint/${id}`, body, {
    signal,
  });
};

export { getAllPlugTypes, getStationById, addStation, updateStation };
