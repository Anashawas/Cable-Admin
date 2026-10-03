// Opening-hours parsing, shared by every screen that shows or edits a
// station's / provider's hours.
//
// This mirrors `OpeningHours` in the two Flutter apps
// (mob/lib/core/helpers/opening_hours.dart and the cable_partner copy) so the
// same station reads identically to an admin, a partner and a driver. If you
// change a rule here, change it there too.
//
// The backend marks "open 24 hours" as `fromTime == toTime == "0:00"` (also
// seen as "00:00", "" or null) — 120 of 214 live stations carry it. Stored
// values are whatever was typed, so real data also contains "9:30", seconds
// ("12:40:00") and outright typos ("0;00", "0:0]"). Hence the forgiving parse.

/**
 * Normalizes a raw time to `"HH:mm"`. Tolerates missing padding, seconds and
 * punctuation typos. Returns `""` when there are no digits at all.
 */
export function normalizeTime(raw?: string | null): string {
	if (raw == null) return "";
	const digits = String(raw).trim().replace(/[^0-9]/g, "");
	if (digits === "") return "";

	let h: number;
	let m: number;
	if (digits.length <= 2) {
		h = Number(digits);
		m = 0;
	} else if (digits.length === 3) {
		// "930" -> 9:30, "000" -> 0:00
		h = Number(digits.slice(0, 1));
		m = Number(digits.slice(1, 3));
	} else {
		// "0900", "124000" (HH:mm:ss) -> take the first four digits.
		h = Number(digits.slice(0, 2));
		m = Number(digits.slice(2, 4));
	}

	if (!Number.isFinite(h)) h = 0;
	if (!Number.isFinite(m)) m = 0;
	if (h > 24) h = h % 24;
	if (m > 59) m = 59;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * True when the place is open around the clock.
 *
 * Covers: nothing (or only half) configured, the `0:00`/`0:00` marker, any
 * zero-length window — identical from/to is never the intent — and
 * `00:00 → 23:59 / 24:00`.
 */
export function is24Hours(from?: string | null, to?: string | null): boolean {
	const f = normalizeTime(from);
	const t = normalizeTime(to);
	if (f === "" || t === "") return true;
	if (f === t) return true;
	if (f === "00:00" && (t === "23:59" || t === "24:00")) return true;
	return false;
}

/**
 * A single time cleaned up for display: `"9:30"` → `"09:30"`,
 * `"12:40:00"` → `"12:40"`. Use this instead of printing the raw API value.
 */
export const timeLabel = normalizeTime;

/**
 * Hours ready to show. Pass the localized "open 24 hours" label — every caller
 * has `t` and the wording differs per app area.
 *
 * Returns `""` when there is nothing to show, so callers can hide the row.
 */
export function formatOpeningHours(
	from: string | null | undefined,
	to: string | null | undefined,
	label24h: string,
	separator = " - "
): string {
	// Both missing reads as "unknown", not "open 24 hours" — an admin needs to
	// see that nothing was ever entered. A real marker still reads as 24h.
	const bothMissing = normalizeTime(from) === "" && normalizeTime(to) === "";
	if (bothMissing) return "";
	if (is24Hours(from, to)) return label24h;

	const f = normalizeTime(from);
	const t = normalizeTime(to);
	if (f === "" || t === "") return f || t;
	return `${f}${separator}${t}`;
}
