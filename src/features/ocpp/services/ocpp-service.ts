import { server } from "@/lib/@axios";
import type {
  AddAuthorizedTagRequest,
  ChargerCredentials,
  OcppAuthorizedTagDto,
  OcppChargePointDetailDto,
  OcppChargePointListItemDto,
  OcppChargePointsQuery,
  OcppFleetHealthDto,
  OcppRawMessageDto,
  PagedResult,
  RegisterChargePointRequest,
  UpdateChargePointRequest,
  UpdateConnectorRequest,
} from "../types/api";

const BASE = "api/admin/ocpp";

// ============================================
// Fleet
// ============================================

export const getFleetHealth = async (signal?: AbortSignal): Promise<OcppFleetHealthDto> => {
  const { data } = await server.get<OcppFleetHealthDto>(`${BASE}/fleet-health`, { signal });
  return data;
};

export const getChargePoints = async (
  query: OcppChargePointsQuery,
  signal?: AbortSignal
): Promise<PagedResult<OcppChargePointListItemDto>> => {
  const { data } = await server.get<PagedResult<OcppChargePointListItemDto>>(`${BASE}/charge-points`, {
    params: query,
    signal,
  });
  return data;
};

export const getChargePoint = async (
  id: number,
  recentTransactions = 10,
  signal?: AbortSignal
): Promise<OcppChargePointDetailDto> => {
  const { data } = await server.get<OcppChargePointDetailDto>(`${BASE}/charge-points/${id}`, {
    params: { recentTransactions },
    signal,
  });
  return data;
};

export const registerChargePoint = async (body: RegisterChargePointRequest): Promise<ChargerCredentials> => {
  const { data } = await server.post<ChargerCredentials>(`${BASE}/charge-points`, body);
  return data;
};

export const updateChargePoint = async (id: number, body: UpdateChargePointRequest): Promise<void> => {
  await server.put(`${BASE}/charge-points/${id}`, body);
};

export const rotateChargePointPassword = async (id: number, requirePassword = true): Promise<ChargerCredentials> => {
  const { data } = await server.post<ChargerCredentials>(`${BASE}/charge-points/${id}/rotate-password`, { requirePassword });
  return data;
};

export const setChargePointEnabled = async (id: number, isEnabled: boolean): Promise<void> => {
  await server.put(`${BASE}/charge-points/${id}/enabled`, { isEnabled });
};

export const deleteChargePoint = async (id: number): Promise<void> => {
  await server.delete(`${BASE}/charge-points/${id}`);
};

export const getRawMessages = async (
  id: number,
  params: { take?: number; direction?: string; action?: string; beforeId?: number } = {},
  signal?: AbortSignal
): Promise<OcppRawMessageDto[]> => {
  const { data } = await server.get<OcppRawMessageDto[]>(`${BASE}/charge-points/${id}/raw-messages`, { params, signal });
  return data;
};

export const updateConnector = async (id: number, body: UpdateConnectorRequest): Promise<void> => {
  await server.put(`${BASE}/connectors/${id}`, body);
};

// ============================================
// Authorized tags (cards / passwords allowed to charge)
// ============================================

export const getAuthorizedTags = async (
  chargingPointId: number,
  includeDisabled = true,
  signal?: AbortSignal
): Promise<OcppAuthorizedTagDto[]> => {
  const { data } = await server.get<OcppAuthorizedTagDto[]>(`${BASE}/authorized-tags`, {
    params: { chargingPointId, includeDisabled },
    signal,
  });
  return data;
};

export const addAuthorizedTag = async (body: AddAuthorizedTagRequest): Promise<number> => {
  const { data } = await server.post<{ id: number }>(`${BASE}/authorized-tags`, body);
  return data.id;
};

export const setAuthorizedTagEnabled = async (id: number, isEnabled: boolean): Promise<void> => {
  await server.put(`${BASE}/authorized-tags/${id}/enabled`, { isEnabled });
};

export const removeAuthorizedTag = async (id: number): Promise<void> => {
  await server.delete(`${BASE}/authorized-tags/${id}`);
};
