import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeBillingAlert,
  cancelPlanSubscription,
  createPlan,
  createPlanSubscription,
  getAgreementBundles,
  getBillingAlerts,
  getBreakEven,
  getPlan,
  getPlanFeatures,
  getPlanHistory,
  getPlans,
  getPlanSubscribers,
  getPlanSubscriptions,
  getUpgradeRequests,
  rejectUpgradeRequest,
  saveFeatureMatrix,
  sellBundle,
  setBillingModel,
  setPlanActive,
  updatePlan,
  upgradePlanSubscription,
} from "../services/billing-service";
import type {
  BillingModel,
  BillingProviderType,
  CreatePlanSubscriptionRequest,
  PlanInput,
  UpgradePlanSubscriptionRequest,
  UpgradeRequestStatus,
} from "../types/api";

export const BILLING_QUERY_KEY = ["billing"];
export const PLANS_QUERY_KEY = ["billing", "plans"];

/** Billing writes touch plans, records, requests, alerts and the existing engine. */
function invalidateBilling(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: BILLING_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
  queryClient.invalidateQueries({ queryKey: ["partners"] });
}

export function usePlans(includeArchived = true) {
  return useQuery({
    queryKey: [...PLANS_QUERY_KEY, "list", includeArchived],
    queryFn: ({ signal }) => getPlans({ includeArchived }, signal),
    staleTime: 60 * 1000,
  });
}

export function usePlan(id: number | null) {
  return useQuery({
    queryKey: [...PLANS_QUERY_KEY, "detail", id],
    queryFn: ({ signal }) => getPlan(id as number, signal),
    enabled: id != null && id > 0,
  });
}

export function usePlanHistory(id: number | null, enabled = true) {
  return useQuery({
    queryKey: [...PLANS_QUERY_KEY, "history", id],
    queryFn: ({ signal }) => getPlanHistory(id as number, signal),
    enabled: enabled && id != null && id > 0,
  });
}

export function usePlanSubscribers(id: number | null, enabled = true) {
  return useQuery({
    queryKey: [...PLANS_QUERY_KEY, "subscribers", id],
    queryFn: ({ signal }) => getPlanSubscribers(id as number, signal),
    enabled: enabled && id != null && id > 0,
  });
}

export function usePlanFeatures() {
  return useQuery({
    queryKey: [...PLANS_QUERY_KEY, "features"],
    queryFn: ({ signal }) => getPlanFeatures(signal),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSavePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number | null; body: PlanInput }) => (id == null ? createPlan(body) : updatePlan(id, body)),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useSetPlanActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive, note }: { id: number; isActive: boolean; note?: string | null }) => setPlanActive(id, isActive, note),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useSaveFeatureMatrix() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ plans, note }: { plans: { planId: number; features: string[] }[]; note?: string | null }) =>
      saveFeatureMatrix(plans, note),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function usePlanSubscriptions(providerType: BillingProviderType, providerId: number, enabled = true) {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, "records", providerType, providerId],
    queryFn: ({ signal }) => getPlanSubscriptions({ providerType, providerId }, signal),
    enabled: enabled && providerId > 0,
  });
}

export function useBreakEven(planSubscriptionId: number | null, enabled = true) {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, "break-even", planSubscriptionId],
    queryFn: ({ signal }) => getBreakEven(planSubscriptionId as number, signal),
    enabled: enabled && planSubscriptionId != null,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useCreatePlanSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlanSubscriptionRequest) => createPlanSubscription(body),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useCancelPlanSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => cancelPlanSubscription(id, reason),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useUpgradePlanSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpgradePlanSubscriptionRequest }) => upgradePlanSubscription(id, body),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useUpgradeRequests(status: UpgradeRequestStatus | null, page: number, pageSize: number) {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, "upgrade-requests", status, page, pageSize],
    queryFn: ({ signal }) => getUpgradeRequests({ status, page, pageSize }, signal),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

/** Pending upgrade requests (dashboard badge). */
export function usePendingUpgradeRequestsCount() {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, "upgrade-requests", "pending-count"],
    queryFn: async ({ signal }) => (await getUpgradeRequests({ status: "Pending", page: 1, pageSize: 1 }, signal)).totalCount,
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useRejectUpgradeRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectUpgradeRequest(id, reason),
    onSuccess: () => invalidateBilling(queryClient),
  });
}

export function useBillingAlerts(unacknowledgedOnly: boolean, page: number, pageSize: number) {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, "alerts", unacknowledgedOnly, page, pageSize],
    queryFn: ({ signal }) => getBillingAlerts({ unacknowledgedOnly, page, pageSize }, signal),
    placeholderData: (prev) => prev,
    staleTime: 30 * 1000,
  });
}

export function useAcknowledgeBillingAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => acknowledgeBillingAlert(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...BILLING_QUERY_KEY, "alerts"] }),
  });
}

export function useAgreementBundles(agreementId: number | null, enabled = true) {
  return useQuery({
    queryKey: [...BILLING_QUERY_KEY, "bundles", agreementId],
    queryFn: ({ signal }) => getAgreementBundles(agreementId as number, signal),
    enabled: enabled && agreementId != null && agreementId > 0,
  });
}

export function useSellBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agreementId,
      ...body
    }: { agreementId: number; planId: number; priceOptionId: number; upgradeRequestId?: number | null; note?: string | null }) =>
      sellBundle(agreementId, body),
    onSuccess: () => {
      invalidateBilling(queryClient);
      // The price is debited from the provider wallet.
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
  });
}

export function useSetBillingModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agreementId, billingModel, minimumTransactionAmount }: { agreementId: number; billingModel: BillingModel; minimumTransactionAmount?: number | null }) =>
      setBillingModel(agreementId, billingModel, minimumTransactionAmount),
    onSuccess: () => invalidateBilling(queryClient),
  });
}
