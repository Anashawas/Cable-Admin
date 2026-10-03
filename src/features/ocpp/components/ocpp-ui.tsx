import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Chip, type ChipProps } from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import SyncIcon from "@mui/icons-material/Sync";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import BlockIcon from "@mui/icons-material/Block";
import LockClockIcon from "@mui/icons-material/LockClock";
import { useLanguageStore } from "../../../stores";
import { formatFullDateTime, formatRelative } from "../../../utils/date-format";
import type { OcppConnectionState, OcppSubscriptionStateDto } from "../types/api";

/** Pull the most descriptive message out of an axios error. */
export function errMessage(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.response?.data?.title || err?.response?.data?.message || err?.message || fallback;
}

/** The OCPP host chargers point at; configurable per environment, falls back to the dev host. */
export function ocppBaseUrl(): string {
  return (window.env as any)?.ocpp?.url ?? "wss://ocpp-dev.cable-app.com";
}

export function useDateFmt() {
  const language = useLanguageStore((s) => s.language);
  return {
    full: (v?: string | null) => (v ? formatFullDateTime(v, language) : "—"),
    relative: (v?: string | null) => (v ? formatRelative(v, language) : "—"),
  };
}

export function fmtDuration(sec?: number | null): string {
  if (sec == null || sec < 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec % 60}s`;
  return `${sec}s`;
}

export function fmtKwh(v?: number | null): string {
  return v == null ? "—" : `${Number(v).toFixed(3)} kWh`;
}

/** Online / Reconnecting / Offline, with disabled and locked overriding the colour. */
export function ConnectionChip({
  state, isEnabled = true, lockedUntil, size = "small",
}: { state: OcppConnectionState; isEnabled?: boolean; lockedUntil?: string | null; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  if (!isEnabled)
    return <Chip size={size} icon={<BlockIcon />} label={t("ocpp@state.disabled")} color="default" variant="outlined" sx={{ fontWeight: 700 }} />;
  if (lockedUntil && new Date(lockedUntil) > new Date())
    return <Chip size={size} icon={<LockClockIcon />} label={t("ocpp@state.locked")} color="warning" variant="outlined" sx={{ fontWeight: 700 }} />;

  const map: Record<OcppConnectionState, { color: ChipProps["color"]; icon: ReactElement }> = {
    Online: { color: "success", icon: <WifiIcon /> },
    Reconnecting: { color: "warning", icon: <SyncIcon /> },
    Offline: { color: "error", icon: <WifiOffIcon /> },
  };
  const cfg = map[state] ?? map.Offline;
  return <Chip size={size} icon={cfg.icon} label={t(`ocpp@state.${state}`)} color={cfg.color} variant={state === "Online" ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />;
}

const CONNECTOR_COLORS: Record<string, ChipProps["color"]> = {
  Available: "success",
  Preparing: "info",
  Charging: "primary",
  SuspendedEVSE: "warning",
  SuspendedEV: "warning",
  Finishing: "info",
  Reserved: "secondary",
  Unavailable: "default",
  Faulted: "error",
};

export function ConnectorStatusChip({ status, size = "small" }: { status: string; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  const known = status in CONNECTOR_COLORS;
  return (
    <Chip
      size={size}
      label={known ? t(`ocpp@connectorStatus.${status}`) : status}
      color={CONNECTOR_COLORS[status] ?? "default"}
      variant={status === "Charging" || status === "Faulted" ? "filled" : "outlined"}
      sx={{ fontWeight: 700 }}
    />
  );
}

export function SubscriptionChip({ sub, size = "small" }: { sub: OcppSubscriptionStateDto; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  if (!sub.status) return <Chip size={size} label={t("ocpp@subscription.none")} variant="outlined" color="default" />;
  const color: ChipProps["color"] =
    sub.status === "Active" ? "success" : sub.status === "ExpiringSoon" || sub.status === "InGrace" ? "warning" : "error";
  return <Chip size={size} label={t(`ocpp@subscription.${sub.status}`)} color={color} variant={sub.isOn ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />;
}
