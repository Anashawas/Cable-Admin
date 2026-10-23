import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthenticationStore } from "../../../stores";
import { acquireOcppLive, useOcppLiveStore, type OcppLiveState } from "../services/ocpp-live";

/**
 * Keep the shared Cable Connect live connection open while the calling screen is mounted.
 * Pushed hints invalidate the matching queries; the hooks in use-ocpp.ts poll slower while connected.
 */
export function useOcppLive(enabled = true): OcppLiveState {
  const qc = useQueryClient();
  const loggedIn = useAuthenticationStore((s) => !!s.user?.accessToken);
  useEffect(() => {
    if (!enabled || !loggedIn) return undefined;
    return acquireOcppLive(qc);
  }, [qc, enabled, loggedIn]);
  return useOcppLiveStore((s) => s.state);
}

/** True while events are pushed; the polls fall back to their normal rate otherwise. */
export function useOcppLiveConnected(): boolean {
  return useOcppLiveStore((s) => s.state === "connected");
}
