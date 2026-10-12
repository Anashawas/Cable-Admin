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

/** Levantine month names, as Jordanian admins read them (same as the OCPP screens / partner web). */
export const AR_MONTHS_LEVANTINE = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];

/**
 * Long date with weekday: "الاثنين، 12 تشرين الأول 2026" in Arabic (Western
 * digits, Levantine month), "Monday, 12 October 2026" otherwise.
 */
export function formatLongDate(d: Date, lang = "en"): string {
  if (!lang.startsWith("ar")) {
    return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  const weekday = d.toLocaleDateString("ar-JO", { weekday: "long" });
  return `${weekday}، ${d.getDate()} ${AR_MONTHS_LEVANTINE[d.getMonth()]} ${d.getFullYear()}`;
}

/** Naive local day bounds ("YYYY-MM-DDT00:00:00" / "…T23:59:59"), matching the API's naive local timestamps. */
export function localDayBounds(d: Date): { from: string; to: string } {
  const p = (n: number) => String(n).padStart(2, "0");
  const day = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return { from: `${day}T00:00:00`, to: `${day}T23:59:59` };
}
