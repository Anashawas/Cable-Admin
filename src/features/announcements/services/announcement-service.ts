import { server } from "../../../lib/@axios";
import { compressImage } from "../../../lib/image-compress";
import type {
  AnnouncementDto,
  AnnouncementPayload,
  AnnouncementsResponse,
  AnnouncementStatsDto,
} from "../types/api";

/** GET api/home/admin/announcements → paginated { items, ... }. */
export const getAnnouncements = async (
  signal?: AbortSignal
): Promise<AnnouncementDto[]> => {
  const { data } = await server.get<AnnouncementsResponse | AnnouncementDto[]>(
    "api/home/admin/announcements",
    { params: { page: 1, pageSize: 100 }, signal }
  );
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
};

/**
 * POST api/home/admin/announcements
 * Returns the new announcement id (backend sends a bare number, `{id}`, or
 * `[id]`) so the caller can chain an image upload right after create.
 */
export const createAnnouncement = async (
  body: AnnouncementPayload,
  signal?: AbortSignal
): Promise<number | null> => {
  const { data } = await server.post<number | number[] | { id?: number }>(
    "api/home/admin/announcements",
    body,
    { signal }
  );
  if (typeof data === "number") return data;
  if (Array.isArray(data)) return typeof data[0] === "number" ? data[0] : null;
  if (data && typeof data === "object" && typeof data.id === "number") return data.id;
  return null;
};

/** PUT api/home/admin/announcements/{id} */
export const updateAnnouncement = async (
  id: number,
  body: AnnouncementPayload,
  signal?: AbortSignal
): Promise<void> => {
  await server.put(`api/home/admin/announcements/${id}`, body, { signal });
};

/**
 * POST api/home/admin/announcements/{id}/image  (multipart, form key `files`)
 * Uploads the welcome-message image; the image is compressed client-side first
 * so it loads fast in the app. Backend stores it and sets `imageUrl` to a
 * public URL. Returns the stored URL.
 */
export const uploadAnnouncementImage = async (
  id: number,
  file: File,
  signal?: AbortSignal
): Promise<string> => {
  const light = await compressImage(file, { maxWidth: 1200, quality: 0.82 });
  const form = new FormData();
  form.append("files", light);
  const { data } = await server.post<{ imageUrl?: string } | string>(
    `api/home/admin/announcements/${id}/image`,
    form,
    { signal }
  );
  if (typeof data === "string") return data;
  return data?.imageUrl ?? "";
};

/**
 * GET api/home/admin/announcements/{id}/stats?from=&to=
 * Per-announcement engagement analytics. Resolves to null on failure so the UI
 * degrades to a subtle empty state instead of erroring.
 */
export const getAnnouncementStats = async (
  id: number,
  signal?: AbortSignal
): Promise<AnnouncementStatsDto | null> => {
  try {
    const { data } = await server.get<AnnouncementStatsDto>(
      `api/home/admin/announcements/${id}/stats`,
      { signal }
    );
    return data ?? null;
  } catch {
    return null;
  }
};
