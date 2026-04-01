import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllPartnerAgreements,
  createPartnerAgreement,
  updatePartnerAgreement,
  deactivatePartnerAgreement,
  getProviderBalance,
  setCreditLimit,
} from "../services/partners-service";
import { addWalletDeposit } from "../../offers/services/offers-service";
import type {
  CreatePartnerAgreementRequest,
  UpdatePartnerAgreementRequest,
  SetCreditLimitRequest,
} from "../types/api";
import type { AddWalletDepositRequest } from "../../offers/types/api";

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

// ============================================
// Credit Limit & Balance — 2026-02-28
// ============================================

export const PROVIDER_BALANCE_QUERY_KEY = (
  providerType: string,
  providerId: number
) => ["partners", "balance", providerType, providerId];

export function useProviderBalance(providerType: string | null, providerId: number | null) {
  return useQuery({
    queryKey: PROVIDER_BALANCE_QUERY_KEY(providerType ?? "", providerId ?? 0),
    queryFn: () => getProviderBalance(providerType!, providerId!),
    enabled: !!providerType && !!providerId,
    staleTime: 30 * 1000,
  });
}

export function usePartnerWalletDeposit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AddWalletDepositRequest) => addWalletDeposit(body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: PROVIDER_BALANCE_QUERY_KEY(vars.providerType, vars.providerId),
      });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", vars.providerType, vars.providerId] });
      queryClient.invalidateQueries({ queryKey: ["wallet-history", vars.providerType, vars.providerId] });
      queryClient.invalidateQueries({ queryKey: ["settlements"] });
    },
  });
}

export function useSetCreditLimit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SetCreditLimitRequest) => setCreditLimit(body),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({
        queryKey: PROVIDER_BALANCE_QUERY_KEY(vars.providerType, vars.providerId),
      });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance", vars.providerType, vars.providerId] });
    },
  });
}
