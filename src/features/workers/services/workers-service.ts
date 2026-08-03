import { server } from "../../../lib/@axios";
import type {
  WorkerDto,
  WorkerProviderType,
  CreateWorkerRequest,
  CreateWorkerResponse,
} from "../types/api";

/**
 * GET /api/workers?providerType=...&providerId=...
 * Returns the single worker for a provider, or null if none is assigned.
 */
export const getWorker = async (
  providerType: WorkerProviderType,
  providerId: number,
  signal?: AbortSignal
): Promise<WorkerDto | null> => {
  const { data } = await server.get<WorkerDto | null>("/api/workers", {
    params: { providerType, providerId },
    signal,
  });
  return data ?? null;
};

/**
 * POST /api/workers (owner/admin)
 * Creates the worker UserAccount + ProviderManager row and assigns it.
 */
export const createWorker = async (
  body: CreateWorkerRequest
): Promise<CreateWorkerResponse> => {
  const { data } = await server.post<CreateWorkerResponse>("/api/workers", body);
  return data;
};

/**
 * PATCH /api/workers/{providerManagerId}/active?isActive={true|false}
 * Activates / deactivates the worker. Deactivating blocks their login.
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
 * DELETE /api/workers/{providerManagerId} (owner/admin)
 * Soft-deletes the assignment and the worker account, freeing the provider slot.
 */
export const deleteWorker = async (
  providerManagerId: number
): Promise<void> => {
  await server.delete(`/api/workers/${providerManagerId}`);
};
