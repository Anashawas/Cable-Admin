import { describe, expect, it } from "vitest";
import { budgetUsedPercent, normalizePublicCode, validatePromo, type PromoRuleInput } from "./promo-rules";

const base = (over: Partial<PromoRuleInput> = {}): PromoRuleInput => ({
  effectType: "DiscountPercent",
  effectValue: 100,
  maxDiscountJod: 5,
  cableSharePercent: 100,
  cableBudgetJod: 500,
  stationsScope: "None",
  stationIds: [],
  serviceProvidersScope: "Selected",
  serviceProviderIds: [7, 9],
  startsAt: "2026-11-01T00:00",
  endsAt: "2026-12-31T23:59",
  validDaysAfterClaim: 30,
  totalLimit: 1000,
  perUserLimit: 1,
  minAmountJod: null,
  codeMode: "Public",
  publicCode: "WASH100",
  ...over,
});

describe("validatePromo", () => {
  it("accepts the documented free-wash campaign", () => {
    expect(validatePromo(base())).toEqual({});
  });

  it("refuses All when the partner pays part of a discount", () => {
    const e = validatePromo(base({ cableSharePercent: 50, stationsScope: "All", serviceProvidersScope: "All" }));
    expect(e.stationsScope?.key).toBe("noAllWhenPartnerPays");
    expect(e.serviceProvidersScope?.key).toBe("noAllWhenPartnerPays");
  });

  it("allows All for points effects whatever the share", () => {
    const e = validatePromo(
      base({ effectType: "PointsMultiplier", effectValue: 2, cableSharePercent: 0, stationsScope: "All", serviceProvidersScope: "All", maxDiscountJod: null, cableBudgetJod: null })
    );
    expect(e).toEqual({});
  });

  it("needs a cap and a budget when Cable pays part of a percent discount", () => {
    const e = validatePromo(base({ maxDiscountJod: null, cableBudgetJod: null }));
    expect(e.maxDiscountJod?.key).toBe("capRequired");
    expect(e.cableBudgetJod?.key).toBe("budgetRequired");
  });

  it("does not need a budget when the partner pays it all", () => {
    const e = validatePromo(base({ cableSharePercent: 0, maxDiscountJod: null, cableBudgetJod: null }));
    expect(e.cableBudgetJod).toBeUndefined();
    expect(e.maxDiscountJod).toBeUndefined();
  });

  it("checks effect ranges", () => {
    expect(validatePromo(base({ effectValue: 0 })).effectValue?.key).toBe("percentRange");
    expect(validatePromo(base({ effectType: "PointsMultiplier", effectValue: 1 })).effectValue?.key).toBe("multiplierRange");
    expect(validatePromo(base({ effectType: "BonusPoints", effectValue: 2.5 })).effectValue?.key).toBe("bonusWhole");
    expect(validatePromo(base({ effectType: "DiscountFixed", effectValue: 0 })).effectValue?.key).toBe("fixedPositive");
  });

  it("needs at least one scope and selections", () => {
    expect(validatePromo(base({ serviceProvidersScope: "None" })).stationsScope?.key).toBe("pickScope");
    expect(validatePromo(base({ serviceProviderIds: [] })).serviceProviderIds?.key).toBe("pickProvider");
  });

  it("validates public codes like the server", () => {
    expect(validatePromo(base({ publicCode: "ab" })).publicCode?.key).toBe("publicCodeFormat");
    expect(validatePromo(base({ publicCode: "PRM123" })).publicCode?.key).toBe("publicCodeReserved");
    expect(validatePromo(base({ publicCode: "cable 20" })).publicCode).toBeUndefined();
    expect(validatePromo(base({ codeMode: "Unique", publicCode: null })).publicCode).toBeUndefined();
  });

  it("checks dates and limits", () => {
    expect(validatePromo(base({ endsAt: "2026-10-01T00:00" })).endsAt?.key).toBe("endsBeforeStart");
    expect(validatePromo(base({ validDaysAfterClaim: 400 })).validDaysAfterClaim?.key).toBe("validDaysRange");
    expect(validatePromo(base({ perUserLimit: 0 })).perUserLimit?.key).toBe("perUserRange");
  });
});

describe("helpers", () => {
  it("normalizes public codes", () => {
    expect(normalizePublicCode("cable-20 x")).toBe("CABLE20X");
  });

  it("computes the budget used share", () => {
    expect(budgetUsedPercent(50, 12.5)).toBe(25);
    expect(budgetUsedPercent(null, 3)).toBeNull();
    expect(budgetUsedPercent(10, 20)).toBe(100);
  });
});
