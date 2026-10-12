import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Breadcrumbs, Button, Chip, IconButton, Link, Paper, Skeleton, Stack, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { getStationById } from "../../charge-management/services/station-form-service";
import { useLanguageStore } from "../../../stores";
import { LANGUAGE } from "../../../constants/language-constants";
import { useLiveVisibility, useOcppAlerts, useOcppChargePointDetails, useOcppChargePoints } from "../hooks/use-ocpp";
import type { OcppChargePointDetailDto, OcppChargePointListItemDto, OcppConnectorDto } from "../types/api";
import AlertsSection from "./AlertsSection";
import ChargerDetailDialog from "./ChargerDetailDialog";
import RegisterChargerDialog from "./RegisterChargerDialog";
import StationChargersSection from "./StationChargersSection";
import SummaryCard, { Figure } from "./SummaryCard";
import ChargerIcon, { iconPlugColor, iconPlugOf, iconPlugsFromCounts, plugConnectors, plugFamily } from "./ChargerIcon";
import { ChargerEnabledSwitch } from "./ChargersTable";
import { Dot, ReliabilityText, StatusDotChip, SubscriptionChip, useDateFmt } from "./ocpp-ui";
import { summarizeStation } from "./station-groups";
import BackButton from "../../../components/BackButton";

const flipInRtl = { transform: (th: { direction: string }) => (th.direction === "rtl" ? "scaleX(-1)" : "none") } as const;

/** One plug: family label coloured by its state, then the state and rated power. */
function PlugChip({ c, online }: { c: OcppConnectorDto; online: boolean }) {
  const { t } = useTranslation();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const color = iconPlugColor(iconPlugOf(c), online);
  const status = t(`ocpp@connectorStatus.${c.status}`, { defaultValue: c.status });
  return (
    <Chip
      size="small" variant="outlined"
      icon={<Dot color={color} />}
      label={
        <bdi>
          <Box component="span" sx={{ color, fontWeight: 800 }}>{plugFamily(c, ar) || `#${c.connectorId}`}</Box>
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {` · ${status}`}{c.powerKw != null ? ` · ${c.powerKw} kW` : ""}
          </Box>
        </bdi>
      }
      sx={{ "& .MuiChip-icon": { marginInlineStart: "8px", marginInlineEnd: "-2px" } }}
    />
  );
}

/** A charger of the station: icon, name, state, plugs, and the enabled switch. Click opens the detail dialog. */
function StationChargerCard({ row, detail, onOpen }: { row: OcppChargePointListItemDto; detail?: OcppChargePointDetailDto; onOpen: (id: number) => void }) {
  const { t } = useTranslation();
  const fmt = useDateFmt();
  const name = row.displayName || row.chargePointId;
  const online = row.isConnected && row.isEnabled;
  const plugs = detail ? plugConnectors(detail.connectors) : null;

  return (
    <Paper
      variant="outlined"
      onClick={() => onOpen(row.id)}
      sx={{
        p: 2, borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", gap: 1.5, cursor: "pointer",
        opacity: row.isEnabled ? 1 : 0.7,
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <ChargerIcon plugs={plugs ? plugs.map(iconPlugOf) : iconPlugsFromCounts(row)} offline={!online} size={36} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={800} noWrap component="h3" lineHeight={1.3}>{name}</Typography>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            <bdi dir="ltr" style={{ fontFamily: "monospace" }}>{row.chargePointId}</bdi>
            {row.vendor ? ` · ${row.vendor}${row.model ? ` ${row.model}` : ""}` : ""}
          </Typography>
        </Box>
        {row.onboardingState && row.isEnabled ? (
          <Tooltip title={row.onboardingReason ?? ""}>
            <span><StatusDotChip state={row.connectionState} isEnabled={row.isEnabled} onboardingState={row.onboardingState} /></span>
          </Tooltip>
        ) : <StatusDotChip state={row.connectionState} isEnabled={row.isEnabled} lockedUntil={row.lockedUntil} />}
      </Stack>

      {/* Plugs */}
      {plugs && plugs.length > 0 ? (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap aria-label={t("ocpp@columns.plugs")}>
          {plugs.map((c) => <PlugChip key={c.id} c={c} online={online} />)}
        </Stack>
      ) : (
        <Typography variant="body2" fontWeight={600} color={row.freeConnectors > 0 ? "success.main" : "text.secondary"}>
          <bdi>{t("ocpp@stations.plugsFree", { free: row.freeConnectors, total: row.connectorCount })}</bdi>
          {row.faultedConnectors > 0 && (
            <Box component="span" sx={{ color: "error.main", fontWeight: 700 }}> · <bdi>{t("ocpp@table.plugsFaulted", { count: row.faultedConnectors })}</bdi></Box>
          )}
        </Typography>
      )}

      {/* Figures + switch */}
      <Stack
        direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap
        sx={{ mt: "auto", pt: 1, borderTop: 1, borderColor: "divider" }}
      >
        {row.openSessions > 0 && (
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: "primary.main" }}>
            <BoltIcon sx={{ fontSize: 16 }} aria-hidden />
            <Typography variant="body2" fontWeight={700}><bdi>{t("ocpp@table.charging", { count: row.openSessions })}</bdi></Typography>
          </Stack>
        )}
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography variant="caption" color="text.secondary">{t("ocpp@columns.reliability")}</Typography>
          <ReliabilityText pct={row.reliabilityPct} />
        </Stack>
        <Tooltip title={row.lastMessageAt ? fmt.full(row.lastMessageAt) : ""}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {t("ocpp@columns.lastSeen")} <bdi>{fmt.relative(row.lastMessageAt)}</bdi>
          </Typography>
        </Tooltip>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.5} alignItems="center" onClick={(e) => e.stopPropagation()}>
          <ChargerEnabledSwitch row={row} />
          <Tooltip title={t("ocpp@actions.view")}>
            <IconButton size="small" onClick={() => onOpen(row.id)} aria-label={t("ocpp@table.viewCharger", { name })}>
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

/** Page frame with the breadcrumb "Cable Connect › station". */
function Shell({ name, children }: { name: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
            <BackButton fallback="/cable-connect" size="small" />
            <Breadcrumbs
              aria-label={t("ocpp@stations.breadcrumb")}
              separator={<ChevronRightIcon fontSize="small" sx={flipInRtl} />}
            >
              <Link component={RouterLink} to="/cable-connect" underline="hover" color="text.secondary" variant="body2" fontWeight={600}>
                {t("ocpp@title")}
              </Link>
              <Typography variant="body2" color="text.primary" fontWeight={700} aria-current="page" noWrap sx={{ maxWidth: 320 }}>{name}</Typography>
            </Breadcrumbs>
          </Stack>
          {children}
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}

/** Level 2 of Cable Connect (/cable-connect/stations/:stationId): one station's chargers, summary, alerts and settings. */
export default function StationCableConnectScreen() {
  const { t } = useTranslation();
  const { stationId } = useParams<{ stationId: string }>();
  const id = Number(stationId);
  if (!Number.isInteger(id) || id <= 0)
    return (
      <Shell name="—">
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" fontWeight={600}>{t("ocpp@stations.notFound")}</Typography>
        </Paper>
      </Shell>
    );
  return <StationView key={id} id={id} />;
}

function StationView({ id }: { id: number }) {
  const { t } = useTranslation();
  const [viewId, setViewId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Same query as the station page's Cable Connect tab, so the cache is shared.
  const list = useOcppChargePoints({ chargingPointId: id, pageSize: 100 });
  const chargers = useMemo(() => list.data?.items ?? [], [list.data]);
  const station = useQuery({
    queryKey: ["charge-management", "station", id],
    queryFn: ({ signal }) => getStationById(id, signal),
    retry: false,
  });
  const alerts = useOcppAlerts({ openOnly: true, take: 50 });
  const visibility = useLiveVisibility(id);
  const details = useOcppChargePointDetails(chargers.map((c) => c.id));

  const g = useMemo(
    () => summarizeStation(id, chargers, alerts.data ?? [], station.data?.name ?? ""),
    [id, chargers, alerts.data, station.data?.name],
  );
  const detailById = new Map<number, OcppChargePointDetailDto>();
  details.forEach((q) => { if (q.data) detailById.set(q.data.id, q.data); });
  const allDetails = chargers.length > 0 && detailById.size === chargers.length;
  const energyToday = allDetails ? Array.from(detailById.values()).reduce((s, d) => s + (d.today?.energyKwh ?? 0), 0) : null;
  const sessionsToday = allDetails ? Array.from(detailById.values()).reduce((s, d) => s + (d.today?.sessions ?? 0), 0) : null;

  const name = station.data?.name || g.stationName || `#${id}`;
  const loading = list.isLoading;
  const dash = "—";
  const relColor = g.reliabilityAvg == null ? undefined : g.reliabilityAvg >= 95 ? "success.main" : g.reliabilityAvg >= 80 ? "warning.main" : "error.main";

  const refresh = () => { list.refetch(); alerts.refetch(); visibility.refetch(); details.forEach((q) => q.refetch()); };

  const v = visibility.data;

  return (
    <Shell name={name}>
      {/* Header */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ md: "flex-start" }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
            <Typography variant="h5" fontWeight={800} component="h1" sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
              {loading && !station.data ? <Skeleton width={220} /> : name}
            </Typography>
            <Typography variant="body2" color="text.secondary"><bdi>#{id}</bdi></Typography>
            {station.data?.cityName && (
              <Stack direction="row" spacing={0.25} alignItems="center" sx={{ color: "text.secondary" }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
                <Typography variant="body2">{station.data.cityName}</Typography>
              </Stack>
            )}
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {chargers.length > 0 && (
              <Tooltip title={t("ocpp@subscription.title")}>
                <span><SubscriptionChip sub={g.subscription} /></span>
              </Tooltip>
            )}
            {v && (
              <Tooltip title={t("ocpp@visibility.title")}>
                <Chip
                  size="small" variant="outlined" color={v.visibleToDrivers ? "success" : "default"}
                  icon={v.visibleToDrivers ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
                  label={v.visibleToDrivers ? t("ocpp@visibility.visible") : t("ocpp@visibility.hidden")}
                  sx={{ fontWeight: 700 }}
                />
              </Tooltip>
            )}
            {v?.adminBlocked && <Chip size="small" variant="outlined" color="error" label={t("ocpp@visibility.blocked")} sx={{ fontWeight: 600 }} />}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
          <Tooltip title={t("ocpp@refresh")}>
            <IconButton onClick={refresh} aria-label={t("ocpp@refresh")}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button
            variant="outlined" color="inherit" size="small" component={RouterLink} to={`/charge-management/${id}`}
            startIcon={<OpenInNewIcon fontSize="small" />}
            sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, borderColor: "divider", height: 36 }}
          >
            {t("ocpp@stations.profile")}
          </Button>
          <Button
            variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", height: 36 }}
          >
            {t("ocpp@addCharger")}
          </Button>
        </Stack>
      </Stack>

      {/* Station summary */}
      {list.isError && !list.data ? (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary" fontWeight={600}>{t("ocpp@stations.loadError")}</Typography>
          <Button size="small" onClick={() => list.refetch()} sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}>{t("ocpp@stations.retry")}</Button>
        </Paper>
      ) : (
        <>
          <SummaryCard label={t("ocpp@stations.summaryTitle")} c={loading ? undefined : g}>
            <Figure label={t("ocpp@kpi.openSessions")} value={loading ? dash : g.openSessions} />
            <Figure label={t("ocpp@kpi.faulted")} value={loading ? dash : g.faultedConnectors} color={g.faultedConnectors > 0 ? "error.main" : undefined} />
            <Figure label={t("ocpp@kpi.energyToday")} value={energyToday == null ? dash : energyToday.toFixed(1)} />
            <Figure label={t("ocpp@kpi.sessionsToday")} value={sessionsToday ?? dash} />
            <Figure
              label={t("ocpp@columns.reliability")} color={relColor}
              value={g.reliabilityAvg == null ? dash : <span dir="ltr">{g.reliabilityAvg.toFixed(1)}%</span>}
              hint={g.reliabilityAvg == null ? t("ocpp@reliability.notYet") : t("ocpp@stations.reliabilityHint")}
            />
          </SummaryCard>

          {/* This station's alerts */}
          <AlertsSection onOpenCharger={setViewId} chargingPointId={id} />

          {/* Chargers */}
          <Box component="section" aria-labelledby="station-chargers-title">
            <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 1.5 }}>
              <Typography id="station-chargers-title" variant="h6" fontWeight={800} component="h2">{t("ocpp@station.chargers")}</Typography>
              {!loading && <Typography variant="body2" color="text.secondary"><bdi>{t("ocpp@stations.chargers", { count: chargers.length })}</bdi></Typography>}
            </Stack>
            {loading ? (
              <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" } }}>
                {[0, 1].map((i) => <Skeleton key={i} variant="rounded" height={170} sx={{ borderRadius: 3 }} />)}
              </Box>
            ) : chargers.length === 0 ? (
              <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary" fontWeight={600}>{t("ocpp@station.noChargers")}</Typography>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)} sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}>
                  {t("ocpp@addCharger")}
                </Button>
              </Paper>
            ) : (
              <Box
                component="ul"
                sx={{
                  listStyle: "none", m: 0, p: 0, display: "grid", gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
                }}
              >
                {chargers.map((c) => (
                  <Box component="li" key={c.id} sx={{ minWidth: 0 }}>
                    <StationChargerCard row={c} detail={detailById.get(c.id)} onOpen={setViewId} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Station settings: subscription, live sharing, alert thresholds, cards */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2 }} component="section" aria-labelledby="station-settings-title">
        <Typography id="station-settings-title" variant="h6" fontWeight={800} component="h2" sx={{ mb: 2 }}>{t("ocpp@stations.settings")}</Typography>
        <StationChargersSection
          chargingPointId={id}
          stationName={name}
          ownerUserAccountId={station.data?.ownerId}
          ownerName={station.data?.ownerName}
          showChargers={false}
        />
      </Paper>

      <ChargerDetailDialog id={viewId} onClose={() => setViewId(null)} />
      <RegisterChargerDialog open={registerOpen} onClose={() => setRegisterOpen(false)} chargingPointId={id} onRegistered={setViewId} />
    </Shell>
  );
}
