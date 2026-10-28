import { server } from "@/lib/@axios";
import type {
  AdminSessionDetailDto,
  AdminSessionsPageDto,
  AdminSessionsQuery,
  ConnectorCodeDto,
  ConnectorReportGroupDto,
  ConnectorReportsQuery,
  LiveChargingSettingsDto,
  LiveChargingSettingsUpdate,
  OcppCardDto,
  StationTariffDto,
  TouWindowDto,
} from "../types/live-charging";
import { fileNameFromDisposition, sessionsParams } from "../utils/live-charging";

/** Sprint 5 live charging — admin endpoints (Docs/Sprint5-LiveCharging-A.md / -B.md). */
const BASE = "api/admin/ocpp";

export interface DownloadedFile {
  blob: Blob;
  fileName: string;
}

const download = async (url: string, fallbackName: string, params?: Record<string, unknown>): Promise<DownloadedFile> => {
  const res = await server.get<Blob>(url, { params, responseType: "blob" });
  const header = (res.headers as Record<string, string | undefined>)?.["content-disposition"];
  return { blob: res.data, fileName: fileNameFromDisposition(header, fallbackName) };
};

// ============================================
// Sessions (§11.b)
// ============================================

export const getAdminSessions = async (query: AdminSessionsQuery, signal?: AbortSignal): Promise<AdminSessionsPageDto> => {
  const { data } = await server.get<AdminSessionsPageDto>(`${BASE}/sessions`, { params: sessionsParams(query), signal });
  return data;
};

/** CSV of the same filters (UTF-8 with BOM, Jordan time, at most 50,000 rows). */
export const exportAdminSessions = (query: AdminSessionsQuery): Promise<DownloadedFile> =>
  download(`${BASE}/sessions/export`, "charging-sessions.csv", sessionsParams({ ...query, page: undefined, pageSize: undefined }));

export const getAdminSession = async (id: number, signal?: AbortSignal): Promise<AdminSessionDetailDto> => {
  const { data } = await server.get<AdminSessionDetailDto>(`${BASE}/sessions/${id}`, { signal });
  return data;
};

/** The PDF receipt of a finished session; 422 SESSION_OPEN while it runs. */
export const downloadSessionReceipt = (id: number): Promise<DownloadedFile> =>
  download(`${BASE}/sessions/${id}/receipt`, `receipt-${id}.pdf`);

/** The user-profile tab: the sessions this user started, with totals. */
export const getUserSessions = async (
  userId: number,
  params: { status?: "open" | "closed" | ""; page?: number; pageSize?: number },
  signal?: AbortSignal,
): Promise<AdminSessionsPageDto> => {
  const { data } = await server.get<AdminSessionsPageDto>(`api/admin/users/${userId}/ocpp-sessions`, {
    params: sessionsParams({ status: params.status, page: params.page, pageSize: params.pageSize }),
    signal,
  });
  return data;
};

// ============================================
// RFID cards linked to a user (4.9)
// ============================================

export const getUserCards = async (userId: number, signal?: AbortSignal): Promise<OcppCardDto[]> => {
  const { data } = await server.get<OcppCardDto[]>(`api/admin/users/${userId}/ocpp-cards`, { signal });
  return Array.isArray(data) ? data : [];
};

/** On the app's own tag (isAppTag) this switches app charging off for the account instead. */
export const unlinkUserCard = async (userId: number, cardId: number): Promise<void> => {
  await server.delete(`api/admin/users/${userId}/ocpp-cards/${cardId}`);
};

// ============================================
// Station tariff (4.4)
// ============================================

export const getStationTariff = async (chargingPointId: number, signal?: AbortSignal): Promise<StationTariffDto> => {
  const { data } = await server.get<StationTariffDto>(`${BASE}/stations/${chargingPointId}/tariff`, { signal });
  return data;
};

export const setStationTariff = async (chargingPointId: number, windows: TouWindowDto[], note: string | null): Promise<StationTariffDto> => {
  const { data } = await server.put<StationTariffDto>(`${BASE}/stations/${chargingPointId}/tariff`, { windows, note });
  return data;
};

/** Back to the national tariff; returns the tariff now in force. */
export const removeStationTariff = async (chargingPointId: number): Promise<StationTariffDto> => {
  const { data } = await server.delete<StationTariffDto>(`${BASE}/stations/${chargingPointId}/tariff`);
  return data;
};

// ============================================
// Plug stickers (§10)
// ============================================

export const getConnectorCodes = async (chargingPointId: number, chargerId?: number | null, signal?: AbortSignal): Promise<ConnectorCodeDto[]> => {
  const { data } = await server.get<ConnectorCodeDto[]>(`${BASE}/stations/${chargingPointId}/connector-codes`, {
    params: chargerId ? { chargerId } : undefined,
    signal,
  });
  return Array.isArray(data) ? data : [];
};

/** Revoke the code (scans then answer 410 CODE_REVOKED) and issue a new one for the same plug. */
export const renewConnectorCode = async (chargingPointId: number, codeId: number): Promise<ConnectorCodeDto> => {
  const { data } = await server.post<ConnectorCodeDto>(`${BASE}/stations/${chargingPointId}/connector-codes/${codeId}/renew`);
  return data;
};

/** A4 sticker sheet, 2 × 3 per page; chargerId = one charger only. */
export const downloadStickers = (chargingPointId: number, chargerId?: number | null): Promise<DownloadedFile> =>
  download(
    `${BASE}/stations/${chargingPointId}/connector-codes/stickers.pdf`,
    chargerId ? `stickers-station-${chargingPointId}-charger-${chargerId}.pdf` : `stickers-station-${chargingPointId}.pdf`,
    chargerId ? { chargerId } : undefined,
  );

// ============================================
// "The plug didn't work" reports (§13.3)
// ============================================

export const getConnectorReports = async (query: ConnectorReportsQuery, signal?: AbortSignal): Promise<ConnectorReportGroupDto[]> => {
  const params: Record<string, string | number> = {};
  if (query.status) params.status = query.status;
  if (query.chargingPointId) params.chargingPointId = query.chargingPointId;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  const { data } = await server.get<ConnectorReportGroupDto[]>(`${BASE}/connector-reports`, { params, signal });
  return Array.isArray(data) ? data : [];
};

/** The plug is fixed: resolves every open report on that plug (allOnPlug false: only this one). */
export const resolveConnectorReport = async (reportId: number, note: string | null, allOnPlug = true): Promise<number> => {
  const { data } = await server.patch<{ resolved: number }>(`${BASE}/connector-reports/${reportId}/resolve`, { note, allOnPlug });
  return data?.resolved ?? 0;
};

// ============================================
// Live charging switches (§8 of part A)
// ============================================

export const getLiveChargingSettings = async (signal?: AbortSignal): Promise<LiveChargingSettingsDto> => {
  const { data } = await server.get<LiveChargingSettingsDto>(`${BASE}/live-charging-settings`, { signal });
  return data;
};

export const setLiveChargingSettings = async (body: LiveChargingSettingsUpdate): Promise<LiveChargingSettingsDto> => {
  const { data } = await server.put<LiveChargingSettingsDto>(`${BASE}/live-charging-settings`, body);
  return data;
};
