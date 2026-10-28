import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminSession,
  getAdminSessions,
  getConnectorCodes,
  getConnectorReports,
  getLiveChargingSettings,
  getStationTariff,
  getUserCards,
  getUserSessions,
  removeStationTariff,
  renewConnectorCode,
  resolveConnectorReport,
  setLiveChargingSettings,
  setStationTariff,
  unlinkUserCard,
} from "../services/live-charging-service";
import type {
  AdminSessionsQuery,
  ConnectorReportsQuery,
  LiveChargingSettingsUpdate,
  TouWindowDto,
} from "../types/live-charging";
import { OCPP_QUERY_KEY } from "../utils/live-events";

/** Keys live under the Cable Connect root, so every Cable Connect write refreshes them too. */
const KEY = [...OCPP_QUERY_KEY, "live-charging"];

/** A running session's detail refreshes itself; finished ones do not change. */
const OPEN_SESSION_REFETCH_MS = 15_000;

// ============================================
// Sessions
// ============================================

export function useAdminSessions(query: AdminSessionsQuery, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "sessions", query],
    queryFn: ({ signal }) => getAdminSessions(query, signal),
    placeholderData: (prev) => prev,
    enabled,
  });
}

export function useAdminSession(id: number | null | undefined) {
  return useQuery({
    queryKey: [...KEY, "session", id],
    queryFn: ({ signal }) => getAdminSession(id!, signal),
    enabled: id != null && id > 0,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
    refetchInterval: (q) => (q.state.data?.session.isOpen ? OPEN_SESSION_REFETCH_MS : false),
  });
}

export function useUserSessions(userId: number, status: "open" | "closed" | "", page: number, pageSize: number, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "user-sessions", userId, status, page, pageSize],
    queryFn: ({ signal }) => getUserSessions(userId, { status, page, pageSize }, signal),
    placeholderData: (prev) => prev,
    enabled: enabled && userId > 0,
  });
}

// ============================================
// Cards linked to a user
// ============================================

export function useUserCards(userId: number, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "user-cards", userId],
    queryFn: ({ signal }) => getUserCards(userId, signal),
    enabled: enabled && userId > 0,
  });
}

export function useUnlinkUserCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, cardId }: { userId: number; cardId: number }) => unlinkUserCard(userId, cardId),
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: [...KEY, "user-cards", v.userId] }),
  });
}

// ============================================
// Station tariff
// ============================================

export function useStationTariff(chargingPointId: number) {
  return useQuery({
    queryKey: [...KEY, "tariff", chargingPointId],
    queryFn: ({ signal }) => getStationTariff(chargingPointId, signal),
    enabled: chargingPointId > 0,
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  });
}

export function useSetStationTariff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chargingPointId, windows, note }: { chargingPointId: number; windows: TouWindowDto[]; note: string | null }) =>
      setStationTariff(chargingPointId, windows, note),
    onSuccess: (data, v) => qc.setQueryData([...KEY, "tariff", v.chargingPointId], data),
  });
}

export function useRemoveStationTariff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chargingPointId: number) => removeStationTariff(chargingPointId),
    onSuccess: (data, chargingPointId) => qc.setQueryData([...KEY, "tariff", chargingPointId], data),
  });
}

// ============================================
// Plug stickers
// ============================================

export function useConnectorCodes(chargingPointId: number, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "codes", chargingPointId],
    queryFn: ({ signal }) => getConnectorCodes(chargingPointId, null, signal),
    enabled: enabled && chargingPointId > 0,
  });
}

export function useRenewConnectorCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chargingPointId, codeId }: { chargingPointId: number; codeId: number }) => renewConnectorCode(chargingPointId, codeId),
    onSuccess: (_r, v) => qc.invalidateQueries({ queryKey: [...KEY, "codes", v.chargingPointId] }),
  });
}

// ============================================
// Plug reports
// ============================================

/** Grouped per plug. Polled slowly: reports come from drivers at any time. */
export function useConnectorReports(query: ConnectorReportsQuery, enabled = true) {
  return useQuery({
    queryKey: [...KEY, "reports", query],
    queryFn: ({ signal }) => getConnectorReports(query, signal),
    enabled,
    refetchInterval: enabled ? 60_000 : false,
    placeholderData: (prev) => prev,
  });
}

export function useResolveConnectorReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, note, allOnPlug }: { reportId: number; note: string | null; allOnPlug: boolean }) =>
      resolveConnectorReport(reportId, note, allOnPlug),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, "reports"] }),
  });
}

// ============================================
// Live charging switches
// ============================================

export function useLiveChargingSettings() {
  return useQuery({
    queryKey: [...KEY, "settings"],
    queryFn: ({ signal }) => getLiveChargingSettings(signal),
  });
}

export function useSetLiveChargingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LiveChargingSettingsUpdate) => setLiveChargingSettings(body),
    onSuccess: (data) => qc.setQueryData([...KEY, "settings"], data),
  });
}
