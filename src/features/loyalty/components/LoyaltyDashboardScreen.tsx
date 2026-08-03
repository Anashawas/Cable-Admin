import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Box, Stack, Typography, Grid, Paper, Avatar, Skeleton, useTheme, Divider, IconButton, Tooltip, Chip } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import RefreshIcon from "@mui/icons-material/Refresh";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SavingsIcon from "@mui/icons-material/Savings";
import RedeemIcon from "@mui/icons-material/Redeem";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import TuneIcon from "@mui/icons-material/Tune";
import PeopleIcon from "@mui/icons-material/People";
import BlockIcon from "@mui/icons-material/Block";
import PercentIcon from "@mui/icons-material/Percent";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AppScreenContainer from "../../app/components/AppScreenContainer";
import { useLoyaltySummary, useAllTiers, useRewardPerformance } from "../hooks/use-loyalty";

export default function LoyaltyDashboardScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { data, isLoading, refetch } = useLoyaltySummary();
  const { data: tiers = [], isLoading: tiersLoading } = useAllTiers();
  const { data: rewards = [], isLoading: rewardsLoading } = useRewardPerformance();

  const netInCirculation = data ? data.totalPointsIssued - data.totalPointsRedeemed - data.totalPointsExpired : 0;

  const heroStats = data
    ? [
        { label: t("loyalty@netInCirculation"), value: netInCirculation.toLocaleString() + ` ${t("loyalty@pts")}` },
        { label: t("loyalty@redemptionRate"), value: `${(data.redemptionRatePct ?? 0).toFixed(1)}%` },
        { label: t("loyalty@activeMembers"), value: data.activeMembers.toLocaleString() },
      ]
    : [];

  const kpis = data
    ? [
        { label: t("loyalty@totalPointsIssued"), value: data.totalPointsIssued.toLocaleString(), icon: <SavingsIcon />, color: "primary" as const },
        { label: t("loyalty@totalPointsRedeemed"), value: data.totalPointsRedeemed.toLocaleString(), icon: <RedeemIcon />, color: "warning" as const },
        { label: t("loyalty@totalPointsExpired"), value: data.totalPointsExpired.toLocaleString(), icon: <TimerOffIcon />, color: "error" as const },
        { label: t("loyalty@totalPointsAdjusted"), value: data.totalPointsAdminAdjusted.toLocaleString(), icon: <TuneIcon />, color: "info" as const },
        { label: t("loyalty@redemptionRate"), value: `${(data.redemptionRatePct ?? 0).toFixed(1)}%`, icon: <PercentIcon />, color: "success" as const },
        { label: t("loyalty@activeMembers"), value: data.activeMembers.toLocaleString(), icon: <PeopleIcon />, color: "secondary" as const },
        { label: t("loyalty@totalRedemptions"), value: data.totalRedemptions.toLocaleString(), icon: <RedeemIcon />, color: "warning" as const },
        { label: t("loyalty@blockedUsers"), value: data.blockedUsers.toLocaleString(), icon: <BlockIcon />, color: "error" as const },
      ]
    : [];

  const quickLinks = [
    { label: t("leaderboard"), icon: <EmojiEventsIcon />, path: "/loyalty-leaderboard", color: "#f9a825" },
    { label: t("redemptions"), icon: <CardGiftcardIcon />, path: "/redemptions", color: "#8e24aa" },
    { label: t("pointAdjustments"), icon: <TuneIcon />, path: "/point-adjustments", color: "#1565c0" },
    { label: t("blockUsers"), icon: <BlockIcon />, path: "/block-users", color: "#c62828" },
    { label: t("conversionRates"), icon: <MonetizationOnIcon />, path: "/conversion-rates", color: "#2e7d32" },
    { label: t("loyaltyManagement"), icon: <ManageAccountsIcon />, path: "/loyalty-management", color: "#00838f" },
  ];

  const daily = data?.issuedVsRedeemedDaily ?? [];
  const topRewards = [...rewards].sort((a, b) => b.redemptions - a.redemptions).slice(0, 6);

  return (
    <AppScreenContainer>
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5}>

          {/* ── Header + liability + inline stats ── */}
          <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2.5, md: 3 }, color: "white", position: "relative", overflow: "hidden" }}>
            <Box sx={{ position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)" }} />
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AccountBalanceIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800}>{t("loyalty@dashboard")}</Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.3 }}>{t("loyalty@dashboardSubtitle")}</Typography>
                </Box>
              </Stack>
              <Tooltip title={t("refresh")}>
                <IconButton onClick={() => { refetch(); }} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}><RefreshIcon /></IconButton>
              </Tooltip>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2.5 }} alignItems="stretch">
              {/* Liability */}
              <Box sx={{ bgcolor: "rgba(255,255,255,0.15)", borderRadius: 2.5, px: 3, py: 2, flex: 1.4 }}>
                <Typography variant="caption" sx={{ opacity: 0.85 }}>{t("loyalty@outstandingLiability")}</Typography>
                {isLoading ? <Skeleton variant="text" width={160} sx={{ bgcolor: "rgba(255,255,255,0.25)" }} /> : (
                  <Stack direction="row" spacing={1.5} alignItems="baseline" flexWrap="wrap">
                    <Typography variant="h4" fontWeight={900}>{(data?.outstandingLiabilityPoints ?? 0).toLocaleString()}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.85 }}>{t("loyalty@pts")}</Typography>
                    <Chip label={`≈ ${(data?.estimatedLiabilityValue ?? 0).toFixed(3)} ${data?.liabilityCurrencyCode ?? "JOD"}`} sx={{ bgcolor: "rgba(255,255,255,0.25)", color: "#fff", fontWeight: 700 }} />
                  </Stack>
                )}
                <Typography variant="caption" sx={{ opacity: 0.7 }}>{t("loyalty@liabilityHint")}</Typography>
              </Box>
              {/* Inline mini-stats */}
              {(isLoading ? [0, 1, 2] : heroStats).map((s: any, i) => (
                <Box key={i} sx={{ bgcolor: "rgba(255,255,255,0.1)", borderRadius: 2.5, px: 2.5, py: 2, flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {isLoading ? <Skeleton variant="text" width={70} sx={{ bgcolor: "rgba(255,255,255,0.25)" }} /> : (
                    <>
                      <Typography variant="h6" fontWeight={800}>{s.value}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>{s.label}</Typography>
                    </>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* ── KPI grid ── */}
          <Grid container spacing={2}>
            {(isLoading ? Array.from({ length: 8 }) : kpis).map((k: any, i) => (
              <Grid size={{ xs: 6, sm: 4, md: 3 }} key={i}>
                {isLoading ? <Skeleton variant="rounded" height={92} /> : (
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider", height: "100%" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: `${k.color}.main` }}>{k.icon}</Avatar>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{k.label}</Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={800} color={`${k.color}.dark`}>{k.value}</Typography>
                  </Paper>
                )}
              </Grid>
            ))}
          </Grid>

          {/* ── Quick links ── */}
          <Grid container spacing={1.5}>
            {quickLinks.map((q) => (
              <Grid size={{ xs: 6, sm: 4, md: 2 }} key={q.path}>
                <Paper
                  elevation={0}
                  onClick={() => navigate(q.path)}
                  sx={{ p: 1.5, borderRadius: 2, border: 1, borderColor: "divider", cursor: "pointer", display: "flex", alignItems: "center", gap: 1, transition: "all .15s", "&:hover": { borderColor: q.color, boxShadow: `0 2px 10px ${q.color}33` } }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: q.color }}>{q.icon}</Avatar>
                  <Typography variant="caption" fontWeight={700} sx={{ flex: 1, lineHeight: 1.2 }}>{q.label}</Typography>
                  <ChevronRightIcon sx={{ fontSize: 18, color: "text.disabled" }} />
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5}>
            {/* Issued vs redeemed trend */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper elevation={1} sx={{ borderRadius: 3, p: 2, height: "100%" }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>{t("loyalty@issuedVsRedeemed")}</Typography>
                {isLoading ? <Skeleton variant="rounded" height={260} /> : daily.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: "center", color: "text.disabled" }}><Typography variant="body2">{t("loyalty@noTrendData")}</Typography></Box>
                ) : (
                  <LineChart
                    height={260}
                    xAxis={[{ scaleType: "point", data: daily.map((d) => new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" })), tickLabelStyle: { fontSize: 10 } }]}
                    series={[
                      { data: daily.map((d) => d.issued), label: t("loyalty@txEarn"), color: theme.palette.primary.main, curve: "monotoneX", area: true },
                      { data: daily.map((d) => d.redeemed), label: t("loyalty@txRedeem"), color: theme.palette.warning.main, curve: "monotoneX" },
                    ]}
                    margin={{ top: 24, right: 20, bottom: 30, left: 45 }}
                  />
                )}
              </Paper>
            </Grid>

            {/* Top earners (clickable → user edit) */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper elevation={1} sx={{ borderRadius: 3, overflow: "hidden", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 2.5, py: 1.75, bgcolor: "secondary.main" }}>
                  <EmojiEventsIcon sx={{ color: "#fff" }} />
                  <Typography variant="subtitle1" fontWeight={700} color="#fff">{t("loyalty@topEarners")}</Typography>
                </Stack>
                <Box sx={{ p: 1.5 }}>
                  {isLoading ? <Stack spacing={1}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={40} />)}</Stack>
                    : (data?.topEarners ?? []).length === 0 ? <Typography variant="body2" color="text.disabled" sx={{ textAlign: "center", py: 3 }}>{t("loyalty@noData")}</Typography>
                    : (
                      <Stack spacing={0.25} divider={<Divider flexItem />}>
                        {data!.topEarners.map((e, i) => (
                          <Stack
                            key={e.userId} direction="row" spacing={1.5} alignItems="center"
                            onClick={() => navigate(`/users/${e.userId}/edit`)}
                            sx={{ px: 1, py: 0.75, borderRadius: 1.5, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                          >
                            <Typography variant="body2" fontWeight={800} color="text.secondary" sx={{ minWidth: 22, textAlign: "center" }}>{i + 1}</Typography>
                            <Avatar sx={{ width: 30, height: 30, bgcolor: "secondary.main", fontSize: 12, fontWeight: 700 }}>{(e.userName ?? "?").charAt(0).toUpperCase()}</Avatar>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>{e.userName ?? `#${e.userId}`}</Typography>
                            <Typography variant="body2" fontWeight={800} color="secondary.main">{e.points.toLocaleString()}</Typography>
                            <ChevronRightIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                          </Stack>
                        ))}
                      </Stack>
                    )}
                </Box>
              </Paper>
            </Grid>

            {/* Tier ladder */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={1} sx={{ borderRadius: 3, p: 2, height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <WorkspacePremiumIcon fontSize="small" color="secondary" />
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t("loyalty@tierLadder")}</Typography>
                </Stack>
                {tiersLoading ? <Stack spacing={1}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={44} />)}</Stack>
                  : tiers.length === 0 ? <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: "center" }}>{t("loyalty@noData")}</Typography>
                  : (
                    <Stack spacing={1}>
                      {tiers.map((tier) => (
                        <Stack key={tier.id} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1, borderRadius: 2, border: 1, borderColor: "divider", opacity: tier.isActive ? 1 : 0.6 }}>
                          <Avatar src={tier.iconUrl ?? undefined} sx={{ width: 34, height: 34, bgcolor: "secondary.50", color: "secondary.main" }}><WorkspacePremiumIcon fontSize="small" /></Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{tier.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{t("loyalty@tierMinPoints", { count: tier.minPoints })}</Typography>
                          </Box>
                          <Chip label={`×${tier.multiplier}`} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 700 }} />
                          {tier.bonusPoints > 0 && <Chip label={`+${tier.bonusPoints}`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
                        </Stack>
                      ))}
                    </Stack>
                  )}
              </Paper>
            </Grid>

            {/* Top rewards */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={1} sx={{ borderRadius: 3, p: 2, height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <CardGiftcardIcon fontSize="small" color="warning" />
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">{t("loyalty@topRewards")}</Typography>
                </Stack>
                {rewardsLoading ? <Stack spacing={1}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={44} />)}</Stack>
                  : topRewards.length === 0 ? <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: "center" }}>{t("loyalty@noData")}</Typography>
                  : (
                    <Stack spacing={1} divider={<Divider flexItem />}>
                      {topRewards.map((r) => (
                        <Stack key={r.rewardId} direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center">
                              <Typography variant="body2" fontWeight={700} noWrap>{r.rewardName}</Typography>
                              {!r.isActive && <Chip label={t("inactive")} size="small" variant="outlined" sx={{ height: 18, fontSize: 10 }} />}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">{r.pointsCost.toLocaleString()} {t("loyalty@pts")}{r.remainingStock != null ? ` · ${r.remainingStock} ${t("loyalty@stockLeft")}` : ""}</Typography>
                          </Box>
                          <Stack alignItems="flex-end" sx={{ flexShrink: 0 }}>
                            <Typography variant="body2" fontWeight={800} color="warning.dark">{r.redemptions}</Typography>
                            <Typography variant="caption" color="text.disabled">{t("loyalty@redemptions")}</Typography>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  )}
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </AppScreenContainer>
  );
}
