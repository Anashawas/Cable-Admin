import type { QueryKey } from "@tanstack/react-query";
import type { OcppLiveEvent } from "../types/api";

/** Root of every Cable Connect query; re-exported by use-ocpp.ts. Kept here so the pure helpers below need no API imports. */
export const OCPP_QUERY_KEY = ["ocpp"];

/**
 * The queries a live hint makes stale. The keys match the ones in use-ocpp.ts (prefix match):
 * a meter reading ("updated") only touches the charger and the session, never the fleet lists.
 */
export function queryKeysForLiveEvent(ev: Partial<OcppLiveEvent> | null | undefined): QueryKey[] {
  if (!ev) return [];
  const type = String(ev.type ?? "").toLowerCase();
  const status = String(ev.status ?? "").toLowerCase();
  const charger = ev.chargerId != null && ev.chargerId > 0 ? ev.chargerId : null;

  const fleet: QueryKey[] = [[...OCPP_QUERY_KEY, "fleet-health"], [...OCPP_QUERY_KEY, "charge-points"]];
  const detail: QueryKey[] = charger ? [[...OCPP_QUERY_KEY, "charge-point", charger]] : [];
  // Command confirmations (completedAt) come from the charger's follow-up message, i.e. this event.
  const commands: QueryKey[] = charger ? [[...OCPP_QUERY_KEY, "commands", charger]] : [];
  const session: QueryKey[] = ev.transactionId ? [[...OCPP_QUERY_KEY, "session-live", ev.transactionId]] : [];

  switch (type) {
    case "connector":
      return [...fleet, ...detail, ...commands, ...(status === "faulted" ? [[...OCPP_QUERY_KEY, "alerts"]] : [])];
    case "session":
      return status === "updated" ? [...detail, ...session] : [...fleet, ...detail, ...commands, ...session];
    case "charger":
      return [...fleet, ...detail, ...commands];
    default:
      return []; // unknown hint: the slow poll still covers it
  }
}

/**
 * Coalesces invalidations: the first key opens a window of `delayMs`, every key added meanwhile joins it,
 * and each distinct key is flushed once when it closes. A steady stream still flushes every `delayMs`.
 */
export function createInvalidationBatcher(flush: (key: QueryKey) => void, delayMs = 400) {
  const pending = new Map<string, QueryKey>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  const run = () => {
    timer = null;
    const keys = Array.from(pending.values());
    pending.clear();
    keys.forEach(flush);
  };
  return {
    add(keys: QueryKey[]) {
      keys.forEach((k) => pending.set(JSON.stringify(k), k));
      if (pending.size > 0 && timer == null) timer = setTimeout(run, delayMs);
    },
    cancel() {
      if (timer != null) clearTimeout(timer);
      timer = null;
      pending.clear();
    },
  };
}

/** Never gives up: 0, 2 s, 5 s, 10 s, then every 30 s (the library default stops after ~40 s). */
export function ocppRetryDelayMs(previousRetryCount: number): number {
  return [0, 2_000, 5_000, 10_000][previousRetryCount] ?? 30_000;
}

/** `${apiBase}/hubs/ocpp`, with the API base resolved like axios does (it may be relative, e.g. "/"). */
export function ocppHubUrl(apiBase: string | null | undefined, pageHref: string): string {
  const base = apiBase || "/";
  return new URL("hubs/ocpp", new URL(base.endsWith("/") ? base : `${base}/`, pageHref)).toString();
}
