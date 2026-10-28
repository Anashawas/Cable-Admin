import { server } from "../../../lib/@axios";
import type {
  AdminCableGiftDto,
  AdminGiftOrderDto,
  CableGiftInput,
  GiftOrderFilters,
  PagedResult,
} from "../types/api";

const BASE = "api/admin/cable-gifts";

const filterParams = (f: GiftOrderFilters) => ({
  status: f.status || undefined,
  giftId: f.giftId || undefined,
  from: f.from || undefined,
  to: f.to || undefined,
  search: f.search?.trim() || undefined,
});

/** GET /api/admin/cable-gifts — every gift (inactive too); a bare list without page/pageSize. */
export const getAdminGifts = async (
  params: { isActive?: boolean | null; search?: string | null } = {},
  signal?: AbortSignal
): Promise<AdminCableGiftDto[]> => {
  const { data } = await server.get(BASE, {
    params: {
      isActive: params.isActive ?? undefined,
      search: params.search?.trim() || undefined,
    },
    signal,
  });
  if (Array.isArray(data)) return data as AdminCableGiftDto[];
  return Array.isArray(data?.items) ? (data.items as AdminCableGiftDto[]) : [];
};

/** GET /api/admin/cable-gifts/{id} */
export const getAdminGift = async (id: number, signal?: AbortSignal): Promise<AdminCableGiftDto> => {
  const { data } = await server.get<AdminCableGiftDto>(`${BASE}/${id}`, { signal });
  return data;
};

/** POST /api/admin/cable-gifts → { id } */
export const createGift = async (body: CableGiftInput): Promise<number> => {
  const { data } = await server.post<{ id: number }>(BASE, body);
  return data.id;
};

/** PUT /api/admin/cable-gifts/{id} — the stock can't go below the pieces already ordered. */
export const updateGift = async (id: number, body: CableGiftInput): Promise<void> => {
  await server.put(`${BASE}/${id}`, body);
};

/** PATCH /api/admin/cable-gifts/{id}/active */
export const setGiftActive = async (id: number, isActive: boolean): Promise<void> => {
  await server.patch(`${BASE}/${id}/active`, { isActive });
};

/** POST /api/admin/cable-gifts/{id}/image — multipart key `files`, jpg/png/webp up to 5 MB. */
export const uploadGiftImage = async (id: number, file: File): Promise<string> => {
  const form = new FormData();
  form.append("files", file);
  const { data } = await server.post<{ imageUrl: string }>(`${BASE}/${id}/image`, form);
  return data?.imageUrl ?? "";
};

/** GET /api/admin/cable-gifts/orders — newest first, paged. */
export const getGiftOrders = async (
  filters: GiftOrderFilters,
  page: number,
  pageSize: number,
  signal?: AbortSignal
): Promise<PagedResult<AdminGiftOrderDto>> => {
  const { data } = await server.get<PagedResult<AdminGiftOrderDto>>(`${BASE}/orders`, {
    params: { ...filterParams(filters), page, pageSize },
    signal,
  });
  return {
    ...data,
    items: Array.isArray(data?.items) ? data.items : [],
    totalCount: data?.totalCount ?? 0,
  };
};

/** GET /api/admin/cable-gifts/orders/export — same filters, CSV (UTF-8 with BOM). */
export const exportGiftOrders = async (filters: GiftOrderFilters): Promise<Blob> => {
  const { data } = await server.get(`${BASE}/orders/export`, {
    params: filterParams(filters),
    responseType: "blob",
  });
  return data as Blob;
};

/** GET /api/admin/cable-gifts/orders/pending-count — the dashboard badge. */
export const getPendingGiftOrdersCount = async (signal?: AbortSignal): Promise<number> => {
  const { data } = await server.get<{ pendingCount: number }>(`${BASE}/orders/pending-count`, { signal });
  return data?.pendingCount ?? 0;
};

/** PATCH /api/admin/cable-gifts/orders/{id}/fulfill — the note / voucher code is shown to the user. */
export const fulfillGiftOrder = async (id: number, fulfillmentNote: string | null): Promise<void> => {
  await server.patch(`${BASE}/orders/${id}/fulfill`, { fulfillmentNote });
};

/** PATCH /api/admin/cable-gifts/orders/{id}/cancel — refunds every point and returns the piece to stock. */
export const cancelGiftOrder = async (id: number, reason: string | null): Promise<void> => {
  await server.patch(`${BASE}/orders/${id}/cancel`, { reason });
};
