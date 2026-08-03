// ============================================
// Social Media Platforms (global catalog)
// ============================================

/** Catalog item from GET /api/socialMediaPlatforms. */
export interface SocialMediaPlatformDto {
  id: number;
  name: string;
  /** Resolved icon URL, or null until an icon has been uploaded. */
  iconUrl: string | null;
  displayOrder: number;
  isActive: boolean;
}

/**
 * Payload for POST /api/socialMediaPlatforms (multipart/form-data).
 * name + displayOrder + optional icon are sent in a single request.
 */
export interface AddSocialMediaPlatformRequest {
  name: string;
  displayOrder: number;
  icon?: File | null;
}

/**
 * Payload for PUT /api/socialMediaPlatforms/{id} (multipart/form-data).
 * Send `icon` only when replacing the existing icon.
 */
export interface UpdateSocialMediaPlatformRequest {
  name: string;
  displayOrder: number;
  isActive: boolean;
  icon?: File | null;
}

// ============================================
// Per-provider social links (Round 2)
// Kept here so the link editor can share the module.
// ============================================

export type SocialProviderType = "ServiceProvider" | "ChargingPoint";

/** Link item from GET /api/socialLinks. */
export interface SocialLinkDto {
  id: number;
  providerType: SocialProviderType;
  providerId: number;
  socialMediaPlatformId: number;
  socialMediaPlatformName: string;
  socialMediaPlatformIconUrl: string | null;
  url: string;
  displayOrder: number;
}

/** One row in the SetSocialLinks payload. */
export interface SocialLinkInput {
  socialMediaPlatformId: number;
  url: string;
  displayOrder?: number;
}

/** Payload for POST /api/socialLinks — replaces the full link list for a provider. */
export interface SetSocialLinksRequest {
  providerType: SocialProviderType;
  providerId: number;
  links: SocialLinkInput[];
}
