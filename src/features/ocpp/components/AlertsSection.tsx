import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Box, Button, ButtonBase, Chip, Paper, Stack, Tooltip, Typography } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import HourglassBottomIcon from "@mui/icons-material/HourglassBottom";
import EvStationIcon from "@mui/icons-material/EvStation";
import { useOcppAlerts } from "../hooks/use-ocpp";
import type { OcppAlertDto, OcppAlertType } from "../types/api";
import { Dot, useDateFmt } from "./ocpp-ui";

const ICON: Record<OcppAlertType, React.ReactElement> = {
  ChargerOffline: <WifiOffIcon fontSize="small" />,
  ConnectorFaulted: <ReportProblemIcon fontSize="small" />,
  SessionTooLong: <HourglassBottomIcon fontSize="small" />,
  ParkedAfterCharging: <EvStationIcon fontSize="small" />,
};

/** Offline / faulted are failures (red); long sessions and parked cars are nudges (amber). */
const isWarning = (type: OcppAlertType) => type === "SessionTooLong" || type === "ParkedAfterCharging";

/** Outlined type chip; the colour carries the severity, grey once resolved. */
export function AlertTypeChip({ type, resolved }: { type: OcppAlertType; resolved?: boolean }) {
  const { t } = useTranslation();
  const color = resolved ? "default" : isWarning(type) ? "warning" : "error";
  return <Chip size="small" icon={ICON[type]} label={t(`ocpp@alerts.type.${type}`)} color={color} variant="outlined" sx={{ fontWeight: 600 }} />;
}

/**
 * The alert job writes its findings in English ("offline 19 min"). Known shapes are
 * translated; anything else is shown as the server sent it.
 */
function alertDetail(details: string, t: TFunction): string {
  const s = details.trim();
  let m = /^offline (?:for )?(\d+) ?min(?:utes?)?$/i.exec(s);
  if (m) return t("ocpp@alertsUi.details.offlineMin", { n: Number(m[1]) });
  m = /^offline (?:for )?(\d+) ?h(?:ours?)?(?: (\d+) ?min(?:utes?)?)?$/i.exec(s);
  if (m) return m[2] ? t("ocpp@alertsUi.details.offlineHm", { h: Number(m[1]), m: Number(m[2]) }) : t("ocpp@alertsUi.details.offlineHours", { h: Number(m[1]) });
  m = /^(\d+) ?min(?:utes?)?$/i.exec(s);
  if (m) return t("ocpp@alertsUi.details.minutes", { n: Number(m[1]) });
  return s;
}

const COLLAPSED = 5;
const COLLAPSED_COMPACT = 3;

/**
 * Open findings of the 5-minute alert job (charger offline / plug Faulted / session too long),
 * each already pushed to admins and the station owner. Clicking a row opens the charger.
 */
export default function AlertsSection({
  onOpenCharger, chargingPointId, compact = false,
}: {
  onOpenCharger: (id: number) => void;
  /** Only this station's alerts (filtered on the client; the API filters by charger, not station). Shown even when empty. */
  chargingPointId?: number;
  /** Fewer rows before "show all" — for the fleet overview. */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const [showResolved, setShowResolved] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { data: all = [] } = useOcppAlerts({ openOnly: !showResolved, take: 50 });
  const alerts = chargingPointId == null ? all : all.filter((a) => a.chargingPointId === chargingPointId);
  const collapsed = compact ? COLLAPSED_COMPACT : COLLAPSED;
  const open = alerts.filter((a) => !a.resolvedAt);

  if (alerts.length === 0 && !showResolved && chargingPointId == null) return null;

  // Most recent first, then collapsed to the first few.
  const sorted = [...alerts].sort((a, b) => (b.conditionSince ?? "").localeCompare(a.conditionSince ?? ""));
  const visible = expanded ? sorted : sorted.slice(0, collapsed);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }} component="section" aria-labelledby="ocpp-alerts-title">
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <NotificationsNoneIcon fontSize="small" color="action" />
          <Typography id="ocpp-alerts-title" variant="subtitle1" fontWeight={800} component="h2">{t("ocpp@alerts.title")}</Typography>
          {open.length > 0 && (
            <Chip size="small" color="error" variant="outlined" label={<bdi>{open.length}</bdi>} sx={{ fontWeight: 700, height: 22 }} />
          )}
        </Stack>
        <Button size="small" onClick={() => setShowResolved((v) => !v)} sx={{ textTransform: "none", fontWeight: 600 }}>
          {showResolved ? t("ocpp@alerts.hideResolved") : t("ocpp@alerts.showResolved")}
        </Button>
      </Stack>

      {alerts.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 2 }}>{chargingPointId == null ? t("ocpp@alertsUi.empty") : t("ocpp@stations.noAlerts")}</Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, borderTop: 1, borderColor: "divider" }}>
          {visible.map((a: OcppAlertDto) => {
            const resolved = !!a.resolvedAt;
            const dot = resolved ? "text.disabled" : isWarning(a.type) ? "warning.main" : "error.main";
            const detailBits: string[] = [];
            if (a.connectorId != null && a.connectorId > 0) detailBits.push(`${t("ocpp@columns.connector")} ${a.connectorId}`);
            if (a.details) detailBits.push(alertDetail(a.details, t));
            if (a.type === "ParkedAfterCharging") {
              detailBits.push(a.driverUserId ? t("ocpp@alerts.driverTold") : t("ocpp@alerts.noDriver"));
              if (a.escalatedAt) detailBits.push(t("ocpp@alerts.stationTold"));
            }
            return (
              <Box component="li" key={a.id} sx={{ "&:not(:last-of-type)": { borderBottom: 1, borderColor: "divider" } }}>
                <ButtonBase
                  onClick={() => onOpenCharger(a.ocppChargePointId)}
                  sx={{
                    width: "100%", textAlign: "start", px: 2, py: 1.25, display: "flex", alignItems: "flex-start", gap: 1.5,
                    opacity: resolved ? 0.7 : 1,
                    "&:hover": { bgcolor: "action.hover" },
                    "&.Mui-focusVisible": { bgcolor: "action.focus", outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
                  }}
                >
                  <Box sx={{ pt: 0.9 }}><Dot color={dot} /></Box>
                  <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 0.75, md: 2 }, alignItems: { md: "center" } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <AlertTypeChip type={a.type} resolved={resolved} />
                        <Typography variant="body2" fontWeight={700} noWrap sx={{ minWidth: 0 }}>
                          {a.displayName || a.chargePointId}
                          {chargingPointId == null && <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}> · {a.stationName}</Box>}
                        </Typography>
                      </Stack>
                      {detailBits.length > 0 && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          <bdi>{detailBits.join(" · ")}</bdi>
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0, color: "text.secondary" }}>
                      <Tooltip title={t("ocpp@alertsUi.since", { when: fmt.full(a.conditionSince) })}>
                        <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}><bdi>{fmt.relative(a.conditionSince)}</bdi></Typography>
                      </Tooltip>
                      <Tooltip title={t("ocpp@alertsUi.notifiedAt", { when: fmt.full(a.notifiedAt) })}>
                        <Typography variant="caption" sx={{ whiteSpace: "nowrap" }}><bdi>{t("ocpp@alerts.recipients", { count: a.recipients })}</bdi></Typography>
                      </Tooltip>
                      <Tooltip title={resolved ? t("ocpp@alertsUi.resolvedAt", { when: fmt.full(a.resolvedAt) }) : ""} disableHoverListener={!resolved} disableFocusListener={!resolved}>
                        <Chip
                          size="small" variant="outlined"
                          label={resolved ? t("ocpp@alertsUi.statusResolved") : t("ocpp@alertsUi.statusOpen")}
                          color={resolved ? "default" : "warning"}
                          sx={{ fontWeight: 600, height: 22 }}
                        />
                      </Tooltip>
                    </Stack>
                  </Box>
                </ButtonBase>
              </Box>
            );
          })}
        </Box>
      )}

      {sorted.length > collapsed && (
        <Box sx={{ px: 2, py: 1, borderTop: 1, borderColor: "divider" }}>
          <Button size="small" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} sx={{ textTransform: "none", fontWeight: 600 }}>
            {expanded ? t("ocpp@alertsUi.showLess") : t("ocpp@alertsUi.showAll", { count: sorted.length })}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
