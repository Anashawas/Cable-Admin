import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Button, Chip, Grid, IconButton, InputAdornment, MenuItem, Pagination, Paper, Stack, TextField, Tooltip, Typography, useTheme,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import CableIcon from "@mui/icons-material/Cable";
import WifiIcon from "@mui/icons-material/Wifi";
import SyncIcon from "@mui/icons-material/Sync";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import PowerIcon from "@mui/icons-material/Power";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import BoltIcon from "@mui/icons-material/Bolt";
import ElectricMeterIcon from "@mui/icons-material/ElectricMeter";
import CreditCardOffIcon from "@mui/icons-material/CreditCardOff";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import AlertsSection from "./AlertsSection";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useOcppChargePoints, useOcppFleetHealth } from "../hooks/use-ocpp";
import type { OcppConnectionState } from "../types/api";
import ChargersTable from "./ChargersTable";
import ChargerDetailDialog from "./ChargerDetailDialog";
import RegisterChargerDialog from "./RegisterChargerDialog";

function Kpi({ icon, label, value, color }: { icon: ReactNode; label: string; value: ReactNode; color: string }) {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 3, lg: 12 / 7 }}>
      <Paper elevation={0} sx={{ borderRadius: 3, p: 1.75, border: 1, borderColor: "divider", height: "100%" }}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: `${color}18`, color }}>{icon}</Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800} lineHeight={1.1}>{value}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">{label}</Typography>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}

const PAGE_SIZE = 20;

export default function CableConnectScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const [search, setSearch] = useState("");
  // One request per pause in typing, not per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => { const h = setTimeout(() => setDebouncedSearch(search), 350); return () => clearTimeout(h); }, [search]);
  const [state, setState] = useState<OcppConnectionState | "">("");
  const [enabled, setEnabled] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [viewId, setViewId] = useState<number | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  const health = useOcppFleetHealth();
  const list = useOcppChargePoints({
    search: debouncedSearch.trim() || undefined,
    connectionState: state || undefined,
    isEnabled: enabled === "" ? undefined : enabled === "true",
    page,
    pageSize: PAGE_SIZE,
  });

  const h = health.data;
  const items = list.data?.items ?? [];
  const totalPages = list.data?.totalPages ?? 0;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5}>
          {/* Header */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "primary.main", color: "primary.contrastText", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(25,118,210,0.35)" }}>
                <CableIcon />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h5" fontWeight={800}>{t("ocpp@title")}</Typography>
                  <Chip size="small" color="success" variant="outlined" label={t("ocpp@live")} sx={{ fontWeight: 700, "& .MuiChip-label": { px: 1 } }} />
                </Stack>
                <Typography variant="body2" color="text.secondary">{t("ocpp@subtitle")}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Tooltip title={t("ocpp@refresh")}><IconButton onClick={() => { health.refetch(); list.refetch(); }}><RefreshIcon /></IconButton></Tooltip>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegisterOpen(true)} sx={{ borderRadius: 2, fontWeight: 700, textTransform: "none" }}>{t("ocpp@addCharger")}</Button>
            </Stack>
          </Stack>

          {/* KPIs */}
          <Grid container spacing={1.5}>
            <Kpi icon={<WifiIcon />} label={t("ocpp@kpi.online")} value={h?.online ?? "—"} color={theme.palette.success.main} />
            <Kpi icon={<SyncIcon />} label={t("ocpp@kpi.reconnecting")} value={h?.reconnecting ?? "—"} color={theme.palette.warning.main} />
            <Kpi icon={<WifiOffIcon />} label={t("ocpp@kpi.offline")} value={h?.offline ?? "—"} color={theme.palette.error.main} />
            <Kpi icon={<PowerIcon />} label={t("ocpp@kpi.freeConnectors")} value={h ? `${h.freeConnectors}/${h.totalConnectors}` : "—"} color={theme.palette.success.dark} />
            <Kpi icon={<ReportProblemIcon />} label={t("ocpp@kpi.faulted")} value={h?.faultedConnectors ?? "—"} color={theme.palette.error.dark} />
            <Kpi icon={<BoltIcon />} label={t("ocpp@kpi.openSessions")} value={h?.openSessions ?? "—"} color={theme.palette.primary.main} />
            <Kpi icon={<ElectricMeterIcon />} label={t("ocpp@kpi.energyToday")} value={h ? Number(h.energyTodayKwh).toFixed(1) : "—"} color={theme.palette.info.main} />
            <Kpi icon={<NotificationsActiveIcon />} label={t("ocpp@kpi.openAlerts")} value={h?.openAlerts ?? "—"} color={h && h.openAlerts > 0 ? theme.palette.error.main : theme.palette.text.disabled} />
          </Grid>
          {h && (h.stationsWithoutActiveSubscription > 0 || h.staleSessions > 0 || h.neverConnected > 0) && (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {h.stationsWithoutActiveSubscription > 0 && <Chip icon={<CreditCardOffIcon />} color="warning" variant="outlined" label={`${t("ocpp@kpi.noSubscription")}: ${h.stationsWithoutActiveSubscription}`} />}
              {h.staleSessions > 0 && <Chip color="warning" variant="outlined" label={`${t("ocpp@kpi.stale")}: ${h.staleSessions}`} />}
              {h.neverConnected > 0 && <Chip variant="outlined" label={`${t("ocpp@kpi.neverConnected")}: ${h.neverConnected}`} />}
            </Stack>
          )}

          {/* Alerts */}
          <AlertsSection onOpenCharger={setViewId} />

          {/* Filters */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
            <TextField
              placeholder={t("ocpp@searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              size="small" fullWidth InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <TextField select size="small" value={state} onChange={(e) => { setState(e.target.value as OcppConnectionState | ""); setPage(1); }} sx={{ minWidth: 180 }}>
              <MenuItem value="">{t("ocpp@state.all")}</MenuItem>
              <MenuItem value="Online">{t("ocpp@state.Online")}</MenuItem>
              <MenuItem value="Reconnecting">{t("ocpp@state.Reconnecting")}</MenuItem>
              <MenuItem value="Offline">{t("ocpp@state.Offline")}</MenuItem>
            </TextField>
            <TextField select size="small" value={enabled} onChange={(e) => { setEnabled(e.target.value as "" | "true" | "false"); setPage(1); }} sx={{ minWidth: 180 }}>
              <MenuItem value="">{t("ocpp@enabledFilter.all")}</MenuItem>
              <MenuItem value="true">{t("ocpp@enabledFilter.enabled")}</MenuItem>
              <MenuItem value="false">{t("ocpp@enabledFilter.disabled")}</MenuItem>
            </TextField>
          </Stack>

          <ChargersTable
            items={items}
            loading={list.isLoading}
            onView={setViewId}
            emptyText={search ? t("ocpp@noResults", { query: search }) : t("ocpp@noChargers")}
          />

          {totalPages > 1 && (
            <Stack direction="row" justifyContent="center">
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Stack>
          )}
        </Stack>
      </Box>

      <ChargerDetailDialog id={viewId} onClose={() => setViewId(null)} />
      <RegisterChargerDialog open={registerOpen} onClose={() => setRegisterOpen(false)} onRegistered={setViewId} />
    </AppScreenContainer>
  );
}
