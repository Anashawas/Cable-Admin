import type { OcppAlertDto, OcppChargePointListItemDto, OcppConnectionState, OcppSubscriptionStateDto } from "../types/api";
import type { SummaryCounts } from "./SummaryCard";

/** One station's chargers with the figures the station card and the station summary show. */
export interface StationGroup extends SummaryCounts {
  chargingPointId: number;
  stationName: string;
  chargers: OcppChargePointListItemDto[];
  faultedConnectors: number;
  openSessions: number;
  openAlerts: number;
  /** The Cable Connect subscription is per station; every charger carries the same state. */
  subscription: OcppSubscriptionStateDto;
  /** Mean of the chargers that have a score; null when none has been scored yet. */
  reliabilityAvg: number | null;
  lastSeen: string | null;
  /** An enabled charger not online, a faulted plug, or an open alert. */
  hasProblem: boolean;
}

const NO_SUB: OcppSubscriptionStateDto = { isOn: false, status: null };

/** Station figures from its chargers (and the open alerts, matched by station id). */
export function summarizeStation(
  chargingPointId: number,
  chargers: OcppChargePointListItemDto[],
  openAlerts: OcppAlertDto[] = [],
  stationName = "",
): StationGroup {
  let online = 0, reconnecting = 0, offline = 0, free = 0, total = 0, faulted = 0, sessions = 0;
  let relSum = 0, relN = 0;
  let lastSeen: string | null = null;
  let enabledDown = false;
  for (const c of chargers) {
    if (c.connectionState === "Online") online++;
    else if (c.connectionState === "Reconnecting") reconnecting++;
    else offline++;
    if (c.isEnabled && c.connectionState !== "Online") enabledDown = true;
    free += c.freeConnectors;
    total += c.connectorCount;
    faulted += c.faultedConnectors;
    sessions += c.openSessions;
    if (c.reliabilityPct != null) { relSum += c.reliabilityPct; relN++; }
    if (c.lastMessageAt && (!lastSeen || c.lastMessageAt > lastSeen)) lastSeen = c.lastMessageAt;
  }
  const alerts = openAlerts.filter((a) => a.chargingPointId === chargingPointId && !a.resolvedAt).length;
  return {
    chargingPointId,
    stationName: chargers[0]?.stationName ?? stationName,
    chargers,
    online, reconnecting, offline,
    freeConnectors: free,
    totalConnectors: total,
    faultedConnectors: faulted,
    openSessions: sessions,
    openAlerts: alerts,
    subscription: chargers.find((c) => c.subscription?.status)?.subscription ?? chargers[0]?.subscription ?? NO_SUB,
    reliabilityAvg: relN > 0 ? relSum / relN : null,
    lastSeen,
    hasProblem: enabledDown || faulted > 0 || alerts > 0,
  };
}

/** Group a flat charger list by station; stations with a problem first, then by name. */
export function groupByStation(items: OcppChargePointListItemDto[], openAlerts: OcppAlertDto[] = []): StationGroup[] {
  const byStation = new Map<number, OcppChargePointListItemDto[]>();
  for (const c of items) {
    const list = byStation.get(c.chargingPointId);
    if (list) list.push(c);
    else byStation.set(c.chargingPointId, [c]);
  }
  return Array.from(byStation, ([id, chargers]) => summarizeStation(id, chargers, openAlerts))
    .sort((a, b) => Number(b.hasProblem) - Number(a.hasProblem) || a.stationName.localeCompare(b.stationName));
}

export type SubscriptionFilter = "" | "on" | "off" | "none";

export interface StationFilters {
  search: string;
  state: OcppConnectionState | "";
  enabled: "" | "true" | "false";
  subscription: SubscriptionFilter;
}

/** A station matches when its subscription matches and any of its chargers matches the charger filters. */
export function stationMatches(g: StationGroup, f: StationFilters): boolean {
  const sub = g.subscription;
  if (f.subscription === "on" && !sub.isOn) return false;
  if (f.subscription === "off" && (sub.isOn || !sub.status)) return false;
  if (f.subscription === "none" && sub.status) return false;

  const q = f.search.trim().toLowerCase().replace(/^#/, "");
  const stationHit = !q || g.stationName.toLowerCase().includes(q) || String(g.chargingPointId) === q;
  return g.chargers.some((c) => {
    if (f.state && c.connectionState !== f.state) return false;
    if (f.enabled && String(c.isEnabled) !== f.enabled) return false;
    if (stationHit) return true;
    return [c.displayName, c.chargePointId, c.vendor, c.model].some((v) => v?.toLowerCase().includes(q));
  });
}
