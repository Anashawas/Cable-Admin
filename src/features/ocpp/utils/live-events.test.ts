import { afterEach, describe, expect, it, vi } from "vitest";
import type { QueryKey } from "@tanstack/react-query";
import type { OcppLiveEvent } from "../types/api";
import { createInvalidationBatcher, ocppHubUrl, ocppRetryDelayMs, queryKeysForLiveEvent } from "./live-events";

const ev = (over: Partial<OcppLiveEvent>): OcppLiveEvent => ({
  type: "connector", chargingPointId: 5, chargerId: 12, connectorId: 1, transactionId: null, status: "Charging", at: "2026-10-20T10:00:00Z", ...over,
});

describe("queryKeysForLiveEvent", () => {
  it("a connector change refreshes the fleet, the charger and its commands", () => {
    expect(queryKeysForLiveEvent(ev({}))).toEqual([
      ["ocpp", "fleet-health"], ["ocpp", "charge-points"], ["ocpp", "charge-point", 12], ["ocpp", "commands", 12],
    ]);
  });

  it("a fault also refreshes the alerts", () => {
    expect(queryKeysForLiveEvent(ev({ status: "Faulted" }))).toContainEqual(["ocpp", "alerts"]);
    expect(queryKeysForLiveEvent(ev({ status: "Available" }))).not.toContainEqual(["ocpp", "alerts"]);
  });

  it("a meter reading touches only the charger and its session", () => {
    expect(queryKeysForLiveEvent(ev({ type: "session", status: "updated", transactionId: 99 }))).toEqual([
      ["ocpp", "charge-point", 12], ["ocpp", "session-live", 99],
    ]);
  });

  it("start / stop / limit-reached refresh the lists too", () => {
    for (const status of ["started", "stopped", "limit-reached"]) {
      const keys = queryKeysForLiveEvent(ev({ type: "session", status, transactionId: 99 }));
      expect(keys).toContainEqual(["ocpp", "fleet-health"]);
      expect(keys).toContainEqual(["ocpp", "charge-points"]);
      expect(keys).toContainEqual(["ocpp", "session-live", 99]);
    }
  });

  it("charger online / offline refreshes fleet and charger; unknown hints nothing", () => {
    expect(queryKeysForLiveEvent(ev({ type: "charger", status: "offline", connectorId: null }))).toEqual([
      ["ocpp", "fleet-health"], ["ocpp", "charge-points"], ["ocpp", "charge-point", 12], ["ocpp", "commands", 12],
    ]);
    expect(queryKeysForLiveEvent({ type: "something" as OcppLiveEvent["type"], chargerId: 1 })).toEqual([]);
    expect(queryKeysForLiveEvent(null)).toEqual([]);
  });

  it("is case-insensitive", () => {
    expect(queryKeysForLiveEvent(ev({ type: "SESSION" as OcppLiveEvent["type"], status: "Updated", transactionId: 3 }))).toEqual([
      ["ocpp", "charge-point", 12], ["ocpp", "session-live", 3],
    ]);
  });
});

describe("createInvalidationBatcher", () => {
  afterEach(() => vi.useRealTimers());

  it("flushes each distinct key once per window", () => {
    vi.useFakeTimers();
    const flushed: QueryKey[] = [];
    const b = createInvalidationBatcher((k) => flushed.push(k), 400);
    b.add([["ocpp", "charge-point", 1], ["ocpp", "fleet-health"]]);
    vi.advanceTimersByTime(200);
    b.add([["ocpp", "charge-point", 1], ["ocpp", "charge-point", 2]]);
    expect(flushed).toEqual([]);
    vi.advanceTimersByTime(200);
    expect(flushed).toEqual([["ocpp", "charge-point", 1], ["ocpp", "fleet-health"], ["ocpp", "charge-point", 2]]);
    b.add([["ocpp", "charge-point", 1]]);
    vi.advanceTimersByTime(400);
    expect(flushed).toHaveLength(4);
  });

  it("cancel drops what is pending", () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const b = createInvalidationBatcher(flush, 400);
    b.add([["ocpp", "alerts"]]);
    b.cancel();
    vi.advanceTimersByTime(1_000);
    expect(flush).not.toHaveBeenCalled();
  });
});

describe("ocppRetryDelayMs", () => {
  it("backs off then retries every 30 s forever", () => {
    expect([0, 1, 2, 3, 4, 50, 1_000].map(ocppRetryDelayMs)).toEqual([0, 2_000, 5_000, 10_000, 30_000, 30_000, 30_000]);
  });
});

describe("ocppHubUrl", () => {
  it("joins the API base like axios", () => {
    expect(ocppHubUrl("https://cable-app.com/", "https://admin.cable-app.com/cable-connect")).toBe("https://cable-app.com/hubs/ocpp");
    expect(ocppHubUrl("http://dev.cable-app.com", "http://127.0.0.1:3000/")).toBe("http://dev.cable-app.com/hubs/ocpp");
    expect(ocppHubUrl("/", "https://dev.cable-app.com/admin/cable-connect")).toBe("https://dev.cable-app.com/hubs/ocpp");
  });
});
