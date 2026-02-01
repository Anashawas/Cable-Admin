import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardActionArea,
  Grid,
  Typography,
  useTheme,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from "@mui/material";
import PeopleIcon from "@mui/icons-material/People";
import EvStationIcon from "@mui/icons-material/EvStation";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { getDashboardStats } from "../services/dashboard-service";
import { DASHBOARD_MENU_ITEMS } from "../constants/dashboard-menu";
import { getAllChargingPoints } from "../../charge-management/services/charge-management-service";

const KPI_COLORS = [
  { bg: "primary.main", color: "primary.contrastText" as const },
  { bg: "success.main", color: "success.contrastText" as const },
  { bg: "warning.main", color: "warning.contrastText" as const },
  { bg: "error.main", color: "error.contrastText" as const },
];

const KPI_ICONS = [PeopleIcon, EvStationIcon, PendingActionsIcon, ReportProblemIcon];

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: ({ signal }) => getDashboardStats(signal),
  });

  const { data: stations = [], isLoading: loadingStations } = useQuery({
    queryKey: ["dashboard", "latest-stations"],
    queryFn: ({ signal }) => getAllChargingPoints({ name: null, chargerPointTypeId: null, cityName: null }, signal),
  });

  const kpiValues = [
    stats?.totalUsers ?? 0,
    stats?.totalStations ?? 0,
    stats?.pendingRequests ?? 0,
    stats?.totalComplaints ?? 0,
  ];
  const kpiLabels = [
    t("dashboard@kpi.users"),
    t("dashboard@kpi.stations"),
    t("dashboard@kpi.pendingRequests"),
    t("dashboard@kpi.complaints"),
  ];
  const latestStations = stations.slice(0, 5);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
        {t("dashboard")}
      </Typography>

      {/* KPI row — 4 cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiLabels.map((label, i) => {
          const KpiIcon = KPI_ICONS[i];
          return (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={label}>
            <Card
              sx={{
                bgcolor: KPI_COLORS[i].bg,
                color: KPI_COLORS[i].color,
                boxShadow: theme.shadows[2],
              }}
            >
              <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ opacity: 0.9 }}>
                  {loadingStats ? (
                    <Skeleton variant="rounded" width={48} height={48} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                  ) : (
                    <KpiIcon sx={{ fontSize: 48 }} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {label}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {loadingStats ? (
                      <Skeleton variant="text" width={60} sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
                    ) : (
                      kpiValues[i].toLocaleString()
                    )}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          );
        })}
      </Grid>

      {/* Menu grid — 7 cards */}
      <Typography variant="h6" fontWeight="600" color="text.secondary" sx={{ mb: 2 }}>
        {t("dashboard@menuTitle")}
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {DASHBOARD_MENU_ITEMS.map(({ path, titleKey, Icon }) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={path}>
            <Card
              sx={{
                height: "100%",
                boxShadow: theme.shadows[2],
                "&:hover": { boxShadow: theme.shadows[6] },
              }}
            >
              <CardActionArea
                onClick={() => navigate(path)}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  justifyContent: "flex-start",
                  p: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: 1,
                    minHeight: 120,
                  }}
                >
                  <Icon sx={{ fontSize: 56, color: "primary.main", mb: 1.5 }} />
                  <Typography variant="h6" component="span" textAlign="center" fontWeight="medium">
                    {t(titleKey)}
                  </Typography>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Latest stations */}
      <Typography variant="h6" fontWeight="600" color="text.secondary" sx={{ mb: 2 }}>
        {t("dashboard@latestStations")}
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 640 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t("dashboard@stationName")}</TableCell>
              <TableCell>{t("dashboard@stationCity")}</TableCell>
              <TableCell align="right">{t("dashboard@actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loadingStations ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Skeleton variant="text" width="80%" />
                </TableCell>
              </TableRow>
            ) : latestStations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">{t("dashboard@noStations")}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              latestStations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell>{station.name ?? "—"}</TableCell>
                  <TableCell>{station.cityName ?? "—"}</TableCell>
                  <TableCell align="right">
                    <Typography
                      component="button"
                      variant="body2"
                      color="primary"
                      onClick={() => navigate(`/charge-management/edit/${station.id}`)}
                      sx={{
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      {t("edit")}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
