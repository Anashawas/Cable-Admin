import { server } from "@/lib/@axios";
import type {
  AddAuthorizedTagRequest,
  ChargerCredentials,
  OcppAlertDto,
  OcppAuthorizedTagDto,
  OcppChargePointDetailDto,
  OcppChargePointListItemDto,
  OcppChargePointsQuery,
  OcppCommandDto,
  OcppCommandResultDto,
  OcppFleetHealthDto,
  OcppLocalListStateDto,
  OcppRawMessageDto,
  PagedResult,
  OcppTriggerMessage,
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
// Alerts (the 5-minute job's findings)
// ============================================

export const getAlerts = async (
  params: { openOnly?: boolean; chargePointId?: number; take?: number } = {},
  signal?: AbortSignal
): Promise<OcppAlertDto[]> => {
  const { data } = await server.get<OcppAlertDto[]>(`${BASE}/alerts`, { params, signal });
  return data;
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

// ============================================
// Phase 2 — commands to the charger (the API forwards them to Cable.Ocpp and waits ≤ 30 s)
// ============================================

const cmd = async (id: number, name: string, body: unknown): Promise<OcppCommandResultDto> => {
  const { data } = await server.post<OcppCommandResultDto>(`${BASE}/charge-points/${id}/commands/${name}`, body);
  return data;
};

export const triggerMessage = (id: number, requestedMessage: OcppTriggerMessage, connectorId?: number | null) =>
  cmd(id, "trigger-message", { requestedMessage, connectorId: connectorId ?? null });

export const resetChargePoint = (id: number, type: "Soft" | "Hard") => cmd(id, "reset", { type });

export const unlockConnector = (id: number, connectorId: number) => cmd(id, "unlock-connector", { connectorId });

export const changeAvailability = (id: number, connectorId: number, type: "Operative" | "Inoperative") =>
  cmd(id, "change-availability", { connectorId, type });

export const remoteStop = (id: number, transactionId: number) => cmd(id, "remote-stop", { transactionId });

export const getConfiguration = (id: number, keys?: string[]) => cmd(id, "get-configuration", { keys: keys ?? null });

export const changeConfiguration = (id: number, key: string, value: string) =>
  cmd(id, "change-configuration", { key, value });

export const syncLocalList = async (id: number): Promise<OcppLocalListStateDto> => {
  const { data } = await server.post<OcppLocalListStateDto>(`${BASE}/charge-points/${id}/commands/sync-local-list`);
  return data;
};

export const getCommands = async (id: number, take = 30, signal?: AbortSignal): Promise<OcppCommandDto[]> => {
  const { data } = await server.get<OcppCommandDto[]>(`${BASE}/charge-points/${id}/commands`, { params: { take }, signal });
  return data;
};
