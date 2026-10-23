import { describe, expect, it } from "vitest";
import { checkChargeLimit } from "./charge-limit";

describe("checkChargeLimit", () => {
  it("accepts no limit", () => {
    expect(checkChargeLimit("", "")).toEqual({ ok: true, kind: null, value: null });
    expect(checkChargeLimit(null, "12")).toEqual({ ok: true, kind: null, value: null });
  });

  it("requires a value once a kind is chosen", () => {
    expect(checkChargeLimit("Jod", "")).toMatchObject({ ok: false, error: "required" });
    expect(checkChargeLimit("Kwh", "abc")).toMatchObject({ ok: false, error: "required" });
  });

  it("enforces the API ranges at their edges", () => {
    expect(checkChargeLimit("Jod", "0.5")).toMatchObject({ ok: true, kind: "Jod", value: 0.5 });
    expect(checkChargeLimit("Jod", "200")).toMatchObject({ ok: true, value: 200 });
    expect(checkChargeLimit("Jod", "0.49")).toMatchObject({ ok: false, error: "range", min: 0.5, max: 200 });
    expect(checkChargeLimit("Jod", "200.01")).toMatchObject({ ok: false, error: "range" });
    expect(checkChargeLimit("Kwh", "1")).toMatchObject({ ok: true, value: 1 });
    expect(checkChargeLimit("Kwh", "301")).toMatchObject({ ok: false, error: "range", min: 1, max: 300 });
    expect(checkChargeLimit("Soc", "10")).toMatchObject({ ok: true, value: 10 });
    expect(checkChargeLimit("Soc", "100")).toMatchObject({ ok: true, value: 100 });
    expect(checkChargeLimit("Soc", "9")).toMatchObject({ ok: false, error: "range", min: 10, max: 100 });
  });

  it("wants a whole battery %", () => {
    expect(checkChargeLimit("Soc", "80.5")).toMatchObject({ ok: false, error: "integer" });
  });

  it("accepts a comma decimal and rounds to 3 decimals like the API", () => {
    expect(checkChargeLimit("Jod", "7,5")).toMatchObject({ ok: true, value: 7.5 });
    expect(checkChargeLimit("Kwh", "12.34567")).toMatchObject({ ok: true, value: 12.346 });
    expect(checkChargeLimit("Jod", 7)).toMatchObject({ ok: true, value: 7 });
  });
});
