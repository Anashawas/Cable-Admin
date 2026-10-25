import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import {
  Alert, Box, Button, Chip, IconButton, LinearProgress, Link, MenuItem, Paper, Skeleton, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppScreenContainer from "../../../app/components/AppScreenContainer";
import { useLanguageStore } from "../../../../stores";
import { LANGUAGE } from "../../../../constants/language-constants";
import { parseApiDate } from "../../../../utils/date-format";
import { useOcppAllChargePoints } from "../../hooks/use-ocpp";
import { useRefreshPayments, useStationSessionsInRange } from "../../hooks/use-connect-payments";
import type { OcppChargePointListItemDto } from "../../types/api";
import {
  PERIOD_PRESETS, SOURCES, STATUSES,
  aggregateByCharger, aggregateByStation, aggregateDaily, avgPerKwh, avgPerSession, bySource, costOf, daysIn,
  fmtDayKey, filterSessions, isValidRange, presetRange, sourceOf, toCsv, totalsOf,
  type DayRange, type PaymentSession, type PeriodPreset, type ShareRow, type SourceFilter, type StatusFilter,
} from "../../utils/payments";
import { fmtDay, fmtNum, fmtTime12, stopReasonLabel } from "../../utils/payments-format";
import ConnectTabs from "../ConnectTabs";
import { groupByStation } from "../station-groups";
import DailyRevenueTable from "./DailyRevenueTable";
import RevenueChart from "./RevenueChart";
import SessionValueDialog from "./SessionValueDialog";

const Ltr = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;
const panelSx = { p: 2, borderRadius: 3 } as const;
const head = { fontWeight: 700, color: "text.secondary", fontSize: 13, whiteSpace: "nowrap" } as const;
const num = { textAlign: "end", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" } as const;

/** One compact summary figure. */
function Figure({ label, value, sub, loading, children }: { label: string; value?: ReactNode; sub?: ReactNode; loading?: boolean; children?: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>{label}</Typography>
      {loading ? <Skeleton width="70%" height={28} /> : (
        <>
          {value != null && <Typography variant="h6" fontWeight={800} lineHeight={1.3} noWrap>{value}</Typography>}
          {children}
        </>
      )}
      {sub && !loading && <Typography variant="caption" color="text.secondary" display="block" noWrap>{sub}</Typography>}
    </Paper>
  );
}

const chargerLabel = (c: OcppChargePointListItemDto) => c.displayName?.trim() || c.chargePointId;

/**
 * Charging revenue across Cable Connect: the value of OCPP sessions priced by Cable's
 * time-of-use tariff, per station, per day and per session. There is no admin-wide
 * sessions endpoint, so each station's own list is paged back to the period start and
 * everything is filtered and summed here. No loyalty / QR data is used.
 */
export default function ConnectPaymentsScreen() {
  const { t } = useTranslation();
  const ar = useLanguageStore((s) => s.language) === LANGUAGE.AR;
  const [params, setParams] = useSearchParams();

  const stationParam = Number(params.get("station"));
  const stationId = Number.isInteger(stationParam) && stationParam > 0 ? stationParam : null;
  const setStation = (id: number | null) =>
    setParams((p) => {
      const next = new URLSearchParams(p);
      if (id == null) next.delete("station");
      else next.set("station", String(id));
      return next;
    }, { replace: true });

  const [preset, setPreset] = useState<PeriodPreset>("today");
  const [custom, setCustom] = useState<DayRange>(() => presetRange("last7"));
  const [chargerId, setChargerId] = useState<number | null>(null);
  const [source, setSource] = useState<SourceFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [openSession, setOpenSession] = useState<PaymentSession | null>(null);

  const today = fmtDayKey(new Date());
  const range: DayRange = preset === "custom" ? custom : presetRange(preset);
  const rangeValid = isValidRange(range);

  // Stations with chargers (no live polling here; the revenue figures are a snapshot).
  const chargersQuery = useOcppAllChargePoints(false);
  const stations = useMemo(
    () => groupByStation(chargersQuery.data ?? []).sort((a, b) => a.stationName.localeCompare(b.stationName)),
    [chargersQuery.data],
  );
  const station = stations.find((s) => s.chargingPointId === stationId) ?? null;
  const scopeIds = stationId != null ? [stationId] : stations.map((s) => s.chargingPointId);

  const query = useStationSessionsInRange(scopeIds, range, rangeValid && !!chargersQuery.data);
  const refreshPayments = useRefreshPayments();

  const stationNames = useMemo(() => new Map(stations.map((s) => [s.chargingPointId, s.stationName])), [stations]);
  const chargerNames = useMemo(() => new Map((chargersQuery.data ?? []).map((c) => [c.id, chargerLabel(c)])), [chargersQuery.data]);
  const stationNameOf = (s: PaymentSession) => stationNames.get(s.stationId) ?? `#${s.stationId}`;
  const chargerNameOf = (s: PaymentSession) => chargerNames.get(s.ocppChargePointId) ?? s.chargerName ?? `#${s.ocppChargePointId}`;

  const all = query.data?.items ?? [];
  const sessions = rangeValid ? filterSessions(all, { range, stationId, chargerId, source, status }) : [];
  const totals = totalsOf(sessions);
  const sourceTotals = bySource(sessions);
  const daily = aggregateDaily(sessions);
  const scopeStations = stationId != null
    ? [{ id: stationId, name: station?.stationName ?? `#${stationId}` }]
    : stations.map((s) => ({ id: s.chargingPointId, name: s.stationName }));
  const byStation = aggregateByStation(sessions, scopeStations);
  const byCharger = station
    ? aggregateByCharger(sessions, chargerNameOf, station.chargers.filter((c) => chargerId == null || c.id === chargerId).map((c) => ({ id: c.id, name: chargerLabel(c) })))
    : [];
  const chartDays = rangeValid ? daysIn({ from: range.from, to: range.to > today ? today : range.to }) : [];
  const singleDay = range.from === range.to;

  const loading = chargersQuery.isLoading || (rangeValid && scopeIds.length > 0 && query.isLoading);
  const perSession = avgPerSession(totals);
  const perKwh = avgPerKwh(totals);
  const capped = (query.data?.cappedStationIds ?? []).filter((id) => scopeIds.includes(id));
  const failed = (query.data?.failedStationIds ?? []).filter((id) => scopeIds.includes(id));

  const refresh = () => { chargersQuery.refetch(); refreshPayments(); };

  const exportCsv = () => {
    const dt = (v?: string | null) => { const d = parseApiDate(v); return d ? format(d, "yyyy-MM-dd HH:mm") : ""; };
    const header = [
      t("ocpp@payments.csv.id"), t("ocpp@payments.csv.date"), t("ocpp@payments.csv.started"), t("ocpp@payments.csv.stopped"),
      t("ocpp@payments.csv.station"), t("ocpp@payments.csv.charger"), t("ocpp@payments.csv.plug"), t("ocpp@payments.csv.startedBy"),
      t("ocpp@payments.csv.card"), t("ocpp@payments.csv.userId"), t("ocpp@payments.csv.durationMin"), t("ocpp@payments.csv.kwh"),
      t("ocpp@payments.csv.jod"), t("ocpp@payments.csv.status"), t("ocpp@payments.csv.stopReason"),
    ];
    const rows = daily.flatMap((d) => d.items).map((s) => [
      s.id,
      d10(s.startedAt),
      dt(s.startedAt),
      dt(s.stoppedAt),
      stationNameOf(s),
      chargerNameOf(s),
      s.connectorId,
      t(`ocpp@payments.source.${sourceOf(s)}`),
      sourceOf(s) === "Card" ? s.idTag : "",
      s.startedByUserId ?? "",
      s.durationSec != null ? Math.round(s.durationSec / 60) : "",
      s.energyKwh != null ? s.energyKwh.toFixed(2) : "",
      s.costJod == null && s.costFils == null ? "" : costOf(s).toFixed(3),
      t(s.isOpen ? "ocpp@payments.status.running" : "ocpp@payments.status.completed"),
      s.isOpen ? "" : stopReasonLabel(s, ar),
    ]);
    const blob = new Blob([toCsv(header, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cable-charging-revenue-${stationId ?? "all"}-${range.from}_${range.to}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const selectSx = { minWidth: { xs: "calc(50% - 4px)", sm: 170 }, flex: { xs: "1 1 calc(50% - 4px)", sm: "0 0 auto" } } as const;
  const jodText = (v: number) => <Ltr>{fmtNum(v, 3)} JOD</Ltr>;
  const lastTime = (v: string | null) => {
    if (!v) return "—";
    return singleDay ? fmtTime12(v, ar) : `${fmtDay(v, ar, true)} · ${fmtTime12(v, ar)}`;
  };

  const shareTable = (rows: ShareRow[], kind: "station" | "charger") => (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small" aria-label={t(kind === "station" ? "ocpp@payments.byStation.title" : "ocpp@payments.byCharger.title")} sx={{ "& td, & th": { py: 1.1 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={head}>{t(kind === "station" ? "ocpp@payments.byStation.station" : "ocpp@payments.byCharger.charger")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t(singleDay && range.from === today ? "ocpp@payments.byStation.sessionsToday" : "ocpp@payments.byStation.sessions")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.byStation.running")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.energy")}</TableCell>
            <TableCell sx={{ ...head, ...num }}>{t("ocpp@payments.daily.revenue")}</TableCell>
            <TableCell sx={{ ...head, ...num, minWidth: 110 }}>{t("ocpp@payments.byStation.share")}</TableCell>
            <TableCell sx={head}>{t("ocpp@payments.byStation.last")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r) => {
            const idle = r.sessions === 0 && r.open === 0;
            return (
              <TableRow key={r.id} hover sx={idle ? { "& td": { color: "text.disabled" } } : undefined}>
                <TableCell sx={{ minWidth: 160 }}>
                  {kind === "station" ? (
                    <Link
                      component={RouterLink} to={`/cable-connect/stations/${r.id}`} underline="hover" fontWeight={700}
                      color={idle ? "text.secondary" : "primary"}
                      aria-label={t("ocpp@payments.byStation.openStation", { name: r.name })}
                    >
                      <bdi>{r.name}</bdi>
                    </Link>
                  ) : <Typography variant="body2" fontWeight={700} color={idle ? "text.secondary" : undefined}><bdi>{r.name}</bdi></Typography>}
                </TableCell>
                <TableCell sx={{ ...num, fontWeight: 700 }}><Ltr>{r.sessions}</Ltr></TableCell>
                <TableCell sx={num}>
                  {r.open > 0
                    ? <Chip size="small" color="primary" label={<Ltr>{r.open}</Ltr>} sx={{ height: 20, fontWeight: 700 }} />
                    : <Ltr>0</Ltr>}
                </TableCell>
                <TableCell sx={num}><Ltr>{fmtNum(r.energyKwh, 2)} kWh</Ltr></TableCell>
                <TableCell sx={{ ...num, fontWeight: 800, color: idle ? undefined : "primary.main" }}>{jodText(r.revenueJod)}</TableCell>
                <TableCell sx={num}>
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
                    <LinearProgress
                      variant="determinate" value={r.sharePct} sx={{ width: 48, height: 6, borderRadius: 3 }}
                      aria-label={t("ocpp@payments.byStation.shareOf", { name: r.name, pct: fmtNum(r.sharePct, 1) })}
                    />
                    <Ltr>{fmtNum(r.sharePct, 1)}%</Ltr>
                  </Stack>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}><bdi>{lastTime(r.lastStartedAt)}</bdi></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2}>
          {/* Header */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ sm: "center" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" fontWeight={800} component="h1">{t("ocpp@payments.title")}</Typography>
              <Typography variant="body2" color="text.secondary">{t("ocpp@payments.subtitle")}</Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Tooltip title={t("ocpp@refresh")}>
                <span>
                  <IconButton onClick={refresh} disabled={query.isFetching} aria-label={t("ocpp@refresh")}><RefreshIcon /></IconButton>
                </span>
              </Tooltip>
              <Button
                variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={sessions.length === 0}
                sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2, height: 36 }}
              >
                {t("ocpp@payments.export")}
              </Button>
            </Stack>
          </Stack>

          <ConnectTabs value="payments" />

          {/* Filters: one row that wraps on narrow screens. */}
          <Paper variant="outlined" sx={panelSx} component="section" aria-label={t("ocpp@payments.filters.label")}>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} role="radiogroup" aria-label={t("ocpp@payments.filters.period")} sx={{ mb: 1.5 }}>
              {PERIOD_PRESETS.map((p) => (
                <Chip
                  key={p} label={t(`ocpp@payments.period.${p}`)} role="radio" aria-checked={preset === p}
                  color={preset === p ? "primary" : "default"} variant={preset === p ? "filled" : "outlined"}
                  onClick={() => setPreset(p)} sx={{ fontWeight: 600 }}
                />
              ))}
            </Stack>
            <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1} alignItems="flex-start">
              {preset === "custom" && (
                <>
                  <TextField
                    type="date" size="small" label={t("ocpp@payments.filters.from")} value={custom.from} sx={selectSx}
                    onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                    error={!rangeValid} helperText={!rangeValid ? t("ocpp@payments.filters.badRange") : undefined}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: custom.to || today } }}
                  />
                  <TextField
                    type="date" size="small" label={t("ocpp@payments.filters.to")} value={custom.to} sx={selectSx}
                    onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} error={!rangeValid}
                    slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: custom.from, max: today } }}
                  />
                </>
              )}
              <TextField
                select size="small" label={t("ocpp@payments.filters.station")} value={stationId ?? ""} sx={selectSx}
                onChange={(e) => { setStation(e.target.value === "" ? null : Number(e.target.value)); setChargerId(null); }}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
              >
                <MenuItem value="">{t("ocpp@payments.filters.allStations")}</MenuItem>
                {stationId != null && !station && <MenuItem value={stationId}><bdi>#{stationId}</bdi></MenuItem>}
                {stations.map((s) => <MenuItem key={s.chargingPointId} value={s.chargingPointId}><bdi>{s.stationName}</bdi></MenuItem>)}
              </TextField>
              <TextField
                select size="small" label={t("ocpp@payments.filters.charger")} value={chargerId ?? ""} sx={selectSx}
                disabled={!station}
                onChange={(e) => setChargerId(e.target.value === "" ? null : Number(e.target.value))}
                slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                helperText={!station ? t("ocpp@payments.filters.pickStation") : undefined}
              >
                <MenuItem value="">{t("ocpp@payments.filters.all")}</MenuItem>
                {station?.chargers.map((c) => <MenuItem key={c.id} value={c.id}><bdi>{chargerLabel(c)}</bdi></MenuItem>)}
              </TextField>
              <TextField
                select size="small" label={t("ocpp@payments.filters.source")} value={source} sx={selectSx}
                onChange={(e) => setSource(e.target.value as SourceFilter)}
              >
                {SOURCES.map((s) => (
                  <MenuItem key={s} value={s}>{s === "all" ? t("ocpp@payments.filters.all") : t(`ocpp@payments.source.${s}`)}</MenuItem>
                ))}
              </TextField>
              <TextField
                select size="small" label={t("ocpp@payments.filters.status")} value={status} sx={selectSx}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>{s === "all" ? t("ocpp@payments.filters.all") : t(`ocpp@payments.status.${s}`)}</MenuItem>
                ))}
              </TextField>
            </Stack>
            {rangeValid && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5 }}>
                {singleDay
                  ? <bdi>{fmtDay(range.from, ar)}</bdi>
                  : <><bdi>{fmtDay(range.from, ar)}</bdi>{" – "}<bdi>{fmtDay(range.to, ar)}</bdi></>}
              </Typography>
            )}
          </Paper>

          {query.isFetching && !loading && <LinearProgress aria-label={t("ocpp@payments.loading")} />}
          {chargersQuery.isError && !chargersQuery.data && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => chargersQuery.refetch()}>{t("ocpp@payments.retry")}</Button>}>
              {t("ocpp@payments.stationsError")}
            </Alert>
          )}
          {query.isError && (
            <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => query.refetch()}>{t("ocpp@payments.retry")}</Button>}>
              {t("ocpp@payments.loadError")}
            </Alert>
          )}
          {failed.length > 0 && (
            <Alert severity="warning">
              <bdi>{t("ocpp@payments.partial", { names: failed.map((id) => stationNames.get(id) ?? `#${id}`).join(ar ? "، " : ", ") })}</bdi>
            </Alert>
          )}
          {capped.length > 0 && (
            <Alert severity="warning">
              <bdi>{t("ocpp@payments.capped", { names: capped.map((id) => stationNames.get(id) ?? `#${id}`).join(ar ? "، " : ", ") })}</bdi>
            </Alert>
          )}

          {!chargersQuery.isLoading && chargersQuery.data && stations.length === 0 ? (
            <Paper variant="outlined" sx={{ ...panelSx, textAlign: "center", py: 5 }}>
              <Typography fontWeight={700}>{t("ocpp@payments.noStations")}</Typography>
            </Paper>
          ) : (
            <>
              {/* Summary */}
              <Box
                component="section" aria-label={t("ocpp@payments.summary.label")}
                sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", sm: "repeat(3, minmax(0, 1fr))", lg: "repeat(7, minmax(0, 1fr))" } }}
              >
                <Figure
                  loading={loading} label={t("ocpp@payments.summary.revenue")}
                  value={<Box component="span" sx={{ color: "primary.main" }}>{jodText(totals.revenueJod)}</Box>}
                  sub={t("ocpp@payments.summary.completedOnly")}
                />
                <Figure loading={loading} label={t("ocpp@payments.summary.energy")} value={<Ltr>{fmtNum(totals.energyKwh, 1)} kWh</Ltr>} />
                <Figure loading={loading} label={t("ocpp@payments.summary.sessions")} value={<Ltr>{totals.sessions}</Ltr>} />
                <Figure loading={loading} label={t("ocpp@payments.summary.perSession")} value={perSession == null ? "—" : jodText(perSession)} />
                <Figure loading={loading} label={t("ocpp@payments.summary.perKwh")} value={perKwh == null ? "—" : <Ltr>{fmtNum(perKwh, 3)} JOD/kWh</Ltr>} />
                <Figure
                  loading={loading} label={t("ocpp@payments.summary.running")}
                  value={<Box component="span" sx={{ color: totals.open > 0 ? "primary.main" : undefined }}><Ltr>{totals.open}</Ltr></Box>}
                  sub={<Tooltip title={t("ocpp@payments.summary.openHint")}><span tabIndex={0}><bdi>{t("ocpp@payments.summary.soFar")}</bdi> {jodText(totals.openRevenueJod)}</span></Tooltip>}
                />
                <Figure loading={loading} label={t("ocpp@payments.summary.bySource")}>
                  {(["Card", "App", "Operator"] as const).map((k) => (
                    <Stack key={k} direction="row" justifyContent="space-between" spacing={1} sx={{ mt: 0.25 }}>
                      <Typography variant="caption" fontWeight={700} noWrap>{t(`ocpp@payments.source.${k}`)} · <Ltr>{sourceTotals[k].sessions}</Ltr></Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{jodText(sourceTotals[k].revenueJod)}</Typography>
                    </Stack>
                  ))}
                </Figure>
              </Box>

              {/* By station (first) */}
              <Paper variant="outlined" sx={panelSx} component="section" aria-labelledby="pay-station-title">
                <Typography id="pay-station-title" variant="subtitle1" fontWeight={800} component="h2" sx={{ mb: 1 }}>{t("ocpp@payments.byStation.title")}</Typography>
                {loading ? <Skeleton variant="rounded" height={160} /> : shareTable(byStation, "station")}
              </Paper>

              {station && !loading && (
                <Paper variant="outlined" sx={panelSx} component="section" aria-labelledby="pay-charger-title">
                  <Typography id="pay-charger-title" variant="subtitle1" fontWeight={800} component="h2" sx={{ mb: 1 }}>{t("ocpp@payments.byCharger.title")}</Typography>
                  {shareTable(byCharger, "charger")}
                </Paper>
              )}

              {loading ? (
                <>
                  <Skeleton variant="rounded" height={220} sx={{ borderRadius: 3 }} />
                  <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
                </>
              ) : !rangeValid || query.isError ? null : sessions.length === 0 ? (
                <Paper variant="outlined" sx={{ ...panelSx, textAlign: "center", py: 4 }}>
                  <Typography fontWeight={700}>{t("ocpp@payments.empty")}</Typography>
                  <Typography variant="body2" color="text.secondary">{t("ocpp@payments.emptyHint")}</Typography>
                </Paper>
              ) : (
                <>
                  {chartDays.length > 1 && (
                    <Paper variant="outlined" sx={panelSx} component="section" aria-labelledby="pay-chart-title">
                      <Typography id="pay-chart-title" variant="subtitle1" fontWeight={800} component="h2">{t("ocpp@payments.chart.title")}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>{t("ocpp@payments.chart.hint")}</Typography>
                      <RevenueChart days={chartDays} rows={daily} ar={ar} />
                    </Paper>
                  )}
                  <Paper variant="outlined" sx={panelSx} component="section" aria-labelledby="pay-daily-title">
                    <Typography id="pay-daily-title" variant="subtitle1" fontWeight={800} component="h2" sx={{ mb: 1 }}>{t("ocpp@payments.daily.title")}</Typography>
                    <DailyRevenueTable
                      rows={daily} totals={totals} ar={ar}
                      stationName={stationNameOf} chargerName={chargerNameOf} onOpenSession={setOpenSession}
                    />
                  </Paper>
                </>
              )}
            </>
          )}

          <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ alignItems: "flex-start" }}>
            {t("ocpp@payments.note")}
          </Alert>
        </Stack>
      </Box>

      <SessionValueDialog
        session={openSession}
        stationName={openSession ? stationNameOf(openSession) : ""}
        chargerName={openSession ? chargerNameOf(openSession) : ""}
        ar={ar}
        onClose={() => setOpenSession(null)}
      />
    </AppScreenContainer>
  );
}

/** "YYYY-MM-DD" of a session start, for the CSV. */
function d10(v: string): string {
  const d = parseApiDate(v);
  return d ? fmtDayKey(d) : "";
}
