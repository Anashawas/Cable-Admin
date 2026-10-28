import { describe, expect, it } from "vitest";
import {
  appendTier,
  breakEvenColor,
  marginVerdict,
  pointsFor,
  removeTier,
  validatePointsRule,
  validatePriceOption,
} from "./plan-rules";
import type { MarginCheckResult, PointsRule } from "../types/api";

const tiered: PointsRule = {
  mode: "Tiered",
  tiers: [
    { fromJod: 1, toJod: 3, points: 10 },
    { fromJod: 3, toJod: 5, points: 20 },
    { fromJod: 5, toJod: null, points: 40 },
  ],
};

describe("validatePointsRule", () => {
  it("accepts contiguous tiers ending open", () => {
    expect(validatePointsRule(tiered)).toBeNull();
  });

  it("flags gaps, overlaps and open middle tiers", () => {
    expect(validatePointsRule({ mode: "Tiered", tiers: [{ fromJod: 1, toJod: 3, points: 1 }, { fromJod: 4, toJod: null, points: 2 }] })?.key).toBe("tiersGap");
    expect(validatePointsRule({ mode: "Tiered", tiers: [{ fromJod: 1, toJod: 3, points: 1 }, { fromJod: 2, toJod: null, points: 2 }] })?.key).toBe("tiersOverlap");
    expect(validatePointsRule({ mode: "Tiered", tiers: [{ fromJod: 1, toJod: null, points: 1 }, { fromJod: 2, toJod: null, points: 2 }] })?.key).toBe("middleTierOpen");
    expect(validatePointsRule({ mode: "Tiered", tiers: [{ fromJod: 1, toJod: 3, points: 1 }] })?.key).toBe("lastTierOpen");
  });

  it("checks fixed points", () => {
    expect(validatePointsRule({ mode: "Fixed", fixedPoints: 0 })?.key).toBe("fixedPoints");
    expect(validatePointsRule({ mode: "Fixed", fixedPoints: 10 })).toBeNull();
  });
});

describe("tier editing", () => {
  it("appends an open tier and closes the previous one", () => {
    const next = appendTier(tiered.tiers!);
    expect(next).toHaveLength(4);
    expect(next[2].toJod).toBe(10);
    expect(next[3]).toMatchObject({ fromJod: 10, toJod: null });
    expect(validatePointsRule({ mode: "Tiered", tiers: next })).toBeNull();
  });

  it("removes a middle tier and keeps the rule contiguous", () => {
    const next = removeTier(tiered.tiers!, 1);
    expect(next).toEqual([
      { fromJod: 1, toJod: 5, points: 10 },
      { fromJod: 5, toJod: null, points: 40 },
    ]);
    expect(validatePointsRule({ mode: "Tiered", tiers: next })).toBeNull();
  });

  it("removes the last tier and re-opens the new last", () => {
    const next = removeTier(tiered.tiers!, 2);
    expect(next[1].toJod).toBeNull();
  });
});

describe("pointsFor", () => {
  it("uses the lower bound inside and the upper bound outside", () => {
    expect(pointsFor(tiered, 0.5)).toBe(0);
    expect(pointsFor(tiered, 3)).toBe(20);
    expect(pointsFor(tiered, 50)).toBe(40);
    expect(pointsFor({ mode: "Fixed", fixedPoints: 7 }, 1)).toBe(7);
  });
});

describe("validatePriceOption", () => {
  it("subscription options need months and no scans", () => {
    expect(validatePriceOption("Subscription", { months: 3, priceJod: 60, scans: null, unlimited: false })).toBeNull();
    expect(validatePriceOption("Subscription", { months: null, priceJod: 60, scans: null, unlimited: false })?.key).toBe("monthsRequired");
    expect(validatePriceOption("Subscription", { months: 1, priceJod: 60, scans: 10, unlimited: false })?.key).toBe("noScansOnSubscription");
  });

  it("loyalty options take scans and/or months; unlimited needs months", () => {
    expect(validatePriceOption("Loyalty", { months: null, priceJod: 40, scans: 400, unlimited: false })).toBeNull();
    expect(validatePriceOption("Loyalty", { months: 1, priceJod: 60, scans: null, unlimited: true })).toBeNull();
    expect(validatePriceOption("Loyalty", { months: null, priceJod: 60, scans: null, unlimited: true })?.key).toBe("unlimitedNeedsMonths");
    expect(validatePriceOption("Loyalty", { months: null, priceJod: 60, scans: null, unlimited: false })?.key).toBe("monthsOrScans");
  });
});

describe("margin helpers", () => {
  const result = (over: Partial<MarginCheckResult>): MarginCheckResult => ({
    avgPointsPerScan: 330,
    pointValueJod: 0.001,
    costPerScanJod: 0.33,
    pricePerScanJod: 0.4,
    breakEvenScans: 121,
    recommendedScans: 96,
    ok: true,
    targetMarginPercent: 20,
    mixSource: "manual",
    amountMix: [],
    ...over,
  });

  it("grades scans against recommended and break-even", () => {
    expect(marginVerdict(result({}), 90)).toBe("ok");
    expect(marginVerdict(result({}), 100)).toBe("warning");
    expect(marginVerdict(result({ ok: false }), 200)).toBe("loss");
    expect(marginVerdict(null, 1)).toBeNull();
  });

  it("maps the break-even state to a colour", () => {
    expect(breakEvenColor("ok")).toBe("success");
    expect(breakEvenColor("warning")).toBe("warning");
    expect(breakEvenColor("over")).toBe("error");
  });
});
