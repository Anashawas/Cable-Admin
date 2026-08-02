export type AnnouncementTargetType = "national" | "city" | "radius";
export type AnnouncementAudience = "all" | "guests" | "loggedIn";

/**
 * Welcome message / announcement (admin view).
 * NOTE: the backend uses FLAT bilingual fields (titleEn/titleAr/bodyEn/bodyAr),
 * not nested objects.
 */
export interface AnnouncementDto {
  id: number;
  titleEn: string;
  titleAr: string;
  bodyEn?: string | null;
  bodyAr?: string | null;
  imageUrl?: string | null;
  actionType?: number | null;
  actionUrl?: string | null;
  actionLabelEn?: string | null;
  actionLabelAr?: string | null;

  targetType?: AnnouncementTargetType | null;
  targetCity?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusKm?: number | null;
  audience?: AnnouncementAudience | null;

  startDate?: string | null;
  endDate?: string | null;

  maxPerDay?: number | null;
  cooldownHours?: number | null;
  maxLifetime?: number | null;
  stopOnDismiss?: boolean | null;

  campaignId?: number | null;
  isActive: boolean;
}

/** Create/update body (id in URL for update). */
export interface AnnouncementPayload {
  titleEn: string;
  titleAr: string;
  bodyEn?: string | null;
  bodyAr?: string | null;
  imageUrl?: string | null;
  actionType?: number | null;
  actionUrl?: string | null;
  actionLabelEn?: string | null;
  actionLabelAr?: string | null;

  targetType?: AnnouncementTargetType;
  targetCity?: string | null;
  centerLat?: number | null;
  centerLng?: number | null;
  radiusKm?: number | null;
  audience?: AnnouncementAudience;

  startDate?: string | null;
  endDate?: string | null;

  maxPerDay?: number | null;
  cooldownHours?: number | null;
  maxLifetime?: number | null;
  stopOnDismiss?: boolean | null;

  campaignId?: number | null;
  isActive: boolean;
}

/**
 * Per-announcement engagement analytics (GET .../announcements/{id}/stats).
 * impressions=view/20, clicks=click/21, dismisses=dismiss/22, conversions=conversion/23.
 * uniqueUsers = distinct logged-in userId + distinct guest anonymousId.
 */
export interface AnnouncementStatsDto {
  impressions: number;
  clicks: number;
  dismisses: number;
  conversions: number;
  ctr: number;
  uniqueUsers?: number | null;
}

/** Paginated list wrapper returned by GET api/home/admin/announcements. */
export interface AnnouncementsResponse {
  items: AnnouncementDto[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
