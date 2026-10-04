// Payment tracking / subscriptions (Phase 1).
//
// Backed by /api/subscriptions — admin only. Phase 1 covers recording offline
// payments (CliQ / cash), reusable payers, auto-computed expiry, proof upload,
// a generated PDF receipt, the renewals dashboard, and manual/timed switch-off.
// Reminders and sending receipts by email/SMS/WhatsApp are Phase 2 and are
// deliberately absent here.

/** What the subscription is attached to. */
export type SubscriptionEntityType =
	| "StationPremium"
	| "Banner"
	| "ServiceProviderPremium"
	/** Cable Connect: live charger data for a station (OCPP). EntityId = station id. */
	| "OcppConnect";

/**
 * Computed server-side on every read from expiry + grace + the admin switch —
 * never stored, so it is always current.
 */
export type SubscriptionStatus =
	| "Active"
	| "ExpiringSoon" // <= 7 days to expiry
	| "InGrace" // past expiry but still switched on
	| "Expired"
	| "SwitchedOff";

/** Manual = nothing turns off until an admin does it. */
export type GraceMode = "Manual" | "AfterDays";

/** Backend payment-method enum. */
export const PAYMENT_METHOD = { CliQ: 1, Cash: 2 } as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ── Payers ───────────────────────────────────────────────────────────

export interface PayerDto {
	id: number;
	name?: string | null;
	phone?: string | null;
	email?: string | null;
	hasWhatsApp?: boolean | null;
	/** Set when the payer is linked to a user account (name/phone read live). */
	userAccountId?: number | null;
}

/**
 * A payment names its payer in one of three ways: reuse an existing payer,
 * link the owner's user account, or type in someone else (a matching phone
 * reuses the existing payer record server-side).
 */
export type PayerRef =
	| { payerId: number }
	| { userAccountId: number; hasWhatsApp?: boolean }
	| {
			name: string;
			phone?: string | null;
			email?: string | null;
			hasWhatsApp?: boolean;
	  };

export interface PayerPayload {
	name: string;
	phone?: string | null;
	email?: string | null;
	hasWhatsApp?: boolean | null;
}

// ── Payments ─────────────────────────────────────────────────────────

export interface PaymentDto {
	id: number;
	referenceNo?: string | null;
	amount: number;
	currency?: string | null;
	method: PaymentMethod;
	methodName?: string | null;
	paidDate?: string | null;
	/** The exact days this payment bought — voiding rolls expiry back to these. */
	periodStart?: string | null;
	periodEnd?: string | null;
	planMonths?: number | null;
	payerId?: number | null;
	payerName?: string | null;
	payerPhone?: string | null;
	note?: string | null;
	/** Relative path to the generated PDF receipt. */
	receiptDownloadPath?: string | null;
	/** The uploaded CliQ screenshot, kept separately as proof. */
	receiptImageUrl?: string | null;
	isVoid: boolean;
	voidReason?: string | null;
	createdAt?: string | null;
}

export interface SubscriptionDto {
	id: number;
	entityType: SubscriptionEntityType;
	entityId: number;
	entityName?: string | null;
	planMonths?: number | null;
	startDate?: string | null;
	expiresAt?: string | null;
	status: SubscriptionStatus;
	/** What the consumer app effectively sees. */
	isOn: boolean;
	isSwitchedOff: boolean;
	graceMode?: GraceMode | null;
	graceDays?: number | null;
	/** True when this subscription overrides the global grace setting. */
	graceIsOverride?: boolean | null;
	/** With AfterDays, when the daily job will switch it off. */
	autoOffAt?: string | null;
	daysUntilExpiry?: number | null;
	payments: PaymentDto[];
}

export interface RecordPaymentRequest {
	entityType: SubscriptionEntityType;
	entityId: number;
	/** 1..24 — the expiry is computed from this, never typed. */
	planMonths: number;
	amount: number;
	/** Optional, defaults to JOD server-side. */
	currency?: string | null;
	method: PaymentMethod;
	/** Jordan local time, no timezone suffix. */
	paidDate: string;
	payer: PayerRef;
	note?: string | null;
	receiptImageFileName?: string | null;
}

export interface RecordPaymentResponse {
	subscriptionId: number;
	paymentId: number;
	referenceNo?: string | null;
	periodStart?: string | null;
	periodEnd?: string | null;
	expiresAt?: string | null;
	receiptDownloadPath?: string | null;
	/**
	 * Non-null only when the PDF failed to render. The payment is still
	 * recorded in that case, so treat it as a warning, not a failure.
	 */
	receiptError?: string | null;
}

/** Dates are not editable — void and re-record instead. */
export interface UpdatePaymentRequest {
	amount?: number | null;
	method?: PaymentMethod | null;
	note?: string | null;
	payer?: PayerRef;
}

// ── Controls ─────────────────────────────────────────────────────────

export interface SwitchRequest {
	on: boolean;
}

export interface GraceRequest {
	/** null inherits the global setting. */
	graceMode: GraceMode | null;
	graceDays?: number | null;
}

export interface GraceSettings {
	graceMode: GraceMode;
	graceDays: number;
}

// ── Renewals dashboard ───────────────────────────────────────────────

/**
 * A row in one of the renewals buckets. Typed leniently: the dashboard groups
 * subscriptions three ways and we render whatever identifying fields come back.
 */
export interface RenewalRowDto {
	subscriptionId?: number | null;
	id?: number | null;
	entityType?: SubscriptionEntityType | null;
	entityId?: number | null;
	entityName?: string | null;
	expiresAt?: string | null;
	daysUntilExpiry?: number | null;
	status?: SubscriptionStatus | null;
	isOn?: boolean | null;
	planMonths?: number | null;
	amount?: number | null;
	currency?: string | null;
	payerName?: string | null;
	payerPhone?: string | null;
}

/** One of the trailing 12 months of collections. */
export interface RenewalsMonthlyDto {
	month?: string | null;
	year?: number | null;
	total?: number | null;
	count?: number | null;
	byMethod?: Record<string, number> | null;
	byPlan?: Record<string, number> | null;
}

export interface RenewalsResponse {
	withinDays?: number | null;
	/** Still on, expiring inside the window. */
	expiringSoon: RenewalRowDto[];
	/** Past expiry but still switched on — the ones costing money. */
	lapsedStillOn: RenewalRowDto[];
	expired: RenewalRowDto[];
	monthly: RenewalsMonthlyDto[];
}
