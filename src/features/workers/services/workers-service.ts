import { server } from "../../../lib/@axios";
import type {
  WorkerDto,
  WorkerProviderType,
  CreateWorkerRequest,
  CreateWorkerResponse,
  WorkerCredentials,
} from "../types/api";

/**
 * GET /api/admin/workers?providerType=...&providerId=...
 * The provider's workers (a list), oldest first, with login state, status and effective privileges.
 */
export const getWorkers = async (
  providerType: WorkerProviderType,
  providerId: number,
  signal?: AbortSignal
): Promise<WorkerDto[]> => {
  const { data } = await server.get<WorkerDto[]>("/api/admin/workers", {
    params: { providerType, providerId },
    signal,
  });
  return Array.isArray(data) ? data : [];
};

/**
 * POST /api/workers
 * Creates the worker (name + phone, optional email) and returns the temporary password ONCE with the share message.
 */
export const createWorker = async (
  body: CreateWorkerRequest
): Promise<CreateWorkerResponse> => {
  const { data } = await server.post<CreateWorkerResponse>("/api/workers", body);
  return data;
};

/** POST /api/admin/workers/{id}/reset-temp-password — support: a new temporary password (the old one stops working). */
export const resetWorkerTempPassword = async (providerManagerId: number): Promise<WorkerCredentials> => {
  const { data } = await server.post<WorkerCredentials>(`/api/admin/workers/${providerManagerId}/reset-temp-password`, {});
  return data;
};

/** POST /api/admin/workers/{id}/unlock — support: clears the 15-minute login lock. */
export const unlockWorker = async (providerManagerId: number): Promise<void> => {
  await server.post(`/api/admin/workers/${providerManagerId}/unlock`);
};

/**
 * PATCH /api/workers/{providerManagerId}/active?isActive={true|false}
 * Suspends / resumes the assignment (the worker's partner sessions end at once; the account is untouched).
 */
export const setWorkerActive = async (
  providerManagerId: number,
  isActive: boolean
): Promise<void> => {
  await server.patch(`/api/workers/${providerManagerId}/active`, null, {
    params: { isActive },
  });
};

/**
 * DELETE /api/workers/{providerManagerId}
 * Removes the assignment and the partner credential; a driver's account is never touched.
 */
export const deleteWorker = async (
  providerManagerId: number
): Promise<void> => {
  await server.delete(`/api/workers/${providerManagerId}`);
};
