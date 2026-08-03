import { server } from "../../../lib/@axios";
import type {
  GetPendingUpdateRequestsRequest,
  UpdateRequestDto,
} from "../types/api";

/**
 * POST api/provider/charging-points/update-requests/pending
 * Body: { status?: string | null }
 */
const getPendingRequests = async (
  status?: string | null,
  signal?: AbortSignal
): Promise<UpdateRequestDto[]> => {
  const body: GetPendingUpdateRequestsRequest = { status: status ?? null };
  const { data } = await server.post<UpdateRequestDto[]>(
    "api/provider/charging-points/update-requests/pending",
    body,
    { signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST api/provider/charging-points/update-requests/{requestId}/approve
 * No body. Use request id (UpdateRequestDto.id), not chargingPointId.
 */
const approveRequest = async (
  requestId: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.post(
    `api/provider/charging-points/update-requests/${requestId}/approve`,
    null,
    { signal }
  );
};

/**
 * POST api/provider/charging-points/update-requests/{requestId}/reject
 * Body: { rejectionReason: string }. Use request id (UpdateRequestDto.id).
 */
const rejectRequest = async (
  requestId: number,
  rejectionReason?: string | null,
  signal?: AbortSignal
): Promise<void> => {
  await server.post(
    `api/provider/charging-points/update-requests/${requestId}/reject`,
    { rejectionReason: rejectionReason ?? "" },
    { signal }
  );
};

export { getPendingRequests, approveRequest, rejectRequest };
