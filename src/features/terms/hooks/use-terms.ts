import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllTermsVersions,
  getTermsVersionById,
  publishTermsVersion,
} from "../services/terms-service";
import type { PublishTermsVersionRequest } from "../types/api";

export const TERMS_QUERY_KEY = ["terms", "versions"];

export function useTermsVersions(enabled = true) {
  return useQuery({
    queryKey: TERMS_QUERY_KEY,
    queryFn: ({ signal }) => getAllTermsVersions(signal),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useTermsVersion(id: number | null) {
  return useQuery({
    queryKey: [...TERMS_QUERY_KEY, id],
    queryFn: ({ signal }) => getTermsVersionById(id as number, signal),
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublishTermsVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PublishTermsVersionRequest) => publishTermsVersion(body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["terms"] }),
  });
}
