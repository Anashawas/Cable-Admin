import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorkers,
  createWorker,
  setWorkerActive,
  deleteWorker,
  resetWorkerTempPassword,
  unlockWorker,
} from "../services/workers-service";
import type { WorkerProviderType, CreateWorkerRequest } from "../types/api";

export const WORKER_QUERY_KEY = (
  providerType: WorkerProviderType | null,
  providerId: number | null
) => ["workers", providerType, providerId];

/** The provider's workers (a list). Disabled until both keys are set. */
export function useWorkers(
  providerType: WorkerProviderType | null,
  providerId: number | null
) {
  return useQuery({
    queryKey: WORKER_QUERY_KEY(providerType, providerId),
    queryFn: ({ signal }) => getWorkers(providerType!, providerId!, signal),
    enabled: !!providerType && !!providerId,
    staleTime: 60 * 1000,
  });
}

function useInvalidate(providerType: WorkerProviderType | null, providerId: number | null) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: WORKER_QUERY_KEY(providerType, providerId) });
}

export function useCreateWorker(providerType: WorkerProviderType | null, providerId: number | null) {
  const invalidate = useInvalidate(providerType, providerId);
  return useMutation({ mutationFn: (body: CreateWorkerRequest) => createWorker(body), onSuccess: invalidate });
}

export function useResetWorkerTempPassword(providerType: WorkerProviderType | null, providerId: number | null) {
  const invalidate = useInvalidate(providerType, providerId);
  return useMutation({ mutationFn: (providerManagerId: number) => resetWorkerTempPassword(providerManagerId), onSuccess: invalidate });
}

export function useUnlockWorker(providerType: WorkerProviderType | null, providerId: number | null) {
  const invalidate = useInvalidate(providerType, providerId);
  return useMutation({ mutationFn: (providerManagerId: number) => unlockWorker(providerManagerId), onSuccess: invalidate });
}

export function useSetWorkerActive(providerType: WorkerProviderType | null, providerId: number | null) {
  const invalidate = useInvalidate(providerType, providerId);
  return useMutation({
    mutationFn: ({ providerManagerId, isActive }: { providerManagerId: number; isActive: boolean }) =>
      setWorkerActive(providerManagerId, isActive),
    onSuccess: invalidate,
  });
}

export function useDeleteWorker(providerType: WorkerProviderType | null, providerId: number | null) {
  const invalidate = useInvalidate(providerType, providerId);
  return useMutation({ mutationFn: (providerManagerId: number) => deleteWorker(providerManagerId), onSuccess: invalidate });
}
