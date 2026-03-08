import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import {
  Box,
  Grid,
  Typography,
  useTheme,
  Skeleton,
  Stack,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import PeopleIcon from "@mui/icons-material/People";
import EvStationIcon from "@mui/icons-material/EvStation";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ListAltIcon from "@mui/icons-material/ListAlt";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import StoreIcon from "@mui/icons-material/Store";
import HandshakeIcon from "@mui/icons-material/Handshake";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getDashboardStats } from "../services/dashboard-service";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getUsersList } from "../../users/services/user-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { getAllPartnerAgreements } from "../../partners/services/partners-service";
import { useAuthenticationStore } from "../../../stores";

// ── Section navigation cards ──────────────────────────────────────────────────
const SECTIONS = [
  { path: "/charge-management",  titleKey: "chargeManagement",  descKey: "dashboard@sec_chargeManagement",  Icon: EvStationIcon,     accent: "#1565c0" },
  { path: "/station-statistics", titleKey: "stationStatistics", descKey: "dashboard@sec_stationStats",      Icon: QueryStatsIcon,    accent: "#3949ab" },
  { path: "/stations-request",   titleKey: "stationsRequest",   descKey: "dashboard@sec_stationsRequest",   Icon: ListAltIcon,       accent: "#e65100" },
  { path: "/users",              titleKey: "userManagement",    descKey: "dashboard@sec_users",             Icon: PeopleIcon,        accent: "#2e7d32" },
  { path: "/pending-offers",     titleKey: "pendingOffers",     descKey: "dashboard@sec_offers",            Icon: LocalOfferIcon,    accent: "#6a1b9a" },
  { path: "/loyalty-management", titleKey: "loyaltySystem",     descKey: "dashboard@sec_loyalty",           Icon: CardGiftcardIcon,  accent: "#c17a00" },
  { path: "/service-providers",  titleKey: "serviceProviders",  descKey: "dashboard@sec_services",          Icon: StoreIcon,         accent: "#00695c" },
  { path: "/partners",           titleKey: "partners",          descKey: "dashboard@sec_partners",          Icon: HandshakeIcon,     accent: "#01579b" },
  { path: "/complaints",         titleKey: "userComplaints",    descKey: "dashboard@sec_complaints",        Icon: ReportProblemIcon, accent: "#b71c1c" },
  { path: "/car-management",     titleKey: "systemData",        descKey: "dashboard@sec_system",            Icon: SettingsIcon,      accent: "#37474f" },
];

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
        height: "100%",
        boxShadow: "0 1px 4px rgba(21,101,192,0.08)",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1.2, bgcolor: "primary.main", borderBottom: "none" }}
      >
        <BarChartIcon fontSize="small" sx={{ color: "rgba(255,255,255,0.9)" }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#fff" }}>{title}</Typography>
      </Stack>
      <Box sx={{ p: 1 }}>{children}</Box>
    </Box>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useAuthenticationStore((s) => s.user);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: ({ signal }) => getDashboardStats(signal),
  });

  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["dashboard", "latest-stations"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users", "list"],
    queryFn: ({ signal }) => getUsersList(signal),
    staleTime: 5 * 60 * 1000,
  });

  const { data: serviceProviders = [], isLoading: loadingProviders } = useQuery({
    queryKey: ["dashboard", "service-providers"],
    queryFn: () => getAllServiceProviders(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ["dashboard", "partners"],
    queryFn: () => getAllPartnerAgreements(),
    staleTime: 5 * 60 * 1000,
  });

  // ── Today's metrics (computed from already-fetched lists) ─────────────────
  const today = new Date().toISOString().slice(0, 10);
  const todayNewUsers = useMemo(() =>
    users.filter(u => u.createdAt?.slice(0, 10) === today).length,
  [users, today]);
  const todayNewProviders = useMemo(() =>
    serviceProviders.filter(sp => sp.createdAt?.slice(0, 10) === today).length,
  [serviceProviders, today]);
  const todayNewPartners = useMemo(() =>
    partners.filter(p => p.createdAt?.slice(0, 10) === today).length,
  [partners, today]);

  // ── Greeting based on hour ────────────────────────────────────────────────
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard@greeting_morning");
    if (h < 18) return t("dashboard@greeting_afternoon");
    return t("dashboard@greeting_evening");
  }, [t]);

  const dateLabel = new Intl.DateTimeFormat(
    i18n.language === "ar" ? "ar-SA" : "en-US",
    { weekday: "long", day: "numeric", month: "long", year: "numeric" }
  ).format(new Date());

  // ── Chart data ────────────────────────────────────────────────────────────
  const stationsByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stations) {
      const city = s.cityName?.trim() || "—";
      map.set(city, (map.get(city) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [stations]);

  const topByVisitors = useMemo(() => {
    return [...stations]
      .filter(s => (s.visitorsCount ?? 0) > 0)
      .sort((a, b) => (b.visitorsCount ?? 0) - (a.visitorsCount ?? 0))
      .slice(0, 8)
      .map(s => ({ name: s.name ?? "—", count: s.visitorsCount ?? 0 }));
  }, [stations]);

  const hasChartData = stations.length > 0;

  // ── Today banner stats (computed from already-fetched lists — no extra API calls) ──
  const todayItems = [
    { label: t("dashboard@today_newUsers"),    value: todayNewUsers,    icon: <PersonAddIcon sx={{ fontSize: 24 }} />, path: "/users",             loading: loadingUsers },
    { label: t("dashboard@today_newProviders"),value: todayNewProviders, icon: <StoreIcon sx={{ fontSize: 24 }} />,    path: "/service-providers", loading: loadingProviders },
    { label: t("dashboard@today_newPartners"), value: todayNewPartners,  icon: <HandshakeIcon sx={{ fontSize: 24 }} />, path: "/partners",          loading: loadingPartners },
  ];

  // ── KPI overview cards ────────────────────────────────────────────────────
  const kpiCards = [
    { label: t("dashboard@kpi.users"),            value: stats?.totalUsers ?? 0,   Icon: PeopleIcon,        path: "/users",              accent: "#1565c0", loading: loadingStats },
    { label: t("dashboard@kpi.stations"),          value: stats?.totalStations ?? 0,Icon: EvStationIcon,     path: "/charge-management",  accent: "#2e7d32", loading: loadingStats },
    { label: t("dashboard@kpi.complaints"),        value: stats?.totalComplaints ?? 0, Icon: ReportProblemIcon, path: "/complaints",      accent: "#b71c1c", loading: loadingStats },
    { label: t("serviceProviders"),                value: serviceProviders.length,  Icon: StoreIcon,         path: "/service-providers",  accent: "#00695c", loading: false },
    { label: t("partners"),                        value: partners.length,          Icon: HandshakeIcon,     path: "/partners",           accent: "#01579b", loading: false },
  ];

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto", p: { xs: 2, sm: 3 } }}>

      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
          color: "#fff",
        }}
      >
        {/* Decorative circles */}
        <Box sx={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", top: -110, right: -90, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", bottom: -70, left: 60, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", width: 110, height: 110, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.07)", top: 15, right: 230, pointerEvents: "none" }} />

        <Grid container spacing={3} alignItems="center">
          {/* Left: greeting + date */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 0.5 }}>
              {greeting}{user?.name ? `, ${user.name}` : ""}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.72 }}>
              {dateLabel}
            </Typography>
          </Grid>

          {/* Right: today's glass stat cards */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Grid container spacing={1.5}>
              {todayItems.map(item => (
                <Grid size={{ xs: 4 }} key={item.label}>
                  <Box
                    onClick={() => navigate(item.path)}
                    sx={{
                      bgcolor: "rgba(255,255,255,0.13)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      borderRadius: 2,
                      p: { xs: 1.5, md: 2 },
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "background 0.2s",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.22)" },
                    }}
                  >
                    <Box sx={{ opacity: 0.85, mb: 0.5 }}>{item.icon}</Box>
                    {item.loading ? (
                      <Skeleton variant="text" width="55%" height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                    ) : (
                      <Typography variant="h5" fontWeight="bold" lineHeight={1}>
                        {item.value.toLocaleString()}
                      </Typography>
                    )}
                    <Typography variant="caption" sx={{ opacity: 0.72, mt: 0.5, display: "block", lineHeight: 1.3 }}>
                      {item.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* ── Platform Overview ──────────────────────────────────────────────── */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #0d47a1 0%, #1565c0 55%, #0277bd 100%)",
          borderRadius: 3,
          p: { xs: 2, md: 2.5 },
          mb: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", top: -100, left: -60, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.04)", bottom: -50, right: 80, pointerEvents: "none" }} />

        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "rgba(255,255,255,0.7)", mb: 1.5, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 11 }}>
          {t("dashboard@overview")}
        </Typography>

        <Grid container spacing={1.5}>
          {kpiCards.map(({ label, value, Icon, path, loading }) => (
            <Grid size={{ xs: 6, sm: 4, md: "auto" }} sx={{ flex: { md: 1 } }} key={label}>
              <Box
                onClick={() => navigate(path)}
                sx={{
                  bgcolor: "rgba(255,255,255,0.13)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 2,
                  p: { xs: 1.5, md: 2 },
                  textAlign: "center",
                  color: "#fff",
                  cursor: "pointer",
                  height: "100%",
                  transition: "background 0.2s, transform 0.15s",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.22)", transform: "translateY(-2px)" },
                }}
              >
                <Box sx={{ opacity: 0.85, mb: 0.75 }}>
                  {loading ? (
                    <Skeleton variant="circular" width={32} height={32} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                  ) : (
                    <Icon sx={{ fontSize: 32 }} />
                  )}
                </Box>
                {loading ? (
                  <Skeleton variant="text" width="60%" height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} />
                ) : (
                  <Typography variant="h4" fontWeight="bold" lineHeight={1}>
                    {value.toLocaleString()}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ opacity: 0.72, mt: 0.5, display: "block", lineHeight: 1.3 }}>
                  {label}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Analytics Charts ───────────────────────────────────────────────── */}
      {(hasChartData || loadingStations) && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: "primary.main", mb: 1.5, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 11 }}>
            {t("dashboard@charts.title")}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <ChartCard title={t("dashboard@charts.byCity")}>
                {loadingStations ? (
                  <Skeleton variant="rounded" height={220} />
                ) : stationsByCity.length > 0 ? (
                  <BarChart
                    layout="horizontal"
                    yAxis={[{ scaleType: "band", data: stationsByCity.map(([n]) => n), tickLabelStyle: { fontSize: 11 } }]}
                    xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                    series={[{ data: stationsByCity.map(([, c]) => c), color: theme.palette.primary.main, label: t("dashboard@kpi.stations") }]}
                    height={Math.max(stationsByCity.length * 30 + 40, 180)}
                    margin={{ top: 5, right: 20, bottom: 30, left: 90 }}
                    slotProps={{ legend: { hidden: true } }}
                  />
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{t("dashboard@noStations")}</Typography>
                )}
              </ChartCard>
            </Grid>

            {topByVisitors.length > 0 && (
              <Grid size={{ xs: 12, md: 6 }}>
                <ChartCard title={t("dashboard@charts.topVisitors")}>
                  {loadingStations ? (
                    <Skeleton variant="rounded" height={220} />
                  ) : (
                    <BarChart
                      layout="horizontal"
                      yAxis={[{ scaleType: "band", data: topByVisitors.map(s => s.name), tickLabelStyle: { fontSize: 11 } }]}
                      xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                      series={[{ data: topByVisitors.map(s => s.count), color: theme.palette.secondary.main, label: t("dashboard@charts.visitors") }]}
                      height={Math.max(topByVisitors.length * 30 + 40, 180)}
                      margin={{ top: 5, right: 20, bottom: 30, left: 110 }}
                      slotProps={{ legend: { hidden: true } }}
                    />
                  )}
                </ChartCard>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* ── Quick Access Section Cards ─────────────────────────────────────── */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ color: "primary.main", mb: 1.5, letterSpacing: 0.5, textTransform: "uppercase", fontSize: 11 }}>
          {t("dashboard@sections")}
        </Typography>
        <Grid container spacing={1.5} sx={{ pb: 3 }}>
          {SECTIONS.map(({ path, titleKey, descKey, Icon, accent }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={path}>
              <Box
                onClick={() => navigate(path)}
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  borderTop: `3px solid ${accent}`,
                  borderRadius: 2,
                  p: 2,
                  height: "100%",
                  cursor: "pointer",
                  boxShadow: "0 1px 4px rgba(21,101,192,0.08)",
                  transition: "box-shadow 0.2s, transform 0.15s",
                  "&:hover": { boxShadow: "0 4px 16px rgba(21,101,192,0.15)", transform: "translateY(-2px)" },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box
                    sx={{
                      width: 42,
                      height: 42,
                      borderRadius: 2,
                      bgcolor: alpha(accent, 0.1),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    <Icon sx={{ fontSize: 22, color: accent }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.4, color: "text.primary" }}>
                      {t(titleKey)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, display: "block" }}>
                      {t(descKey)}
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{ color: accent, display: "flex", alignItems: "center", gap: 0.25 }}
                  >
                    {t("dashboard@viewAll")}
                    <ChevronRightIcon sx={{ fontSize: 14 }} />
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

    </Box>
  );
}
