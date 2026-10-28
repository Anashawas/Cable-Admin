import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useDebounce } from "use-debounce";
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton, InputAdornment, LinearProgress, MenuItem, Paper, Stack, TextField, Tooltip, Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import AppScreenContainer from "../../../app/components/AppScreenContainer";
import { useSnackbarStore } from "../../../../stores";
import { useOcppAllChargePoints } from "../../hooks/use-ocpp";
import { useAdminSessions } from "../../hooks/use-live-charging";
import { exportAdminSessions } from "../../services/live-charging-service";
import { START_METHODS, type OcppStartMethod, type SessionLimitFilter, type SessionStatusFilter } from "../../types/live-charging";
import {
  NO_SESSION_FILTERS, filtersActive, filtersFromSearch, filtersToQuery, filtersToSearch, fmtJod, saveBlob, type SessionUrlFilters,
} from "../../utils/live-charging";
import { fmtNum } from "../../utils/payments-format";
import ConnectTabs from "../ConnectTabs";
import { groupByStation } from "../station-groups";
import SessionsTable from "./SessionsTable";
import { Figure, Ltr, useProblemToast } from "./live-ui";

const DEFAULT_PAGE_SIZE = 20;

/**
 * «جلسات الشحن» — every Cable Connect session for the admin (GET api/admin/ocpp/sessions):
 * filters kept in the URL (?station=, ?user=, …), totals over everything matched, server paging
 * and the CSV export of the same filters.
 */
export default function ChargingSessionsScreen() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromSearch(params), [params]);
  const [search, setSearch] = useState(filters.q);
  const [debounced] = useDebounce(search, 400);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [exporting, setExporting] = useState(false);
  const openSuccessSnackbar = useSnackbarStore((s) => s.openSuccessSnackbar);
  const toastError = useProblemToast();

  const update = (patch: Partial<SessionUrlFilters>) => {
    setParams(filtersToSearch({ ...filters, ...patch }), { replace: true });
    setPage(0);
  };

  // The search box writes to the URL once typing pauses.
  useEffect(() => {
    if (debounced.trim() !== filters.q.trim()) update({ q: debounced });
  }, [debounced]);

  const chargersQuery = useOcppAllChargePoints(false);
  const stations = useMemo(
    () => groupByStation(chargersQuery.data ?? []).sort((a, b) => a.stationName.localeCompare(b.stationName)),
    [chargersQuery.data],
  );
  const station = stations.find((s) => s.chargingPointId === filters.station) ?? null;

  const rangeBad = !!filters.from && !!filters.to && filters.from > filters.to;
  const query = filtersToQuery(filters, page + 1, pageSize);
  const list = useAdminSessions(query, !rangeBad);
  const data = list.data;
  const totals = data?.totals;

  const doExport = async () => {
    setExporting(true);
    try {
      const f = await exportAdminSessions(query);
      saveBlob(f.blob, f.fileName);
      openSuccessSnackbar({ message: t("liveCharging@sessions.exported") });
    } catch (err) {
      await toastError(err);
    } finally {
      setExporting(false);
    }
  };

  const userName = data?.items.find((s) => s.driver?.userId === filters.user)?.driver?.name
    ?? data?.items.find((s) => s.startedByStaff?.userId === filters.user)?.startedByStaff?.name;
  const selectSx = { minWidth: { xs: "calc(50% - 4px)", sm: 160 }, flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" } } as const;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} component="h1">{t("liveCharging@sessions.title")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("liveCharging@sessions.subtitle")}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t("refresh")}>
                <span><IconButton onClick={() => list.refetch()} disabled={list.isFetching} aria-label={t("refresh")}><RefreshIcon /></IconButton></span>
              </Tooltip>
              <Button
                variant="outlined" size="small" onClick={doExport} disabled={exporting || rangeBad || !data || data.totalCount === 0}
                startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, height: 36 }}
              >
                {t("liveCharging@sessions.export")}
              </Button>
            </Stack>
          </Stack>

          <ConnectTabs value="sessions" />

          {/* Filters */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }} component="section" aria-label={t("liveCharging@filters.label")}>
            <TextField
              placeholder={t("liveCharging@filters.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)}
              size="small" fullWidth sx={{ mb: 1.5 }}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
                htmlInput: { "aria-label": t("liveCharging@filters.searchPlaceholder") },
              }}
            />
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} alignItems="flex-start">
              <TextField
                type="date" size="small" label={t("liveCharging@filters.from")} value={filters.from} sx={selectSx}
                onChange={(e) => update({ from: e.target.value })} error={rangeBad}
                helperText={rangeBad ? t("liveCharging@filters.badRange") : undefined}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: filters.to || undefined } }}
              />
              <TextField
                type="date" size="small" label={t("liveCharging@filters.to")} value={filters.to} sx={selectSx}
                onChange={(e) => update({ to: e.target.value })} error={rangeBad}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: filters.from || undefined } }}
              />
              <TextField
                select size="small" label={t("liveCharging@filters.station")} value={filters.station ?? ""} sx={selectSx}
                onChange={(e) => update({ station: e.target.value === "" ? null : Number(e.target.value), charger: null })}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("liveCharging@filters.allStations")}</MenuItem>
                {filters.station != null && !station && <MenuItem value={filters.station}><bdi>#{filters.station}</bdi></MenuItem>}
                {stations.map((s) => <MenuItem key={s.chargingPointId} value={s.chargingPointId}><bdi>{s.stationName}</bdi></MenuItem>)}
              </TextField>
              <TextField
                select size="small" label={t("liveCharging@filters.charger")} value={filters.charger ?? ""} sx={selectSx}
                disabled={!station}
                onChange={(e) => update({ charger: e.target.value === "" ? null : Number(e.target.value) })}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                helperText={!station ? t("liveCharging@filters.pickStation") : undefined}
              >
                <MenuItem value="">{t("liveCharging@filters.all")}</MenuItem>
                {station?.chargers.map((c) => <MenuItem key={c.id} value={c.id}><bdi>{c.displayName?.trim() || c.chargePointId}</bdi></MenuItem>)}
              </TextField>
              <TextField
                select size="small" label={t("liveCharging@filters.method")} value={filters.source} sx={selectSx}
                onChange={(e) => update({ source: e.target.value as OcppStartMethod | "" })}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("liveCharging@filters.all")}</MenuItem>
                {START_METHODS.map((m) => <MenuItem key={m} value={m}>{t(`liveCharging@method.${m}`)}</MenuItem>)}
              </TextField>
              <TextField
                select size="small" label={t("liveCharging@filters.status")} value={filters.status} sx={selectSx}
                onChange={(e) => update({ status: e.target.value as SessionStatusFilter })}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("liveCharging@filters.all")}</MenuItem>
                <MenuItem value="open">{t("liveCharging@state.open")}</MenuItem>
                <MenuItem value="closed">{t("liveCharging@state.closed")}</MenuItem>
              </TextField>
              <TextField
                select size="small" label={t("liveCharging@filters.limit")} value={filters.limit} sx={selectSx}
                onChange={(e) => update({ limit: e.target.value as SessionLimitFilter })}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("liveCharging@filters.all")}</MenuItem>
                <MenuItem value="none">{t("liveCharging@filters.noLimit")}</MenuItem>
                {(["Jod", "Kwh", "Soc"] as const).map((k) => <MenuItem key={k} value={k}>{t(`ocpp@limit.kind.${k}`)}</MenuItem>)}
              </TextField>
            </Stack>
            {(filters.user != null || filtersActive(filters)) && (
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                {filters.user != null && (
                  <Chip
                    size="small" color="primary" variant="outlined"
                    label={<bdi>{t("liveCharging@filters.userChip", { name: userName || `#${filters.user}` })}</bdi>}
                    onDelete={() => update({ user: null })}
                  />
                )}
                <Button
                  size="small" onClick={() => { setSearch(""); setParams(filtersToSearch(NO_SESSION_FILTERS), { replace: true }); setPage(0); }}
                  sx={{ textTransform: "none", fontWeight: 600 }}
                >
                  {t("liveCharging@filters.clear")}
                </Button>
              </Stack>
            )}
          </Paper>

          {/* Totals over everything the filters match */}
          <Box
            component="section" aria-label={t("liveCharging@totals.label")}
            sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}
          >
            <Figure loading={list.isLoading} label={t("liveCharging@totals.sessions")} value={<Ltr>{totals?.sessions ?? 0}</Ltr>} />
            <Figure loading={list.isLoading} label={t("liveCharging@totals.energy")} value={<Ltr>{fmtNum(totals?.energyKwh ?? 0, 2)} kWh</Ltr>} />
            <Figure loading={list.isLoading} label={t("liveCharging@totals.cost")} color="primary.main" value={<Ltr>{fmtJod(totals?.costJod ?? 0)}</Ltr>} sub={t("liveCharging@totals.costHint")} />
            <Figure
              loading={list.isLoading} label={t("liveCharging@totals.openNow")}
              color={(totals?.openNow ?? 0) > 0 ? "primary.main" : undefined}
              value={<Ltr>{totals?.openNow ?? 0}</Ltr>} sub={t("liveCharging@totals.openNowHint")}
            />
          </Box>

          {list.isFetching && !list.isLoading && <LinearProgress aria-label={t("liveCharging@loading")} />}
          {list.isError && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => list.refetch()}>{t("liveCharging@retry")}</Button>}>
              {t("liveCharging@sessions.loadError")}
            </Alert>
          )}

          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
            <SessionsTable
              rows={data?.items ?? []}
              loading={list.isLoading}
              emptyText={filtersActive(filters) ? t("liveCharging@sessions.noMatch") : t("liveCharging@sessions.empty")}
              paging={{
                page,
                pageSize,
                total: data?.totalCount ?? 0,
                onPage: setPage,
                onPageSize: (n) => { setPageSize(n); setPage(0); },
              }}
            />
          </Paper>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
