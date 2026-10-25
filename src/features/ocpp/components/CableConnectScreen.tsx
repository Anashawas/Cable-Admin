import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, IconButton, InputAdornment, MenuItem, Paper, Skeleton, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import SpeedIcon from "@mui/icons-material/Speed";
import AlertsSection from "./AlertsSection";
import ConnectTabs from "./ConnectTabs";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useOcppAlerts, useOcppAllChargePoints, useOcppFleetHealth, useRecomputeReliability } from "../hooks/use-ocpp";
import { useOcppLive } from "../hooks/use-ocpp-live";
import { useAuthenticationStore, useSnackbarStore } from "../../../stores";

/** Admin roles (Admin, SuperAdmin) — only they may recompute reliability. */
const isAdminRole = (role?: { id: number; name: string } | null) =>
  !!role && (role.id === 2 || /^(super)?admin$/i.test(role.name?.replace(/[s_-]/g, "") ?? ""));
import type { OcppConnectionState, OcppFleetHealthDto } from "../types/api";
import ChargerDetailDialog from "./ChargerDetailDialog";
import RegisterChargerDialog from "./RegisterChargerDialog";
import SummaryCard, { Figure } from "./SummaryCard";
import StationCard from "./StationCard";
import { LiveIndicator } from "./ocpp-ui";
import { groupByStation, stationMatches, type StationFilters, type SubscriptionFilter } from "./station-groups";
import { useListState } from "../../../hooks";

/** Fleet at a glance: chargers online, free plugs, then the rest as small figures. */
function FleetSummary({ h }: { h?: OcppFleetHealthDto }) {
  const { t } = useTranslation();
  const dash = "—";
  return (
    <SummaryCard
      label={t("ocpp@summary.title")}
      c={h && { online: h.online, reconnecting: h.reconnecting, offline: h.offline, freeConnectors: h.freeConnectors, totalConnectors: h.totalConnectors }}
    >
      <Figure label={t("ocpp@kpi.openSessions")} value={h?.openSessions ?? dash} />
      <Figure label={t("ocpp@kpi.faulted")} value={h?.faultedConnectors ?? dash} color={h && h.faultedConnectors > 0 ? "error.main" : undefined} />
      <Figure label={t("ocpp@kpi.energyToday")} value={h ? Number(h.energyTodayKwh).toFixed(1) : dash} />
      <Figure label={t("ocpp@kpi.openAlerts")} value={h?.openAlerts ?? dash} />
      <Figure
        label={t("ocpp@kpi.noSubscription")} value={h?.stationsWithoutActiveSubscription ?? dash}
        color={h && h.stationsWithoutActiveSubscription > 0 ? "warning.main" : undefined}
        hint={t("ocpp@summary.noSubscriptionHint")}
      />
      {h && h.staleSessions > 0 && <Figure label={t("ocpp@kpi.stale")} value={h.staleSessions} color="warning.main" />}
      {h && h.neverConnected > 0 && <Figure label={t("ocpp@kpi.neverConnected")} value={h.neverConnected} />}
    </SummaryCard>
  );
}

const NO_FILTERS: StationFilters = { search: "", state: "", enabled: "", subscription: "" };

export default function CableConnectScreen() {
  const { t } = useTranslation();

  const [filters, setFilters] = useListState<StationFilters>("filters", NO_FILTERS);
  const set = <K extends keyof StationFilters>(k: K, v: StationFilters[K]) => setFilters((f) => ({ ...f, [k]: v }));
  const [viewId, setViewId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Pushed changes of the whole fleet while this screen is open; the polls slow down meanwhile.
  useOcppLive();
  const health = useOcppFleetHealth();
  const recompute = useRecomputeReliability();
  const canRecompute = isAdminRole(useAuthenticationStore((s) => s.user?.role));
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  const doRecompute = async () => {
    try { const n = await recompute.mutateAsync(); openSuccessSnackbar({ message: t("ocpp@reliability.recomputed", { count: n }) }); }
    catch (err) { openErrorSnackbar({ message: String((err as any)?.response?.data?.detail ?? (err as any)?.message ?? t("ocpp@toast.error")) }); }
  };

  // Every charger (the list is small), grouped by station on the client; filters run on the groups.
  const list = useOcppAllChargePoints();
  // Same query as the alerts card below, so it is shared, not fetched twice.
  const alerts = useOcppAlerts({ openOnly: true, take: 50 });
  const stations = useMemo(() => groupByStation(list.data ?? [], alerts.data ?? []), [list.data, alerts.data]);
  const visible = useMemo(() => stations.filter((g) => stationMatches(g, filters)), [stations, filters]);

  const filtersActive = filters.search !== "" || filters.state !== "" || filters.enabled !== "" || filters.subscription !== "";

  let emptyText = t("ocpp@stations.none");
  if (stations.length > 0) emptyText = filters.search ? t("ocpp@noResults", { query: filters.search }) : t("ocpp@stations.noMatch");

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h5" fontWeight={800} component="h1">{t("ocpp@title")}</Typography>
                <LiveIndicator />
              </Stack>
              <Typography variant="body2" color="text.secondary">{t("ocpp@subtitle")}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              <Tooltip title={t("ocpp@refresh")}>
                <IconButton onClick={() => { health.refetch(); list.refetch(); alerts.refetch(); }} aria-label={t("ocpp@refresh")}><RefreshIcon /></IconButton>
              </Tooltip>
              {canRecompute && (
              <Tooltip title={t("ocpp@reliability.recomputeHint")}>
                <span>
                  <Button
                    variant="outlined" color="inherit" size="small" startIcon={<SpeedIcon fontSize="small" />}
                    disabled={recompute.isPending} onClick={doRecompute}
                    sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, borderColor: "divider", height: 36 }}
                  >
                    {t("ocpp@reliability.recompute")}
                  </Button>
                </span>
              </Tooltip>
              )}
              <Button
                variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none", height: 36 }}
              >
                {t("ocpp@addCharger")}
              </Button>
            </Stack>
          </Stack>

          <ConnectTabs value="overview" />

          <FleetSummary h={health.data} />

          {/* Alerts (fleet-wide, compact) */}
          <AlertsSection onOpenCharger={setViewId} compact />

          {/* Stations */}
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography variant="h6" fontWeight={800} component="h2">{t("ocpp@stations.title")}</Typography>
            {list.data && (
              <Typography variant="body2" color="text.secondary">
                <bdi>{filtersActive ? t("ocpp@stations.countOf", { shown: visible.length, total: stations.length }) : t("ocpp@stations.count", { count: stations.length })}</bdi>
              </Typography>
            )}
          </Stack>

          {/* Filters */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
            <TextField
              placeholder={t("ocpp@stations.searchPlaceholder")} value={filters.search} onChange={(e) => set("search", e.target.value)}
              size="small" fullWidth sx={{ flex: 1 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
                htmlInput: { "aria-label": t("ocpp@stations.searchPlaceholder") },
              }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ flexShrink: 0 }}>
              <TextField
                select size="small" label={t("ocpp@filters.state")} value={filters.state}
                onChange={(e) => set("state", e.target.value as OcppConnectionState | "")}
                sx={{ minWidth: { xs: 0, md: 160 }, flex: { xs: 1, md: "none" } }}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("ocpp@state.all")}</MenuItem>
                <MenuItem value="Online">{t("ocpp@state.Online")}</MenuItem>
                <MenuItem value="Reconnecting">{t("ocpp@state.Reconnecting")}</MenuItem>
                <MenuItem value="Offline">{t("ocpp@state.Offline")}</MenuItem>
              </TextField>
              <TextField
                select size="small" label={t("ocpp@filters.subscription")} value={filters.subscription}
                onChange={(e) => set("subscription", e.target.value as SubscriptionFilter)}
                sx={{ minWidth: { xs: 0, md: 160 }, flex: { xs: 1, md: "none" } }}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("ocpp@subscriptionFilter.all")}</MenuItem>
                <MenuItem value="on">{t("ocpp@subscriptionFilter.on")}</MenuItem>
                <MenuItem value="off">{t("ocpp@subscriptionFilter.off")}</MenuItem>
                <MenuItem value="none">{t("ocpp@subscriptionFilter.none")}</MenuItem>
              </TextField>
              <TextField
                select size="small" label={t("ocpp@filters.enabled")} value={filters.enabled}
                onChange={(e) => set("enabled", e.target.value as "" | "true" | "false")}
                sx={{ minWidth: { xs: 0, md: 160 }, flex: { xs: 1, md: "none" } }}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("ocpp@enabledFilter.all")}</MenuItem>
                <MenuItem value="true">{t("ocpp@enabledFilter.enabled")}</MenuItem>
                <MenuItem value="false">{t("ocpp@enabledFilter.disabled")}</MenuItem>
              </TextField>
            </Stack>
            {filtersActive && (
              <Button size="small" onClick={() => setFilters(NO_FILTERS)} sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0, alignSelf: { xs: "flex-start", md: "center" } }}>
                {t("ocpp@filters.clear")}
              </Button>
            )}
          </Stack>

          {list.isLoading ? (
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" } }}>
              {[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={190} sx={{ borderRadius: 3 }} />)}
            </Box>
          ) : list.isError && !list.data ? (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 4, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>{t("ocpp@stations.loadError")}</Typography>
              <Button size="small" onClick={() => list.refetch()} sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}>{t("ocpp@stations.retry")}</Button>
            </Paper>
          ) : visible.length === 0 ? (
            <Paper variant="outlined" sx={{ borderRadius: 3, p: 5, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary" fontWeight={600}>{emptyText}</Typography>
            </Paper>
          ) : (
            <Box
              component="ul"
              aria-label={t("ocpp@stations.title")}
              sx={{
                listStyle: "none", m: 0, p: 0, display: "grid", gap: 2,
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              {visible.map((g) => (
                <Box component="li" key={g.chargingPointId} sx={{ minWidth: 0 }}>
                  <StationCard g={g} />
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </Box>

      <ChargerDetailDialog id={viewId} onClose={() => setViewId(null)} />
      <RegisterChargerDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onRegistered={setViewId} />
    </AppScreenContainer>
  );
}
