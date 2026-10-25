import { describe, expect, it } from "vitest";
import type { PagedResult } from "../types/api";
import {
  aggregateByCharger,
  aggregateByStation,
  aggregateDaily,
  avgPerKwh,
  avgPerSession,
  bySource,
  daysIn,
  fetchSessionsSince,
  filterSessions,
  isValidRange,
  mapWithConcurrency,
  presetRange,
  toCsv,
  totalsOf,
  type PaymentSession,
  type SessionFilters,
} from "./payments";
import { fmtDay, fmtTime12 } from "./payments-format";

const s = (over: Partial<PaymentSession>): PaymentSession => ({
  id: 1,
  stationId: 37,
  ocppChargePointId: 10,
  chargerName: "A",
  connectorId: 1,
  idTag: "X",
  startedAt: "2026-10-12T10:00:00",
  isOpen: false,
  startSource: "Card",
  energyKwh: 10,
  costJod: 1.5,
  durationSec: 600,
  ...over,
});

const sessions: PaymentSession[] = [
  s({ id: 1, startedAt: "2026-10-12T23:30:00", energyKwh: 20, costJod: 3 }),
  s({ id: 2, startedAt: "2026-10-12T08:00:00", energyKwh: 10, costJod: 1.5, connectorId: 2, startSource: "App" }),
  s({ id: 3, startedAt: "2026-10-12T23:50:00", isOpen: true, energyKwh: 2, costJod: 0.25 }),
  s({ id: 4, startedAt: "2026-10-11T00:10:00", energyKwh: 5, costJod: null, costFils: 750, ocppChargePointId: 11, chargerName: "B", stationId: 40 }),
  s({ id: 5, startedAt: "2026-10-01T12:00:00", energyKwh: 1, costJod: 0.1, startSource: "Operator" }),
];

const noFilter = (from: string, to: string): SessionFilters => ({
  range: { from, to }, stationId: null, chargerId: null, source: "all", status: "all",
});

describe("presetRange / daysIn", () => {
  const now = new Date(2026, 9, 25, 14, 30); // 25 Oct 2026

  it("builds the presets from today, local time", () => {
    expect(presetRange("today", now)).toEqual({ from: "2026-10-25", to: "2026-10-25" });
    expect(presetRange("yesterday", now)).toEqual({ from: "2026-10-24", to: "2026-10-24" });
    expect(presetRange("last7", now)).toEqual({ from: "2026-10-19", to: "2026-10-25" });
    expect(presetRange("thisMonth", now)).toEqual({ from: "2026-10-01", to: "2026-10-25" });
    expect(presetRange("lastMonth", now)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("lists every day of a range, gaps included, and validates ranges", () => {
    expect(daysIn({ from: "2026-02-27", to: "2026-03-02" })).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
    expect(daysIn({ from: "2026-03-02", to: "2026-03-01" })).toEqual([]);
    expect(isValidRange({ from: "2026-03-01", to: "2026-03-01" })).toBe(true);
    expect(isValidRange({ from: "2026-03-02", to: "2026-03-01" })).toBe(false);
    expect(isValidRange({ from: "", to: "2026-03-01" })).toBe(false);
  });
});

describe("filterSessions", () => {
  it("keeps the period by local start day, inclusive", () => {
    expect(filterSessions(sessions, noFilter("2026-10-12", "2026-10-12")).map((x) => x.id)).toEqual([1, 2, 3]);
    expect(filterSessions(sessions, noFilter("2026-10-11", "2026-10-12")).map((x) => x.id)).toEqual([1, 2, 3, 4]);
  });

  it("filters by station, charger, source and status", () => {
    const f = noFilter("2026-10-01", "2026-10-31");
    expect(filterSessions(sessions, { ...f, stationId: 40 }).map((x) => x.id)).toEqual([4]);
    expect(filterSessions(sessions, { ...f, chargerId: 11 }).map((x) => x.id)).toEqual([4]);
    expect(filterSessions(sessions, { ...f, source: "App" }).map((x) => x.id)).toEqual([2]);
    expect(filterSessions(sessions, { ...f, source: "Operator" }).map((x) => x.id)).toEqual([5]);
    expect(filterSessions(sessions, { ...f, status: "running" }).map((x) => x.id)).toEqual([3]);
    expect(filterSessions(sessions, { ...f, status: "completed" })).toHaveLength(4);
  });
});

describe("totals and aggregation", () => {
  it("groups by local start day, newest first, and keeps open sessions out of the value", () => {
    const rows = aggregateDaily(sessions);
    expect(rows.map((r) => r.day)).toEqual(["2026-10-12", "2026-10-11", "2026-10-01"]);
    const d12 = rows[0];
    expect(d12.sessions).toBe(2);
    expect(d12.open).toBe(1);
    expect(d12.energyKwh).toBe(30);
    expect(d12.revenueJod).toBeCloseTo(4.5);
    expect(d12.openRevenueJod).toBeCloseTo(0.25);
    expect(d12.items.map((i) => i.id)).toEqual([3, 1, 2]);
    expect(avgPerKwh(d12)).toBeCloseTo(0.15);
    // costFils is used when costJod is missing.
    expect(rows[1].revenueJod).toBeCloseTo(0.75);
  });

  it("totals match the sum of the days; averages are null without sessions", () => {
    const t = totalsOf(sessions);
    expect(t.sessions).toBe(4);
    expect(t.revenueJod).toBeCloseTo(3 + 1.5 + 0.75 + 0.1);
    expect(t.open).toBe(1);
    expect(avgPerSession(t)).toBeCloseTo(5.35 / 4);
    expect(avgPerSession(totalsOf([]))).toBeNull();
    expect(avgPerKwh(totalsOf([]))).toBeNull();
  });

  it("splits completed sessions by how they started", () => {
    const b = bySource(sessions);
    expect(b.Card.sessions).toBe(2);
    expect(b.Card.revenueJod).toBeCloseTo(3.75);
    expect(b.Card.open).toBe(1);
    expect(b.App.sessions).toBe(1);
    expect(b.Operator.revenueJod).toBeCloseTo(0.1);
  });

  it("lists every station, idle ones with 0, highest value first with shares", () => {
    const rows = aggregateByStation(sessions, [
      { id: 37, name: "Irbid" },
      { id: 40, name: "Amman" },
      { id: 50, name: "Zarqa" },
    ]);
    expect(rows.map((r) => r.id)).toEqual([37, 40, 50]);
    expect(rows[0].revenueJod).toBeCloseTo(4.6);
    expect(rows[0].open).toBe(1);
    expect(rows[0].lastStartedAt).toBe("2026-10-12T23:50:00");
    expect(rows[2]).toMatchObject({ sessions: 0, revenueJod: 0, sharePct: 0, lastStartedAt: null, name: "Zarqa" });
    expect(rows.reduce((sum, r) => sum + r.sharePct, 0)).toBeCloseTo(100);
  });

  it("aggregates per charger with names", () => {
    const rows = aggregateByCharger(sessions, (x) => x.chargerName ?? "?", [{ id: 12, name: "C" }]);
    expect(rows.map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(rows[0].sharePct + rows[1].sharePct).toBeCloseTo(100);
  });
});

describe("toCsv", () => {
  it("starts with a BOM, quotes when needed and uses CRLF", () => {
    const csv = toCsv(["رقم", "name"], [[1, 'a,"b"'], [2, null]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe('رقم,name\r\n1,"a,""b"""\r\n2,');
  });
});

describe("fetchSessionsSince", () => {
  const page = (items: { startedAt: string }[], hasNextPage: boolean, totalCount = 1000): PagedResult<{ startedAt: string }> => ({
    items, totalCount, page: 1, pageSize: items.length, totalPages: 10, hasNextPage, hasPreviousPage: false,
  });

  it("stops at the first page that reaches back past the period start", async () => {
    const calls: number[] = [];
    const res = await fetchSessionsSince(async (p) => {
      calls.push(p);
      return p === 1
        ? page([{ startedAt: "2026-10-25T10:00:00" }, { startedAt: "2026-10-25T01:00:00" }], true)
        : page([{ startedAt: "2026-10-25T00:30:00" }, { startedAt: "2026-10-24T22:00:00" }], true);
    }, "2026-10-25", { pageSize: 2 });
    expect(calls).toEqual([1, 2]);
    expect(res.items).toHaveLength(4);
    expect(res.capped).toBe(false);
  });

  it("stops when the list ends, and flags the cap", async () => {
    const short = await fetchSessionsSince(async () => page([{ startedAt: "2026-10-25T10:00:00" }], false, 1), "2026-10-01", { pageSize: 2 });
    expect(short.capped).toBe(false);
    const capped = await fetchSessionsSince(
      async () => page([{ startedAt: "2026-10-25T10:00:00" }, { startedAt: "2026-10-25T09:00:00" }], true),
      "2026-10-01",
      { pageSize: 2, maxPages: 3 },
    );
    expect(capped.items).toHaveLength(6);
    expect(capped.capped).toBe(true);
  });
});

describe("mapWithConcurrency", () => {
  it("never runs more than the limit at once and keeps the order", async () => {
    let running = 0;
    let peak = 0;
    const out = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5 * (8 - n)));
      running--;
      return n * 10;
    });
    expect(out).toEqual([10, 20, 30, 40, 50, 60, 70]);
    expect(peak).toBe(3);
  });
});

describe("format", () => {
  it("12-hour time with Arabic or English suffix, Western digits", () => {
    expect(fmtTime12("2026-10-12T14:37:00", true)).toBe("2:37 م");
    expect(fmtTime12("2026-10-12T00:05:00", false)).toBe("12:05 AM");
    expect(fmtTime12(null, true)).toBe("");
  });

  it("Levantine month names", () => {
    expect(fmtDay("2026-10-12", true)).toBe("الاثنين 12 تشرين الأول 2026");
    expect(fmtDay("2026-10-12", true, true)).toBe("12 تشرين الأول");
    expect(fmtDay("2026-10-12", false)).toBe("Mon, 12 Oct 2026");
  });
});
