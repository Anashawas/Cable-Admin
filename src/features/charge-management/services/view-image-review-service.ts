import { server } from "../../../lib/@axios";
import { compressImage } from "../../../lib/image-compress";

/**
 * POST api/charging-points/{id}/view-image  (multipart 'file', admin → approved)
 * Uploads/replaces the station promo image. Compresses to a light 16:9-ish
 * photo before upload so it loads fast on the app. Returns the stored URL.
 */
export const uploadStationViewImage = async (
  id: number,
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  const light = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
  const form = new FormData();
  form.append("file", light);
  const { data } = await server.post(`api/charging-points/${id}/view-image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    signal,
  });
  if (typeof data === "string") return data;
  return (data?.viewImage as string) ?? "";
};

export interface PendingViewImageDto {
  chargingPointId: number;
  stationName?: string | null;
  cityName?: string | null;
  ownerId?: number | null;
  ownerName?: string | null;
  viewImage?: string | null;
  uploadedAt?: string | null;
}

/**
 * GET api/charging-points/view-image/pending
 * Charging points whose promo (viewImage) is awaiting admin review.
 * Response shape (frozen with BE): { chargingPointId, stationName, cityName,
 * ownerId, ownerName, viewImage (full URL), uploadedAt }.
 */
export const getPendingViewImages = async (
  signal?: AbortSignal
): Promise<PendingViewImageDto[]> => {
  // Backend returns a paginated wrapper { items, totalCount, ... }, not a bare
  // array — read data.items (fall back to array for safety).
  const { data } = await server.get<
    PendingViewImageDto[] | { items?: PendingViewImageDto[] }
  >("api/charging-points/view-image/pending", {
    params: { page: 1, pageSize: 100 },
    signal,
  });
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
};

/**
 * PUT api/charging-points/{id}/view-image/review?approve=true|false
 */
export const reviewViewImage = async (
  id: number,
  approve: boolean,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(
    `api/charging-points/${id}/view-image/review?approve=${approve}`,
    undefined,
    { signal }
  );
};

/**
 * DELETE api/charging-points/{id}/view-image
 */
export const deleteViewImage = async (
  id: number,
  signal?: AbortSignal
): Promise<void> => {
  await server.delete(`api/charging-points/${id}/view-image`, { signal });
};
