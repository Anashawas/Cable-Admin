import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from "@microsoft/signalr";
import type { QueryClient } from "@tanstack/react-query";
import { create } from "zustand";
import { useAuthenticationStore } from "../../../stores";
import type { OcppLiveEvent } from "../types/api";
import { OCPP_QUERY_KEY, createInvalidationBatcher, ocppHubUrl, ocppRetryDelayMs, queryKeysForLiveEvent } from "../utils/live-events";

/**
 * idle = no Cable Connect screen open · connecting / reconnecting = on the way (polling meanwhile)
 * · connected = pushed live · unavailable = the hub refused the fleet (not an admin): polling only.
 */
export type OcppLiveState = "idle" | "connecting" | "connected" | "reconnecting" | "unavailable";

export const useOcppLiveStore = create<{ state: OcppLiveState }>(() => ({ state: "idle" }));
const setState = (state: OcppLiveState) => useOcppLiveStore.setState({ state });

/** Navigating between Cable Connect screens unmounts one before the next mounts: keep the socket that long. */
const LINGER_MS = 5_000;

// One connection for the whole admin, shared by every screen that calls useOcppLive (ref-counted).
let refs = 0;
let connection: HubConnection | null = null;
let queryClient: QueryClient | null = null;
let restartTimer: ReturnType<typeof setTimeout> | null = null;
let lingerTimer: ReturnType<typeof setTimeout> | null = null;
let restartAttempt = 0;
/** JoinFleet refused: do not retry until the user changes. */
let denied = false;
let unsubscribeAuth: (() => void) | null = null;

const batcher = createInvalidationBatcher((queryKey) => void queryClient?.invalidateQueries({ queryKey }), 400);

const loggedIn = () => !!useAuthenticationStore.getState().user?.accessToken;

function clearRestart() {
  if (restartTimer != null) clearTimeout(restartTimer);
  restartTimer = null;
}

function build(): HubConnection {
  const c = new HubConnectionBuilder()
    .withUrl(ocppHubUrl(window.env?.server?.url, window.location.href), {
      // Read on every (re)connect, so a token refreshed by the axios interceptor is picked up.
      accessTokenFactory: () => useAuthenticationStore.getState().user?.accessToken ?? "",
      // The API's CORS is AllowAnyOrigin without credentials.
      withCredentials: false,
    })
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: (ctx) => ocppRetryDelayMs(ctx.previousRetryCount) })
    .configureLogging(window.env?.debug ? LogLevel.Warning : LogLevel.None)
    .build();

  c.on("ocpp", (ev: OcppLiveEvent) => batcher.add(queryKeysForLiveEvent(ev)));
  c.onreconnecting(() => { if (connection === c) setState("reconnecting"); });
  c.onreconnected(async () => {
    if (connection !== c || !(await joinFleet(c))) return;
    setState("connected");
    // Events may have been missed while away: one refresh of everything Cable Connect.
    void queryClient?.invalidateQueries({ queryKey: OCPP_QUERY_KEY });
  });
  // The server closes the socket when the JWT expires (no automatic reconnect then): start again ourselves.
  c.onclose(() => { if (connection === c) scheduleRestart(); });
  return c;
}

/** Admins get every station's events. A HubException (not an admin) means polling only. */
async function joinFleet(c: HubConnection): Promise<boolean> {
  try {
    await c.invoke("JoinFleet");
    return true;
  } catch {
    // Still connected = the server refused; otherwise the socket dropped and reconnect handles it.
    if (connection === c && c.state === HubConnectionState.Connected) {
      denied = true;
      stopConnection();
      setState("unavailable");
    }
    return false;
  }
}

async function start() {
  clearRestart();
  if (denied) return setState("unavailable");
  if (refs === 0 || !loggedIn()) return;
  const c = connection ?? (connection = build());
  if (c.state !== HubConnectionState.Disconnected) return;
  setState(restartAttempt === 0 ? "connecting" : "reconnecting");
  try {
    await c.start();
    if (connection !== c || !(await joinFleet(c))) return;
    const restarted = restartAttempt > 0;
    restartAttempt = 0;
    setState("connected");
    if (restarted) void queryClient?.invalidateQueries({ queryKey: OCPP_QUERY_KEY });
  } catch {
    if (connection === c) scheduleRestart();
  }
}

function scheduleRestart() {
  clearRestart();
  if (refs === 0 || denied || !loggedIn()) {
    setState(denied ? "unavailable" : "idle");
    return;
  }
  setState("reconnecting");
  // A 401 here usually means an expired token; the 15 s fallback poll makes axios refresh it meanwhile.
  restartTimer = setTimeout(() => void start(), ocppRetryDelayMs(restartAttempt++));
}

function stopConnection() {
  clearRestart();
  batcher.cancel();
  restartAttempt = 0;
  const c = connection;
  connection = null; // first, so its onclose does not schedule a restart
  if (c) void c.stop().catch(() => undefined);
}

function teardown() {
  lingerTimer = null;
  unsubscribeAuth?.();
  unsubscribeAuth = null;
  stopConnection();
  setState("idle");
}

/**
 * Start (or share) the live connection; returns the release function. The last release closes it
 * after a short linger. Logging out closes it at once; logging in as someone else re-evaluates JoinFleet.
 */
export function acquireOcppLive(qc: QueryClient): () => void {
  queryClient = qc;
  refs++;
  if (lingerTimer != null) {
    clearTimeout(lingerTimer);
    lingerTimer = null;
  }
  if (!unsubscribeAuth) {
    unsubscribeAuth = useAuthenticationStore.subscribe(
      (s) => s.user?.id ?? null,
      (userId) => {
        denied = false;
        stopConnection();
        setState("idle");
        if (userId != null) void start();
      },
    );
  }
  void start();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    refs = Math.max(0, refs - 1);
    if (refs === 0) lingerTimer = setTimeout(teardown, LINGER_MS);
  };
}
