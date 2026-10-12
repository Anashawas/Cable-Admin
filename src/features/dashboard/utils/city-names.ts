/**
 * Jordanian city names: the API stores them in English (with assorted legacy
 * spellings). These helpers group spellings under one canonical key and show
 * the Arabic name in the Arabic UI.
 */

interface CityEntry { en: string; ar: string; aliases: string[] }

const CITIES: CityEntry[] = [
  { en: "Amman", ar: "عمّان", aliases: ["amman", "aman", "amaan", "عمان", "عمّان"] },
  { en: "Irbid", ar: "إربد", aliases: ["irbid", "irbed", "irbit", "اربد", "إربد"] },
  { en: "Zarqa", ar: "الزرقاء", aliases: ["zarqa", "zarka", "zerqa", "zarqaa", "الزرقاء", "الزرقا"] },
  { en: "Karak", ar: "الكرك", aliases: ["karak", "kerak", "الكرك"] },
  { en: "Aqaba", ar: "العقبة", aliases: ["aqaba", "akaba", "aqabah", "العقبة"] },
  { en: "Mafraq", ar: "المفرق", aliases: ["mafraq", "mafrak", "المفرق"] },
  { en: "Ma'an", ar: "معان", aliases: ["maan", "maan city", "mann", "معان"] },
  { en: "Salt", ar: "السلط", aliases: ["salt", "السلط"] },
  { en: "Balqa", ar: "البلقاء", aliases: ["balqa", "balqaa", "balka", "البلقاء"] },
  { en: "Madaba", ar: "مادبا", aliases: ["madaba", "madaba city", "maadaba", "مادبا"] },
  { en: "Jerash", ar: "جرش", aliases: ["jerash", "jarash", "gerasa", "جرش"] },
  { en: "Ajloun", ar: "عجلون", aliases: ["ajloun", "ajlun", "ajlune", "ajlon", "عجلون"] },
  { en: "Tafilah", ar: "الطفيلة", aliases: ["tafilah", "tafileh", "tafila", "tafile", "tafyleh", "الطفيلة"] },
  { en: "Ramtha", ar: "الرمثا", aliases: ["ramtha", "ramtha city", "الرمثا"] },
  { en: "Russeifa", ar: "الرصيفة", aliases: ["russeifa", "rusaifa", "ruseifa", "rusayfah", "russaifa", "الرصيفة"] },
  { en: "Sahab", ar: "سحاب", aliases: ["sahab", "سحاب"] },
  { en: "Fuheis", ar: "الفحيص", aliases: ["fuheis", "fuhais", "fheis", "الفحيص"] },
  { en: "Dead Sea", ar: "البحر الميت", aliases: ["dead sea", "البحر الميت"] },
  { en: "Petra", ar: "البتراء", aliases: ["petra", "wadi musa", "wadi mousa", "البتراء", "وادي موسى"] },
  { en: "Jordan Valley", ar: "الأغوار", aliases: ["jordan valley", "ghor", "aghwar", "al aghwar", "الأغوار", "الاغوار"] },
  { en: "Azraq", ar: "الأزرق", aliases: ["azraq", "الأزرق", "الازرق"] },
  { en: "Shouneh", ar: "الشونة", aliases: ["shouneh", "shuneh", "south shuna", "north shuna", "الشونة"] },
  { en: "Dhlail", ar: "الضليل", aliases: ["dhlail", "dhuleil", "dulail", "الضليل"] },
  { en: "Ain Al-Basha", ar: "عين الباشا", aliases: ["ain al basha", "ain basha", "ein al basha", "عين الباشا"] },
];

/** Lower-case, drop apostrophes/diacritic marks, unify separators and the Arabic-style "Al-" prefix. */
function normalize(raw: string): string {
  let s = raw.trim().toLowerCase()
    .replace(/[‘’'`´ʼ]/g, "")
    .replace(/[-_.,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  s = s.replace(/\s+(city|governorate|gov)$/, "");
  s = s.replace(/^(al|el|as|az|ar|ad|at)\s+/, "");
  return s;
}

const INDEX = new Map<string, CityEntry>();
for (const c of CITIES) {
  for (const a of [c.en, ...c.aliases]) INDEX.set(normalize(a), c);
}

/** Stable grouping key: the canonical English name when known, otherwise the trimmed raw value. */
export function cityKey(raw?: string | null): string | null {
  const v = raw?.trim();
  if (!v) return null;
  return INDEX.get(normalize(v))?.en ?? v;
}

/** Display name for a grouping key in the given UI language. */
export function cityLabel(key: string, lang: string): string {
  const entry = INDEX.get(normalize(key));
  if (!entry) return key;
  return lang.startsWith("ar") ? entry.ar : entry.en;
}
