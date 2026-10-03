// ── Welcome bonus (first-ever-charge double points) ──────────────────
// Backed by GET/PUT api/settings/welcome-bonus.
export interface WelcomeBonusDto {
  /** Points multiplier applied on a user's first-ever charge. 1 = disabled. */
  multiplier: number;
  /** Convenience flag from BE: true when multiplier > 1. */
  isEnabled?: boolean;
  /** True when the value is the server default (never explicitly set). */
  isDefault?: boolean;
}

// ── Loyalty boost campaigns ──────────────────────────────────────────
// Backed by api/loyalty/boosts (list / {id} / POST / PUT{id} / PUT{id}/deactivate).
export type BoostProviderType = "ChargingPoint" | "ServiceProvider";

/** A single station/provider a boost is scoped to. */
export interface BoostProviderRef {
  providerType: BoostProviderType;
  providerId: number;
  /** Display only — not sent in the create/update body. */
  providerName?: string | null;
}

export interface BoostDto {
  id: number;
  name?: string | null;
  nameAr?: string | null;
  /** Points multiplier while the boost is in effect (e.g. 2 = double). */
  multiplier: number;
  /** UTC ISO — window start (inclusive; null = starts immediately). */
  startsAt?: string | null;
  /** UTC ISO — window end (exclusive; null = open-ended). */
  endsAt?: string | null;
  /** Minutes from midnight, Jordan local time (null = all day). A start later
   *  than the end is a valid window that crosses midnight (e.g. 22:00→02:00). */
  dailyStartMinute?: number | null;
  dailyEndMinute?: number | null;
  /** Bitmask of active weekdays; bit 0 = Sunday … bit 6 = Saturday. 0 = every day. */
  daysOfWeekMask: number;
  /** True = applies at every provider; false = only the `providers` list. */
  appliesToAllProviders: boolean;
  providers?: BoostProviderRef[] | null;
  /** Tie-breaker when several boosts overlap (higher wins); default 0. */
  priority: number;
  /** Cap on bonus points a single user can earn from this boost (null = no cap). */
  maxBonusPointsPerUser?: number | null;
  /** Cap on total bonus points across all users (null = no cap). */
  maxTotalBonusPoints?: number | null;
  /** False once the boost has been deactivated. */
  isActive: boolean;
  /** Read-only usage figures the list endpoint returns. */
  bonusPointsSpent?: number | null;
  boostedTransactions?: number | null;
}

export interface BoostPayload {
  name?: string | null;
  nameAr?: string | null;
  multiplier: number;
  startsAt?: string | null;
  endsAt?: string | null;
  dailyStartMinute?: number | null;
  dailyEndMinute?: number | null;
  daysOfWeekMask: number;
  appliesToAllProviders: boolean;
  providers: { providerType: BoostProviderType; providerId: number }[];
  priority: number;
  maxBonusPointsPerUser?: number | null;
  maxTotalBonusPoints?: number | null;
}
