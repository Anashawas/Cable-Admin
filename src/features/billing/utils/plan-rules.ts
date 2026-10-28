import type { MarginCheckResult, PlanCategory, PointsRule, PointsTier } from "../types/api";

/** An error is an i18n key under `billing@rules.` with its interpolation values. */
export interface PlanRuleError {
  key: string;
  values?: Record<string, string | number>;
}

/**
 * Mirrors the server's PointsRuleValidator (§2b.5): the lower bound is inside a
 * tier and the upper bound outside it, tiers are contiguous with no gap or
 * overlap, only the last one is open-ended, points can't be negative, and a
 * fixed rule needs more than 0 points. Returns null when valid.
 */
export function validatePointsRule(rule: PointsRule | null | undefined): PlanRuleError | null {
  if (!rule) return { key: "ruleRequired" };
  if (rule.mode === "Fixed") {
    return rule.fixedPoints != null && rule.fixedPoints > 0 ? null : { key: "fixedPoints" };
  }
  const tiers = rule.tiers ?? [];
  if (tiers.length === 0) return { key: "tiersEmpty" };
  if (tiers[0].fromJod < 0) return { key: "firstTierNegative" };
  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];
    const n = i + 1;
    if (!Number.isFinite(tier.points) || tier.points < 0) return { key: "tierPointsNegative", values: { n } };
    const last = i === tiers.length - 1;
    if (last) {
      if (tier.toJod != null) return { key: "lastTierOpen" };
    } else {
      if (tier.toJod == null) return { key: "middleTierOpen", values: { n } };
      if (tier.toJod <= tier.fromJod) return { key: "tierToAboveFrom", values: { n } };
      const next = tiers[i + 1];
      if (next.fromJod < tier.toJod) return { key: "tiersOverlap", values: { a: n, b: n + 1 } };
      if (next.fromJod > tier.toJod) return { key: "tiersGap", values: { a: n, b: n + 1 } };
    }
  }
  return null;
}

/** Adds a tier after the last one: the old last tier gets an upper bound, the new one is open-ended. */
export function appendTier(tiers: PointsTier[]): PointsTier[] {
  if (tiers.length === 0) return [{ fromJod: 1, toJod: null, points: 10 }];
  const copy = tiers.map((t) => ({ ...t }));
  const last = copy[copy.length - 1];
  const to = last.toJod ?? Math.max(last.fromJod + 1, last.fromJod * 2);
  last.toJod = to;
  copy.push({ fromJod: to, toJod: null, points: last.points });
  return copy;
}

/** Removes a tier and re-joins its neighbours so the rule stays contiguous. */
export function removeTier(tiers: PointsTier[], index: number): PointsTier[] {
  const copy = tiers.filter((_, i) => i !== index).map((t) => ({ ...t }));
  if (copy.length === 0) return copy;
  if (index > 0 && index < tiers.length) {
    // The previous tier now ends where the removed one ended.
    copy[index - 1].toJod = index < copy.length ? copy[index].fromJod : null;
  }
  if (index === 0) copy[0].fromJod = tiers[0].fromJod;
  copy[copy.length - 1].toJod = null;
  return copy;
}

/** Points the rule gives for an amount (below the first tier → 0), for the live preview. */
export function pointsFor(rule: PointsRule | null | undefined, amountJod: number): number {
  if (!rule) return 0;
  if (rule.mode === "Fixed") return rule.fixedPoints ?? 0;
  const tier = (rule.tiers ?? []).find((t) => amountJod >= t.fromJod && (t.toJod == null || amountJod < t.toJod));
  return tier?.points ?? 0;
}

export interface PriceOptionDraft {
  id?: number | null;
  months: number | null;
  priceJod: number | null;
  scans: number | null;
  unlimited: boolean;
}

/**
 * Server rules for price options: subscription options need months 1–24 and
 * no scans; loyalty options need months and/or scans (no scans + months =
 * unlimited scanning for that period). Price ≥ 0.
 */
export function validatePriceOption(category: PlanCategory, o: PriceOptionDraft): PlanRuleError | null {
  if (o.priceJod == null || o.priceJod < 0) return { key: "priceRequired" };
  if (o.months != null && (o.months < 1 || o.months > 24 || !Number.isInteger(o.months))) return { key: "monthsRange" };
  if (category === "Subscription") {
    if (o.months == null) return { key: "monthsRequired" };
    if (o.scans != null) return { key: "noScansOnSubscription" };
    return null;
  }
  if (o.unlimited) return o.months == null ? { key: "unlimitedNeedsMonths" } : null;
  if (o.scans == null && o.months == null) return { key: "monthsOrScans" };
  if (o.scans == null) return { key: "scansRequired" };
  if (o.scans < 1 || !Number.isInteger(o.scans)) return { key: "scansPositive" };
  return null;
}

export const PLAN_KEY_PATTERN = /^[a-z0-9_]{2,50}$/;

/** Green / amber / red verdict of a margin check for an option. */
export type MarginVerdict = "ok" | "warning" | "loss";

/**
 * Red when the sold scans pass break-even (or the server says not ok),
 * amber when they pass the recommended count (below the target margin but not
 * a loss), green otherwise.
 */
export function marginVerdict(result: MarginCheckResult | null | undefined, scans: number | null | undefined): MarginVerdict | null {
  if (!result) return null;
  if (!result.ok) return "loss";
  if (scans != null && result.breakEvenScans != null && scans > result.breakEvenScans) return "loss";
  if (scans != null && result.recommendedScans != null && scans > result.recommendedScans) return "warning";
  return "ok";
}

/** Break-even meter colour from the server state (ok < 80%, warning, over > 100%). */
export function breakEvenColor(state: string | null | undefined): "success" | "warning" | "error" {
  if (state === "over") return "error";
  if (state === "warning") return "warning";
  return "success";
}

/**
 * "1 month · 20.000 JOD", "400 scans · 40.000 JOD", "1 month unlimited · 60.000 JOD".
 * "Unlimited scans" only means something on a loyalty plan; a subscription option has no scans at all.
 */
export function optionLabel(
  o: { months?: number | null; scans?: number | null; priceJod: number; isUnlimited?: boolean },
  t: (key: string, values?: Record<string, unknown>) => string,
  category?: string | null
): string {
  const parts: string[] = [];
  if (o.months != null) parts.push(t("billing@option.months", { count: o.months }));
  if (o.scans != null) parts.push(t("billing@option.scans", { count: o.scans }));
  if (o.isUnlimited && category !== "Subscription") parts.push(t("billing@option.unlimited"));
  parts.push(`${Number(o.priceJod).toFixed(3)} JOD`);
  return parts.join(" · ");
}
