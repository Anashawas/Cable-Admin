import { describe, expect, it } from "vitest";
import type { ConnectorReportGroupDto, TouWindowDto } from "../types/live-charging";
import {
  NO_SESSION_FILTERS, carNameOf, checkTariffWindows, fileNameFromDisposition, filtersActive, filtersFromSearch, filtersToQuery,
  filtersToSearch, fmtJod, fromClock, nextDay, plugKey, plugReportStats, problemOf, problemOfError, sessionWho, sessionsParams,
  stationReportSummaries, toClock,
} from "./live-charging";

describe("sessionsParams", () => {
  it("drops empty strings, nulls and trims the search", () => {
    expect(sessionsParams({ from: "", to: undefined, chargingPointId: null, source: "", status: "open", q: "  #72 ", page: 2, pageSize: 20 }))
      .toEqual({ status: "open", q: "#72", page: 2, pageSize: 20 });
  });
  it("keeps ids and the limit filter", () => {
    expect(sessionsParams({ chargingPointId: 37, chargerId: 8, userId: 13795, limitKind: "none", source: "Sticker" }))
      .toEqual({ chargingPointId: 37, chargerId: 8, userId: 13795, limitKind: "none", source: "Sticker" });
  });
});

describe("URL filters", () => {
  it("round-trips through the query string", () => {
    const f = { ...NO_SESSION_FILTERS, from: "2026-10-01", to: "2026-10-28", station: 37, charger: 8, user: 5, source: "Sticker" as const, status: "closed" as const, limit: "Jod" as const, q: "079" };
    expect(filtersFromSearch(filtersToSearch(f))).toEqual(f);
  });
  it("ignores unknown or malformed values", () => {
    const f = filtersFromSearch(new URLSearchParams("station=abc&user=-3&source=Bus&status=x&limit=Watt&from=28-10-2026"));
    expect(f).toEqual(NO_SESSION_FILTERS);
    expect(filtersActive(f)).toBe(false);
  });
  it("sends the whole last day: to = the next day at midnight", () => {
    const q = filtersToQuery({ ...NO_SESSION_FILTERS, from: "2026-10-01", to: "2026-10-31" }, 1, 20);
    expect(q.from).toBe("2026-10-01T00:00:00");
    expect(q.to).toBe("2026-11-01T00:00:00");
    expect(q.page).toBe(1);
  });
  it("nextDay crosses months and years", () => {
    expect(nextDay("2026-02-28")).toBe("2026-03-01");
    expect(nextDay("2026-12-31")).toBe("2027-01-01");
  });
});

describe("sessionWho", () => {
  it("prefers the driver, then staff, then the card", () => {
    expect(sessionWho({ driver: { userId: 1, name: "محمد", phone: "+962791234967" }, startedByStaff: null, cardLabel: null, idTag: "CBL-U1" }))
      .toEqual({ kind: "driver", userId: 1, name: "محمد", phone: "+962791234967" });
    expect(sessionWho({ driver: null, startedByStaff: { userId: 2, name: null }, cardLabel: null, idTag: "x" }).kind).toBe("staff");
    expect(sessionWho({ driver: null, startedByStaff: null, cardLabel: "Fleet X", idTag: "04A2" })).toEqual({ kind: "card", label: "Fleet X", idTag: "04A2" });
    expect(sessionWho({ driver: null, startedByStaff: null, cardLabel: null, idTag: "" }).kind).toBe("none");
  });
  it("names a nameless person by id", () => {
    const w = sessionWho({ driver: { userId: 9, name: "  " }, idTag: "" });
    expect(w.kind === "driver" && w.name).toBe("#9");
  });
  it("car name from either field", () => {
    expect(carNameOf({ car: { name: "Hyundai Ioniq 5" } })).toBe("Hyundai Ioniq 5");
    expect(carNameOf({ carName: "BYD Atto 3" })).toBe("BYD Atto 3");
    expect(carNameOf({})).toBeNull();
  });
});

const group = (over: Partial<ConnectorReportGroupDto>): ConnectorReportGroupDto => ({
  chargingPointId: 37, stationName: "S", chargerId: 8, chargerName: "A", chargePointId: "SIM-A", connectorId: 1,
  openReports: 1, reportsToday: 1, totalReports: 1, suspectedIssue: false, lastReportAt: "2026-10-28T10:00:00",
  lastReason: "Rejected", lastCommandResult: null, latest: [], ...over,
});

describe("plug reports", () => {
  it("indexes groups by charger and plug", () => {
    const m = plugReportStats([group({ connectorId: 2, openReports: 3, suspectedIssue: true })]);
    expect(m.get(plugKey(8, 2))).toMatchObject({ openReports: 3, suspectedIssue: true });
    expect(m.get(plugKey(8, 1))).toBeUndefined();
  });
  it("sums per station and counts suspected plugs", () => {
    const m = stationReportSummaries([
      group({ connectorId: 1, openReports: 3, suspectedIssue: true }),
      group({ connectorId: 2, openReports: 1 }),
      group({ chargingPointId: 40, openReports: 2 }),
    ]);
    expect(m.get(37)).toEqual({ openReports: 4, suspectedPlugs: 1 });
    expect(m.get(40)).toEqual({ openReports: 2, suspectedPlugs: 0 });
  });
});

const w = (key: string, startMin: number, endMin: number, priceFils = 150, tier: TouWindowDto["tier"] = "partial"): TouWindowDto =>
  ({ key, startMin, endMin, tier, priceFils, nameEn: key, nameAr: key });

describe("checkTariffWindows", () => {
  it("accepts 24 h of valid windows (one crossing midnight)", () => {
    const r = checkTariffWindows([w("offPeak", 300, 1020, 175, "offPeak"), w("peak", 1020, 1380, 213, "peak"), w("night", 1380, 1740, 160)]);
    expect(r).toEqual({ ok: true, coverage: 1440, duplicateKeys: false, invalidRows: [] });
  });
  it("flags coverage, duplicate keys and bad rows", () => {
    const r = checkTariffWindows([w("a", 0, 600), w("a", 600, 1200, 0), w("", 1200, 1200)]);
    expect(r.ok).toBe(false);
    expect(r.coverage).toBe(1200);
    expect(r.duplicateKeys).toBe(true);
    expect(r.invalidRows).toEqual([1, 2]);
  });
  it("rejects an empty list and prices out of 1–9999", () => {
    expect(checkTariffWindows([]).ok).toBe(false);
    expect(checkTariffWindows([w("all", 0, 1440, 10000)]).invalidRows).toEqual([0]);
  });
  it("clock helpers", () => {
    expect(toClock(1020)).toBe("17:00");
    expect(toClock(1740)).toBe("05:00");
    expect(fromClock("05:30")).toBe(330);
  });
});

describe("problem details", () => {
  it("reads detail and code", () => {
    expect(problemOf({ detail: "لازم تكون عند المحطة", code: "TOO_FAR_FROM_STATION" }, 422))
      .toEqual({ detail: "لازم تكون عند المحطة", code: "TOO_FAR_FROM_STATION", status: 422 });
    expect(problemOf({ title: "Not found" }).detail).toBe("Not found");
    expect(problemOf(null, 500)).toEqual({ status: 500 });
  });
  it("reads a JSON body that came back as a Blob (downloads)", async () => {
    const blob = new Blob([JSON.stringify({ detail: "Session still running", code: "SESSION_OPEN" })], { type: "application/problem+json" });
    await expect(problemOfError({ response: { status: 422, data: blob } })).resolves.toEqual({ detail: "Session still running", code: "SESSION_OPEN", status: 422 });
  });
  it("survives a non-JSON blob and no response", async () => {
    await expect(problemOfError({ response: { status: 500, data: new Blob(["<html>"]) } })).resolves.toEqual({ status: 500 });
    await expect(problemOfError(new Error("network"))).resolves.toEqual({});
  });
});

describe("downloads and money", () => {
  it("file name from Content-Disposition", () => {
    expect(fileNameFromDisposition("attachment; filename=receipt.pdf; filename*=UTF-8''CHS-2026-000072.pdf", "x.pdf")).toBe("CHS-2026-000072.pdf");
    expect(fileNameFromDisposition('attachment; filename="stickers-station-37.pdf"', "x.pdf")).toBe("stickers-station-37.pdf");
    expect(fileNameFromDisposition(undefined, "x.pdf")).toBe("x.pdf");
  });
  it("JOD with 3 decimals", () => {
    expect(fmtJod(2.336)).toBe("2.336 JOD");
    expect(fmtJod(1234.5)).toBe("1,234.500 JOD");
    expect(fmtJod(null)).toBe("—");
  });
});
