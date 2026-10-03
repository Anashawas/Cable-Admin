import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAuthorizedTag,
  deleteChargePoint,
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
    refetchInterval: live ? LIVE_REFETCH_MS : false,
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
