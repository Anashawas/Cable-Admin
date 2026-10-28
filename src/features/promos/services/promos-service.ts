import { server } from "../../../lib/@axios";
import type {
  AdminPromoCampaignDto,
  AdminUserPromoDto,
  AssignPromoRequest,
  AssignPromoResult,
  GeneratePromoCodesResult,
  PagedResult,
  PromoCampaignInput,
  PromoReportDto,
  UserPromoStatus,
} from "../types/api";

const BASE = "api/admin/promos";

/** GET /api/admin/promos — a bare list without page/pageSize. */
export const getPromoCampaigns = async (
  params: { isActive?: boolean | null; search?: string | null } = {},
  signal?: AbortSignal
): Promise<AdminPromoCampaignDto[]> => {
  const { data } = await server.get(BASE, {
    params: { isActive: params.isActive ?? undefined, search: params.search?.trim() || undefined },
    signal,
  });
  if (Array.isArray(data)) return data as AdminPromoCampaignDto[];
  return Array.isArray(data?.items) ? (data.items as AdminPromoCampaignDto[]) : [];
};

/** GET /api/admin/promos/{id} */
export const getPromoCampaign = async (id: number, signal?: AbortSignal): Promise<AdminPromoCampaignDto> => {
  const { data } = await server.get<AdminPromoCampaignDto>(`${BASE}/${id}`, { signal });
  return data;
};

/** POST /api/admin/promos → { id } */
export const createPromoCampaign = async (body: PromoCampaignInput): Promise<number> => {
  const { data } = await server.post<{ id: number }>(BASE, body);
  return data.id;
};

/** PUT /api/admin/promos/{id} */
export const updatePromoCampaign = async (id: number, body: PromoCampaignInput): Promise<void> => {
  await server.put(`${BASE}/${id}`, body);
};

/** PATCH /api/admin/promos/{id}/active — a campaign whose budget is used up can't be switched on. */
export const setPromoCampaignActive = async (id: number, isActive: boolean): Promise<void> => {
  await server.patch(`${BASE}/${id}/active`, { isActive });
};

/** POST /api/admin/promos/{id}/codes — Unique mode, 1–5000 codes. */
export const generatePromoCodes = async (id: number, count: number): Promise<GeneratePromoCodesResult> => {
  const { data } = await server.post<GeneratePromoCodesResult>(`${BASE}/${id}/codes`, { count });
  return data;
};

/** GET /api/admin/promos/{id}/codes/export — CSV (UTF-8 BOM). */
export const exportPromoCodes = async (id: number): Promise<Blob> => {
  const { data } = await server.get(`${BASE}/${id}/codes/export`, { responseType: "blob" });
  return data as Blob;
};

/** POST /api/admin/promos/{id}/assign — puts the promo in users' "My codes" with a push. */
export const assignPromo = async (id: number, body: AssignPromoRequest): Promise<AssignPromoResult> => {
  const { data } = await server.post<AssignPromoResult>(`${BASE}/${id}/assign`, body);
  return data;
};

/** GET /api/admin/promos/{id}/report */
export const getPromoReport = async (id: number, signal?: AbortSignal): Promise<PromoReportDto> => {
  const { data } = await server.get<PromoReportDto>(`${BASE}/${id}/report`, { signal });
  return { ...data, byProvider: Array.isArray(data?.byProvider) ? data.byProvider : [] };
};

/** GET /api/admin/user-promos — user profile → codes, paged. */
export const getUserPromos = async (
  params: { userId?: number; campaignId?: number; status?: UserPromoStatus | null; page: number; pageSize: number },
  signal?: AbortSignal
): Promise<PagedResult<AdminUserPromoDto>> => {
  const { data } = await server.get<PagedResult<AdminUserPromoDto>>("api/admin/user-promos", {
    params: { ...params, status: params.status || undefined },
    signal,
  });
  return { ...data, items: Array.isArray(data?.items) ? data.items : [], totalCount: data?.totalCount ?? 0 };
};

/** PATCH /api/admin/user-promos/{id}/revoke — available promos only (409 PROMO_NOT_AVAILABLE). */
export const revokeUserPromo = async (id: number, reason: string | null): Promise<void> => {
  await server.patch(`api/admin/user-promos/${id}/revoke`, { reason });
};
