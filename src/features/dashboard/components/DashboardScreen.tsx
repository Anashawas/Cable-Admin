import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { alpha } from "@mui/material/styles";
import { Box, Grid, Typography, useTheme, Stack, Button, type Theme } from "@mui/material";
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
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import PaymentsIcon from "@mui/icons-material/Payments";
import GavelIcon from "@mui/icons-material/Gavel";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import LocationCityIcon from "@mui/icons-material/LocationCity";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import CampaignIcon from "@mui/icons-material/Campaign";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";
import { getPendingRequests } from "../../charge-management/services/request-service";
import { getUsersSummary } from "../../users/services/user-service";
import { getAllServiceProviders } from "../../service-providers/services/service-provider-service";
import { getAllPartnerAgreements } from "../../partners/services/partners-service";
import { getAllComplaints } from "../../complaints/services/complaints-service";
import { getAttentionSummary } from "../services/attention-service";
import { localDayBounds } from "../../../utils/date-format";
import DashboardHero from "./DashboardHero";
import {
  ActionList, AnalyticsCard, Num, RankedList, RegistrationTrendChart, SectionTitle, StatsStrip,
  type ActionItem, type RankedRow, type StatItem,
} from "./DashboardSections";
import { cityKey, cityLabel } from "../utils/city-names";
import { buildRegistrationSeries } from "../utils/registration-trend";

const UNKNOWN_CITY = "__unknown__";

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

export default function DashboardScreen() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: stations = [], isLoading: loadingStations, isError: stationsError } = useQuery({
    queryKey: ["dashboard", "latest-stations"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
  });

  // Efficient: one aggregate call instead of loading ~14k users.
  const { data: usersSummary, isLoading: loadingUsers, isError: usersError } = useQuery({
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
  const { data: attention, isLoading: loadingAttention } = useQuery({
    queryKey: ["dashboard", "attention-summary"],
    queryFn: ({ signal }) => getAttentionSummary(signal),
    staleTime: 60 * 1000,
  });

  const today = localDayBounds(new Date()).from.slice(0, 10);
  const todayNewProviders = useMemo(() => serviceProviders.filter((sp) => sp.createdAt?.slice(0, 10) === today).length, [serviceProviders, today]);
  const todayNewPartners = useMemo(() => partners.filter((p) => p.createdAt?.slice(0, 10) === today).length, [partners, today]);

  // Action-required signals (client-side fallback when attention-summary is unavailable)
  const pendingApproval = useMemo(() => updateRequests.filter((r) => (r.requestStatus ?? "").toLowerCase() === "pending").length, [updateRequests]);
  const openComplaints = useMemo(() => complaints.filter((c) => c.status !== 1 && c.status !== 2).length, [complaints]);

  // ── Analytics data ──
  const stationsByCity = useMemo<RankedRow[]>(() => {
    const map = new Map<string, number>();
    for (const s of stations) {
      const key = cityKey(s.cityName) ?? UNKNOWN_CITY;
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, value]) => ({ key, value, label: key === UNKNOWN_CITY ? t("dashboard@unknownCity") : cityLabel(key, i18n.language) }));
  }, [stations, i18n.language, t]);

  const topByVisitors = useMemo<RankedRow[]>(() =>
    stations
      .filter((s) => (s.visitorsCount ?? 0) > 0)
      .sort((a, b) => (b.visitorsCount ?? 0) - (a.visitorsCount ?? 0))
      .slice(0, 10)
      .map((s) => ({ key: String(s.id), label: s.name?.trim() || "—", value: s.visitorsCount ?? 0, path: `/charge-management/${s.id}` })),
  [stations]);

  const trend = useMemo(
    () => buildRegistrationSeries(usersSummary?.registrationTrend, usersSummary?.totalUsers, 30),
    [usersSummary?.registrationTrend, usersSummary?.totalUsers],
  );

  // ── Overview strip ──
  // Stations are already the hero's headline (total / verified / loyalty), so
  // that slot shows users-with-a-vehicle instead — already in the users summary,
  // and the best proxy for "real EV drivers" on the platform. Falls back to the
  // stations count if the summary doesn't carry the field.
  const openComplaintsCount = attention?.openComplaints ?? openComplaints;
  const totalUsers = usersSummary?.totalUsers;
  const withVehicles = usersSummary?.withVehicles;
  const hasVehicles = typeof withVehicles === "number";
  const vehiclesPct = hasVehicles && totalUsers ? Math.round((withVehicles / totalUsers) * 100) : null;
  const subLine = (n: number, key: string) => <><Num v={n} /> {t(key)}</>;

  const overview: StatItem[] = [
    { key: "users", label: t("dashboard@kpi.users"), value: usersError ? null : totalUsers ?? 0, Icon: PeopleIcon, path: "/users", accent: theme.palette.primary.main, loading: loadingUsers,
      sub: typeof usersSummary?.newThisMonth === "number" ? <>+{subLine(usersSummary.newThisMonth, "dashboard@sub.thisMonth")}</> : undefined },
    hasVehicles || loadingUsers
      ? { key: "vehicles", label: t("dashboard@kpi.withVehicles"), value: usersError ? null : withVehicles ?? 0, Icon: DirectionsCarIcon, path: "/user-analytics", accent: theme.palette.success.main, loading: loadingUsers,
          sub: vehiclesPct !== null ? <><bdi>{vehiclesPct}%</bdi> {t("dashboard@sub.ofUsers")}</> : undefined }
      : { key: "stations", label: t("dashboard@kpi.stations"), value: stationsError ? null : stations.length, Icon: EvStationIcon, path: "/charge-management", accent: theme.palette.success.main, loading: loadingStations,
          sub: subLine(stations.filter((s) => s.isVerified).length, "dashboard@sub.verified") },
    { key: "providers", label: t("dashboard@kpi.serviceProviders"), value: serviceProviders.length, Icon: StoreIcon, path: "/service-providers", accent: "#00897b", loading: loadingProviders },
    { key: "partners", label: t("dashboard@kpi.partners"), value: partners.length, Icon: HandshakeIcon, path: "/partners", accent: "#5c6bc0", loading: loadingPartners },
    { key: "complaints", label: t("dashboard@kpi.complaints"), value: complaints.length, Icon: ReportProblemIcon, path: "/complaints", accent: theme.palette.error.main, loading: loadingComplaints,
      sub: subLine(openComplaintsCount, "dashboard@sub.open") },
  ];

  // ── Action list ── Prefer the single attention-summary endpoint (all queues);
  // fall back to the two client-side counts if it isn't available.
  const actions = useMemo<ActionItem[]>(() => {
    const item = (key: string, labelKey: string, value: number, Icon: ActionItem["Icon"], accent: string, path: string): ActionItem =>
      ({ key, label: t(`dashboard@${labelKey}`), help: t(`dashboard@actionHelp.${key}`), value, Icon, accent, path });
    const all: ActionItem[] = attention
      ? [
          item("stationUpdateRequests", "pendingApproval", attention.stationUpdateRequests, ListAltIcon, theme.palette.warning.dark, "/stations-request"),
          item("openComplaints", "openComplaints", attention.openComplaints, ReportProblemIcon, theme.palette.error.main, "/complaints"),
          item("pendingViewImages", "pendingViewImages", attention.pendingViewImages, ImageOutlinedIcon, "#00838f", "/view-image-review"),
          item("pendingOffers", "pendingOffers", attention.pendingOffers, LocalOfferIcon, "#8e24aa", "/pending-offers"),
          item("settlementsPending", "settlementsPending", attention.settlementsPending, PaymentsIcon, theme.palette.info.main, "/settlements"),
          item("settlementsDisputed", "settlementsDisputed", attention.settlementsDisputed, GavelIcon, theme.palette.error.main, "/settlements"),
          // premiumExpiringSoon is promoted to the prominent banner above.
          item("premiumExpired", "premiumExpired", attention.premiumExpired, WorkspacePremiumIcon, theme.palette.error.main, "/charge-management"),
          item("campaignsEndingSoon", "campaignsEndingSoon", attention.campaignsEndingSoon, CampaignIcon, theme.palette.warning.dark, "/campaigns"),
          item("announcementsExpiringSoon", "announcementsExpiringSoon", attention.announcementsExpiringSoon, CampaignIcon, theme.palette.warning.dark, "/welcome-messages"),
        ]
      : [
          item("stationUpdateRequests", "pendingApproval", pendingApproval, ListAltIcon, theme.palette.warning.dark, "/stations-request"),
          item("openComplaints", "openComplaints", openComplaints, ReportProblemIcon, theme.palette.error.main, "/complaints"),
        ];
    return all.filter((a) => (a.value ?? 0) > 0);
  }, [attention, pendingApproval, openComplaints, t, theme]);
  const loadingActions = loadingAttention || (!attention && (loadingRequests || loadingComplaints));

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto", p: { xs: 2, sm: 3 } }}>

      {/* ── Hero: greeting + headline KPIs ── */}
      <DashboardHero
        stations={stations}
        loadingStations={loadingStations}
        stationsError={stationsError}
        newUsersToday={usersSummary?.newToday}
        newUsersThisWeek={usersSummary?.newThisWeek}
        loadingUsers={loadingUsers}
        usersError={usersError}
        newProvidersToday={todayNewProviders}
        newPartnersToday={todayNewPartners}
      />

      {/* ── Premium expiring-soon reminder (prominent) ── */}
      {attention && attention.premiumExpiringSoon > 0 && (
        <Box
          onClick={() => navigate("/charge-management")}
          sx={{
            display: "flex", alignItems: "center", gap: 2, mb: 3, p: { xs: 2, sm: 2.5 },
            borderRadius: 3, cursor: "pointer",
            background: `linear-gradient(120deg, ${alpha("#e65100", 0.12)}, ${alpha("#e65100", 0.04)})`,
            border: "1px solid", borderColor: alpha("#e65100", 0.4),
            transition: "box-shadow .2s", "&:hover": { boxShadow: `0 4px 16px ${alpha("#e65100", 0.22)}` },
          }}
        >
          <Box sx={{ width: 48, height: 48, borderRadius: 2.5, bgcolor: alpha("#e65100", 0.15), color: "#e65100", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <WorkspacePremiumIcon />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#e65100", lineHeight: 1.25 }}>
              {t("dashboard@premiumExpiringBannerTitle", { count: attention.premiumExpiringSoon })}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {t("dashboard@premiumExpiringBannerSubtitle")}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={(e) => { e.stopPropagation(); navigate("/charge-management"); }}
            sx={{ bgcolor: "#e65100", borderRadius: 2, fontWeight: 700, textTransform: "none", flexShrink: 0, "&:hover": { bgcolor: "#e65100", filter: "brightness(0.92)" } }}
          >
            {t("dashboard@review")}
          </Button>
        </Box>
      )}

      {/* ── Needs action: compact list, colour only on icon + count ── */}
      <Box component="section" aria-labelledby="dash-actions-title" sx={{ mb: 3 }}>
        <SectionTitle id="dash-actions-title" icon={<NotificationsActiveOutlinedIcon />}>{t("dashboard@actionRequired")}</SectionTitle>
        <ActionList items={actions} loading={loadingActions} onOpen={navigate} labelledBy="dash-actions-title" />
      </Box>

      {/* ── Platform overview: one compact stats strip ── */}
      <Box component="section" aria-labelledby="dash-overview-title" sx={{ mb: 3 }}>
        <SectionTitle id="dash-overview-title" icon={<BarChartIcon />}>{t("dashboard@overview")}</SectionTitle>
        <StatsStrip items={overview} onOpen={navigate} labelledBy="dash-overview-title" />
      </Box>

      {/* ── Analytics: three equal-height cards ── */}
      <Box component="section" aria-labelledby="dash-analytics-title" sx={{ mb: 3 }}>
        <SectionTitle id="dash-analytics-title" icon={<QueryStatsIcon />}>{t("dashboard@charts.title")}</SectionTitle>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <AnalyticsCard
              title={t("dashboard@newUsersTrend")}
              Icon={ShowChartIcon}
              action={!loadingUsers && !usersError && trend.status === "ok" ? (
                <Box sx={{ textAlign: "end", flexShrink: 0 }}>
                  <Typography variant="subtitle2" fontWeight={800} sx={{ lineHeight: 1.1 }}><Num v={trend.total} /></Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>{t("dashboard@trend.total")}</Typography>
                </Box>
              ) : undefined}
            >
              <RegistrationTrendChart series={trend} loading={loadingUsers} error={usersError} />
            </AnalyticsCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <AnalyticsCard title={t("dashboard@charts.topVisitors")} Icon={TrendingUpIcon}>
              <RankedList rows={topByVisitors} color={theme.palette.secondary.main} loading={loadingStations} emptyLabel={t("dashboard@noVisits")} onOpen={navigate} />
            </AnalyticsCard>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <AnalyticsCard title={t("dashboard@charts.byCity")} Icon={LocationCityIcon}>
              <RankedList rows={stationsByCity} color={theme.palette.primary.main} loading={loadingStations} emptyLabel={t("dashboard@noStations")} />
            </AnalyticsCard>
          </Grid>
        </Grid>
      </Box>

      {/* ── Quick Access ── */}
      <Box>
        <SectionTitle icon={<ListAltIcon />}>{t("dashboard@sections")}</SectionTitle>
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
