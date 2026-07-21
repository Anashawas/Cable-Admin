import { server } from "../../../lib/@axios";
import type {
  SocialMediaPlatformDto,
  AddSocialMediaPlatformRequest,
  UpdateSocialMediaPlatformRequest,
  SocialLinkDto,
  SetSocialLinksRequest,
  SocialProviderType,
} from "../types/api";

/**
 * GET /api/socialMediaPlatforms?activeOnly=true
 * Public. Ordered by displayOrder then name. Pass activeOnly=false for the
 * admin screen so deactivated platforms are included.
 */
export const getAllSocialMediaPlatforms = async (
  activeOnly = true,
  signal?: AbortSignal
): Promise<SocialMediaPlatformDto[]> => {
  const { data } = await server.get<SocialMediaPlatformDto[]>(
    "/api/socialMediaPlatforms",
    { params: { activeOnly }, signal }
  );
  return Array.isArray(data) ? data : [];
};

/**
 * POST /api/socialMediaPlatforms (admin, multipart/form-data)
 * name + displayOrder + optional icon in one request. Returns the new id.
 */
export const createSocialMediaPlatform = async (
  body: AddSocialMediaPlatformRequest
): Promise<number> => {
  const form = new FormData();
  form.append("name", body.name);
  form.append("displayOrder", String(body.displayOrder));
  if (body.icon) form.append("icon", body.icon);
  const { data } = await server.post<number>("/api/socialMediaPlatforms", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

/**
 * PUT /api/socialMediaPlatforms/{id} (admin, multipart/form-data)
 * Send `icon` only when replacing the existing one.
 */
export const updateSocialMediaPlatform = async (
  id: number,
  body: UpdateSocialMediaPlatformRequest
): Promise<void> => {
  const form = new FormData();
  form.append("name", body.name);
  form.append("displayOrder", String(body.displayOrder));
  form.append("isActive", String(body.isActive));
  if (body.icon) form.append("icon", body.icon);
  await server.put(`/api/socialMediaPlatforms/${id}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * DELETE /api/socialMediaPlatforms/{id} (admin)
 * Soft delete: sets IsDeleted = 1 and IsActive = 0.
 */
export const deleteSocialMediaPlatform = async (id: number): Promise<void> => {
  await server.delete(`/api/socialMediaPlatforms/${id}`);
};

// ============================================
// Per-provider social links
// ============================================

/**
 * GET /api/socialLinks?providerType=...&providerId=...
 * Public. Links for one provider, ordered by displayOrder, enriched with
 * platform name + icon url.
 */
export const getSocialLinks = async (
  providerType: SocialProviderType,
  providerId: number,
  signal?: AbortSignal
): Promise<SocialLinkDto[]> => {
  const { data } = await server.get<SocialLinkDto[]>("/api/socialLinks", {
    params: { providerType, providerId },
    signal,
  });
  return Array.isArray(data) ? data : [];
};

/**
 * POST /api/socialLinks (admin)
 * Replaces the FULL link list for the provider atomically. Send links: [] to
 * clear all. Returns the new SocialLink ids in order.
 */
export const setSocialLinks = async (
  body: SetSocialLinksRequest
): Promise<number[]> => {
  const { data } = await server.post<number[]>("/api/socialLinks", body);
  return Array.isArray(data) ? data : [];
};

/**
 * DELETE /api/socialLinks/{id} (admin)
 * Soft-delete a single link.
 */
export const deleteSocialLink = async (id: number): Promise<void> => {
  await server.delete(`/api/socialLinks/${id}`);
};
