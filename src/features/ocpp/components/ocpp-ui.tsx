import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Chip, type ChipProps } from "@mui/material";
import WifiIcon from "@mui/icons-material/Wifi";
import SyncIcon from "@mui/icons-material/Sync";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import BlockIcon from "@mui/icons-material/Block";
import LockClockIcon from "@mui/icons-material/LockClock";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import LinkIcon from "@mui/icons-material/Link";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useLanguageStore } from "../../../stores";
import { formatFullDateTime, formatRelative } from "../../../utils/date-format";
import type { OcppConnectionState, OcppOnboardingDto, OcppSubscriptionStateDto } from "../types/api";

/** Pull the most descriptive message out of an axios error. */
export function errMessage(err: any, fallback: string): string {
  return err?.response?.data?.detail || err?.response?.data?.title || err?.response?.data?.message || err?.message || fallback;
}

/**
 * The OCPP host chargers point at. Explicit per-environment config wins; the
 * embedded-under-API build shares one config between dev and prod, so it is
 * derived from where the admin itself is served (dev.cable-app.com → ocpp-dev).
 */
export function ocppBaseUrl(): string {
  const configured = (window.env as any)?.ocpp?.url as string | undefined;
  if (configured) return configured;
  const host = window.location.hostname.toLowerCase();
  const isDev = host.startsWith("dev.") || host === "localhost" || host === "127.0.0.1";
  return isDev ? "wss://ocpp-dev.cable-app.com" : "wss://ocpp.cable-app.com";
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

const ONBOARDING: Record<OcppOnboardingDto["state"], { color: ChipProps["color"]; icon: ReactElement }> = {
  Waiting: { color: "default", icon: <HourglassTopIcon /> },
  Connected: { color: "info", icon: <LinkIcon /> },
  Refused: { color: "error", icon: <ErrorOutlineIcon /> },
  Booted: { color: "success", icon: <CheckCircleIcon /> },
};

/** Table chip for a unit that has not booted yet (replaces the Offline chip, which would be misleading). */
export function OnboardingChip({ state, size = "small" }: { state: OcppOnboardingDto["state"]; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  const cfg = ONBOARDING[state] ?? ONBOARDING.Waiting;
  return <Chip size={size} icon={cfg.icon} label={t(`ocpp@onboarding.${state}`)} color={cfg.color} variant={state === "Refused" ? "filled" : "outlined"} sx={{ fontWeight: 700 }} />;
}

/**
 * The commissioning card shown on a charger page until its first BootNotification: what the
 * admin at the station watches after typing the credentials into the unit. Polled every 4 s.
 */
export function OnboardingCard({ ob, vendor, model, firmware }: { ob: OcppOnboardingDto; vendor?: string | null; model?: string | null; firmware?: string | null }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const cfg = ONBOARDING[ob.state] ?? ONBOARDING.Waiting;
  const border = ob.state === "Refused" ? "error.main" : ob.state === "Booted" ? "success.main" : ob.state === "Connected" ? "info.main" : "warning.main";
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, borderColor: border, borderWidth: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ color: border, display: "flex", mt: 0.25 }}>{cfg.icon}</Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" fontWeight={800}>{t(`ocpp@onboarding.title.${ob.state}`)}</Typography>
          <Typography variant="body2" color="text.secondary">
            {ob.state === "Booted"
              ? t("ocpp@onboarding.bootedBody", { vendor: vendor ?? "?", model: model ?? "?", firmware: firmware ?? "?" })
              : t(`ocpp@onboarding.body.${ob.state}`)}
          </Typography>
          {ob.reason && ob.state !== "Booted" && (
            <Typography variant="body2" color={ob.state === "Refused" ? "error.main" : "text.secondary"} fontWeight={600} sx={{ mt: 0.5, fontFamily: "monospace" }}>
              {ob.httpStatus ? `${ob.httpStatus} · ` : ""}{ob.reason}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
            {ob.at ? `${t("ocpp@onboarding.lastEvent")} ${fmt.relative(ob.at)}` : `${t("ocpp@onboarding.registered")} ${fmt.relative(ob.registeredAt)}`}
            {ob.state !== "Booted" && ` · ${t("ocpp@onboarding.autoRefresh")}`}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}
