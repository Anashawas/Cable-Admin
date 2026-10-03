import { server } from "../../../lib/@axios";

/** A user who follows (favorited) a station.
 *  From GET /api/provider/favorites/ChargingPoint/{id} (FanUser).
 *  The backend deliberately omits phone/email here. */
export interface StationFollowerDto {
  userId: number;
  name: string;
  city: string;
  favoritedAt: string | null;
}

/** A notification the station owner sent to the station's followers.
 *  From GET /api/provider/favorites/ChargingPoint/{id}/notifications (PartnerNotification). */
export interface StationSentNotificationDto {
  id: number;
  title: string;
  body: string;
  typeName: string | null;
  status: string; // sent | pending | rejected
  sentByName: string | null;
  sentAt: string | null;
  recipientsCount: number | null;
  deliveredCount: number | null;
  readCount: number | null;
}

/** A single page from the backend's paged list envelope. */
export interface Page<T> {
  items: T[];
  totalCount: number;
  page: number;
  hasNextPage: boolean;
}

/** Tolerant field picker — the .NET backend has returned both camelCase and PascalCase. */
function pick<T = unknown>(row: Record<string, unknown>, keys: string[], fallback: T): T {
  for (const k of keys) {
    const v = row?.[k];
    if (v != null) return v as T;
  }
  return fallback;
}

function asInt(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function rowsOf(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  const items = (data as { items?: unknown; Items?: unknown })?.items ??
    (data as { Items?: unknown })?.Items;
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

/** Reads the paged envelope's meta ({ totalCount, page, hasNextPage }), tolerant of casing.
 *  Falls back sensibly when the backend returns a bare array. */
function pageMeta(data: unknown, items: unknown[], page: number): { totalCount: number; hasNextPage: boolean } {
  if (Array.isArray(data)) return { totalCount: items.length, hasNextPage: false };
  const d = (data ?? {}) as Record<string, unknown>;
  const totalCount = asInt(d.totalCount ?? d.TotalCount, items.length);
  const hasNext = (d.hasNextPage ?? d.HasNextPage);
  return {
    totalCount,
    hasNextPage: typeof hasNext === "boolean" ? hasNext : page * items.length < totalCount,
  };
}

/** The favorites API is type-generic: charging points or service providers. */
export type EngagementProviderType = "ChargingPoint" | "ServiceProvider";

/**
 * GET /api/provider/favorites/{providerType}/{id}?page=&pageSize=
 * The users who favorited (follow) the station / service provider. Admin/owner only.
 */
export const getStationFollowers = async (
  providerType: EngagementProviderType,
  id: number,
  page = 1,
  pageSize = 50,
  signal?: AbortSignal
): Promise<Page<StationFollowerDto>> => {
  const { data } = await server.get(
    `api/provider/favorites/${providerType}/${id}`,
    { params: { page, pageSize }, signal }
  );
  const rows = rowsOf(data);
  const items = rows.map((r) => ({
    userId: pick<number>(r, ["userId", "UserId", "id", "Id"], 0),
    name: pick<string>(r, ["name", "Name", "userName", "UserName", "fullName", "FullName"], ""),
    city: pick<string>(r, ["city", "City", "cityName", "CityName"], ""),
    favoritedAt: pick<string | null>(
      r,
      ["favoritedAt", "FavoritedAt", "followedAt", "FollowedAt", "createdAt", "CreatedAt"],
      null
    ),
  }));
  return { items, page, ...pageMeta(data, items, page) };
};

/**
 * GET /api/provider/favorites/{providerType}/{id}/notifications?page=&pageSize=
 * The notifications the owner sent to their followers. Admin/owner only.
 */
export const getStationSentNotifications = async (
  providerType: EngagementProviderType,
  id: number,
  page = 1,
  pageSize = 50,
  signal?: AbortSignal
): Promise<Page<StationSentNotificationDto>> => {
  const { data } = await server.get(
    `api/provider/favorites/${providerType}/${id}/notifications`,
    { params: { page, pageSize }, signal }
  );
  const rows = rowsOf(data);
  const items = rows.map((r) => ({
    id: pick<number>(r, ["id", "Id"], 0),
    title: pick<string>(r, ["title", "Title"], ""),
    body: pick<string>(r, ["body", "Body", "message", "Message"], ""),
    typeName: pick<string | null>(
      r,
      ["notificationTypeName", "NotificationTypeName", "typeName", "TypeName", "type", "Type"],
      null
    ),
    status: pick<string>(r, ["status", "Status"], "sent"),
    sentByName: pick<string | null>(r, ["sentByName", "SentByName"], null),
    sentAt: pick<string | null>(
      r,
      ["sentAt", "SentAt", "submittedAt", "SubmittedAt", "createdAt", "CreatedAt"],
      null
    ),
    recipientsCount: pick<number | null>(
      r,
      ["recipientCount", "RecipientCount", "recipientsCount", "RecipientsCount", "recipients", "Recipients"],
      null
    ),
    deliveredCount: pick<number | null>(r, ["deliveredCount", "DeliveredCount"], null),
    readCount: pick<number | null>(r, ["readCount", "ReadCount"], null),
  }));
  return { items, page, ...pageMeta(data, items, page) };
};
