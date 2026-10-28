import type { PromoCodeMode, PromoEffectType, PromoTargetScope } from "../types/api";

/** The form values the rules look at (numbers already parsed; null = empty). */
export interface PromoRuleInput {
  effectType: PromoEffectType;
  effectValue: number | null;
  maxDiscountJod: number | null;
  cableSharePercent: number | null;
  cableBudgetJod: number | null;
  stationsScope: PromoTargetScope;
  stationIds: number[];
  serviceProvidersScope: PromoTargetScope;
  serviceProviderIds: number[];
  startsAt: string | null;
  endsAt: string | null;
  validDaysAfterClaim: number | null;
  totalLimit: number | null;
  perUserLimit: number | null;
  minAmountJod: number | null;
  codeMode: PromoCodeMode;
  publicCode: string | null;
}

/** An error is an i18n key under `promos@rules.` (plus interpolation values). */
export interface RuleError {
  key: string;
  values?: Record<string, string | number>;
}

export const isDiscount = (type: PromoEffectType) => type === "DiscountPercent" || type === "DiscountFixed";

/** Spaces and dashes are ignored, letters upper-cased — the same normalisation as the server. */
export const normalizePublicCode = (code: string | null | undefined) =>
  (code ?? "").replace(/[\s-]+/g, "").toUpperCase();

const RESERVED_PREFIXES = ["PRM", "PTR", "GFT", "CBL"];

/**
 * Mirrors the server's PromoRules.Validate so the admin sees every rule before
 * saving; the server stays the authority (its 400 field errors are shown too).
 * Key rule: when the partner carries part of a discount (Cable share < 100) the
 * stations and providers scopes can't be All.
 */
export function validatePromo(v: PromoRuleInput): Record<string, RuleError> {
  const e: Record<string, RuleError> = {};
  const value = v.effectValue;

  if (value == null) e.effectValue = { key: "required" };
  else {
    switch (v.effectType) {
      case "DiscountPercent":
        if (value < 1 || value > 100) e.effectValue = { key: "percentRange" };
        break;
      case "DiscountFixed":
        if (value <= 0) e.effectValue = { key: "fixedPositive" };
        break;
      case "PointsMultiplier":
        if (value <= 1 || value > 10) e.effectValue = { key: "multiplierRange" };
        break;
      case "BonusPoints":
        if (value < 1 || !Number.isInteger(value)) e.effectValue = { key: "bonusWhole" };
        break;
    }
  }

  const share = v.cableSharePercent;
  if (share == null || share < 0 || share > 100) e.cableSharePercent = { key: "shareRange" };
  if (v.maxDiscountJod != null && v.maxDiscountJod <= 0) e.maxDiscountJod = { key: "capPositive" };
  if (v.cableBudgetJod != null && v.cableBudgetJod <= 0) e.cableBudgetJod = { key: "budgetPositive" };
  if (v.minAmountJod != null && v.minAmountJod < 0) e.minAmountJod = { key: "minAmountNegative" };

  if (isDiscount(v.effectType) && share != null && share > 0) {
    if (v.cableBudgetJod == null) e.cableBudgetJod = { key: "budgetRequired" };
    if (v.effectType === "DiscountPercent" && v.maxDiscountJod == null) e.maxDiscountJod = { key: "capRequired" };
  }

  if (isDiscount(v.effectType) && share != null && share < 100) {
    if (v.stationsScope === "All") e.stationsScope = { key: "noAllWhenPartnerPays" };
    if (v.serviceProvidersScope === "All") e.serviceProvidersScope = { key: "noAllWhenPartnerPays" };
  }

  if (v.stationsScope === "None" && v.serviceProvidersScope === "None") e.stationsScope = { key: "pickScope" };
  if (v.stationsScope === "Selected" && v.stationIds.length === 0) e.stationIds = { key: "pickStation" };
  if (v.serviceProvidersScope === "Selected" && v.serviceProviderIds.length === 0)
    e.serviceProviderIds = { key: "pickProvider" };

  if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) e.endsAt = { key: "endsBeforeStart" };
  if (v.validDaysAfterClaim != null && (v.validDaysAfterClaim < 1 || v.validDaysAfterClaim > 365))
    e.validDaysAfterClaim = { key: "validDaysRange" };
  if (v.totalLimit != null && v.totalLimit < 1) e.totalLimit = { key: "totalLimitMin" };
  if (v.perUserLimit != null && (v.perUserLimit < 1 || v.perUserLimit > 100)) e.perUserLimit = { key: "perUserRange" };

  if (v.codeMode === "Public") {
    const code = normalizePublicCode(v.publicCode);
    if (code.length < 3 || code.length > 30 || !/^[A-Z0-9]+$/.test(code)) e.publicCode = { key: "publicCodeFormat" };
    else if (RESERVED_PREFIXES.some((p) => code.startsWith(p))) e.publicCode = { key: "publicCodeReserved" };
  }

  return e;
}

/** "−20%", "−2.000 JOD", "×2 points", "+50 points" — a short label for tables. */
export function effectSummary(
  type: PromoEffectType,
  value: number,
  maxDiscountJod: number | null | undefined,
  t: (key: string, values?: Record<string, unknown>) => string
): string {
  switch (type) {
    case "DiscountPercent":
      return maxDiscountJod != null
        ? t("promos@effectShort.percentCapped", { value, cap: Number(maxDiscountJod).toFixed(3) })
        : t("promos@effectShort.percent", { value });
    case "DiscountFixed":
      return t("promos@effectShort.fixed", { value: Number(value).toFixed(3) });
    case "PointsMultiplier":
      return t("promos@effectShort.multiplier", { value });
    case "BonusPoints":
      return t("promos@effectShort.bonus", { value });
    default:
      return String(value);
  }
}

/** Share of the budget used, 0–100 (null when there is no budget). */
export function budgetUsedPercent(budget: number | null | undefined, spent: number): number | null {
  if (budget == null || budget <= 0) return null;
  return Math.min(100, Math.max(0, (spent / budget) * 100));
}
