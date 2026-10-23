import type { OcppChargeLimitKind } from "../types/api";

/** Mirrors OcppChargeLimit.Range on the API: something worth a session, at most more than any car takes. */
export const CHARGE_LIMIT_RANGES: Record<OcppChargeLimitKind, { min: number; max: number; step: number }> = {
  Jod: { min: 0.5, max: 200, step: 0.5 },
  Kwh: { min: 1, max: 300, step: 1 },
  Soc: { min: 10, max: 100, step: 5 },
};

export const CHARGE_LIMIT_KINDS: OcppChargeLimitKind[] = ["Jod", "Kwh", "Soc"];

export type ChargeLimitError = "required" | "range" | "integer";

/** ok: kind + value to send (both null = no limit). Not ok: why, with the range for the message. */
export interface ChargeLimitCheck {
  ok: boolean;
  kind: OcppChargeLimitKind | null;
  value: number | null;
  error?: ChargeLimitError;
  min?: number;
  max?: number;
}

/**
 * Client-side check of a "Stop at …" choice before it is sent. kind "" / null = no limit (always valid).
 * The value comes straight from the text field; "," is accepted as the decimal separator.
 */
export function checkChargeLimit(kind: OcppChargeLimitKind | "" | null | undefined, raw: string | number | null | undefined): ChargeLimitCheck {
  if (!kind) return { ok: true, kind: null, value: null };
  const { min, max } = CHARGE_LIMIT_RANGES[kind];
  const fail = (error: ChargeLimitError): ChargeLimitCheck => ({ ok: false, kind, value: null, error, min, max });
  const text = raw == null ? "" : String(raw).trim().replace(",", ".");
  if (text === "") return fail("required");
  const value = Number(text);
  if (!Number.isFinite(value)) return fail("required");
  if (kind === "Soc" && !Number.isInteger(value)) return fail("integer");
  if (value < min || value > max) return fail("range");
  // Same rounding as the API: whole % for the battery, 3 decimals otherwise.
  return { ok: true, kind, value: kind === "Soc" ? value : Math.round(value * 1000) / 1000 };
}
