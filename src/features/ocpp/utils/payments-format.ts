import { format } from "date-fns";
import type { TFunction } from "i18next";
import { parseApiDate } from "../../../utils/date-format";
import type { OcppStationSessionDto } from "../types/api";
import { parseDay } from "./payments";

/**
 * Display helpers of the Charging revenue page (from the partner web's format.ts):
 * Levantine month names, Western digits, 12-hour clock.
 */

const AR_MONTHS = [
  "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
  "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
];
const AR_WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

const readDay = (value: string): Date | null => parseDay(value) ?? parseApiDate(value);

/**
 * A calendar day ("YYYY-MM-DD" or a date-time): "الاثنين 12 تشرين الأول 2026" in Arabic,
 * "Mon, 12 Oct 2026" otherwise. `short` drops the weekday and the year.
 */
export const fmtDay = (value: string, ar: boolean, short = false): string => {
  const d = readDay(value);
  if (!d) return "—";
  if (ar) return short ? `${d.getDate()} ${AR_MONTHS[d.getMonth()]}` : `${AR_WEEKDAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return format(d, short ? "d MMM" : "EEE, d MMM yyyy");
};

/** "2:37 م" in Arabic, "2:37 PM" otherwise — 12-hour clock, Western digits. */
export const fmtTime12 = (value: string | null | undefined, ar: boolean): string => {
  const d = parseApiDate(value);
  if (!d) return "";
  const h = d.getHours() % 12 || 12;
  const suffix = d.getHours() < 12 ? (ar ? "ص" : "AM") : ar ? "م" : "PM";
  return `${h}:${String(d.getMinutes()).padStart(2, "0")} ${suffix}`;
};

/** "< 1 min", "12 min", "1 h 5 min" — wording from i18n. */
export const fmtDurationLong = (sec: number | null | undefined, t: TFunction): string => {
  if (sec == null || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return t("ocpp@payments.duration.hm", { h, m });
  if (m < 1) return t("ocpp@payments.duration.lessThanMin");
  return t("ocpp@payments.duration.min", { m });
};

/** Why a session ended, in the UI language: the server's own text (Arabic when it has one), else the OCPP code. */
export const stopReasonLabel = (s: Pick<OcppStationSessionDto, "stopReason" | "stopReasonText" | "stopReasonTextAr">, ar: boolean): string =>
  (ar ? s.stopReasonTextAr : null) || s.stopReasonText || s.stopReason || "—";

/** 1.234 → "1.234" with grouping, fixed digits, Western digits. */
export const fmtNum = (v: number, digits = 3): string =>
  v.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
