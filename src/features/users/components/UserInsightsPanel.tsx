import { useTranslation } from "react-i18next";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Avatar,
  Chip,
  Divider,
  useTheme,
  Grid,
} from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { BarChart } from "@mui/x-charts/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import InsightsIcon from "@mui/icons-material/Insights";
import type { UserSummaryDto } from "../types/api";
import { useCarTypeStats, useMonthlyStats } from "../hooks/use-user-stats";

interface UserInsightsPanelProps {
  users: UserSummaryDto[];
}

export default function UserInsightsPanel({ users }: UserInsightsPanelProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const carStats = useCarTypeStats(users);
  const monthlyStats = useMonthlyStats(users);

  const activeCount = users.filter((u) => u.isActive !== false).length;
  const inactiveCount = users.length - activeCount;
  const maxCarCount = carStats[0]?.count ?? 1;
  const topBrands = carStats.slice(0, 10);

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden" }}>
      {/* Section header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2.5, py: 1.5, bgcolor: "primary.main" }}
      >
        <InsightsIcon sx={{ color: "#fff", fontSize: 20 }} />
        <Typography variant="subtitle1" fontWeight={700} color="#fff">
          {t("userManagement@insights_title")}
        </Typography>
        <Chip
          label={users.length.toLocaleString()}
          size="small"
          sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 700, ml: 0.5 }}
        />
      </Stack>

      <Box sx={{ p: 2.5 }}>
        <Grid container spacing={2.5}>

          {/* ── Stat cards ── */}
          <Grid item xs={12} md={5}>
            <Stack spacing={1.5} height="100%">
              {[
                { label: t("userManagement@insights_totalUsers"), value: users.length, icon: <PeopleIcon />, color: "primary" as const },
                { label: t("userManagement@insights_activeUsers"), value: activeCount, icon: <CheckCircleIcon />, color: "success" as const },
                { label: t("userManagement@insights_inactiveUsers"), value: inactiveCount, icon: <PersonOffIcon />, color: "error" as const },
              ].map(({ label, value, icon, color }) => (
                <Paper
                  key={label}
                  elevation={0}
                  sx={{ px: 2, py: 1.5, bgcolor: `${color}.50`, borderRadius: 2, border: 1, borderColor: `${color}.100`, flex: 1 }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: `${color}.main`, width: 36, height: 36, fontSize: 18 }}>{icon}</Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
                      <Typography variant="h5" fontWeight={800} color={`${color}.dark`} lineHeight={1.2}>
                        {value.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Grid>

          {/* ── Donut chart ── */}
          <Grid item xs={12} md={7} sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            {users.length > 0 && (
              <Box sx={{ textAlign: "center" }}>
                <PieChart
                  series={[{
                    data: [
                      { id: 0, value: activeCount, label: t("userManagement@insights_activeUsers"), color: theme.palette.success.main },
                      { id: 1, value: inactiveCount || 0.0001, label: t("userManagement@insights_inactiveUsers"), color: theme.palette.error.main },
                    ],
                    innerRadius: 55,
                    outerRadius: 90,
                    paddingAngle: 3,
                    cornerRadius: 5,
                  }]}
                  width={280}
                  height={200}
                  slotProps={{ legend: { direction: "row", position: { vertical: "bottom", horizontal: "middle" }, itemMarkWidth: 10, itemMarkHeight: 10, markGap: 5, itemGap: 12, labelStyle: { fontSize: 12 } } }}
                />
              </Box>
            )}
          </Grid>

          {/* ── Registration trend ── */}
          {monthlyStats.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <TrendingUpIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("userManagement@insights_registrationTrend")}
                  </Typography>
                </Stack>
                <BarChart
                  xAxis={[{ scaleType: "band", data: monthlyStats.map((m) => m.label), tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: monthlyStats.map((m) => m.count), color: theme.palette.primary.main }]}
                  height={200}
                  margin={{ top: 10, right: 10, bottom: 35, left: 40 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </Paper>
            </Grid>
          )}

          {/* ── Top brands chart ── */}
          {topBrands.length > 0 && (
            <Grid item xs={12} md={monthlyStats.length > 0 ? 6 : 12}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: 1, borderColor: "divider", height: "100%" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <DirectionsCarIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {t("userManagement@insights_carTypeStats")}
                  </Typography>
                  <Chip label={carStats.length} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                </Stack>
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: topBrands.map((s) => s.name), tickLabelStyle: { fontSize: 11 } }]}
                  xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: topBrands.map((s) => s.count), color: theme.palette.primary.main }]}
                  height={Math.max(topBrands.length * 30 + 40, 180)}
                  margin={{ top: 5, right: 20, bottom: 30, left: 80 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              </Paper>
            </Grid>
          )}

          {/* ── Car details: models + plugs per brand ── */}
          {carStats.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                {t("userManagement@insights_carTypeStats")} — {t("userManagement@insights_totalUsers", { count: carStats.length })}
              </Typography>
              <Stack spacing={1.5}>
                {carStats.map(({ name, count, models, plugs }) => (
                  <Box key={name}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.4 }}>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <DirectionsCarIcon sx={{ fontSize: 15, color: "text.secondary" }} />
                        <Typography variant="body2" fontWeight={700}>{name}</Typography>
                      </Stack>
                      <Chip label={t("userManagement@insights_usersInRange", { count })} size="small" variant="outlined" color="primary" sx={{ fontWeight: 600 }} />
                    </Stack>
                    <Box sx={{ bgcolor: "grey.100", borderRadius: 2, height: 5, overflow: "hidden", mb: 0.8 }}>
                      <Box sx={{ width: `${Math.round((count / maxCarCount) * 100)}%`, height: "100%", bgcolor: "primary.main", borderRadius: 2, transition: "width 0.6s ease" }} />
                    </Box>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mb: models.length > 0 && plugs.length > 0 ? 0.5 : 0 }}>
                      {models.slice(0, 6).map((m) => (
                        <Chip key={m.name} label={`${m.name} (${m.count})`} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                      ))}
                    </Stack>
                    {plugs.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {plugs.map((p) => (
                          <Chip key={p.name} icon={<ElectricBoltIcon sx={{ fontSize: "13px !important" }} />} label={`${p.name} (${p.count})`} size="small" color="success" variant="outlined" sx={{ fontSize: 11 }} />
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
              </Stack>
            </Grid>
          )}

        </Grid>
      </Box>
    </Paper>
  );
}
