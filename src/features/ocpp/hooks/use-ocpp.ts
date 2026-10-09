import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAuthorizedTag,
  changeAvailability,
  changeConfiguration,
  deleteChargePoint,
  getAlerts,
  getCommands,
  getConfiguration,
  getLiveVisibility,
  getAlertThresholds,
  setAlertThresholds,
  recomputeReliability,
  remoteStop,
  remoteStart,
  setLiveStatusBlocked,
  setShareLiveStatus,
  resetChargePoint,
  syncLocalList,
  triggerMessage,
  unlockConnector,
  getAuthorizedTags,
  getChargePoint,
  getChargePoints,
  getFleetHealth,
  getRawMessages,
  registerChargePoint,
  removeAuthorizedTag,
  rotateChargePointPassword,
  setAuthorizedTagEnabled,
  setChargePointEnabled,
  updateChargePoint,
  updateConnector,
} from "../services/ocpp-service";
import type {
  AddAuthorizedTagRequest,
  OcppChargePointsQuery,
  OcppTriggerMessage,
  RegisterChargePointRequest,
  UpdateChargePointRequest,
  UpdateConnectorRequest,
} from "../types/api";

export const OCPP_QUERY_KEY = ["ocpp"];

/** Live screens poll: chargers report every 15–60 s, so 15 s keeps "last seen" honest without hammering the API. */
export const LIVE_REFETCH_MS = 15_000;

// ============================================
// Queries
// ============================================

export function useOcppFleetHealth(live = true) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "fleet-health"],
    queryFn: ({ signal }) => getFleetHealth(signal),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
  });
}

export function useOcppChargePoints(query: OcppChargePointsQuery, live = true) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "charge-points", query],
    queryFn: ({ signal }) => getChargePoints(query, signal),
    refetchInterval: live ? LIVE_REFETCH_MS : false,
    placeholderData: (prev) => prev,
  });
}

export function useOcppChargePoint(id: number | null | undefined, live = true) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "charge-point", id],
    queryFn: ({ signal }) => getChargePoint(id!, 10, signal),
    enabled: id != null && id > 0,
    // A unit that has not booted yet is being commissioned right now: poll every 4 s so the
    // admin at the station sees "connected" the moment it happens.
    refetchInterval: (q) => (!live ? false : q.state.data && !q.state.data.lastBootAt ? 4_000 : LIVE_REFETCH_MS),
  });
}

export function useOcppRawMessages(id: number | null | undefined, take = 50, enabled = true) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "raw-messages", id, take],
    queryFn: ({ signal }) => getRawMessages(id!, { take }, signal),
    enabled: enabled && id != null && id > 0,
    refetchInterval: enabled ? LIVE_REFETCH_MS : false,
  });
}

export function useOcppAlerts(params: { openOnly?: boolean; chargePointId?: number; take?: number } = {}, live = true) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "alerts", params],
    queryFn: ({ signal }) => getAlerts(params, signal),
    refetchInterval: live ? LIVE_REFETCH_MS * 4 : false,
  });
}

export function useOcppAuthorizedTags(chargingPointId: number | null | undefined) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "authorized-tags", chargingPointId],
    queryFn: ({ signal }) => getAuthorizedTags(chargingPointId!, true, signal),
    enabled: chargingPointId != null && chargingPointId > 0,
  });
}

// ============================================
// Mutations — every write invalidates the whole feature; the lists are small.
// ============================================

function useInvalidateOcpp() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: OCPP_QUERY_KEY });
}

export function useRegisterChargePoint() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: (body: RegisterChargePointRequest) => registerChargePoint(body),
    onSuccess: invalidate,
  });
}

export function useUpdateChargePoint() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateChargePointRequest }) => updateChargePoint(id, body),
    onSuccess: invalidate,
  });
}

export function useRotateChargePointPassword() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, requirePassword }: { id: number; requirePassword: boolean }) =>
      rotateChargePointPassword(id, requirePassword),
    onSuccess: invalidate,
  });
}

export function useSetChargePointEnabled() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) => setChargePointEnabled(id, isEnabled),
    onSuccess: invalidate,
  });
}

export function useDeleteChargePoint() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: (id: number) => deleteChargePoint(id),
    onSuccess: invalidate,
  });
}

export function useUpdateConnector() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateConnectorRequest }) => updateConnector(id, body),
    onSuccess: invalidate,
  });
}

export function useAddAuthorizedTag() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: (body: AddAuthorizedTagRequest) => addAuthorizedTag(body),
    onSuccess: invalidate,
  });
}

export function useSetAuthorizedTagEnabled() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: number; isEnabled: boolean }) => setAuthorizedTagEnabled(id, isEnabled),
    onSuccess: invalidate,
  });
}

export function useRemoveAuthorizedTag() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: (id: number) => removeAuthorizedTag(id),
    onSuccess: invalidate,
  });
}

// ============================================
// Phase 2 — commands. Each one waits for the unit's answer (≤ 30 s) and then
// refreshes the charger, since most commands change connector state.
// ============================================

export function useOcppCommands(id: number | null | undefined, take = 30, enabled = true) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "commands", id, take],
    queryFn: ({ signal }) => getCommands(id!, take, signal),
    enabled: enabled && id != null && id > 0,
  });
}

export function useTriggerMessage() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, requestedMessage, connectorId }: { id: number; requestedMessage: OcppTriggerMessage; connectorId?: number | null }) =>
      triggerMessage(id, requestedMessage, connectorId),
    onSettled: invalidate,
  });
}

export function useResetChargePoint() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, type }: { id: number; type: "Soft" | "Hard" }) => resetChargePoint(id, type),
    onSettled: invalidate,
  });
}

export function useUnlockConnector() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, connectorId }: { id: number; connectorId: number }) => unlockConnector(id, connectorId),
    onSettled: invalidate,
  });
}

export function useChangeAvailability() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, connectorId, type }: { id: number; connectorId: number; type: "Operative" | "Inoperative" }) =>
      changeAvailability(id, connectorId, type),
    onSettled: invalidate,
  });
}

export function useRemoteStart() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, connectorId }: { id: number; connectorId: number }) => remoteStart(id, connectorId),
    onSettled: invalidate,
  });
}

export function useRemoteStop() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, transactionId }: { id: number; transactionId: number }) => remoteStop(id, transactionId),
    onSettled: invalidate,
  });
}

export function useGetConfiguration() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, keys }: { id: number; keys?: string[] }) => getConfiguration(id, keys),
    onSettled: invalidate,
  });
}

export function useChangeConfiguration() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ id, key, value }: { id: number; key: string; value: string }) => changeConfiguration(id, key, value),
    onSettled: invalidate,
  });
}

export function useSyncLocalList() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: (id: number) => syncLocalList(id),
    onSettled: invalidate,
  });
}

// ============================================
// N-2 — live-data visibility
// ============================================

export function useLiveVisibility(chargingPointId: number | null | undefined) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "live-visibility", chargingPointId],
    queryFn: ({ signal }) => getLiveVisibility(chargingPointId!, signal),
    enabled: chargingPointId != null && chargingPointId > 0,
  });
}

export function useOcppAlertThresholds(chargingPointId: number | null | undefined) {
  return useQuery({
    queryKey: [...OCPP_QUERY_KEY, "alert-thresholds", chargingPointId],
    queryFn: ({ signal }) => getAlertThresholds(chargingPointId!, signal),
    enabled: chargingPointId != null && chargingPointId > 0,
  });
}

export function useSetOcppAlertThresholds() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ chargingPointId, ...body }: { chargingPointId: number; offlineMinutes: number | null; faultedMinutes: number | null; longSessionMinutes: number | null; parkedMinutes: number | null }) =>
      setAlertThresholds(chargingPointId, body),
    onSuccess: invalidate,
  });
}

export function useSetLiveStatusBlocked() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ chargingPointId, blocked, reason }: { chargingPointId: number; blocked: boolean; reason?: string | null }) =>
      setLiveStatusBlocked(chargingPointId, blocked, reason),
    onSuccess: invalidate,
  });
}

export function useSetShareLiveStatus() {
  const invalidate = useInvalidateOcpp();
  return useMutation({
    mutationFn: ({ chargingPointId, share }: { chargingPointId: number; share: boolean }) => setShareLiveStatus(chargingPointId, share),
    onSuccess: invalidate,
  });
}

export function useRecomputeReliability() {
  const invalidate = useInvalidateOcpp();
  return useMutation({ mutationFn: () => recomputeReliability(), onSuccess: invalidate });
}
