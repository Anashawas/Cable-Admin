import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Box, Stack, Typography, Chip, Grid, Paper, Skeleton, useTheme, Divider } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LineChart } from "@mui/x-charts/LineChart";
import InsightsIcon from "@mui/icons-material/Insights";
import PeopleIcon from "@mui/icons-material/People";
import { useAnalyticsSummary } from "../hooks/use-analytics";
import type { AnalyticsEntityType } from "../types/api";

interface AnalyticsPanelProps {
  entityType: AnalyticsEntityType;
  entityId: number | null;
  enabled?: boolean;
}

/** Fixed event-type order → color slot. Color follows the event, never its rank. */
const EVENT_ORDER = [1, 2, 3, 4, 20, 21];

function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function endOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return startOfDay(d); }
function dayKey(iso: string) { return iso.slice(0, 10); }

export default function AnalyticsPanel({ entityType, entityId, enabled = true }: AnalyticsPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [from, setFrom] = useState<Date | null>(daysAgo(30));
  const [to, setTo] = useState<Date | null>(new Date());

  // Fixed color slots from the app theme.
  const colors = useMemo(
    () => [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main, theme.palette.secondary.main, theme.palette.info.main],
    [theme]
  );
  const colorFor = (eventType: number) => colors[(EVENT_ORDER.indexOf(eventType) + colors.length) % colors.length];

  const range = useMemo(() => ({
    from: from ? startOfDay(from).toISOString() : undefined,
    to: to ? endOfDay(to).toISOString() : undefined,
  }), [from, to]);

  const { data, isLoading } = useAnalyticsSummary(entityType, entityId, range, enabled);

  const setPreset = (n: number) => { setFrom(daysAgo(n)); setTo(new Date()); };
  const activePreset = useMemo(() => {
    if (!from || !to) return null;
    const diff = Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
    const isToday = startOfDay(to).getTime() === startOfDay(new Date()).getTime();
    return isToday && [7, 30, 90].includes(diff) ? diff : null;
  }, [from, to]);

  // Totals sorted by fixed event order for stable tile/legend order.
  const totals = useMemo(
    () => [...(data?.totals ?? [])].sort((a, b) => EVENT_ORDER.indexOf(a.eventType) - EVENT_ORDER.indexOf(b.eventType)),
    [data]
  );

  // CTR for banners (clicks / views).
  const ctr = useMemo(() => {
    if (entityType !== "Banner") return null;
    const views = data?.totals.find((x) => x.eventType === 20)?.totalCount ?? 0;
    const clicks = data?.totals.find((x) => x.eventType === 21)?.totalCount ?? 0;
    if (views === 0) return null;
    return (clicks / views) * 100;
  }, [data, entityType]);

  // Pivot daily → one series per event type, aligned to the sorted day axis.
  const chart = useMemo(() => {
    const daily = data?.daily ?? [];
    if (daily.length === 0) return null;
    const dayKeys = Array.from(new Set(daily.map((d) => dayKey(d.day)))).sort();
    const byType = new Map<number, { name: string; map: Map<string, number> }>();
    for (const d of daily) {
      if (!byType.has(d.eventType)) byType.set(d.eventType, { name: d.eventName, map: new Map() });
      byType.get(d.eventType)!.map.set(dayKey(d.day), d.count);
    }
    const series = Array.from(byType.entries())
      .sort((a, b) => EVENT_ORDER.indexOf(a[0]) - EVENT_ORDER.indexOf(b[0]))
      .map(([eventType, info]) => ({
        label: info.name,
        color: colorFor(eventType),
        data: dayKeys.map((k) => info.map.get(k) ?? 0),
        showMark: dayKeys.length <= 31,
        curve: "monotoneX" as const,
      }));
    const labels = dayKeys.map((k) => new Date(k).toLocaleDateString(undefined, { month: "short", day: "numeric" }));
    return { labels, series };
  }, [data, colors]);

  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}>
        <InsightsIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t("analytics@title")}</Typography>
      </Stack>

      {/* Range controls */}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={0.75}>
          {[7, 30, 90].map((n) => (
            <Chip
              key={n} label={t("analytics@lastNDays", { count: n })} size="small"
              onClick={() => setPreset(n)}
              color={activePreset === n ? "primary" : "default"}
              variant={activePreset === n ? "filled" : "outlined"}
              sx={{ fontWeight: 600, cursor: "pointer" }}
            />
          ))}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <DatePicker label={t("analytics@from")} value={from} onChange={setFrom} maxDate={to ?? undefined} slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }} />
        <DatePicker label={t("analytics@to")} value={to} onChange={setTo} minDate={from ?? undefined} slotProps={{ textField: { size: "small", sx: { minWidth: 150 } } }} />
      </Stack>

      {isLoading ? (
        <Stack spacing={2}>
          <Grid container spacing={1.5}>{[0, 1, 2].map((i) => <Grid size={{ xs: 6, sm: 3 }} key={i}><Skeleton variant="rounded" height={72} /></Grid>)}</Grid>
          <Skeleton variant="rounded" height={240} />
        </Stack>
      ) : !data || totals.length === 0 ? (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 2, border: "1px dashed", borderColor: "divider", textAlign: "center" }}>
          <InsightsIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">{t("analytics@noData")}</Typography>
        </Paper>
      ) : (
        <Stack spacing={2}>
          {/* KPI tiles */}
          <Grid container spacing={1.5}>
            {totals.map((tot) => {
              const c = colorFor(tot.eventType);
              return (
                <Grid size={{ xs: 6, sm: 3 }} key={tot.eventType}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider", borderLeft: `3px solid ${c}`, height: "100%" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} noWrap>{tot.eventName}</Typography>
                    <Typography variant="h5" fontWeight={800} sx={{ color: c, lineHeight: 1.2 }}>{tot.totalCount.toLocaleString()}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <PeopleIcon sx={{ fontSize: 13, color: "text.disabled" }} />
                      <Typography variant="caption" color="text.secondary">{t("analytics@uniqueUsers", { count: tot.uniqueUsers })}</Typography>
                    </Stack>
                  </Paper>
                </Grid>
              );
            })}
            {ctr != null && (
              <Grid size={{ xs: 6, sm: 3 }}>
                <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider", borderLeft: `3px solid ${theme.palette.info.main}`, height: "100%" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{t("analytics@ctr")}</Typography>
                  <Typography variant="h5" fontWeight={800} color="info.main" sx={{ lineHeight: 1.2 }}>{ctr.toFixed(1)}%</Typography>
                  <Typography variant="caption" color="text.secondary">{t("analytics@clicksPerView")}</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Daily time-series */}
          {chart && (
            <Paper elevation={0} sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider" }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ pl: 1 }}>{t("analytics@dailyTrend")}</Typography>
              <LineChart
                height={260}
                xAxis={[{ scaleType: "point", data: chart.labels, tickLabelStyle: { fontSize: 10 } }]}
                series={chart.series}
                margin={{ top: 24, right: 20, bottom: 30, left: 45 }}
              />
            </Paper>
          )}
          <Divider />
          <Typography variant="caption" color="text.disabled">
            {t("analytics@rangeNote", {
              from: data.fromUtc ? new Date(data.fromUtc).toLocaleDateString() : "",
              to: data.toUtc ? new Date(data.toUtc).toLocaleDateString() : "",
            })}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
