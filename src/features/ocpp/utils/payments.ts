import { addDays, endOfMonth, format, isValid, startOfMonth, subDays, subMonths } from "date-fns";
import { parseApiDate } from "../../../utils/date-format";
import type { OcppStationSessionDto, PagedResult } from "../types/api";

/**
 * Pure helpers behind the Charging revenue page (copied from the partner web's
 * payments.ts and adapted: no dayjs, sessions carry their station). Period ranges,
 * client-side filters, per day / per station / per charger totals, the CSV export
 * and the paged fetch that walks a station's sessions back to the period start.
 *
 * Session times are Jordan local time without a zone; they are read as local
 * time, so a session falls on the day its start shows.
 */

/** A station session tagged with the station it was fetched for. */
export type PaymentSession = OcppStationSessionDto & { stationId: number };

export type PeriodPreset = "today" | "yesterday" | "last7" | "thisMonth" | "lastMonth" | "custom";
export const PERIOD_PRESETS: PeriodPreset[] = ["today", "yesterday", "last7", "thisMonth", "lastMonth", "custom"];

export type SourceFilter = "all" | "Card" | "App" | "Operator";
export const SOURCES: SourceFilter[] = ["all", "Card", "App", "Operator"];
export type StatusFilter = "all" | "completed" | "running";
export const STATUSES: StatusFilter[] = ["all", "completed", "running"];

/** Inclusive day range as "YYYY-MM-DD" strings. */
export interface DayRange {
  from: string;
  to: string;
}

const DAY = "yyyy-MM-dd";
export const fmtDayKey = (d: Date): string => format(d, DAY);

/** "YYYY-MM-DD" → local midnight, or null. */
export const parseDay = (day: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isValid(d) ? d : null;
};

/** The calendar day a session belongs to (by its start), in local time; "" when unreadable. */
export const dayKey = (value: string): string => {
  const d = parseApiDate(value);
  return d ? fmtDayKey(d) : "";
};

const ts = (value?: string | null): number => parseApiDate(value)?.getTime() ?? 0;

export const presetRange = (preset: Exclude<PeriodPreset, "custom">, now: Date = new Date()): DayRange => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d = fmtDayKey;
  switch (preset) {
    case "today":
      return { from: d(today), to: d(today) };
    case "yesterday": {
      const y = d(subDays(today, 1));
      return { from: y, to: y };
    }
    case "last7":
      return { from: d(subDays(today, 6)), to: d(today) };
    case "thisMonth":
      return { from: d(startOfMonth(today)), to: d(today) };
    case "lastMonth": {
      const m = subMonths(today, 1);
      return { from: d(startOfMonth(m)), to: d(endOfMonth(m)) };
    }
  }
};

export const isValidRange = (r: DayRange): boolean => !!parseDay(r.from) && !!parseDay(r.to) && r.from <= r.to;

/** Every day in the range, oldest first (for the chart's x-axis, gaps included). */
export const daysIn = (range: DayRange): string[] => {
  const out: string[] = [];
  let cur = parseDay(range.from);
  const end = parseDay(range.to);
  if (!cur || !end) return out;
  while (cur <= end && out.length < 400) {
    out.push(fmtDayKey(cur));
    cur = addDays(cur, 1);
  }
  return out;
};

export interface SessionFilters {
  range: DayRange;
  stationId: number | null;
  chargerId: number | null;
  source: SourceFilter;
  status: StatusFilter;
}

export const sourceOf = (s: Pick<OcppStationSessionDto, "startSource">): Exclude<SourceFilter, "all"> => {
  const v = s.startSource;
  return v === "App" || v === "Operator" ? v : "Card";
};

export const filterSessions = <T extends PaymentSession>(sessions: T[], f: SessionFilters): T[] =>
  sessions.filter((s) => {
    const day = dayKey(s.startedAt);
    if (!day || day < f.range.from || day > f.range.to) return false;
    if (f.stationId != null && s.stationId !== f.stationId) return false;
    if (f.chargerId != null && s.ocppChargePointId !== f.chargerId) return false;
    if (f.source !== "all" && sourceOf(s) !== f.source) return false;
    if (f.status === "completed" && s.isOpen) return false;
    if (f.status === "running" && !s.isOpen) return false;
    return true;
  });

/** Totals over a set of sessions. Value, energy and averages count completed sessions only; open ones are counted apart. */
export interface Totals {
  sessions: number;
  energyKwh: number;
  revenueJod: number;
  durationSec: number;
  open: number;
  openRevenueJod: number;
}

export const costOf = (s: Pick<OcppStationSessionDto, "costJod" | "costFils">): number =>
  s.costJod ?? (s.costFils != null ? s.costFils / 1000 : 0);

export const emptyTotals = (): Totals => ({ sessions: 0, energyKwh: 0, revenueJod: 0, durationSec: 0, open: 0, openRevenueJod: 0 });

const add = (t: Totals, s: OcppStationSessionDto): Totals => {
  if (s.isOpen) {
    t.open += 1;
    t.openRevenueJod += costOf(s);
  } else {
    t.sessions += 1;
    t.energyKwh += s.energyKwh ?? 0;
    t.revenueJod += costOf(s);
    t.durationSec += s.durationSec ?? 0;
  }
  return t;
};

export const totalsOf = (sessions: OcppStationSessionDto[]): Totals => sessions.reduce(add, emptyTotals());

/** JOD per completed session, or null when there are none. */
export const avgPerSession = (t: Totals) => (t.sessions > 0 ? t.revenueJod / t.sessions : null);
/** JOD per kWh, or null when no energy was delivered. */
export const avgPerKwh = (t: Totals) => (t.energyKwh > 0 ? t.revenueJod / t.energyKwh : null);
export const avgDurationSec = (t: Totals) => (t.sessions > 0 ? t.durationSec / t.sessions : null);

/** Completed sessions and their value per way of starting (card / driver app / staff). */
export const bySource = (sessions: OcppStationSessionDto[]): Record<Exclude<SourceFilter, "all">, Totals> => {
  const out = { Card: emptyTotals(), App: emptyTotals(), Operator: emptyTotals() };
  for (const s of sessions) add(out[sourceOf(s)], s);
  return out;
};

export interface DayRow<T extends OcppStationSessionDto = PaymentSession> extends Totals {
  day: string;
  items: T[];
}

/** One row per day that has sessions, newest first; each row keeps its sessions (newest first). */
export const aggregateDaily = <T extends OcppStationSessionDto>(sessions: T[]): DayRow<T>[] => {
  const map = new Map<string, DayRow<T>>();
  for (const s of sessions) {
    const day = dayKey(s.startedAt);
    let row = map.get(day);
    if (!row) {
      row = { day, items: [], ...emptyTotals() };
      map.set(day, row);
    }
    add(row, s);
    row.items.push(s);
  }
  const rows = [...map.values()].sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  rows.forEach((r) => r.items.sort((a, b) => ts(b.startedAt) - ts(a.startedAt)));
  return rows;
};

export interface ShareRow extends Totals {
  id: number;
  name: string;
  /** Share of completed value, 0–100. */
  sharePct: number;
  /** Start of the newest session in the set, or null. */
  lastStartedAt: string | null;
}

const withShares = (rows: ShareRow[]): ShareRow[] => {
  const total = rows.reduce((sum, r) => sum + r.revenueJod, 0);
  rows.forEach((r) => (r.sharePct = total > 0 ? (r.revenueJod / total) * 100 : 0));
  return rows.sort((a, b) => b.revenueJod - a.revenueJod || b.sessions + b.open - (a.sessions + a.open) || a.name.localeCompare(b.name));
};

const groupBy = <T extends OcppStationSessionDto>(
  sessions: T[],
  keyOf: (s: T) => number,
  seed: { id: number; name: string }[],
  nameOf: (s: T) => string,
): ShareRow[] => {
  const map = new Map<number, ShareRow>();
  const blank = (id: number, name: string): ShareRow => ({ id, name, sharePct: 0, lastStartedAt: null, ...emptyTotals() });
  for (const x of seed) map.set(x.id, blank(x.id, x.name));
  for (const s of sessions) {
    const id = keyOf(s);
    let row = map.get(id);
    if (!row) {
      row = blank(id, nameOf(s));
      map.set(id, row);
    }
    add(row, s);
    if (!row.lastStartedAt || ts(s.startedAt) > ts(row.lastStartedAt)) row.lastStartedAt = s.startedAt;
  }
  return withShares([...map.values()]);
};

/** Per station, every station in `stations` included (0 when it sold nothing), by value, highest first. */
export const aggregateByStation = (sessions: PaymentSession[], stations: { id: number; name: string }[]): ShareRow[] =>
  groupBy(sessions, (s) => s.stationId, stations, (s) => `#${s.stationId}`);

/** Per charger; `chargers` seeds rows with 0 so idle chargers show too. */
export const aggregateByCharger = <T extends OcppStationSessionDto>(
  sessions: T[],
  nameOf: (s: T) => string,
  chargers: { id: number; name: string }[] = [],
): ShareRow[] => groupBy(sessions, (s) => s.ocppChargePointId, chargers, nameOf);

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Arabic correctly. */
export const toCsv = (header: string[], rows: (string | number | null | undefined)[][]): string => {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
};

export interface SessionsSince<T> {
  items: T[];
  /** True when the page cap was hit before reaching the period start. */
  capped: boolean;
}

/**
 * Every session from `from` ("YYYY-MM-DD") onwards. The list is newest first with
 * no date filter, so pages are walked until one reaches back past the period start,
 * the list ends, or the cap is hit.
 */
export const fetchSessionsSince = async <T extends { startedAt: string }>(
  fetchPage: (page: number, pageSize: number) => Promise<PagedResult<T>>,
  from: string,
  { pageSize = 100, maxPages = 20 }: { pageSize?: number; maxPages?: number } = {},
): Promise<SessionsSince<T>> => {
  const start = parseDay(from)?.getTime() ?? 0;
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetchPage(page, pageSize);
    const batch = res.items ?? [];
    items.push(...batch);
    const oldest = batch[batch.length - 1];
    const reachedStart = oldest != null && ts(oldest.startedAt) < start;
    const noMore = batch.length < pageSize || !res.hasNextPage || page * pageSize >= (res.totalCount ?? 0);
    if (reachedStart || noMore) return { items, capped: false };
  }
  return { items, capped: true };
};

/** Runs `worker` over `items` with at most `limit` running at once; results keep the input order. */
export const mapWithConcurrency = async <I, O>(items: I[], limit: number, worker: (item: I) => Promise<O>): Promise<O[]> => {
  const out: O[] = new Array(items.length);
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await worker(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, run));
  return out;
};
