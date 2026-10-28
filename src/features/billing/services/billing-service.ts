import { server } from "../../../lib/@axios";
import type {
  AgreementBundlesDto,
  BillingAlertDto,
  BillingModel,
  BillingProviderType,
  BreakEvenDto,
  CreatePlanSubscriptionRequest,
  MarginCheckRequest,
  MarginCheckResult,
  PagedResult,
  PlanCategory,
  PlanChangeLogDto,
  PlanDto,
  PlanFeatureDto,
  PlanInput,
  PlanSaveResult,
  PlanSubscriberDto,
  PlanSubscriptionDto,
  SetBillingModelResult,
  UpgradePlanSubscriptionRequest,
  UpgradeRequestDto,
  UpgradeRequestStatus,
} from "../types/api";

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asPaged = <T,>(data: any): PagedResult<T> => ({
  items: asArray<T>(data?.items ?? data),
  totalCount: data?.totalCount ?? (Array.isArray(data) ? data.length : 0),
  page: data?.page ?? 1,
  pageSize: data?.pageSize ?? 20,
});

// ── Plans ────────────────────────────────────────────────────────────

/** GET /api/admin/plans?category=&includeArchived= — with subscriber counts. */
export const getPlans = async (
  params: { category?: PlanCategory | null; includeArchived?: boolean } = {},
  signal?: AbortSignal
): Promise<PlanDto[]> => {
  const { data } = await server.get("api/admin/plans", {
    params: { category: params.category || undefined, includeArchived: params.includeArchived ?? undefined },
    signal,
  });
  return asArray<PlanDto>(data);
};

/** GET /api/admin/plans/{id} */
export const getPlan = async (id: number, signal?: AbortSignal): Promise<PlanDto> => {
  const { data } = await server.get<PlanDto>(`api/admin/plans/${id}`, { signal });
  return data;
};

/** POST /api/admin/plans — 409 PLAN_KEY_TAKEN, 422 INVALID_TIERS / UNKNOWN_FEATURE. */
export const createPlan = async (body: PlanInput): Promise<PlanSaveResult> => {
  const { data } = await server.post<PlanSaveResult>("api/admin/plans", body);
  return data;
};

/** PUT /api/admin/plans/{id} — returns the change list and who it affects. */
export const updatePlan = async (id: number, body: PlanInput): Promise<PlanSaveResult> => {
  const { data } = await server.put<PlanSaveResult>(`api/admin/plans/${id}`, body);
  return data;
};

/** PATCH /api/admin/plans/{id}/active — archive / reactivate (no delete; free can't be archived). */
export const setPlanActive = async (id: number, isActive: boolean, note?: string | null): Promise<PlanSaveResult> => {
  const { data } = await server.patch<PlanSaveResult>(`api/admin/plans/${id}/active`, { isActive, note: note || null });
  return data;
};

/** GET /api/admin/plans/{id}/history */
export const getPlanHistory = async (id: number, signal?: AbortSignal): Promise<PlanChangeLogDto[]> => {
  const { data } = await server.get(`api/admin/plans/${id}/history`, { signal });
  return asArray<PlanChangeLogDto>(data);
};

/** GET /api/admin/plans/{id}/subscribers */
export const getPlanSubscribers = async (id: number, signal?: AbortSignal): Promise<PlanSubscriberDto[]> => {
  const { data } = await server.get(`api/admin/plans/${id}/subscribers`, { signal });
  return asArray<PlanSubscriberDto>(data);
};

/** GET /api/admin/plans/features — the fixed catalog. */
export const getPlanFeatures = async (signal?: AbortSignal): Promise<PlanFeatureDto[]> => {
  const { data } = await server.get("api/admin/plans/features", { signal });
  return asArray<PlanFeatureDto>(data);
};

/** PUT /api/admin/plans/feature-matrix — applies at once, logged per plan. */
export const saveFeatureMatrix = async (
  plans: { planId: number; features: string[] }[],
  note?: string | null
): Promise<PlanSaveResult[]> => {
  const { data } = await server.put("api/admin/plans/feature-matrix", { plans, note: note || null });
  return asArray<PlanSaveResult>(data);
};

/** POST /api/admin/plans/margin-check — break-even and recommended scans (points cost only). */
export const marginCheck = async (body: MarginCheckRequest, signal?: AbortSignal): Promise<MarginCheckResult> => {
  const { data } = await server.post<MarginCheckResult>("api/admin/plans/margin-check", body, { signal });
  return data;
};

// ── Subscription records ─────────────────────────────────────────────

/** GET /api/admin/subscriptions?providerType=&providerId= — every record, newest first. */
export const getPlanSubscriptions = async (
  params: { providerType?: BillingProviderType; providerId?: number; planId?: number; status?: string },
  signal?: AbortSignal
): Promise<PlanSubscriptionDto[]> => {
  const { data } = await server.get("api/admin/subscriptions", { params, signal });
  return asArray<PlanSubscriptionDto>(data?.items ?? data);
};

/** POST /api/admin/subscriptions — new / renewal / trial. */
export const createPlanSubscription = async (body: CreatePlanSubscriptionRequest): Promise<PlanSubscriptionDto> => {
  const { data } = await server.post<PlanSubscriptionDto>("api/admin/subscriptions", body);
  return data;
};

/** POST /api/admin/subscriptions/{id}/cancel */
export const cancelPlanSubscription = async (id: number, reason: string): Promise<PlanSubscriptionDto> => {
  const { data } = await server.post<PlanSubscriptionDto>(`api/admin/subscriptions/${id}/cancel`, { reason });
  return data;
};

/** POST /api/admin/subscriptions/{id}/upgrade — credits the unused value on the new price. */
export const upgradePlanSubscription = async (id: number, body: UpgradePlanSubscriptionRequest): Promise<PlanSubscriptionDto> => {
  const { data } = await server.post<PlanSubscriptionDto>(`api/admin/subscriptions/${id}/upgrade`, body);
  return data;
};

/** GET /api/admin/subscriptions/{id}/break-even — internal to Cable. */
export const getBreakEven = async (id: number, signal?: AbortSignal): Promise<BreakEvenDto> => {
  const { data } = await server.get<BreakEvenDto>(`api/admin/subscriptions/${id}/break-even`, { signal });
  return data;
};

// ── Upgrade requests ─────────────────────────────────────────────────

/** GET /api/admin/upgrade-requests — pending first. */
export const getUpgradeRequests = async (
  params: { status?: UpgradeRequestStatus | null; providerType?: BillingProviderType; providerId?: number; page: number; pageSize: number },
  signal?: AbortSignal
): Promise<PagedResult<UpgradeRequestDto>> => {
  const { data } = await server.get("api/admin/upgrade-requests", {
    params: { ...params, status: params.status || undefined },
    signal,
  });
  return asPaged<UpgradeRequestDto>(data);
};

/** POST /api/admin/upgrade-requests/{id}/reject */
export const rejectUpgradeRequest = async (id: number, reason: string): Promise<UpgradeRequestDto> => {
  const { data } = await server.post<UpgradeRequestDto>(`api/admin/upgrade-requests/${id}/reject`, { reason });
  return data;
};

/** POST /api/admin/upgrade-requests/{id}/fulfil — manual; normally automatic. */
export const fulfilUpgradeRequest = async (
  id: number,
  body: { paymentId?: number | null; planSubscriptionId?: number | null } = {}
): Promise<UpgradeRequestDto> => {
  const { data } = await server.post<UpgradeRequestDto>(`api/admin/upgrade-requests/${id}/fulfil`, body);
  return data;
};

// ── Billing alerts ───────────────────────────────────────────────────

/** GET /api/admin/billing-alerts */
export const getBillingAlerts = async (
  params: { unacknowledgedOnly: boolean; page: number; pageSize: number },
  signal?: AbortSignal
): Promise<PagedResult<BillingAlertDto>> => {
  const { data } = await server.get("api/admin/billing-alerts", { params, signal });
  return asPaged<BillingAlertDto>(data);
};

/** POST /api/admin/billing-alerts/{id}/acknowledge */
export const acknowledgeBillingAlert = async (id: number): Promise<void> => {
  await server.post(`api/admin/billing-alerts/${id}/acknowledge`);
};

// ── Scan bundles on a partner agreement ──────────────────────────────

/** GET /api/partners/{agreementId}/bundles */
export const getAgreementBundles = async (agreementId: number, signal?: AbortSignal): Promise<AgreementBundlesDto> => {
  const { data } = await server.get<AgreementBundlesDto>(`api/partners/${agreementId}/bundles`, { signal });
  return { ...data, history: asArray<PlanSubscriptionDto>(data?.history) };
};

/** POST /api/partners/{agreementId}/bundles — debits the provider wallet (bundlePurchase). */
export const sellBundle = async (
  agreementId: number,
  body: { planId: number; priceOptionId: number; upgradeRequestId?: number | null; note?: string | null }
): Promise<PlanSubscriptionDto> => {
  const { data } = await server.post<PlanSubscriptionDto>(`api/partners/${agreementId}/bundles`, body);
  return data;
};

/** PATCH /api/partners/{agreementId}/billing-model */
export const setBillingModel = async (
  agreementId: number,
  billingModel: BillingModel,
  minimumTransactionAmount?: number | null
): Promise<SetBillingModelResult> => {
  const { data } = await server.patch<SetBillingModelResult>(`api/partners/${agreementId}/billing-model`, {
    billingModel,
    minimumTransactionAmount: minimumTransactionAmount ?? null,
  });
  return data;
};
