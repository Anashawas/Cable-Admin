/**
 * Jordan phone number helpers for building dial / WhatsApp links.
 *
 * Numbers are stored as "962XXXXXXXXX" (no +), which the SMS gateway expects.
 * A tel: link without the + is read by the dialer as a NATIONAL number, so
 * "tel:962791234567" fails to dial — these helpers add the + and repair the
 * legacy "07XXXXXXXX" and landline shapes still present in the data.
 *
 * Mirrors Cable.Core/Utilities/PhoneNumberUtility.cs on the backend.
 */

const COUNTRY_CODE = "962";
const MOBILE_PREFIXES = ["76", "77", "78", "79"];
const LANDLINE_AREA_CODES = ["2", "3", "5", "6"];

/** Folds Arabic-Indic (٠-٩) and Extended Arabic-Indic (۰-۹) digits to ASCII. */
const toAsciiDigits = (value: string): string =>
  value.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String((code - base));
  });

/** Strips prefixes/separators down to the bare national number. */
const toNationalDigits = (phone?: string | null): string | null => {
  if (!phone) return null;

  let digits = toAsciiDigits(phone).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith(`00${COUNTRY_CODE}`)) digits = digits.slice(2 + COUNTRY_CODE.length);
  else if (digits.startsWith(COUNTRY_CODE) && digits.length > COUNTRY_CODE.length)
    digits = digits.slice(COUNTRY_CODE.length);

  digits = digits.replace(/^0+/, "");

  return digits || null;
};

/**
 * Dial-ready E.164 number (+962XXXXXXXXX), or null when the value can't be
 * dialed (placeholders like "0"/"101010", truncated numbers) so callers can
 * hide the call action instead of rendering a link that errors.
 */
export const toCallableNumber = (phone?: string | null): string | null => {
  const digits = toNationalDigits(phone);
  if (!digits) return null;

  // Mobile: 9 digits, 7[6-9]XXXXXXX
  if (digits.length === 9 && MOBILE_PREFIXES.includes(digits.slice(0, 2)))
    return `+${COUNTRY_CODE}${digits}`;

  // Landline: area code + 7-digit subscriber (6 5885000 → +96265885000)
  if (digits.length === 8 && LANDLINE_AREA_CODES.includes(digits[0]))
    return `+${COUNTRY_CODE}${digits}`;

  return null;
};

/** `tel:` href, or null when the number isn't dialable. */
export const toTelHref = (phone?: string | null): string | null => {
  const callable = toCallableNumber(phone);
  return callable ? `tel:${callable}` : null;
};

/**
 * `wa.me` href. WhatsApp requires bare digits with the country code and no
 * leading + or 0, and only works on mobile numbers. Null when unusable.
 */
export const toWhatsAppHref = (phone?: string | null): string | null => {
  const digits = toNationalDigits(phone);
  if (!digits || digits.length !== 9 || !MOBILE_PREFIXES.includes(digits.slice(0, 2))) return null;
  return `https://wa.me/${COUNTRY_CODE}${digits}`;
};
