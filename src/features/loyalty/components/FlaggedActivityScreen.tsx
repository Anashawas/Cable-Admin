import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Avatar,
  Alert,
  Divider,
} from "@mui/material";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import RedeemIcon from "@mui/icons-material/Redeem";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import PersonIcon from "@mui/icons-material/Person";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { ScreenHeader } from "../../../components";
import { useFlaggedActivity } from "../hooks/use-loyalty";

const WINDOWS = [24, 72, 168, 720];

const RULE_CFG: Record<string, { color: "warning" | "error" | "secondary"; icon: React.ReactNode; metricKey: string }> = {
  EARN_VELOCITY: { color: "warning", icon: <TrendingUpIcon />, metricKey: "loyalty@flagged.metricEarns" },
  REDEMPTION_VELOCITY: { color: "error", icon: <RedeemIcon />, metricKey: "loyalty@flagged.metricRedemptions" },
  BALANCE_SWING: { color: "secondary", icon: <SwapVertIcon />, metricKey: "loyalty@flagged.metricSwing" },
};

export default function FlaggedActivityScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [windowHours, setWindowHours] = useState(24);

  const { data, isLoading } = useFlaggedActivity(windowHours);

  const windowLabel = (h: number) =>
    h < 168 ? t("loyalty@flagged.windowHours", { count: h }) : t("loyalty@flagged.windowDays", { count: Math.round(h / 24) });

  const byRule = useMemo(() => {
    const counts: Record<string, number> = {};
    (data ?? []).forEach((r) => { counts[r.ruleCode] = (counts[r.ruleCode] ?? 0) + 1; });
    return counts;
  }, [data]);

  return (
    <AppScreenContainer>
      <ScreenHeader icon={<ReportProblemIcon />} title={t("loyalty@flagged.title")} subtitle={t("loyalty@flagged.subtitle")} />

      <Stack spacing={2.5} sx={{ mt: 3, maxWidth: 820 }}>
        <Alert severity="info" icon={<ShieldOutlinedIcon />} sx={{ borderRadius: 2 }}>
          {t("loyalty@flagged.info")}
        </Alert>

        {/* Window selector */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {WINDOWS.map((h) => (
            <Chip
              key={h}
              label={windowLabel(h)}
              onClick={() => setWindowHours(h)}
              color={windowHours === h ? "primary" : "default"}
              variant={windowHours === h ? "filled" : "outlined"}
              sx={{ fontWeight: 700, cursor: "pointer" }}
            />
          ))}
        </Stack>

        <Paper elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: "error.main" }}>
            <ReportProblemIcon sx={{ color: "#fff" }} />
            <Typography variant="subtitle1" fontWeight={700} color="#fff" flex={1}>{t("loyalty@flagged.queueTitle")}</Typography>
            {data && <Chip label={data.length} size="small" sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />}
          </Stack>

          <Box sx={{ p: 2 }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={34} /></Box>
            ) : !data || data.length === 0 ? (
              <Stack alignItems="center" spacing={1} sx={{ py: 6 }}>
                <ShieldOutlinedIcon sx={{ fontSize: 44, color: "success.light" }} />
                <Typography variant="body2" color="text.secondary">{t("loyalty@flagged.empty")}</Typography>
              </Stack>
            ) : (
              <>
                {/* Per-rule summary */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                  {Object.entries(byRule).map(([code, count]) => {
                    const cfg = RULE_CFG[code];
                    return (
                      <Chip key={code} size="small" color={cfg?.color ?? "default"} variant="outlined"
                        label={`${t(`loyalty@flagged.rule.${code}`, code)} · ${count}`}
                        sx={{ fontWeight: 700 }} />
                    );
                  })}
                </Stack>

                <Stack spacing={1} divider={<Divider flexItem />}>
                  {data.map((r, i) => {
                    const cfg = RULE_CFG[r.ruleCode] ?? { color: "warning" as const, icon: <ReportProblemIcon />, metricKey: "" };
                    return (
                      <Stack key={`${r.userId}-${r.ruleCode}-${i}`} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: `${cfg.color}.50`, color: `${cfg.color}.main` }}>{cfg.icon}</Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Chip size="small" color={cfg.color} variant="filled" label={t(`loyalty@flagged.rule.${r.ruleCode}`, r.ruleName || r.ruleCode)} sx={{ height: 20, fontWeight: 700, "& .MuiChip-label": { px: 0.75, fontSize: "0.62rem" } }} />
                            <Chip size="small" icon={<PersonIcon sx={{ fontSize: "13px !important" }} />}
                              label={r.userName ? `${r.userName} · #${r.userId}` : `#${r.userId}`}
                              variant="outlined" onClick={() => navigate(`/users/${r.userId}`)}
                              sx={{ height: 20, cursor: "pointer", "& .MuiChip-label": { px: 0.5, fontSize: "0.62rem", fontWeight: 700 } }} />
                          </Stack>
                          <Typography variant="caption" color="text.disabled">{windowLabel(r.windowHours)}</Typography>
                        </Box>
                        <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                          <Typography variant="h6" fontWeight={800} color={`${cfg.color}.main`} lineHeight={1}>{r.metric.toLocaleString()}</Typography>
                          {cfg.metricKey && <Typography variant="caption" color="text.disabled">{t(cfg.metricKey)}</Typography>}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              </>
            )}
          </Box>
        </Paper>
      </Stack>
    </AppScreenContainer>
  );
}
