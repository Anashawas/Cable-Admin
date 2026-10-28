import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignPromo,
  createPromoCampaign,
  generatePromoCodes,
  getPromoCampaign,
  getPromoCampaigns,
  getPromoReport,
  getUserPromos,
  revokeUserPromo,
  setPromoCampaignActive,
  updatePromoCampaign,
} from "../services/promos-service";
import type { AssignPromoRequest, PromoCampaignInput, UserPromoStatus } from "../types/api";

export const PROMOS_QUERY_KEY = ["promos"];
export const USER_PROMOS_QUERY_KEY = ["promos", "user-promos"];

export function usePromoCampaigns(isActive: boolean | null, search: string) {
  return useQuery({
    queryKey: [...PROMOS_QUERY_KEY, "list", isActive, search],
    queryFn: ({ signal }) => getPromoCampaigns({ isActive, search }, signal),
    placeholderData: (prev) => prev,
    staleTime: 60 * 1000,
  });
}

export function usePromoCampaign(id: number | null) {
  return useQuery({
    queryKey: [...PROMOS_QUERY_KEY, "detail", id],
    queryFn: ({ signal }) => getPromoCampaign(id as number, signal),
    enabled: id != null && id > 0,
  });
}

export function usePromoReport(id: number | null, enabled = true) {
  return useQuery({
    queryKey: [...PROMOS_QUERY_KEY, "report", id],
    queryFn: ({ signal }) => getPromoReport(id as number, signal),
    enabled: enabled && id != null && id > 0,
    staleTime: 30 * 1000,
  });
}

export function useUserPromos(userId: number, status: UserPromoStatus | null, page: number, pageSize: number, enabled = true) {
  return useQuery({
    queryKey: [...USER_PROMOS_QUERY_KEY, userId, status, page, pageSize],
    queryFn: ({ signal }) => getUserPromos({ userId, status, page, pageSize }, signal),
    enabled: enabled && userId > 0,
    placeholderData: (prev) => prev,
  });
}

export function useSavePromoCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number | null; body: PromoCampaignInput }) => {
      if (id == null) return createPromoCampaign(body);
      await updatePromoCampaign(id, body);
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMOS_QUERY_KEY }),
  });
}

export function useSetPromoCampaignActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setPromoCampaignActive(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMOS_QUERY_KEY }),
  });
}

export function useGeneratePromoCodes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, count }: { id: number; count: number }) => generatePromoCodes(id, count),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMOS_QUERY_KEY }),
  });
}

export function useAssignPromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AssignPromoRequest }) => assignPromo(id, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMOS_QUERY_KEY }),
  });
}

export function useRevokeUserPromo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string | null }) => revokeUserPromo(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PROMOS_QUERY_KEY }),
  });
}
