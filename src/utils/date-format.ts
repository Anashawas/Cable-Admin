import { formatDistanceToNow, isValid, parseISO } from "date-fns";
import { ar, enUS } from "date-fns/locale";

/**
 * Date helpers for audit columns (createdAt / modifiedAt).
 *
 * The API returns naive local timestamps like "2025-09-23T03:50:39.093" with no
 * timezone suffix. `new Date()` treats those as local time, which is what we
 * want here — do not append "Z".
 */

export function parseApiDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = value.includes("T") ? parseISO(value) : new Date(value);
  return isValid(d) ? d : null;
}

const localeOf = (lang: string) => (lang.startsWith("ar") ? ar : enUS);

/** Short absolute date, e.g. "23 Sep 2025" / "٢٣ سبتمبر ٢٠٢٥". */
export function formatShortDate(value?: string | null, lang = "en"): string {
  const d = parseApiDate(value);
  if (!d) return "—";
  return d.toLocaleDateString(lang.startsWith("ar") ? "ar-JO" : "en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Full timestamp for tooltips. */
export function formatFullDateTime(value?: string | null, lang = "en"): string {
  const d = parseApiDate(value);
  if (!d) return "—";
  return d.toLocaleString(lang.startsWith("ar") ? "ar-JO" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Relative age, e.g. "8 months ago" / "منذ ٨ أشهر". */
export function formatRelative(value?: string | null, lang = "en"): string {
  const d = parseApiDate(value);
  if (!d) return "—";
  return formatDistanceToNow(d, { addSuffix: true, locale: localeOf(lang) });
}

/** Milliseconds since epoch, or null — for sorting without re-parsing. */
export function toTimestamp(value?: string | null): number | null {
  const d = parseApiDate(value);
  return d ? d.getTime() : null;
}

// ── Date-range presets ───────────────────────────────────────────────────────

export type DateRangePreset = "all" | "7d" | "30d" | "90d" | "365d";

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  "all",
  "7d",
  "30d",
  "90d",
  "365d",
];

const PRESET_DAYS: Record<Exclude<DateRangePreset, "all">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

/**
 * Whether `value` falls inside the preset window, counting back from now.
 * A row with no date is excluded from any narrowed range — an unknown date
 * cannot be claimed to be recent.
 */
export function matchesDateRange(
  value: string | null | undefined,
  preset: DateRangePreset
): boolean {
  if (preset === "all") return true;
  const ts = toTimestamp(value);
  if (ts == null) return false;
  const cutoff = Date.now() - PRESET_DAYS[preset] * 24 * 60 * 60 * 1000;
  return ts >= cutoff;
}
