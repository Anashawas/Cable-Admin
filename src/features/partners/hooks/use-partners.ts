import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPartnerAgreements,
  createPartnerAgreement,
  updatePartnerAgreement,
  deactivatePartnerAgreement,
} from "../services/partners-service";
import type {
  CreatePartnerAgreementRequest,
  UpdatePartnerAgreementRequest,
} from "../types/api";

export const PARTNERS_QUERY_KEY = ["partners", "agreements"];

export function usePartnerAgreements(filters?: { isActive?: boolean }) {
  return useQuery({
    queryKey: [...PARTNERS_QUERY_KEY, filters],
    queryFn: () => getAllPartnerAgreements(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreatePartnerAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePartnerAgreementRequest) => createPartnerAgreement(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
    },
  });
}

export function useUpdatePartnerAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePartnerAgreementRequest }) =>
      updatePartnerAgreement(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
    },
  });
}

export function useDeactivatePartnerAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deactivatePartnerAgreement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTNERS_QUERY_KEY });
    },
  });
}
