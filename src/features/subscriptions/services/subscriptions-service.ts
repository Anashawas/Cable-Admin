import { server } from "../../../lib/@axios";
import type {
	GraceRequest,
	GraceSettings,
	PayerDto,
	PayerPayload,
	RecordPaymentRequest,
	RecordPaymentResponse,
	RenewalsResponse,
	SubscriptionDto,
	SubscriptionEntityType,
	UpdatePaymentRequest,
} from "../types/api";

/** The renewals buckets arrive as arrays; keep the screen safe if one is null. */
const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// ── Subscription + payments ──────────────────────────────────────────

/**
 * GET /api/subscriptions/{entityType}/{entityId} (admin)
 * The subscription plus its full payment history.
 * Returns null when the entity has never been paid for (the API 404s).
 */
export const getSubscription = async (
	entityType: SubscriptionEntityType,
	entityId: number,
	signal?: AbortSignal
): Promise<SubscriptionDto | null> => {
	try {
		const { data } = await server.get<SubscriptionDto>(
			`api/subscriptions/${entityType}/${entityId}`,
			{ signal }
		);
		return data ?? null;
	} catch (error: unknown) {
		// "Never paid for" is a normal state for most stations, not an error.
		const status = (error as { response?: { status?: number } })?.response?.status;
		if (status === 404) return null;
		throw error;
	}
};

/**
 * POST /api/subscriptions/payments (admin)
 * Records a payment. The expiry is computed from `planMonths` — while a period
 * is still running a renewal extends from the current expiry, so the customer
 * never loses paid days.
 */
export const recordPayment = async (
	body: RecordPaymentRequest,
	signal?: AbortSignal
): Promise<RecordPaymentResponse> => {
	const { data } = await server.post<RecordPaymentResponse>(
		"api/subscriptions/payments",
		body,
		{ signal }
	);
	return data;
};

/**
 * PUT /api/subscriptions/payments/{id} (admin)
 * Edits amount / method / note / payer and regenerates the receipt.
 * Dates are not editable — void and re-record instead.
 */
export const updatePayment = async (
	id: number,
	body: UpdatePaymentRequest,
	signal?: AbortSignal
): Promise<void> => {
	await server.put(`api/subscriptions/payments/${id}`, body, { signal });
};

/**
 * POST /api/subscriptions/payments/{id}/void (admin)
 * Keeps the payment for audit and rolls the expiry back to the latest
 * remaining period. Voiding the only payment switches the item off.
 */
export const voidPayment = async (
	id: number,
	reason: string,
	signal?: AbortSignal
): Promise<void> => {
	await server.post(`api/subscriptions/payments/${id}/void`, { reason }, { signal });
};

/**
 * POST /api/subscriptions/payments/{id}/proof (multipart 'file', admin)
 * Attaches the CliQ screenshot. Returns its stored URL.
 */
export const uploadPaymentProof = async (
	id: number,
	file: File,
	signal?: AbortSignal
): Promise<string> => {
	const form = new FormData();
	form.append("file", file);
	// No explicit Content-Type — axios sets the multipart boundary itself.
	const { data } = await server.post(`api/subscriptions/payments/${id}/proof`, form, {
		signal,
	});
	if (typeof data === "string") return data;
	return (data?.url as string) ?? (data?.receiptImageUrl as string) ?? "";
};

/**
 * GET /api/subscriptions/payments/{id}/receipt (admin or the entity owner)
 * Streams the generated bilingual PDF receipt.
 */
export const downloadReceipt = async (
	id: number,
	signal?: AbortSignal
): Promise<Blob> => {
	const { data } = await server.get(`api/subscriptions/payments/${id}/receipt`, {
		responseType: "blob",
		signal,
	});
	return data as Blob;
};

// ── Switch / grace ───────────────────────────────────────────────────

/**
 * PATCH /api/subscriptions/{subscriptionId}/switch (admin)
 * Ends premium / the banner run now, or turns it back on.
 */
export const switchSubscription = async (
	subscriptionId: number,
	on: boolean,
	signal?: AbortSignal
): Promise<void> => {
	await server.patch(`api/subscriptions/${subscriptionId}/switch`, { on }, { signal });
};

/**
 * PATCH /api/subscriptions/{subscriptionId}/grace (admin)
 * Per-subscription override; `graceMode: null` inherits the global setting.
 */
export const setSubscriptionGrace = async (
	subscriptionId: number,
	body: GraceRequest,
	signal?: AbortSignal
): Promise<void> => {
	await server.patch(`api/subscriptions/${subscriptionId}/grace`, body, { signal });
};

/** GET /api/subscriptions/settings/grace (admin) — the global rule. */
export const getGraceSettings = async (signal?: AbortSignal): Promise<GraceSettings> => {
	const { data } = await server.get<GraceSettings>("api/subscriptions/settings/grace", {
		signal,
	});
	return data;
};

/** PUT /api/subscriptions/settings/grace (admin) */
export const updateGraceSettings = async (
	body: GraceSettings,
	signal?: AbortSignal
): Promise<void> => {
	await server.put("api/subscriptions/settings/grace", body, { signal });
};

// ── Payers ───────────────────────────────────────────────────────────

/**
 * GET /api/subscriptions/payers?q=&page=&pageSize= (admin)
 * Previous payers by name/phone — matches linked user accounts too.
 */
export const getPayers = async (
	q?: string,
	signal?: AbortSignal
): Promise<PayerDto[]> => {
	const { data } = await server.get("api/subscriptions/payers", {
		params: { q: q || undefined, page: 1, pageSize: 20 },
		signal,
	});
	// Tolerates both a bare array and a paged { items } / { data } wrapper.
	if (Array.isArray(data)) return data as PayerDto[];
	return asArray<PayerDto>(data?.items ?? data?.data ?? data?.value);
};

/** POST /api/subscriptions/payers (admin) */
export const createPayer = async (
	body: PayerPayload,
	signal?: AbortSignal
): Promise<PayerDto> => {
	const { data } = await server.post<PayerDto>("api/subscriptions/payers", body, {
		signal,
	});
	return data;
};

/** PUT /api/subscriptions/payers/{id} (admin) */
export const updatePayer = async (
	id: number,
	body: PayerPayload,
	signal?: AbortSignal
): Promise<void> => {
	await server.put(`api/subscriptions/payers/${id}`, body, { signal });
};

// ── Renewals dashboard ───────────────────────────────────────────────

/**
 * GET /api/subscriptions/renewals?withinDays=30 (admin)
 * Expiring soon, lapsed-but-still-on, expired, plus 12 months of totals.
 */
export const getRenewals = async (
	withinDays = 30,
	signal?: AbortSignal
): Promise<RenewalsResponse> => {
	const { data } = await server.get<RenewalsResponse>("api/subscriptions/renewals", {
		params: { withinDays },
		signal,
	});
	return {
		withinDays: data?.withinDays ?? withinDays,
		expiringSoon: asArray(data?.expiringSoon),
		lapsedStillOn: asArray(data?.lapsedStillOn),
		expired: asArray(data?.expired),
		monthly: asArray(data?.monthly),
	};
};
