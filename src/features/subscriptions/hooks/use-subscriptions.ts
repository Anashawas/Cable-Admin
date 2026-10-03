import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createPayer,
	getGraceSettings,
	getPayers,
	getRenewals,
	getSubscription,
	recordPayment,
	setSubscriptionGrace,
	switchSubscription,
	updateGraceSettings,
	updatePayment,
	uploadPaymentProof,
	voidPayment,
} from "../services/subscriptions-service";
import type {
	GraceRequest,
	GraceSettings,
	PayerPayload,
	RecordPaymentRequest,
	SubscriptionEntityType,
	UpdatePaymentRequest,
} from "../types/api";

export const SUBSCRIPTIONS_QUERY_KEY = ["subscriptions"];
export const RENEWALS_QUERY_KEY = ["subscriptions", "renewals"];
export const PAYERS_QUERY_KEY = ["subscriptions", "payers"];
export const GRACE_SETTINGS_QUERY_KEY = ["subscriptions", "grace-settings"];

export const subscriptionQueryKey = (
	entityType: SubscriptionEntityType,
	entityId: number | null | undefined
) => ["subscriptions", "entity", entityType, entityId];

/** Everything that changed after a write — the entity and every dashboard. */
function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
	queryClient.invalidateQueries({ queryKey: SUBSCRIPTIONS_QUERY_KEY });
	// Premium dates live on the station too.
	queryClient.invalidateQueries({ queryKey: ["charge-management"] });
}

/** The subscription + payment history for one station / banner / provider. */
export function useSubscription(
	entityType: SubscriptionEntityType,
	entityId: number | null | undefined,
	enabled = true
) {
	return useQuery({
		queryKey: subscriptionQueryKey(entityType, entityId),
		queryFn: ({ signal }) => getSubscription(entityType, entityId as number, signal),
		enabled: enabled && entityId != null && entityId > 0,
	});
}

/** Expiring soon / lapsed-still-on / expired + 12 months of collections. */
export function useRenewals(withinDays = 30) {
	return useQuery({
		queryKey: [...RENEWALS_QUERY_KEY, withinDays],
		queryFn: ({ signal }) => getRenewals(withinDays, signal),
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
	});
}

/** Previous payers, searched by name or phone. */
export function usePayers(q: string, enabled = true) {
	return useQuery({
		queryKey: [...PAYERS_QUERY_KEY, q],
		queryFn: ({ signal }) => getPayers(q, signal),
		enabled,
		staleTime: 60 * 1000,
	});
}

export function useGraceSettings(enabled = true) {
	return useQuery({
		queryKey: GRACE_SETTINGS_QUERY_KEY,
		queryFn: ({ signal }) => getGraceSettings(signal),
		enabled,
		staleTime: 5 * 60 * 1000,
	});
}

export function useRecordPayment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: RecordPaymentRequest) => recordPayment(body),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useUpdatePayment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, body }: { id: number; body: UpdatePaymentRequest }) =>
			updatePayment(id, body),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useVoidPayment() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: number; reason: string }) => voidPayment(id, reason),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useUploadPaymentProof() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ id, file }: { id: number; file: File }) => uploadPaymentProof(id, file),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useSwitchSubscription() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({ subscriptionId, on }: { subscriptionId: number; on: boolean }) =>
			switchSubscription(subscriptionId, on),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useSetSubscriptionGrace() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			subscriptionId,
			body,
		}: {
			subscriptionId: number;
			body: GraceRequest;
		}) => setSubscriptionGrace(subscriptionId, body),
		onSuccess: () => invalidateAll(queryClient),
	});
}

export function useUpdateGraceSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: GraceSettings) => updateGraceSettings(body),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: GRACE_SETTINGS_QUERY_KEY });
			queryClient.invalidateQueries({ queryKey: RENEWALS_QUERY_KEY });
		},
	});
}

export function useCreatePayer() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (body: PayerPayload) => createPayer(body),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: PAYERS_QUERY_KEY }),
	});
}
