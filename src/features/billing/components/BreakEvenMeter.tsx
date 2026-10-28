import { useTranslation } from "react-i18next";
import { Box, LinearProgress, Skeleton, Tooltip, Typography } from "@mui/material";
import { useBreakEven } from "../hooks/use-billing";
import { breakEvenColor } from "../utils/plan-rules";

/**
 * "Used 87 of 121 (break-even)": green below 80%, amber from 80%, red past
 * break-even. Internal to Cable — never shown to the partner.
 */
export default function BreakEvenMeter({ planSubscriptionId, compact }: { planSubscriptionId: number; compact?: boolean }) {
  const { t } = useTranslation();
  const { data, isLoading, error } = useBreakEven(planSubscriptionId);

  if (isLoading) return <Skeleton variant="rounded" height={compact ? 24 : 40} width={compact ? 140 : "100%"} />;
  if (error || !data) return null;
  if (data.breakEvenScans == null) {
    return <Typography variant="caption" color="text.secondary">{t("billing@breakEven.none")}</Typography>;
  }

  const color = breakEvenColor(data.state);
  const pct = Math.min(100, Math.max(0, data.percent));
  const label = t(data.period === "month" ? "billing@breakEven.usedMonth" : "billing@breakEven.used", {
    used: data.scansUsed,
    breakEven: data.breakEvenScans,
  });

  return (
    <Tooltip
      title={t("billing@breakEven.tooltip", {
        cost: data.costPerScanJod.toFixed(3),
        points: Math.round(data.avgPointsPerScan),
        price: data.priceJod.toFixed(3),
      })}
    >
      <Box sx={{ minWidth: compact ? 140 : 200 }}>
        <Typography variant="caption" fontWeight={700} color={`${color}.main`}>
          {label} · {Math.round(data.percent)}%
        </Typography>
        <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: compact ? 6 : 8, borderRadius: 4 }} />
      </Box>
    </Tooltip>
  );
}
