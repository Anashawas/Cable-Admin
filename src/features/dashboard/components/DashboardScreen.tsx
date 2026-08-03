import { useMemo, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import { Box, Grid, Typography, useTheme, Skeleton, Stack, Chip, Button, type Theme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { LineChart } from "@mui/x-charts/LineChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
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
import VerifiedIcon from "@mui/icons-material/Verified";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PaymentsIcon from "@mui/icons-material/Payments";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import CampaignIcon from "@mui/icons-material/Campaign";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getPendingRequests } from "../../charge-management/services/request-service";
import { getUsersSummary } from "../../users/services/user-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { getAllPartnerAgreements } from "../../partners/services/partners-service";
import { getAllComplaints } from "../../complaints/services/complaints-service";
import { getAttentionSummary } from "../services/attention-service";
import { useAuthenticationStore } from "../../../stores";

// Theme-driven where a palette token exists; the remaining hexes are
// deliberate per-section accents with no theme equivalent.
const getSections = (theme: Theme) => [
  { path: "/charge-management",  titleKey: "chargeManagement",  descKey: "dashboard@sec_chargeManagement",  Icon: EvStationIcon,     accent: theme.palette.primary.main },
  { path: "/station-statistics", titleKey: "stationStatistics", descKey: "dashboard@sec_stationStats",      Icon: QueryStatsIcon,    accent: "#3949ab" },
  { path: "/stations-request",   titleKey: "stationsRequest",   descKey: "dashboard@sec_stationsRequest",   Icon: ListAltIcon,       accent: theme.palette.warning.dark },
  { path: "/users",              titleKey: "userManagement",    descKey: "dashboard@sec_users",             Icon: PeopleIcon,        accent: theme.palette.success.main },
  { path: "/pending-offers",     titleKey: "pendingOffers",     descKey: "dashboard@sec_offers",            Icon: LocalOfferIcon,    accent: "#6a1b9a" },
  { path: "/loyalty-management", titleKey: "loyaltySystem",     descKey: "dashboard@sec_loyalty",           Icon: CardGiftcardIcon,  accent: "#c17a00" },
  { path: "/service-providers",  titleKey: "serviceProviders",  descKey: "dashboard@sec_services",          Icon: StoreIcon,         accent: "#00695c" },
  { path: "/partners",           titleKey: "partners",          descKey: "dashboard@sec_partners",          Icon: HandshakeIcon,     accent: theme.palette.secondary.dark },
  { path: "/complaints",         titleKey: "userComplaints",    descKey: "dashboard@sec_complaints",        Icon: ReportProblemIcon, accent: theme.palette.error.dark },
  { path: "/car-management",     titleKey: "systemData",        descKey: "dashboard@sec_system",            Icon: SettingsIcon,      accent: "#37474f" },
];

// Section label used above each block
function SectionLabel({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1.5 }}>
      {icon}
      <Typography variant="subtitle2" fontWeight={800} sx={{ color: "text.primary", letterSpacing: 0.3, textTransform: "uppercase", fontSize: 12 }}>
        {children}
      </Typography>
    </Stack>
  );
}

// KPI card on a light surface with a per-metric accent
function KpiCard({ label, value, sub, Icon, accent, loading, onClick }: {
  label: string; value: number; sub?: ReactNode; Icon: typeof PeopleIcon; accent: string; loading?: boolean; onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        bgcolor: "background.paper", borderRadius: 3, p: 2.25, cursor: "pointer", height: "100%",
        border: "1px solid", borderColor: "divider",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
        transition: "box-shadow .2s, transform .15s, border-color .2s",
        "&:hover": { boxShadow: `0 8px 24px ${alpha(accent, 0.2)}`, transform: "translateY(-3px)", borderColor: alpha(accent, 0.5) },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(accent, 0.12), color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon sx={{ fontSize: 24 }} />
        </Box>
        <ChevronRightIcon sx={{ color: "text.disabled", fontSize: 18 }} />
      </Stack>
      {loading ? (
        <Skeleton variant="text" width="55%" height={40} sx={{ mt: 1 }} />
      ) : (
        <Typography variant="h4" fontWeight={800} sx={{ mt: 1, lineHeight: 1.1 }}>{value.toLocaleString()}</Typography>
      )}
      <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mt: 0.25 }}>{label}</Typography>
      {sub && <Box sx={{ mt: 0.75 }}>{sub}</Box>}
    </Box>
  );
}

// Ranked horizontal bar-list — clearer than a cramped bar chart for long labels
function BarList({ items, color, emptyLabel }: { items: { label: string; value: number }[]; color: string; emptyLabel: string }) {
  if (items.length === 0) return <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>{emptyLabel}</Typography>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <Stack spacing={1.4} sx={{ px: 0.5, py: 0.75 }}>
      {items.map((it, idx) => (
        <Box key={idx}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="caption" fontWeight={800} sx={{ color, width: 16, flexShrink: 0, textAlign: "center" }}>{idx + 1}</Typography>
            <Typography variant="body2" fontWeight={600} noWrap title={it.label} sx={{ flex: 1, minWidth: 0 }}>{it.label}</Typography>
            <Typography variant="body2" fontWeight={800} sx={{ flexShrink: 0, color }}>{it.value.toLocaleString()}</Typography>
          </Stack>
          <Box sx={{ height: 8, borderRadius: 4, bgcolor: alpha(color, 0.12), overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${(it.value / max) * 100}%`, minWidth: 6, borderRadius: 4, background: `linear-gradient(90deg, ${alpha(color, 0.65)}, ${color})`, transition: "width .5s ease" }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function ChartCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Box sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderRadius: 3, overflow: "hidden", height: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 1.4, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={800}>{title}</Typography>
      </Stack>
      <Box sx={{ p: 1.5 }}>{children}</Box>
    </Box>
  );
}

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const user = useAuthenticationStore((s) => s.user);
  const isAr = i18n.language === "ar";

  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["dashboard", "latest-stations"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
  });

  // Efficient: one aggregate call instead of loading ~14k users.
  const { data: usersSummary, isLoading: loadingUsers } = useQuery({
    queryKey: ["users", "summary"],
    queryFn: ({ signal }) => getUsersSummary(signal),
    staleTime: 60 * 1000,
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

  const { data: complaints = [], isLoading: loadingComplaints } = useQuery({
    queryKey: ["dashboard", "complaints"],
    queryFn: ({ signal }) => getAllComplaints(signal),
    staleTime: 5 * 60 * 1000,
  });

  const { data: updateRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ["dashboard", "update-requests"],
    queryFn: ({ signal }) => getPendingRequests(null, signal),
    staleTime: 5 * 60 * 1000,
  });

  // One-call "needs attention" counts (all queues). Falls back to the
  // per-query counts below when the endpoint is unavailable.
  const { data: attention } = useQuery({
    queryKey: ["dashboard", "attention-summary"],
    queryFn: ({ signal }) => getAttentionSummary(signal),
    staleTime: 60 * 1000,
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayNewUsers = usersSummary?.newToday ?? 0;
  const todayNewProviders = useMemo(() => serviceProviders.filter((sp) => sp.createdAt?.slice(0, 10) === today).length, [serviceProviders, today]);
  const todayNewPartners = useMemo(() => partners.filter((p) => p.createdAt?.slice(0, 10) === today).length, [partners, today]);

  // Action-required signals
  const pendingApproval = useMemo(() => updateRequests.filter((r) => (r.requestStatus ?? "").toLowerCase() === "pending").length, [updateRequests]);
  const openComplaints = useMemo(() => complaints.filter((c) => c.status !== 1 && c.status !== 2).length, [complaints]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return t("dashboard@greeting_morning");
    if (h < 18) return t("dashboard@greeting_afternoon");
    return t("dashboard@greeting_evening");
  }, [t]);

  const dateLabel = new Intl.DateTimeFormat(isAr ? "ar-SA" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

  // Chart data
  const stationsByCity = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of stations) { const city = s.cityName?.trim() || "—"; map.set(city, (map.get(city) ?? 0) + 1); }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [stations]);

  const topByVisitors = useMemo(() =>
    [...stations].filter((s) => (s.visitorsCount ?? 0) > 0).sort((a, b) => (b.visitorsCount ?? 0) - (a.visitorsCount ?? 0)).slice(0, 8).map((s) => ({ name: s.name ?? "—", count: s.visitorsCount ?? 0 })),
  [stations]);

  const trend = usersSummary?.registrationTrend ?? [];
  const hasTrend = trend.length > 1;

  const todayItems = [
    { label: t("dashboard@today_newUsers"), value: todayNewUsers, icon: <PersonAddIcon sx={{ fontSize: 22 }} />, path: "/users", loading: loadingUsers },
    { label: t("dashboard@today_newProviders"), value: todayNewProviders, icon: <StoreIcon sx={{ fontSize: 22 }} />, path: "/service-providers", loading: loadingProviders },
    { label: t("dashboard@today_newPartners"), value: todayNewPartners, icon: <HandshakeIcon sx={{ fontSize: 22 }} />, path: "/partners", loading: loadingPartners },
  ];

  const kpiCards = [
    { label: t("dashboard@kpi.users"), value: usersSummary?.totalUsers ?? 0, Icon: PeopleIcon, path: "/users", accent: theme.palette.primary.main, loading: loadingUsers,
      sub: todayNewUsers > 0 ? <Chip size="small" icon={<ArrowUpwardIcon sx={{ fontSize: "14px !important" }} />} label={`${todayNewUsers} ${t("dashboard@todaySuffix")}`} sx={{ height: 20, bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, fontWeight: 700, "& .MuiChip-label": { px: 0.75, fontSize: "0.68rem" } }} /> : null },
    { label: t("dashboard@kpi.stations"), value: stations.length, Icon: EvStationIcon, path: "/charge-management", accent: theme.palette.success.main, loading: loadingStations,
      sub: <Chip size="small" icon={<VerifiedIcon sx={{ fontSize: "14px !important" }} />} label={`${stations.filter((s) => s.isVerified).length}`} sx={{ height: 20, bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: 700, "& .MuiChip-label": { px: 0.75, fontSize: "0.68rem" } }} /> },
    { label: t("dashboard@kpi.serviceProviders"), value: serviceProviders.length, Icon: StoreIcon, path: "/service-providers", accent: "#00695c", loading: loadingProviders },
    { label: t("dashboard@kpi.partners"), value: partners.length, Icon: HandshakeIcon, path: "/partners", accent: "#3949ab", loading: loadingPartners },
    { label: t("dashboard@kpi.complaints"), value: complaints.length, Icon: ReportProblemIcon, path: "/complaints", accent: theme.palette.error.dark, loading: loadingComplaints,
      sub: openComplaints > 0 ? <Chip size="small" label={`${openComplaints} ${t("dashboard@openComplaints")}`} sx={{ height: 20, bgcolor: alpha(theme.palette.error.dark, 0.1), color: theme.palette.error.dark, fontWeight: 700, "& .MuiChip-label": { px: 0.75, fontSize: "0.68rem" } }} /> : null },
  ];

  // Prefer the single attention-summary endpoint (all queues). Fall back to the
  // two client-side counts if it isn't available yet.
  const actions = useMemo(() => {
    if (attention) {
      return [
        { show: attention.stationUpdateRequests > 0, label: t("dashboard@pendingApproval"), value: attention.stationUpdateRequests, Icon: ListAltIcon, accent: theme.palette.warning.dark, path: "/stations-request" },
        { show: attention.openComplaints > 0, label: t("dashboard@openComplaints"), value: attention.openComplaints, Icon: ReportProblemIcon, accent: theme.palette.error.dark, path: "/complaints" },
        { show: attention.pendingViewImages > 0, label: t("dashboard@pendingViewImages"), value: attention.pendingViewImages, Icon: ImageOutlinedIcon, accent: "#00838f", path: "/view-image-review" },
        { show: attention.pendingOffers > 0, label: t("dashboard@pendingOffers"), value: attention.pendingOffers, Icon: LocalOfferIcon, accent: "#6a1b9a", path: "/pending-offers" },
        { show: attention.settlementsPending > 0, label: t("dashboard@settlementsPending"), value: attention.settlementsPending, Icon: PaymentsIcon, accent: theme.palette.primary.main, path: "/settlements" },
        { show: attention.settlementsDisputed > 0, label: t("dashboard@settlementsDisputed"), value: attention.settlementsDisputed, Icon: PaymentsIcon, accent: theme.palette.error.dark, path: "/settlements" },
        { show: attention.premiumExpiringSoon > 0, label: t("dashboard@premiumExpiringSoon"), value: attention.premiumExpiringSoon, Icon: WorkspacePremiumIcon, accent: theme.palette.warning.dark, path: "/charge-management" },
        { show: attention.premiumExpired > 0, label: t("dashboard@premiumExpired"), value: attention.premiumExpired, Icon: WorkspacePremiumIcon, accent: theme.palette.error.dark, path: "/charge-management" },
        { show: attention.campaignsEndingSoon > 0, label: t("dashboard@campaignsEndingSoon"), value: attention.campaignsEndingSoon, Icon: CampaignIcon, accent: theme.palette.warning.dark, path: "/campaigns" },
        { show: attention.announcementsExpiringSoon > 0, label: t("dashboard@announcementsExpiringSoon"), value: attention.announcementsExpiringSoon, Icon: CampaignIcon, accent: theme.palette.warning.dark, path: "/welcome-messages" },
      ].filter((a) => a.show);
    }
    return [
      { show: pendingApproval > 0, label: t("dashboard@pendingApproval"), value: pendingApproval, Icon: ListAltIcon, accent: theme.palette.warning.dark, path: "/stations-request" },
      { show: openComplaints > 0, label: t("dashboard@openComplaints"), value: openComplaints, Icon: ReportProblemIcon, accent: theme.palette.error.dark, path: "/complaints" },
    ].filter((a) => a.show);
  }, [attention, pendingApproval, openComplaints, t]);

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto", p: { xs: 2, sm: 3 } }}>

      {/* ── Hero ── */}
      <Box sx={{ background: `linear-gradient(120deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`, borderRadius: 3, p: { xs: 2.5, md: 3 }, mb: 3, position: "relative", overflow: "hidden", color: "common.white" }}>
        <Box sx={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.06)", top: -120, insetInlineEnd: -80, pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", width: 150, height: 150, borderRadius: "50%", bgcolor: "rgba(255,255,255,0.05)", bottom: -60, insetInlineStart: 40, pointerEvents: "none" }} />
        <Grid container spacing={2.5} alignItems="center" sx={{ position: "relative" }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 0.5 }}>{greeting}{user?.name ? `, ${user.name}` : ""}!</Typography>
            <Typography variant="body1" sx={{ opacity: 0.75 }}>{dateLabel}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 7 }}>
            <Grid container spacing={1.5}>
              {todayItems.map((item) => (
                <Grid size={{ xs: 4 }} key={item.label}>
                  <Box onClick={() => navigate(item.path)} sx={{ bgcolor: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 2.5, p: { xs: 1.25, md: 1.75 }, textAlign: "center", cursor: "pointer", transition: "background .2s", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" } }}>
                    <Box sx={{ opacity: 0.85, mb: 0.25 }}>{item.icon}</Box>
                    {item.loading ? <Skeleton variant="text" width="55%" height={28} sx={{ bgcolor: "rgba(255,255,255,0.2)", mx: "auto" }} /> : <Typography variant="h5" fontWeight={800} lineHeight={1}>{item.value.toLocaleString()}</Typography>}
                    <Typography variant="caption" sx={{ opacity: 0.72, mt: 0.5, display: "block", lineHeight: 1.3 }}>{item.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* ── Action Required ── */}
      <Box sx={{ mb: 3 }}>
        <SectionLabel icon={<ReportProblemIcon sx={{ fontSize: 18, color: "warning.main" }} />}>{t("dashboard@actionRequired")}</SectionLabel>
        {loadingRequests || loadingComplaints ? (
          <Grid container spacing={2}>{[0, 1].map((i) => <Grid size={{ xs: 12, sm: 6 }} key={i}><Skeleton variant="rounded" height={72} sx={{ borderRadius: 3 }} /></Grid>)}</Grid>
        ) : actions.length === 0 ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.08), border: "1px solid", borderColor: alpha(theme.palette.success.main, 0.25) }}>
            <CheckCircleIcon sx={{ color: "success.main" }} />
            <Typography variant="body2" fontWeight={600} color="success.dark">{t("dashboard@allClear")}</Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {actions.map((a) => (
              <Grid size={{ xs: 12, sm: 6 }} key={a.label}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2, borderRadius: 3, bgcolor: alpha(a.accent, 0.07), border: "1px solid", borderColor: alpha(a.accent, 0.3) }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: alpha(a.accent, 0.15), color: a.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><a.Icon /></Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="h6" fontWeight={800} lineHeight={1.1} sx={{ color: a.accent }}>{a.value.toLocaleString()}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{a.label}</Typography>
                  </Box>
                  <Button size="small" variant="contained" onClick={() => navigate(a.path)} sx={{ bgcolor: a.accent, borderRadius: 2, fontWeight: 700, textTransform: "none", "&:hover": { bgcolor: a.accent, filter: "brightness(0.92)" } }}>
                    {t("dashboard@review")}
                  </Button>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* ── Platform KPIs (light, per-metric colors) ── */}
      <Box sx={{ mb: 3 }}>
        <SectionLabel icon={<BarChartIcon sx={{ fontSize: 18, color: "primary.main" }} />}>{t("dashboard@overview")}</SectionLabel>
        <Grid container spacing={2}>
          {kpiCards.map((c) => (
            <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={c.label}>
              <KpiCard label={c.label} value={c.value} sub={c.sub} Icon={c.Icon} accent={c.accent} loading={c.loading} onClick={() => navigate(c.path)} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Analytics ── */}
      <Box sx={{ mb: 3 }}>
        <SectionLabel icon={<QueryStatsIcon sx={{ fontSize: 18, color: "primary.main" }} />}>{t("dashboard@charts.title")}</SectionLabel>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: hasTrend ? 4 : 6 }}>
            <ChartCard title={t("dashboard@charts.byCity")} icon={<BarChartIcon fontSize="small" />}>
              {loadingStations ? <Skeleton variant="rounded" height={240} /> : (
                <BarList items={stationsByCity.map(([label, value]) => ({ label, value }))} color={theme.palette.primary.main} emptyLabel={t("dashboard@noStations")} />
              )}
            </ChartCard>
          </Grid>
          <Grid size={{ xs: 12, md: hasTrend ? 4 : 6 }}>
            <ChartCard title={t("dashboard@charts.topVisitors")} icon={<BarChartIcon fontSize="small" />}>
              {loadingStations ? <Skeleton variant="rounded" height={240} /> : (
                <BarList items={topByVisitors.map((s) => ({ label: s.name, value: s.count }))} color={theme.palette.secondary.main} emptyLabel={t("dashboard@noStations")} />
              )}
            </ChartCard>
          </Grid>
          {hasTrend && (
            <Grid size={{ xs: 12, md: 4 }}>
              <ChartCard title={t("dashboard@newUsersTrend")} icon={<ShowChartIcon fontSize="small" />}>
                <LineChart
                  xAxis={[{ scaleType: "point", data: trend.map((d) => d.day.slice(5)), tickLabelStyle: { fontSize: 9 } }]}
                  series={[{ data: trend.map((d) => d.count), color: theme.palette.success.main, area: true, showMark: false }]}
                  height={Math.max(topByVisitors.length * 30 + 40, 200)}
                  margin={{ top: 10, right: 16, bottom: 28, left: 34 }} />
              </ChartCard>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* ── Quick Access ── */}
      <Box>
        <SectionLabel icon={<ListAltIcon sx={{ fontSize: 18, color: "primary.main" }} />}>{t("dashboard@sections")}</SectionLabel>
        <Grid container spacing={1.5} sx={{ pb: 3 }}>
          {getSections(theme).map(({ path, titleKey, descKey, Icon, accent }) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={path}>
              <Box onClick={() => navigate(path)} sx={{ bgcolor: "background.paper", border: "1px solid", borderColor: "divider", borderTop: `3px solid ${accent}`, borderRadius: 2, p: 2, height: "100%", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", transition: "box-shadow .2s, transform .15s", "&:hover": { boxShadow: `0 6px 20px ${alpha(accent, 0.18)}`, transform: "translateY(-2px)" } }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: alpha(accent, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, mt: 0.25 }}>
                    <Icon sx={{ fontSize: 22, color: accent }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.4 }}>{t(titleKey)}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45, display: "block" }}>{t(descKey)}</Typography>
                  </Box>
                </Stack>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: accent, display: "flex", alignItems: "center", gap: 0.25 }}>
                    {t("dashboard@viewAll")}<ChevronRightIcon sx={{ fontSize: 14 }} />
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
