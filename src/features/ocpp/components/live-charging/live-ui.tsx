import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Box, Chip, Paper, Skeleton, Tooltip, Typography, type ChipProps } from "@mui/material";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import PhoneIphoneIcon from "@mui/icons-material/PhoneIphone";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import StarsIcon from "@mui/icons-material/Stars";
import { useSnackbarStore } from "../../../../stores";
import { problemOfError } from "../../utils/live-charging";
import type { PlugReportStat } from "../../utils/live-charging";

export const Ltr = ({ children }: { children: ReactNode }) => <bdi dir="ltr">{children}</bdi>;

/**
 * Error toast with the problem-details `detail` (the API localizes it from Accept-Language).
 * Reads blob bodies of failed downloads too; without a detail, a known `code` or the fallback.
 */
export function useProblemToast() {
  const { t } = useTranslation();
  const openErrorSnackbar = useSnackbarStore((s) => s.openErrorSnackbar);
  return async (err: unknown, fallbackKey = "liveCharging@errors.generic") => {
    const p = await problemOfError(err);
    const byCode = p.code ? t(`liveCharging@errors.${p.code}`, { defaultValue: "" }) : "";
    const message = p.detail || byCode || (err as { message?: string })?.message || t(fallbackKey);
    openErrorSnackbar({ message: String(message) });
  };
}

const METHOD_ICON: Record<string, ReactNode> = {
  App: <PhoneIphoneIcon />,
  Sticker: <QrCode2Icon />,
  Card: <CreditCardIcon />,
  Operator: <SupportAgentIcon />,
};

/** App / Sticker (CHG- code) / Card / Operator. */
export function StartMethodChip({ method, size = "small" }: { method?: string | null; size?: ChipProps["size"] }) {
  const { t } = useTranslation();
  const m = method || "Card";
  return (
    <Chip
      size={size} variant="outlined" icon={METHOD_ICON[m] as ChipProps["icon"]}
      label={t(`liveCharging@method.${m}`, { defaultValue: m })}
      color={m === "Sticker" ? "secondary" : "default"}
      sx={{ fontWeight: 600, height: size === "small" ? 22 : undefined, fontSize: size === "small" ? 11 : undefined, "& .MuiChip-icon": { fontSize: 15 } }}
    />
  );
}

/** Running / stale / finished. */
export function SessionStateChip({ isOpen, isStale }: { isOpen: boolean; isStale?: boolean }) {
  const { t } = useTranslation();
  if (isOpen && isStale) return <Chip size="small" color="warning" variant="outlined" label={t("liveCharging@state.stale")} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />;
  if (isOpen) return <Chip size="small" color="primary" label={t("liveCharging@state.open")} sx={{ height: 20, fontSize: 11, fontWeight: 700 }} />;
  return <Chip size="small" variant="outlined" label={t("liveCharging@state.closed")} sx={{ height: 20, fontSize: 11, fontWeight: 600 }} />;
}

/** "+330 points"; nothing when points were not decided (null). */
export function PointsChip({ points }: { points?: number | null }) {
  const { t } = useTranslation();
  if (points == null) return null;
  if (points <= 0)
    return <Chip size="small" variant="outlined" label={t("liveCharging@points.none")} sx={{ height: 20, fontSize: 11, color: "text.secondary" }} />;
  return (
    <Chip
      size="small" color="success" variant="outlined" icon={<StarsIcon />}
      label={<bdi>{t("liveCharging@points.awarded", { count: points })}</bdi>}
      sx={{ height: 20, fontSize: 11, fontWeight: 700, "& .MuiChip-icon": { fontSize: 14 } }}
    />
  );
}

/**
 * A plug's "didn't work" reports: amber "may have a problem" when suspectedIssue,
 * otherwise a quiet "N reports". Nothing without open reports.
 */
export function PlugReportBadge({ stat, compact = false }: { stat?: PlugReportStat | null; compact?: boolean }) {
  const { t } = useTranslation();
  if (!stat || (stat.openReports <= 0 && !stat.suspectedIssue)) return null;
  const count = t("liveCharging@plugReports.openCount", { count: stat.openReports });
  const tip = stat.suspectedIssue ? `${t("liveCharging@plugReports.suspectedHint")} · ${count}` : count;
  return (
    <Tooltip title={tip}>
      <Chip
        size="small" variant={stat.suspectedIssue ? "filled" : "outlined"} color="warning"
        icon={<WarningAmberIcon />}
        label={<bdi>{compact ? stat.openReports : stat.suspectedIssue ? t("liveCharging@plugReports.suspected") : count}</bdi>}
        aria-label={tip}
        sx={{ height: 20, fontSize: 11, fontWeight: 700, "& .MuiChip-icon": { fontSize: 14 } }}
      />
    </Tooltip>
  );
}

/** One compact summary figure (same look as the revenue page). */
export function Figure({ label, value, sub, loading, color }: { label: string; value?: ReactNode; sub?: ReactNode; loading?: boolean; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 3, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" noWrap>{label}</Typography>
      {loading ? <Skeleton width="70%" height={28} /> : (
        <Typography variant="h6" fontWeight={800} lineHeight={1.3} noWrap color={color}>{value}</Typography>
      )}
      {sub && !loading && <Typography variant="caption" color="text.secondary" display="block" noWrap>{sub}</Typography>}
    </Paper>
  );
}

/** Small uppercase section heading used in the session detail. */
export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <Typography id={id} variant="subtitle2" fontWeight={800} color="text.secondary" component="h2" sx={{ textTransform: "uppercase", letterSpacing: 0.4, mb: 1 }}>
      {children}
    </Typography>
  );
}

/** Label over value; hidden when there is no value. */
export function Field({ label, children, mono }: { label: string; children?: ReactNode; mono?: boolean }) {
  if (children == null || children === "" || children === false) return null;
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{label}</Typography>
      <Box sx={{ fontSize: "0.875rem", fontWeight: 600, wordBreak: "break-word", fontFamily: mono ? "monospace" : undefined }}>{children}</Box>
    </Box>
  );
}
