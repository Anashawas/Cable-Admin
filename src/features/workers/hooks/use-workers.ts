import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWorker,
  createWorker,
  setWorkerActive,
  deleteWorker,
} from "../services/workers-service";
import type { WorkerProviderType, CreateWorkerRequest } from "../types/api";

export const WORKER_QUERY_KEY = (
  providerType: WorkerProviderType | null,
  providerId: number | null
) => ["workers", providerType, providerId];

/** The single worker for a provider (or null). Disabled until both keys are set. */
export function useWorker(
  providerType: WorkerProviderType | null,
  providerId: number | null
) {
  return useQuery({
    queryKey: WORKER_QUERY_KEY(providerType, providerId),
    queryFn: ({ signal }) => getWorker(providerType!, providerId!, signal),
    enabled: !!providerType && !!providerId,
    staleTime: 60 * 1000,
  });
}

export function useCreateWorker(
  providerType: WorkerProviderType | null,
  providerId: number | null
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWorkerRequest) => createWorker(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_QUERY_KEY(providerType, providerId) });
    },
  });
}

export function useSetWorkerActive(
  providerType: WorkerProviderType | null,
  providerId: number | null
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ providerManagerId, isActive }: { providerManagerId: number; isActive: boolean }) =>
      setWorkerActive(providerManagerId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_QUERY_KEY(providerType, providerId) });
    },
  });
}

export function useDeleteWorker(
  providerType: WorkerProviderType | null,
  providerId: number | null
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (providerManagerId: number) => deleteWorker(providerManagerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKER_QUERY_KEY(providerType, providerId) });
    },
  });
}
