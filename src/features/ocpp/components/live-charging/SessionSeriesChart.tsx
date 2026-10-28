import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Box, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { parseApiDate } from "../../../../utils/date-format";
import type { OcppSessionSampleDto } from "../../types/api";

/**
 * The session's readings (live.series, up to 120 points, oldest first): power in kW on the
 * left axis and, when the car reports it, the battery % on the right one. Time runs left to right in both languages.
 */
export default function SessionSeriesChart({ series }: { series: OcppSessionSampleDto[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const points = series
    .map((s) => ({ at: parseApiDate(s.at), kw: s.powerW != null ? s.powerW / 1000 : null, soc: s.socPercent ?? null }))
    .filter((p): p is { at: Date; kw: number | null; soc: number | null } => p.at != null);

  if (points.length < 2)
    return <Typography variant="body2" color="text.secondary">{t("liveCharging@detail.noSeries")}</Typography>;

  const hasSoc = points.some((p) => p.soc != null);

  return (
    <Box role="img" aria-label={t("liveCharging@detail.chartLabel", { count: points.length })} dir="ltr">
      <LineChart
        height={240}
        xAxis={[{
          scaleType: "time",
          data: points.map((p) => p.at),
          valueFormatter: (d: Date) => format(d, "HH:mm"),
          tickLabelStyle: { fontSize: 10 },
        }]}
        yAxis={[
          { id: "kw", label: "kW", tickLabelStyle: { fontSize: 10 }, position: "left" as const },
          ...(hasSoc ? [{ id: "soc", label: "%", min: 0, max: 100, tickLabelStyle: { fontSize: 10 }, position: "right" as const }] : []),
        ]}
        series={[
          {
            id: "kw", yAxisId: "kw", label: t("liveCharging@detail.power"), data: points.map((p) => p.kw),
            showMark: false, connectNulls: true, color: theme.palette.primary.main,
            valueFormatter: (v: number | null) => (v == null ? "—" : `${v.toFixed(1)} kW`),
          },
          ...(hasSoc ? [{
            id: "soc", yAxisId: "soc", label: t("liveCharging@detail.battery"), data: points.map((p) => p.soc),
            showMark: false, connectNulls: true, color: theme.palette.success.main,
            valueFormatter: (v: number | null) => (v == null ? "—" : `${v}%`),
          }] : []),
        ]}
        margin={{ top: 16, bottom: 8, left: 8, right: 8 }}
      />
    </Box>
  );
}
