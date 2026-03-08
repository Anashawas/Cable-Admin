import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
  useTheme,
  Button,
  Divider,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import BarChartIcon from "@mui/icons-material/BarChart";
import FilterListIcon from "@mui/icons-material/FilterList";
import EvStationIcon from "@mui/icons-material/EvStation";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import StarRateIcon from "@mui/icons-material/StarRate";
import ClearIcon from "@mui/icons-material/Clear";
import { getAllChargingPoints } from "../services/charge-management-service";

// ── Chart card wrapper ────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: "hidden", height: "100%" }}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ px: 2, py: 1.2, bgcolor: theme.palette.grey[50], borderBottom: 1, borderColor: "divider" }}
      >
        <BarChartIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
      </Stack>
      <Box sx={{ p: 1 }}>{children}</Box>
    </Paper>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  badge?: string;
  icon: React.ReactNode;
  bg: string;
  color: "primary.contrastText" | "success.contrastText" | "warning.contrastText" | "info.contrastText";
  loading: boolean;
}

function KpiCard({ label, value, badge, icon, bg, color, loading }: KpiCardProps) {
  return (
    <Card sx={{ bgcolor: bg, color, height: "100%" }}>
      <Box sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
        <Box sx={{ opacity: 0.9 }}>
          {loading ? (
            <Skeleton variant="rounded" width={44} height={44} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          ) : (
            <Box sx={{ fontSize: 44, display: "flex" }}>{icon}</Box>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ opacity: 0.85, mb: 0.25 }}>{label}</Typography>
          {loading ? (
            <Skeleton variant="text" width={60} height={36} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
          ) : (
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h4" fontWeight="bold" lineHeight={1}>{value}</Typography>
              {badge && (
                <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 600 }}>{badge}</Typography>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Card>
  );
}

// ── Empty chart placeholder ──────────────────────────────────────────────────
function EmptyChart({ hint }: { hint: string }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 1 }}>
      <BarChartIcon sx={{ fontSize: 40, color: "text.disabled" }} />
      <Typography variant="body2" color="text.disabled">{hint}</Typography>
    </Box>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function StationStatisticsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ["station-statistics", "all"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
  });

  // ── Filter state ────────────────────────────────────────────────────────────
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [verifiedFilter, setVerifiedFilter] = useState("all");

  const hasFilters = cityFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || verifiedFilter !== "all";
  const activeFilterCount = [cityFilter, typeFilter, statusFilter, verifiedFilter].filter(v => v !== "all").length;

  const clearFilters = () => {
    setCityFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setVerifiedFilter("all");
  };

  // ── Dynamic filter options ──────────────────────────────────────────────────
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => { if (s.cityName?.trim()) set.add(s.cityName.trim()); });
    return Array.from(set).sort();
  }, [stations]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => {
      const type = s.chargingPointType?.name?.trim() || s.stationType?.name?.trim();
      if (type) set.add(type);
    });
    return Array.from(set).sort();
  }, [stations]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    stations.forEach(s => { if (s.statusSummary?.name?.trim()) set.add(s.statusSummary.name.trim()); });
    return Array.from(set).sort();
  }, [stations]);

  // ── Filtered stations ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return stations.filter(s => {
      if (cityFilter !== "all" && (s.cityName?.trim() || "") !== cityFilter) return false;
      const type = s.chargingPointType?.name?.trim() || s.stationType?.name?.trim() || "";
      if (typeFilter !== "all" && type !== typeFilter) return false;
      if (statusFilter !== "all" && (s.statusSummary?.name?.trim() || "") !== statusFilter) return false;
      if (verifiedFilter === "verified" && !s.isVerified) return false;
      if (verifiedFilter === "not_verified" && s.isVerified) return false;
      return true;
    });
  }, [stations, cityFilter, typeFilter, statusFilter, verifiedFilter]);

  // ── KPI values ───────────────────────────────────────────────────────────────
  const kpiTotal = filtered.length;
  const kpiVerified = filtered.filter(s => s.isVerified).length;
  const kpiWithOffer = filtered.filter(s => s.hasOffer).length;
  const ratedStations = filtered.filter(s => (s.avgChargingPointRate ?? 0) > 0);
  const kpiAvgRating = ratedStations.length > 0
    ? (ratedStations.reduce((sum, s) => sum + (s.avgChargingPointRate ?? 0), 0) / ratedStations.length).toFixed(1)
    : "—";

  const pct = (n: number) => kpiTotal > 0 ? `${Math.round((n / kpiTotal) * 100)}%` : "0%";

  // ── Chart data ───────────────────────────────────────────────────────────────
  const stationsByCity = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(s => {
      const city = s.cityName?.trim() || "—";
      map.set(city, (map.get(city) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [filtered]);

  const stationsByType = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(s => {
      const type = s.chargingPointType?.name?.trim() || s.stationType?.name?.trim() || t("stationStats@noData");
      map.set(type, (map.get(type) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered, t]);

  const stationsByStatus = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(s => {
      const status = s.statusSummary?.name?.trim() || "—";
      map.set(status, (map.get(status) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const plugTypeDistribution = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(s => {
      s.plugTypeSummary?.forEach(p => {
        const plug = p.name?.trim() || "—";
        map.set(plug, (map.get(plug) ?? 0) + 1);
      });
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  const topByVisitors = useMemo(() => {
    return [...filtered]
      .filter(s => (s.visitorsCount ?? 0) > 0)
      .sort((a, b) => (b.visitorsCount ?? 0) - (a.visitorsCount ?? 0))
      .slice(0, 8)
      .map(s => ({ name: s.name ?? "—", count: s.visitorsCount ?? 0 }));
  }, [filtered]);

  const topByRating = useMemo(() => {
    return [...filtered]
      .filter(s => (s.avgChargingPointRate ?? 0) > 0 && (s.rateCount ?? 0) > 0)
      .sort((a, b) => (b.avgChargingPointRate ?? 0) - (a.avgChargingPointRate ?? 0))
      .slice(0, 8)
      .map(s => ({ name: s.name ?? "—", rating: +(s.avgChargingPointRate ?? 0).toFixed(2) }));
  }, [filtered]);

  const chargerBrands = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach(s => {
      if (s.chargerBrand?.trim()) {
        const brand = s.chargerBrand.trim();
        map.set(brand, (map.get(brand) ?? 0) + 1);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);

  // ── Skeleton loader ──────────────────────────────────────────────────────────
  const ChartSkeleton = () => <Skeleton variant="rounded" height={200} sx={{ m: 1 }} />;

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "auto", p: { xs: 2, sm: 3 } }}>

      {/* ── Page header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">{t("stationStats@title")}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("stationStats@subtitle")}
        </Typography>
      </Box>

      {/* ── Filter bar ── */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: "grey.50" }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <FilterListIcon fontSize="small" color="action" />
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
            {t("filter")}
          </Typography>
          {hasFilters && (
            <Chip
              label={`${activeFilterCount} ${t("stationStats@activeFilters")}`}
              size="small"
              color="primary"
              variant="filled"
            />
          )}
        </Stack>

        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("stationStats@filterCity")}</InputLabel>
              <Select
                value={cityFilter}
                label={t("stationStats@filterCity")}
                onChange={e => setCityFilter(e.target.value)}
                MenuProps={{ PaperProps: { sx: { maxHeight: 260 } } }}
              >
                <MenuItem value="all">{t("stationStats@allCities")}</MenuItem>
                {cityOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("stationStats@filterType")}</InputLabel>
              <Select
                value={typeFilter}
                label={t("stationStats@filterType")}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <MenuItem value="all">{t("stationStats@allTypes")}</MenuItem>
                {typeOptions.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("stationStats@filterStatus")}</InputLabel>
              <Select
                value={statusFilter}
                label={t("stationStats@filterStatus")}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">{t("stationStats@allStatuses")}</MenuItem>
                {statusOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>{t("stationStats@filterVerified")}</InputLabel>
              <Select
                value={verifiedFilter}
                label={t("stationStats@filterVerified")}
                onChange={e => setVerifiedFilter(e.target.value)}
              >
                <MenuItem value="all">{t("stationStats@allVerification")}</MenuItem>
                <MenuItem value="verified">{t("stationStats@verified")}</MenuItem>
                <MenuItem value="not_verified">{t("stationStats@notVerified")}</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {hasFilters && (
            <Grid size={{ xs: 12, sm: 6, md: 1 }}>
              <Button
                variant="outlined"
                size="small"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                fullWidth
                sx={{ height: 40 }}
              >
                {t("stationStats@clearFilters")}
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ── KPI row ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t("stationStats@kpi_total")}
            value={kpiTotal.toLocaleString()}
            icon={<EvStationIcon sx={{ fontSize: 44 }} />}
            bg="primary.main"
            color="primary.contrastText"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t("stationStats@kpi_verified")}
            value={kpiVerified.toLocaleString()}
            badge={pct(kpiVerified)}
            icon={<VerifiedIcon sx={{ fontSize: 44 }} />}
            bg="success.main"
            color="success.contrastText"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t("stationStats@kpi_withOffer")}
            value={kpiWithOffer.toLocaleString()}
            badge={pct(kpiWithOffer)}
            icon={<LocalOfferIcon sx={{ fontSize: 44 }} />}
            bg="warning.main"
            color="warning.contrastText"
            loading={isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            label={t("stationStats@kpi_avgRating")}
            value={kpiAvgRating}
            badge={ratedStations.length > 0 ? `(${ratedStations.length})` : undefined}
            icon={<StarRateIcon sx={{ fontSize: 44 }} />}
            bg="info.main"
            color="info.contrastText"
            loading={isLoading}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 3 }} />

      {/* ── Charts grid ── */}
      <Grid container spacing={2}>

        {/* Stations by City */}
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard title={t("stationStats@chart_byCity")}>
            {isLoading ? <ChartSkeleton /> : stationsByCity.length > 0 ? (
              <BarChart
                layout="horizontal"
                yAxis={[{ scaleType: "band", data: stationsByCity.map(([name]) => name), tickLabelStyle: { fontSize: 11 } }]}
                xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                series={[{ data: stationsByCity.map(([, count]) => count), color: theme.palette.primary.main, label: t("stationStats@stations") }]}
                height={Math.max(stationsByCity.length * 32 + 40, 180)}
                margin={{ top: 5, right: 20, bottom: 30, left: 100 }}
                slotProps={{ legend: { hidden: true } }}
              />
            ) : <EmptyChart hint={t("stationStats@noDataHint")} />}
          </ChartCard>
        </Grid>

        {/* Station Types */}
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard title={t("stationStats@chart_byType")}>
            {isLoading ? <ChartSkeleton /> : stationsByType.length > 0 ? (
              <BarChart
                layout="horizontal"
                yAxis={[{ scaleType: "band", data: stationsByType.map(([name]) => name), tickLabelStyle: { fontSize: 11 } }]}
                xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                series={[{ data: stationsByType.map(([, count]) => count), color: theme.palette.secondary.main, label: t("stationStats@stations") }]}
                height={Math.max(stationsByType.length * 36 + 40, 180)}
                margin={{ top: 5, right: 20, bottom: 30, left: 110 }}
                slotProps={{ legend: { hidden: true } }}
              />
            ) : <EmptyChart hint={t("stationStats@noDataHint")} />}
          </ChartCard>
        </Grid>

        {/* Status Distribution */}
        {(isLoading || stationsByStatus.length > 0) && (
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <ChartCard title={t("stationStats@chart_byStatus")}>
              {isLoading ? <ChartSkeleton /> : (
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: stationsByStatus.map(([name]) => name), tickLabelStyle: { fontSize: 11 } }]}
                  xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: stationsByStatus.map(([, count]) => count), color: theme.palette.success.main, label: t("stationStats@stations") }]}
                  height={Math.max(stationsByStatus.length * 40 + 40, 160)}
                  margin={{ top: 5, right: 20, bottom: 30, left: 100 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              )}
            </ChartCard>
          </Grid>
        )}

        {/* Plug Type Distribution */}
        {(isLoading || plugTypeDistribution.length > 0) && (
          <Grid size={{ xs: 12, sm: 6, md: plugTypeDistribution.length > 0 && stationsByStatus.length === 0 ? 12 : 8 }}>
            <ChartCard title={t("stationStats@chart_byPlugType")}>
              {isLoading ? <ChartSkeleton /> : plugTypeDistribution.length > 0 ? (
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: plugTypeDistribution.map(([name]) => name), tickLabelStyle: { fontSize: 11 } }]}
                  xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: plugTypeDistribution.map(([, count]) => count), color: theme.palette.info.dark, label: t("stationStats@stations") }]}
                  height={Math.max(plugTypeDistribution.length * 36 + 40, 160)}
                  margin={{ top: 5, right: 20, bottom: 30, left: 110 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : <EmptyChart hint={t("stationStats@noDataHint")} />}
            </ChartCard>
          </Grid>
        )}

        {/* Top by Visitors */}
        {(isLoading || topByVisitors.length > 0) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard title={t("stationStats@chart_topVisitors")}>
              {isLoading ? <ChartSkeleton /> : topByVisitors.length > 0 ? (
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: topByVisitors.map(s => s.name), tickLabelStyle: { fontSize: 11 } }]}
                  xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: topByVisitors.map(s => s.count), color: theme.palette.warning.dark, label: t("stationStats@visitors") }]}
                  height={Math.max(topByVisitors.length * 32 + 40, 180)}
                  margin={{ top: 5, right: 20, bottom: 30, left: 110 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : <EmptyChart hint={t("stationStats@noDataHint")} />}
            </ChartCard>
          </Grid>
        )}

        {/* Top by Rating */}
        {(isLoading || topByRating.length > 0) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <ChartCard title={t("stationStats@chart_topRating")}>
              {isLoading ? <ChartSkeleton /> : topByRating.length > 0 ? (
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: topByRating.map(s => s.name), tickLabelStyle: { fontSize: 11 } }]}
                  xAxis={[{ min: 0, max: 5, tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: topByRating.map(s => s.rating), color: theme.palette.warning.main, label: t("stationStats@rating") }]}
                  height={Math.max(topByRating.length * 32 + 40, 180)}
                  margin={{ top: 5, right: 20, bottom: 30, left: 110 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : <EmptyChart hint={t("stationStats@noDataHint")} />}
            </ChartCard>
          </Grid>
        )}

        {/* Charger Brands */}
        {(isLoading || chargerBrands.length > 0) && (
          <Grid size={{ xs: 12 }}>
            <ChartCard title={t("stationStats@chart_byBrand")}>
              {isLoading ? <ChartSkeleton /> : chargerBrands.length > 0 ? (
                <BarChart
                  layout="horizontal"
                  yAxis={[{ scaleType: "band", data: chargerBrands.map(([name]) => name), tickLabelStyle: { fontSize: 11 } }]}
                  xAxis={[{ tickLabelStyle: { fontSize: 10 } }]}
                  series={[{ data: chargerBrands.map(([, count]) => count), color: theme.palette.error.main, label: t("stationStats@stations") }]}
                  height={Math.max(chargerBrands.length * 36 + 40, 180)}
                  margin={{ top: 5, right: 20, bottom: 30, left: 120 }}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : <EmptyChart hint={t("stationStats@noDataHint")} />}
            </ChartCard>
          </Grid>
        )}

      </Grid>
    </Box>
  );
}
