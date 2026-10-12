/**
 * Normalises `GET api/users/summary` → `registrationTrend` into a clean
 * per-day series for the dashboard chart.
 *
 * The contract says `{ day: "YYYY-MM-DD", count }` — one row per day for the
 * last 30 days. In practice the API returns `day` as a timestamp
 * ("2026-09-22T03:00:00.000"), may return several rows for the same day, skips
 * days with no sign-ups, and may send a running total instead of daily counts.
 * This turns whatever comes back into exactly `days` consecutive local days.
 */

export interface TrendPoint { key: string; date: Date; count: number }

export interface TrendSeries {
  points: TrendPoint[];
  total: number;
  /** "ok" → chart; "empty" → no sign-ups in range; "single" → server sent one bucket, no daily breakdown. */
  status: "ok" | "empty" | "single";
  /** The input looked cumulative and was converted to daily deltas. */
  wasCumulative: boolean;
  /** Raw sum when status === "single". */
  singleValue: number;
}

type RawRow = { day?: unknown; date?: unknown; count?: unknown; total?: unknown };

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local calendar day of an API date. Zone-less timestamps are already local; zoned ones are converted. */
function toDayKey(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const s = value.trim();
  const hasZone = /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(s) && s.length > 10;
  if (hasZone) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : ymd(d);
  }
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

export function buildRegistrationSeries(
  raw: ReadonlyArray<RawRow> | null | undefined,
  totalUsers: number | undefined,
  days = 30,
  now = new Date(),
): TrendSeries {
  // 1) Sum per local day (merges duplicate / time-stamped rows).
  const byDay = new Map<string, number>();
  for (const r of raw ?? []) {
    const key = toDayKey(r.day ?? r.date);
    const n = Number(r.count ?? r.total ?? 0);
    if (!key || !Number.isFinite(n)) continue;
    byDay.set(key, (byDay.get(key) ?? 0) + n);
  }

  // 2) Running totals → daily deltas. A non-decreasing series whose last value
  //    is in the ballpark of the user base cannot be 30 days of sign-ups.
  const sortedKeys = [...byDay.keys()].sort();
  const vals = sortedKeys.map((k) => byDay.get(k) ?? 0);
  const nonDecreasing = vals.every((v, i) => i === 0 || v >= vals[i - 1]);
  const last = vals[vals.length - 1] ?? 0;
  const wasCumulative = vals.length >= 3 && nonDecreasing && !!totalUsers && last >= totalUsers * 0.5;
  if (wasCumulative) {
    sortedKeys.forEach((k, i) => byDay.set(k, i === 0 ? 0 : vals[i] - vals[i - 1]));
  }

  // 3) Exactly `days` consecutive days ending today (or the latest data day if the server is ahead).
  const latest = sortedKeys[sortedKeys.length - 1];
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (latest && latest > ymd(end)) {
    const [y, m, d] = latest.split("-").map(Number);
    end.setFullYear(y, m - 1, d);
  }
  const points: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    const key = ymd(d);
    points.push({ key, date: d, count: Math.max(0, byDay.get(key) ?? 0) });
  }
  const total = points.reduce((s, p) => s + p.count, 0);

  const nonZeroDays = [...byDay.values()].filter((v) => v > 0).length;
  const singleValue = [...byDay.values()].reduce((s, v) => s + v, 0);
  const status: TrendSeries["status"] =
    nonZeroDays === 1 && byDay.size === 1 ? "single" : total === 0 ? "empty" : "ok";

  return { points, total, status, wasCumulative, singleValue };
}
