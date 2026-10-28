import type {
  AdminSessionRowDto,
  AdminSessionsQuery,
  ConnectorReportGroupDto,
  OcppStartMethod,
  SessionLimitFilter,
  SessionStatusFilter,
  TouWindowDto,
} from "../types/live-charging";
import { START_METHODS } from "../types/live-charging";

/**
 * Pure helpers behind the Sprint 5 live-charging admin screens: list filters and their URL
 * form, plug-report lookups, the station tariff checks, and reading problem details from
 * JSON and blob (file download) errors.
 */

// ============================================
// Session list filters
// ============================================

/** The query string the API gets: empty strings, nulls and the default page are left out. */
export function sessionsParams(q: AdminSessionsQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  const put = (k: string, v: unknown) => {
    if (v == null) return;
    if (typeof v === "string") {
      const s = v.trim();
      if (s) out[k] = s;
      return;
    }
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  };
  put("from", q.from);
  put("to", q.to);
  put("chargingPointId", q.chargingPointId);
  put("chargerId", q.chargerId);
  put("userId", q.userId);
  put("source", q.source);
  put("status", q.status);
  put("limitKind", q.limitKind);
  put("q", q.q);
  put("page", q.page);
  put("pageSize", q.pageSize);
  return out;
}

/** The filters kept in the page URL, so links like ?station=37 or ?user=13795 open the list filtered. */
export interface SessionUrlFilters {
  from: string;
  to: string;
  station: number | null;
  charger: number | null;
  user: number | null;
  source: OcppStartMethod | "";
  status: SessionStatusFilter;
  limit: SessionLimitFilter;
  q: string;
}

export const NO_SESSION_FILTERS: SessionUrlFilters = {
  from: "", to: "", station: null, charger: null, user: null, source: "", status: "", limit: "", q: "",
};

const posInt = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};
const day = (v: string | null): string => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "");

export function filtersFromSearch(p: URLSearchParams): SessionUrlFilters {
  const source = p.get("source") ?? "";
  const status = p.get("status") ?? "";
  const limit = p.get("limit") ?? "";
  return {
    from: day(p.get("from")),
    to: day(p.get("to")),
    station: posInt(p.get("station")),
    charger: posInt(p.get("charger")),
    user: posInt(p.get("user")),
    source: (START_METHODS as string[]).includes(source) ? (source as OcppStartMethod) : "",
    status: status === "open" || status === "closed" ? status : "",
    limit: limit === "Jod" || limit === "Kwh" || limit === "Soc" || limit === "none" ? limit : "",
    q: p.get("q") ?? "",
  };
}

export function filtersToSearch(f: SessionUrlFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.station) p.set("station", String(f.station));
  if (f.charger) p.set("charger", String(f.charger));
  if (f.user) p.set("user", String(f.user));
  if (f.source) p.set("source", f.source);
  if (f.status) p.set("status", f.status);
  if (f.limit) p.set("limit", f.limit);
  if (f.q.trim()) p.set("q", f.q.trim());
  return p;
}

/**
 * The API query for the URL filters. `to` is a day and the API takes "started before",
 * so the day after is sent to include the whole last day.
 */
export function filtersToQuery(f: SessionUrlFilters, page: number, pageSize: number): AdminSessionsQuery {
  return {
    from: f.from ? `${f.from}T00:00:00` : undefined,
    to: f.to ? `${nextDay(f.to)}T00:00:00` : undefined,
    chargingPointId: f.station,
    chargerId: f.charger,
    userId: f.user,
    source: f.source,
    status: f.status,
    limitKind: f.limit,
    q: f.q,
    page,
    pageSize,
  };
}

/** "2026-10-31" → "2026-11-01" (calendar arithmetic, no time zone involved). */
export function nextDay(d: string): string {
  const [y, m, dd] = d.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m || 1) - 1, (dd || 1) + 1));
  return date.toISOString().slice(0, 10);
}

export const filtersActive = (f: SessionUrlFilters): boolean =>
  !!(f.from || f.to || f.station || f.charger || f.user || f.source || f.status || f.limit || f.q.trim());

// ============================================
// Who started a session
// ============================================

export type SessionWho =
  | { kind: "driver"; userId: number; name: string; phone?: string | null }
  | { kind: "staff"; userId: number; name: string; phone?: string | null }
  | { kind: "card"; label?: string | null; idTag: string }
  | { kind: "none"; idTag: string };

/** Driver for app / sticker / linked-card starts, staff for operator starts, else the card. */
export function sessionWho(s: Pick<AdminSessionRowDto, "driver" | "startedByStaff" | "cardLabel" | "idTag">): SessionWho {
  if (s.driver) return { kind: "driver", userId: s.driver.userId, name: s.driver.name?.trim() || `#${s.driver.userId}`, phone: s.driver.phone };
  if (s.startedByStaff) return { kind: "staff", userId: s.startedByStaff.userId, name: s.startedByStaff.name?.trim() || `#${s.startedByStaff.userId}`, phone: s.startedByStaff.phone };
  if (s.cardLabel || s.idTag) return { kind: "card", label: s.cardLabel, idTag: s.idTag };
  return { kind: "none", idTag: s.idTag };
}

/** The car name of a row, whichever field the API fills. */
export const carNameOf = (s: { car?: { name?: string | null } | null; carName?: string | null }): string | null =>
  s.car?.name?.trim() || s.carName?.trim() || null;

// ============================================
// Plug reports
// ============================================

export const plugKey = (chargerId: number, connectorId: number) => `${chargerId}:${connectorId}`;

export interface PlugReportStat {
  openReports: number;
  reportsToday: number;
  suspectedIssue: boolean;
  lastReportAt: string;
}

/** Per plug ("charger:connector") the open-report figures, from the grouped admin list. */
export function plugReportStats(groups: ConnectorReportGroupDto[]): Map<string, PlugReportStat> {
  const out = new Map<string, PlugReportStat>();
  for (const g of groups) {
    out.set(plugKey(g.chargerId, g.connectorId), {
      openReports: g.openReports,
      reportsToday: g.reportsToday,
      suspectedIssue: g.suspectedIssue,
      lastReportAt: g.lastReportAt,
    });
  }
  return out;
}

export interface StationReportSummary {
  openReports: number;
  suspectedPlugs: number;
}

/** Per station: open reports and plugs flagged "may have a problem". */
export function stationReportSummaries(groups: ConnectorReportGroupDto[]): Map<number, StationReportSummary> {
  const out = new Map<number, StationReportSummary>();
  for (const g of groups) {
    const s = out.get(g.chargingPointId) ?? { openReports: 0, suspectedPlugs: 0 };
    s.openReports += g.openReports;
    if (g.suspectedIssue) s.suspectedPlugs += 1;
    out.set(g.chargingPointId, s);
  }
  return out;
}

// ============================================
// Station tariff (same rules as PUT api/admin/pricing/tou)
// ============================================

export const toClock = (min: number) =>
  `${String(Math.floor((min % 1440) / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const fromClock = (v: string) => {
  const [h, m] = v.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export interface TariffCheck {
  ok: boolean;
  /** Minutes covered by the windows; must be 1440. */
  coverage: number;
  duplicateKeys: boolean;
  /** Indexes of rows with an empty key / name, a bad price or end ≤ start. */
  invalidRows: number[];
}

export function checkTariffWindows(rows: TouWindowDto[]): TariffCheck {
  const coverage = rows.reduce((s, w) => s + (w.endMin - w.startMin), 0);
  const keys = rows.map((r) => r.key.trim());
  const duplicateKeys = new Set(keys).size !== keys.length;
  const invalidRows = rows
    .map((r, i) => {
      const bad = !r.key.trim() || !r.nameEn.trim() || !r.nameAr.trim()
        || !Number.isInteger(r.priceFils) || r.priceFils < 1 || r.priceFils > 9999
        || r.endMin <= r.startMin || !["offPeak", "partial", "peak"].includes(r.tier);
      return bad ? i : -1;
    })
    .filter((i) => i >= 0);
  return { ok: rows.length > 0 && coverage === 1440 && !duplicateKeys && invalidRows.length === 0, coverage, duplicateKeys, invalidRows };
}

export const sameWindows = (a: TouWindowDto[], b: TouWindowDto[]): boolean =>
  a.length === b.length && a.every((w, i) => {
    const o = b[i];
    return w.key === o.key && w.startMin === o.startMin && w.endMin === o.endMin && w.tier === o.tier
      && w.priceFils === o.priceFils && w.nameEn === o.nameEn && w.nameAr === o.nameAr;
  });

// ============================================
// Errors (problem details) and downloads
// ============================================

export interface ProblemInfo {
  detail?: string;
  code?: string;
  status?: number;
}

/** detail / title / code of a problem-details body (already parsed). */
export function problemOf(data: unknown, status?: number): ProblemInfo {
  if (!data || typeof data !== "object") return { status };
  const d = data as Record<string, unknown>;
  const detail = [d.detail, d.title, d.message].find((v) => typeof v === "string" && v.trim()) as string | undefined;
  const code = typeof d.code === "string" ? d.code : undefined;
  return { detail, code, status };
}

/** Problem details of an axios error, reading the body when it came back as a Blob (file downloads). */
export async function problemOfError(err: unknown): Promise<ProblemInfo> {
  const res = (err as { response?: { data?: unknown; status?: number } })?.response;
  if (!res) return {};
  const data = res.data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    try {
      return problemOf(JSON.parse(await data.text()), res.status);
    } catch {
      return { status: res.status };
    }
  }
  return problemOf(data, res.status);
}

/** File name from Content-Disposition (filename*=UTF-8''… or filename=…), else the fallback. */
export function fileNameFromDisposition(header: string | null | undefined, fallback: string): string {
  if (!header) return fallback;
  const star = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (star) {
    try {
      return decodeURIComponent(star[1].trim().replace(/^"|"$/g, ""));
    } catch {
      /* fall through */
    }
  }
  const plain = /filename\s*=\s*("?)([^";]+)\1/i.exec(header);
  return plain ? plain[2].trim() : fallback;
}

/** Hand a Blob to the browser as a download. */
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 1.234 JOD with grouping and 3 decimals (Western digits). */
export const fmtJod = (v?: number | null): string =>
  v == null ? "—" : `${Number(v).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} JOD`;
