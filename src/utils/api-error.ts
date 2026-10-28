/**
 * The API answers errors with RFC 7807 problem details: `detail` is already
 * localized through Accept-Language, 409 / 422 add a machine `code`, and 400
 * validation problems carry an `errors` dictionary. Show `detail` first, then
 * the field messages, then whatever else the response has.
 */
export function apiErrorMessage(err: any, fallback: string): string {
  const d = err?.response?.data;
  if (typeof d === "string" && d.trim()) return d;
  if (d && typeof d === "object") {
    const fromErrors =
      d.errors && typeof d.errors === "object"
        ? Object.values(d.errors as Record<string, unknown>).flat().filter(Boolean).join(" · ")
        : "";
    return d.detail || fromErrors || d.title || d.message || err?.message || fallback;
  }
  return err?.message || fallback;
}

/** The machine code of a 409 / 422 problem (`ORDER_NOT_PENDING`, `INVALID_TIERS`, …). */
export function apiErrorCode(err: any): string | null {
  const code = err?.response?.data?.code;
  return typeof code === "string" && code ? code : null;
}

/** Field → messages of a 400 validation problem, keys lower-camel-cased to match the form. */
export function apiFieldErrors(err: any): Record<string, string> {
  const errors = err?.response?.data?.errors;
  if (!errors || typeof errors !== "object") return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
    const field = key.replace(/^Input\./i, "");
    const camel = field.charAt(0).toLowerCase() + field.slice(1);
    const msg = Array.isArray(value) ? value.filter(Boolean).join(" · ") : String(value ?? "");
    if (msg) out[camel] = msg;
  }
  return out;
}

/** "12.500 JOD" — money is always shown with 3 decimals (fils). */
export function fmtJod(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return `${Number(value).toFixed(3)} JOD`;
}

/** Saves a blob (CSV export, PDF) under the given file name. */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** "2026-12-31T23:59:00" → "2026-12-31T23:59" for a datetime-local input (API dates are Jordan local time). */
export function toDateTimeInput(value?: string | null): string {
  if (!value) return "";
  return value.length >= 16 ? value.slice(0, 16) : value;
}

/** datetime-local value → naive Jordan time for the API (no offset, so the server reads it as Jordan time). */
export function fromDateTimeInput(value?: string | null): string | null {
  if (!value) return null;
  return value.length === 16 ? `${value}:00` : value;
}
