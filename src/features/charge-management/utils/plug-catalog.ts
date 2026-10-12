/**
 * EV plug/connector catalogue for the admin UI.
 *
 * Mirrors `cable_partner/lib/core/constants/plug_icons.dart` (and the consumer
 * app's plug_type_constants.dart) so admins see the same wording drivers and
 * providers see. Ids 14–23 come straight from the API — keep them in sync.
 * Icons live in `public/images/plugs/`.
 */

export interface PlugCatalogEntry {
  id: number;
  nameEn: string;
  nameAr: string;
  /** Short connector family, e.g. "أوروبي" / "Euro". */
  familyEn: string;
  familyAr: string;
  icon: string;
  serialNumber: string;
  isFastCharging: boolean;
  chargingType: "AC" | "DC";
  /** Lower-case fragments matched against serial number / name when the id is unknown. */
  patterns: string[];
}

const ICON = (file: string) => `/images/plugs/${file}`;

export const PLUG_CATALOG: PlugCatalogEntry[] = [
  // ── Slow charging (AC) ──
  { id: 14, nameEn: "Chinese Slow Charge", nameAr: "شحن صيني بطيء", familyEn: "Chinese", familyAr: "صيني", icon: ICON("AC_GBT.png"), serialNumber: "AC GB/T", isFastCharging: false, chargingType: "AC", patterns: ["ac gb/t", "ac gbt", "gb/t ac"] },
  { id: 20, nameEn: "Korean Slow Charge", nameAr: "شحن كوري بطيء", familyEn: "Korean", familyAr: "كوري", icon: ICON("AC_TYPE1.png"), serialNumber: "AC TYPE 1", isFastCharging: false, chargingType: "AC", patterns: ["ac type 1", "ac type1", "type 1", "j1772"] },
  // id 23 sits before 21 so its longer "type 2 fast" patterns win the pattern pass.
  { id: 23, nameEn: "Type 2 AC (Fast)", nameAr: "تايب 2 سريع", familyEn: "Euro", familyAr: "أوروبي", icon: ICON("AC_TYPE2.png"), serialNumber: "AC TYPE 2 FAST", isFastCharging: true, chargingType: "AC", patterns: ["ac type 2 fast", "ac type2 fast", "type 2 fast", "type2 fast"] },
  { id: 21, nameEn: "EURO Slow Charge", nameAr: "شحن أوروبي بطيء", familyEn: "Euro", familyAr: "أوروبي", icon: ICON("AC_TYPE2.png"), serialNumber: "AC TYPE 2", isFastCharging: false, chargingType: "AC", patterns: ["ac type 2", "ac type2", "type 2", "mennekes"] },
  { id: 22, nameEn: "Japanese Slow Charge", nameAr: "شحن ياباني بطيء", familyEn: "Japanese", familyAr: "ياباني", icon: ICON("CHADEMO.png"), serialNumber: "Chademo Slow", isFastCharging: false, chargingType: "AC", patterns: ["chademo slow", "chademo ac", "japanese slow"] },
  // ── Fast charging (DC) ──
  { id: 15, nameEn: "Chinese Fast Charge", nameAr: "شحن صيني سريع", familyEn: "Chinese", familyAr: "صيني", icon: ICON("DC_GBT.png"), serialNumber: "DC GB/T", isFastCharging: true, chargingType: "DC", patterns: ["dc gb/t", "dc gbt", "gb/t dc"] },
  { id: 16, nameEn: "Korean Fast Charge", nameAr: "شحن كوري سريع", familyEn: "Korean", familyAr: "كوري", icon: ICON("CCS1.png"), serialNumber: "CCS 1", isFastCharging: true, chargingType: "DC", patterns: ["ccs 1", "ccs1", "combo 1"] },
  { id: 17, nameEn: "EURO Fast Charge", nameAr: "شحن أوروبي سريع", familyEn: "Euro", familyAr: "أوروبي", icon: ICON("CCS2.png"), serialNumber: "CCS 2", isFastCharging: true, chargingType: "DC", patterns: ["ccs 2", "ccs2", "combo 2"] },
  { id: 18, nameEn: "Japanese Fast Charge", nameAr: "شحن ياباني سريع", familyEn: "Japanese", familyAr: "ياباني", icon: ICON("CHADEMO.png"), serialNumber: "Chademo", isFastCharging: true, chargingType: "DC", patterns: ["chademo", "cha de mo"] },
  { id: 19, nameEn: "Tesla Charge", nameAr: "شحن تسلا", familyEn: "Tesla", familyAr: "تسلا", icon: ICON("Tesla.png"), serialNumber: "Tesla Super Charge", isFastCharging: true, chargingType: "DC", patterns: ["tesla super charge", "tesla", "supercharger"] },
];

const BY_ID = new Map(PLUG_CATALOG.map((p) => [p.id, p]));

/**
 * Resolve a plug by id first, then by exact serial number, then by pattern —
 * exact serials go before patterns so "AC TYPE 2 FAST" resolves to 23, not 21.
 */
export function resolvePlug(plug: { id?: number | null; serialNumber?: string | null; name?: string | null }): PlugCatalogEntry | null {
  if (plug.id != null) {
    const byId = BY_ID.get(plug.id);
    if (byId) return byId;
  }
  const serial = (plug.serialNumber ?? "").trim().toLowerCase();
  if (serial) {
    const exact = PLUG_CATALOG.find((p) => p.serialNumber.toLowerCase() === serial);
    if (exact) return exact;
  }
  const text = `${plug.serialNumber ?? ""} ${plug.name ?? ""}`.toLowerCase();
  if (!text.trim()) return null;
  return PLUG_CATALOG.find((p) => p.patterns.some((pat) => text.includes(pat))) ?? null;
}

export interface PlugDisplay {
  key: string;
  /** Short chip label, e.g. «أوروبي DC». */
  short: string;
  /** Full name for tooltips, e.g. «شحن أوروبي سريع (CCS 2)». */
  full: string;
  icon: string | null;
}

/** Display info for one plug; unknown connectors fall back to their raw serial/name. */
export function plugDisplay(
  plug: { id?: number | null; serialNumber?: string | null; name?: string | null },
  lang: string
): PlugDisplay {
  const ar = lang.startsWith("ar");
  const entry = resolvePlug(plug);
  if (!entry) {
    const raw = (plug.serialNumber ?? plug.name ?? "").trim() || `#${plug.id ?? "?"}`;
    return { key: `raw:${raw}`, short: raw, full: raw, icon: null };
  }
  const family = ar ? entry.familyAr : entry.familyEn;
  const fast = entry.chargingType === "AC" && entry.isFastCharging ? (ar ? " سريع" : " fast") : "";
  return {
    key: `id:${entry.id}`,
    short: `${family} ${entry.chargingType}${fast}`,
    full: `${ar ? entry.nameAr : entry.nameEn} (${entry.serialNumber})`,
    icon: entry.icon,
  };
}

/** De-duplicated display list for a station's plug summary. */
export function plugDisplays(
  plugs: { id?: number | null; serialNumber?: string | null; name?: string | null }[] | null | undefined,
  lang: string
): PlugDisplay[] {
  const seen = new Set<string>();
  const out: PlugDisplay[] = [];
  for (const p of plugs ?? []) {
    const d = plugDisplay(p, lang);
    if (seen.has(d.key)) continue;
    seen.add(d.key);
    out.push(d);
  }
  return out;
}
