import { useTranslation } from "react-i18next";
import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { fmtDay, fmtNum } from "../../utils/payments-format";
import type { DayRow } from "../../utils/payments";

const HEIGHT = 168;

/**
 * Value per day as plain CSS bars — one series, so no legend; the title names it.
 * Each column is a focusable hit target with a tooltip carrying the day's value,
 * energy and sessions; the daily table below is the table view.
 */
export default function RevenueChart({ days, rows, ar }: { days: string[]; rows: DayRow[]; ar: boolean }) {
  const { t } = useTranslation();
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const max = Math.max(0, ...rows.map((r) => r.revenueJod));
  // Selective x labels: first, middle and last day only.
  const labelled = new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]);

  const describe = (day: string) => {
    const r = byDay.get(day);
    return t("ocpp@payments.chart.point", {
      day: fmtDay(day, ar),
      revenue: fmtNum(r?.revenueJod ?? 0, 3),
      kwh: fmtNum(r?.energyKwh ?? 0, 2),
      n: r?.sessions ?? 0,
    });
  };

  return (
    <Box role="group" aria-label={t("ocpp@payments.chart.title")}>
      <Stack direction="row" spacing={1} alignItems="stretch">
        <Stack justifyContent="space-between" sx={{ height: HEIGHT, flexShrink: 0 }} aria-hidden>
          {[max, max / 2, 0].map((v, i) => (
            <Typography key={i} variant="caption" color="text.secondary" sx={{ lineHeight: 1, fontSize: 10 }}>
              <bdi dir="ltr">{fmtNum(v, max >= 10 ? 0 : 2)}</bdi>
            </Typography>
          ))}
        </Stack>

        <Box sx={{ flex: 1, minWidth: 0, overflowX: "auto" }}>
          <Box sx={{ minWidth: days.length * 8 }}>
            <Box
              sx={{
                position: "relative", height: HEIGHT, display: "flex", alignItems: "flex-end", gap: "2px",
                borderBottom: "1px solid", borderColor: "divider",
                backgroundImage: (th) => `linear-gradient(${th.palette.divider} 1px, transparent 1px)`,
                backgroundSize: `100% ${HEIGHT / 2}px`,
              }}
            >
              {days.map((day) => {
                const v = byDay.get(day)?.revenueJod ?? 0;
                const pct = max > 0 ? (v / max) * 100 : 0;
                const label = describe(day);
                return (
                  <Tooltip key={day} title={<span style={{ whiteSpace: "pre-line" }}>{label}</span>} placement="top" arrow>
                    <Box
                      tabIndex={0}
                      aria-label={label}
                      sx={{
                        flex: 1, maxWidth: 40, height: "100%", display: "flex", alignItems: "flex-end", cursor: "default",
                        borderRadius: "4px 4px 0 0", outline: "none",
                        "&:hover, &:focus-visible": { bgcolor: (th) => alpha(th.palette.primary.main, 0.06) },
                        "&:focus-visible": { boxShadow: (th) => `0 0 0 2px ${th.palette.primary.main}` },
                      }}
                    >
                      <Box sx={{ width: "100%", height: `${pct}%`, minHeight: v > 0 ? 2 : 0, bgcolor: "primary.main", borderRadius: "4px 4px 0 0" }} />
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
            <Box sx={{ display: "flex", gap: "2px", mt: 0.5 }} aria-hidden>
              {days.map((day, i) => {
                const last = i === days.length - 1 && days.length > 1;
                return (
                  <Box key={day} sx={{ flex: 1, maxWidth: 40, minWidth: 0, position: "relative", height: 16 }}>
                    {labelled.has(i) && (
                      <Typography
                        variant="caption" color="text.secondary" noWrap
                        sx={{ position: "absolute", insetInlineStart: last ? "auto" : 0, insetInlineEnd: last ? 0 : "auto", fontSize: 10 }}
                      >
                        <bdi>{fmtDay(day, ar, true)}</bdi>
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
