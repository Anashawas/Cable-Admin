/**
 * Text normalisation for client-side search across Arabic and English:
 * lower-case, strip Arabic diacritics/tatweel, unify alef/ta-marbuta/alef-maqsura
 * variants and convert Arabic-Indic / Persian digits to Western digits.
 */
export function normalizeSearchText(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .toLowerCase()
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "") // harakat, superscript alef, Quranic marks, tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\s+/g, " ")
    .trim();
}

/** Digits only, with the Jordanian country code / trunk zero dropped: "+962 7 9…" / "079…" → "79…". */
export function normalizePhoneDigits(raw: string | null | undefined): string {
  const digits = normalizeSearchText(raw).replace(/\D/g, "");
  return digits.replace(/^(00962|962|0)/, "");
}
