import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Box, Button, IconButton, LinearProgress, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../../app/components/AppScreenContainer";
import { useOcppAllChargePoints } from "../../hooks/use-ocpp";
import { useConnectorReports } from "../../hooks/use-live-charging";
import { nextDay } from "../../utils/live-charging";
import ConnectTabs from "../ConnectTabs";
import { groupByStation } from "../station-groups";
import PlugReportsList from "./PlugReportsList";
import { Figure, Ltr } from "./live-ui";

/**
 * «بلاغات المقابس» — "the plug didn't work" reports from drivers, grouped per plug
 * ("3 reports on this plug today"), so a broken plug shows up rather than single reports.
 */
export default function PlugReportsScreen() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"open" | "all">("open");
  const [stationId, setStationId] = useState<number | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const rangeBad = !!from && !!to && from > to;

  const chargersQuery = useOcppAllChargePoints(false);
  const stations = useMemo(
    () => groupByStation(chargersQuery.data ?? []).sort((a, b) => a.stationName.localeCompare(b.stationName)),
    [chargersQuery.data],
  );

  const reports = useConnectorReports({
    status,
    chargingPointId: stationId,
    from: from ? `${from}T00:00:00` : undefined,
    to: to ? `${nextDay(to)}T00:00:00` : undefined,
  }, !rangeBad);
  const groups = reports.data ?? [];
  const open = groups.reduce((s, g) => s + g.openReports, 0);
  const today = groups.reduce((s, g) => s + g.reportsToday, 0);
  const suspected = groups.filter((g) => g.suspectedIssue).length;
  const selectSx = { minWidth: { xs: "calc(50% - 4px)", sm: 170 }, flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" } } as const;

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} component="h1">{t("liveCharging@plugReports.title")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("liveCharging@plugReports.subtitle")}</Typography>
            </Box>
            <Tooltip title={t("refresh")}>
              <span><IconButton onClick={() => reports.refetch()} disabled={reports.isFetching} aria-label={t("refresh")}><RefreshIcon /></IconButton></span>
            </Tooltip>
          </Stack>

          <ConnectTabs value="reports" />

          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }} component="section" aria-label={t("liveCharging@filters.label")}>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} alignItems="flex-start">
              <ToggleButtonGroup
                size="small" exclusive value={status} onChange={(_e, v) => v && setStatus(v)}
                aria-label={t("liveCharging@filters.status")} sx={{ height: 40 }}
              >
                <ToggleButton value="open" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@plugReports.filterOpen")}</ToggleButton>
                <ToggleButton value="all" sx={{ textTransform: "none", fontWeight: 700 }}>{t("liveCharging@plugReports.filterAll")}</ToggleButton>
              </ToggleButtonGroup>
              <TextField
                select size="small" label={t("liveCharging@filters.station")} value={stationId ?? ""} sx={selectSx}
                onChange={(e) => setStationId(e.target.value === "" ? null : Number(e.target.value))}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("liveCharging@filters.allStations")}</MenuItem>
                {stations.map((s) => <MenuItem key={s.chargingPointId} value={s.chargingPointId}><bdi>{s.stationName}</bdi></MenuItem>)}
              </TextField>
              <TextField
                type="date" size="small" label={t("liveCharging@filters.from")} value={from} sx={selectSx}
                onChange={(e) => setFrom(e.target.value)} error={rangeBad} helperText={rangeBad ? t("liveCharging@filters.badRange") : undefined}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                type="date" size="small" label={t("liveCharging@filters.to")} value={to} sx={selectSx}
                onChange={(e) => setTo(e.target.value)} error={rangeBad}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
          </Paper>

          <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } }}>
            <Figure loading={reports.isLoading} label={t("liveCharging@plugReports.kpiPlugs")} value={<Ltr>{groups.length}</Ltr>} />
            <Figure loading={reports.isLoading} label={t("liveCharging@plugReports.kpiOpen")} value={<Ltr>{open}</Ltr>} color={open > 0 ? "warning.main" : undefined} />
            <Figure loading={reports.isLoading} label={t("liveCharging@plugReports.kpiToday")} value={<Ltr>{today}</Ltr>} />
            <Figure
              loading={reports.isLoading} label={t("liveCharging@plugReports.kpiSuspected")} value={<Ltr>{suspected}</Ltr>}
              color={suspected > 0 ? "error.main" : undefined} sub={t("liveCharging@plugReports.suspectedRule")}
            />
          </Box>

          {reports.isFetching && !reports.isLoading && <LinearProgress aria-label={t("liveCharging@loading")} />}
          {reports.isError && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => reports.refetch()}>{t("liveCharging@retry")}</Button>}>
              {t("liveCharging@plugReports.loadError")}
            </Alert>
          )}

          <PlugReportsList
            groups={groups} loading={reports.isLoading}
            emptyText={status === "open" ? t("liveCharging@plugReports.emptyOpen") : t("liveCharging@plugReports.empty")}
          />
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
